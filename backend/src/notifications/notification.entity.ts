import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { dateTransformer, jsonTransformer } from '../common/value-transformers';

export enum NotificationType {
  MATCH = 'match',
  MESSAGE = 'message',
  LIKE = 'like',
  SUPERLIKE = 'superlike',
  PROFILE_VIEW = 'profile_view',
  SYSTEM = 'system',
  PREMIUM = 'premium',
  VERIFICATION = 'verification',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'varchar', name: 'user_id', length: 36 })
  userId: string;

  @Column({ type: 'varchar', length: 24 })
  type: NotificationType;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  body: string | null;

  @Column({ type: 'text', nullable: true, transformer: jsonTransformer })
  data: Record<string, unknown> | null;

  @Column({ name: 'is_read', type: 'boolean', default: false })
  isRead: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;
}
