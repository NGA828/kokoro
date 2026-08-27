import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { dateTransformer } from '../common/value-transformers';
import { Conversation } from '../conversations/conversation.entity';

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  VOICE = 'voice',
  SYSTEM = 'system',
}

export enum MessageStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
}

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'varchar', name: 'conversation_id', length: 36 })
  conversationId: string;

  @ManyToOne(() => Conversation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversation_id' })
  conversation: Conversation;

  @Index()
  @Column({ type: 'varchar', name: 'sender_id', length: 36 })
  senderId: string;

  @Column({ type: 'text', nullable: true })
  body: string | null;

  @Column({ type: 'varchar', length: 12, default: MessageType.TEXT })
  type: MessageType;

  @Column({ type: 'varchar', length: 12, default: MessageStatus.SENT })
  status: MessageStatus;

  @Column({ name: 'deleted_at', type: 'datetime', nullable: true, transformer: dateTransformer })
  deletedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @OneToMany(() => MessageAttachment, (a) => a.message, { cascade: true })
  attachments: MessageAttachment[];
}

@Entity('message_attachments')
export class MessageAttachment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', name: 'message_id', length: 36 })
  messageId: string;

  @ManyToOne(() => Message, (m) => m.attachments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'message_id' })
  message: Message;

  @Column({ type: 'varchar', length: 500 })
  url: string;

  @Column({ type: 'varchar', name: 'public_id', length: 255, nullable: true })
  publicId: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  mime: string | null;

  @Column({ type: 'int', nullable: true })
  size: number | null;

  /** Voice-note duration in seconds. */
  @Column({ name: 'duration_sec', type: 'int', nullable: true })
  durationSec: number | null;
}
