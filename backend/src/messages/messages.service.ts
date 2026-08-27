import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Message, MessageAttachment, MessageStatus, MessageType } from './message.entity';
import { ConversationParticipant } from '../conversations/conversation.entity';
import { ConversationsService } from '../conversations/conversations.service';
import { BlocksService } from '../blocks/blocks.service';
import { RealtimeGateway } from '../common/realtime.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/notification.entity';
import { SendMessageDto } from './messages.dto';

const PAGE_SIZE = 30;

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly messages: Repository<Message>,
    @InjectRepository(MessageAttachment)
    private readonly attachments: Repository<MessageAttachment>,
    @InjectRepository(ConversationParticipant)
    private readonly participants: Repository<ConversationParticipant>,
    private readonly conversations: ConversationsService,
    private readonly blocks: BlocksService,
    private readonly realtime: RealtimeGateway,
    private readonly notifications: NotificationsService,
  ) {}

  async send(conversationId: string, senderId: string, dto: SendMessageDto) {
    const conv = await this.conversations.getConversation(conversationId);
    if (conv.isClosed) {
      throw new ForbiddenException(
        'This conversation was closed because the match was undone.',
      );
    }
    const senderPart = await this.conversations.assertParticipant(
      conversationId,
      senderId,
    );

    const parts = await this.participants.find({ where: { conversationId } });
    const recipient = parts.find((p) => p.userId !== senderId);
    if (!recipient) throw new NotFoundException('Recipient not found.');

    if (await this.blocks.hasAnyBlock(senderId, recipient.userId)) {
      throw new ForbiddenException('You cannot message this member.');
    }

    const hasAttachment = !!dto.attachmentUrl;
    if (!dto.body?.trim() && !hasAttachment) {
      throw new ForbiddenException('Message cannot be empty.');
    }

    let message = this.messages.create({
      conversationId,
      senderId,
      body: dto.body?.trim() || null,
      type: hasAttachment
        ? dto.attachmentKind === 'voice'
          ? MessageType.VOICE
          : MessageType.IMAGE
        : MessageType.TEXT,
      status: MessageStatus.SENT,
    });
    message = await this.messages.save(message);

    if (hasAttachment) {
      const att = this.attachments.create({
        messageId: message.id,
        url: dto.attachmentUrl!,
        mime: dto.attachmentMime ?? null,
        durationSec: dto.durationSec ?? null,
      });
      await this.attachments.save(att);
      message.attachments = [att];
    }

    // Conversation ordering + preview.
    const preview =
      message.type === MessageType.IMAGE
        ? '📷 Photo'
        : message.type === MessageType.VOICE
          ? '🎤 Voice message'
          : message.body ?? '';
    await this.conversations.touch(conversationId, preview);

    // Unread counter for the recipient.
    recipient.unreadCount += 1;
    await this.participants.save(recipient);
    // The sender has implicitly read their own message.
    senderPart.lastReadAt = new Date();
    await this.participants.save(senderPart);

    // Delivery status: delivered instantly if recipient is online.
    if (this.realtime.isOnline(recipient.userId)) {
      message.status = MessageStatus.DELIVERED;
      await this.messages.save(message);
    }

    // ── Realtime fan-out ──
    const payload = this.serialize(message, message.attachments);
    this.realtime.emitToConversation(conversationId, 'message:new', {
      conversationId,
      message: payload,
    });
    // Also target the recipient directly (covers multi-device / not in room).
    this.realtime.emitToUser(recipient.userId, 'message:new', {
      conversationId,
      message: payload,
    });

    // In-app notification (persisted + pushed).
    await this.notifications.create({
      userId: recipient.userId,
      type: NotificationType.MESSAGE,
      title: 'New message 💬',
      body: preview,
      data: { conversationId },
    });

    return payload;
  }

  async listForConversation(conversationId: string, before?: string) {
    // Fetch the page of message ids (pagination), then hydrate — avoids a
    // TypeORM join+limit compatibility issue across drivers.
    const idQb = this.messages
      .createQueryBuilder('m')
      .select('m.id', 'id')
      .where('m.conversation_id = :cid', { cid: conversationId })
      .andWhere('m.deleted_at IS NULL')
      .orderBy('m.created_at', 'DESC')
      .limit(PAGE_SIZE + 1);
    if (before) {
      idQb.andWhere(
        'm.created_at < (SELECT created_at FROM messages WHERE id = :bid)',
        { bid: before },
      );
    }
    const idRows = await idQb.getRawMany<{ id: string }>();
    const hasMore = idRows.length > PAGE_SIZE;
    const ids = idRows.slice(0, PAGE_SIZE).map((r) => r.id);
    if (!ids.length) return { items: [], hasMore: false };

    const rows = await this.messages.find({ where: { id: In(ids) } });
    const attachments = await this.attachments.find({
      where: { messageId: In(ids) },
    });
    const byMessage = new Map<string, MessageAttachment[]>();
    for (const att of attachments) {
      const list = byMessage.get(att.messageId) ?? [];
      list.push(att);
      byMessage.set(att.messageId, list);
    }
    // Return in chronological order.
    rows.sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    );
    return {
      items: rows.map((m) => this.serialize(m, byMessage.get(m.id))),
      hasMore,
    };
  }

  async countForConversation(conversationId: string): Promise<number> {
    return this.messages.count({ where: { conversationId } });
  }

  /** Mark messages read up to now; emit read receipts. */
  async markRead(conversationId: string, userId: string) {
    const me = await this.conversations.assertParticipant(conversationId, userId);
    const other = (
      await this.participants.find({ where: { conversationId } })
    ).find((p) => p.userId !== userId);

    await this.messages
      .createQueryBuilder()
      .update(Message)
      .set({ status: MessageStatus.READ })
      .where('conversation_id = :cid', { cid: conversationId })
      .andWhere('sender_id = :sender', { sender: other?.userId })
      .andWhere('status IN (:...s)', { s: [MessageStatus.SENT, MessageStatus.DELIVERED] })
      .execute();

    me.unreadCount = 0;
    me.lastReadAt = new Date();
    await this.participants.save(me);

    this.realtime.emitToConversation(conversationId, 'message:read', {
      conversationId,
      readBy: userId,
      at: new Date().toISOString(),
    });
    if (other) {
      this.realtime.emitToUser(other.userId, 'message:read', {
        conversationId,
        readBy: userId,
        at: new Date().toISOString(),
      });
    }
    return { success: true };
  }

  /** Soft-delete a message (sender only, within 1 hour). */
  async deleteMessage(messageId: string, userId: string) {
    const message = await this.messages.findOne({ where: { id: messageId } });
    if (!message) throw new NotFoundException('Message not found.');
    if (message.senderId !== userId) {
      throw new ForbiddenException('You can only delete your own messages.');
    }
    const ageMin = (Date.now() - message.createdAt.getTime()) / 60000;
    if (ageMin > 60) {
      throw new ForbiddenException('Messages can only be deleted within an hour.');
    }
    message.deletedAt = new Date();
    await this.messages.save(message);
    this.realtime.emitToConversation(message.conversationId, 'message:deleted', {
      conversationId: message.conversationId,
      messageId,
    });
    return { success: true };
  }

  serialize(m: Message, attachments?: MessageAttachment[]) {
    return {
      id: m.id,
      conversationId: m.conversationId,
      senderId: m.senderId,
      body: m.deletedAt ? null : m.body,
      type: m.deletedAt ? 'deleted' : m.type,
      status: m.status,
      createdAt: m.createdAt,
      deletedAt: m.deletedAt,
      attachments: m.deletedAt
        ? []
        : (attachments ?? m.attachments ?? []).map((a) => ({
            id: a.id,
            url: a.url,
            mime: a.mime,
            durationSec: a.durationSec,
          })),
    };
  }
}
