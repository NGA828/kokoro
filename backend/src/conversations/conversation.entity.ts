import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { dateTransformer } from '../common/value-transformers';

@Entity('conversations')
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', name: 'match_id', length: 36, nullable: true })
  matchId: string | null;

  @Column({ name: 'last_message_at', type: 'datetime', nullable: true, transformer: dateTransformer })
  lastMessageAt: Date | null;

  @Column({ type: 'varchar', name: 'last_message_preview', length: 255, nullable: true })
  lastMessagePreview: string | null;

  @Column({ name: 'is_closed', type: 'boolean', default: false })
  isClosed: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;

  @OneToMany(() => ConversationParticipant, (p) => p.conversation, { cascade: true })
  participants: ConversationParticipant[];
}

@Entity('conversation_participants')
export class ConversationParticipant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'varchar', name: 'conversation_id', length: 36 })
  conversationId: string;

  @ManyToOne(() => Conversation, (c) => c.participants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversation_id' })
  conversation: Conversation;

  @Index()
  @Column({ type: 'varchar', name: 'user_id', length: 36 })
  userId: string;

  @Column({ name: 'unread_count', type: 'int', default: 0 })
  unreadCount: number;

  @Column({ name: 'last_read_at', type: 'datetime', nullable: true, transformer: dateTransformer })
  lastReadAt: Date | null;

  @Column({ name: 'is_hidden', type: 'boolean', default: false })
  isHidden: boolean;
}
