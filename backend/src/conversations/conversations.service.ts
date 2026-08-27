import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Conversation,
  ConversationParticipant,
} from './conversation.entity';
import { Match } from '../matches/match.entity';
import { RecommendationsService } from '../recommendations/recommendations.service';

@Injectable()
export class ConversationsService {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversations: Repository<Conversation>,
    @InjectRepository(ConversationParticipant)
    private readonly participants: Repository<ConversationParticipant>,
    @InjectRepository(Match)
    private readonly matches: Repository<Match>,
    private readonly recommendations: RecommendationsService,
  ) {}

  async createForMatch(userA: string, userB: string): Promise<Conversation> {
    const conv = this.conversations.create({});
    const saved = await this.conversations.save(conv);
    await this.participants.save([
      this.participants.create({ conversationId: saved.id, userId: userA }),
      this.participants.create({ conversationId: saved.id, userId: userB }),
    ]);
    return saved;
  }

  async attachMatch(conversationId: string, matchId: string) {
    await this.conversations.update(
      { id: conversationId },
      { matchId },
    );
  }

  /** Returns the participant row if user belongs, else null. */
  async membership(
    conversationId: string,
    userId: string,
  ): Promise<ConversationParticipant | null> {
    return this.participants.findOne({ where: { conversationId, userId } });
  }

  async assertParticipant(conversationId: string, userId: string) {
    const p = await this.membership(conversationId, userId);
    if (!p) {
      throw new ForbiddenException(
        'You do not have access to this conversation.',
      );
    }
    return p;
  }

  /** Conversation list for the sidebar — enriched with the other user's card. */
  async listForUser(userId: string) {
    const parts = await this.participants.find({ where: { userId } });
    const convIds = parts.map((p) => p.conversationId);
    if (!convIds.length) return [];
    const convs = await this.conversations.find({
      where: convIds.map((id) => ({ id, isClosed: false })),
      order: { lastMessageAt: 'DESC' },
    });

    const result: Array<Record<string, unknown>> = [];
    for (const conv of convs) {
      const allParts = await this.participants.find({
        where: { conversationId: conv.id },
      });
      const mine = allParts.find((p) => p.userId === userId);
      if (mine?.isHidden) continue;
      const other = allParts.find((p) => p.userId !== userId);
      if (!other) continue;
      const card = await this.recommendations.getProfileCard(userId, other.userId);
      if (!card) continue;
      const match = conv.matchId
        ? await this.matches.findOne({ where: { id: conv.matchId } })
        : null;
      result.push({
        id: conv.id,
        matchId: conv.matchId,
        other: card,
        compatibility: match?.compatibilityScore ?? card.compatibility,
        lastMessageAt: conv.lastMessageAt,
        lastMessagePreview: conv.lastMessagePreview,
        unreadCount: mine?.unreadCount ?? 0,
      });
    }
    result.sort((a, b) => {
      const ta = a.lastMessageAt ? new Date(a.lastMessageAt as Date).getTime() : 0;
      const tb = b.lastMessageAt ? new Date(b.lastMessageAt as Date).getTime() : 0;
      return tb - ta;
    });
    return result;
  }

  async touch(conversationId: string, preview: string, at = new Date()) {
    await this.conversations.update(
      { id: conversationId },
      {
        lastMessageAt: at,
        lastMessagePreview: preview.slice(0, 200),
      },
    );
  }

  async closeForMatch(matchId: string) {
    const conv = await this.conversations.findOne({ where: { matchId } });
    if (conv) {
      conv.isClosed = true;
      await this.conversations.save(conv);
    }
  }

  async getConversation(id: string) {
    const conv = await this.conversations.findOne({ where: { id } });
    if (!conv) throw new NotFoundException('Conversation not found.');
    return conv;
  }

  otherParticipant(conversationId: string, userId: string) {
    return this.participants
      .findOne({ where: { conversationId } })
      .then(async () => {
        const all = await this.participants.find({ where: { conversationId } });
        return all.find((p) => p.userId !== userId) ?? null;
      });
  }
}
