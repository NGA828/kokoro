import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { dateTransformer } from '../common/value-transformers';

export enum LikeType {
  LIKE = 'like',
  SUPERLIKE = 'superlike',
  PASS = 'pass',
}

@Entity('likes')
@Index('idx_like_pair', ['likerId', 'likedId'], { unique: true })
export class Like {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'varchar', name: 'liker_id', length: 36 })
  likerId: string;

  @Index()
  @Column({ type: 'varchar', name: 'liked_id', length: 36 })
  likedId: string;

  @Column({ type: 'varchar', length: 16, default: LikeType.LIKE })
  type: LikeType;

  /** True once this action has been consumed by a match (likes only). */
  @Column({ name: 'is_matched', type: 'boolean', default: false })
  isMatched: boolean;

  @Column({ name: 'rewindable_until', type: 'datetime', nullable: true, transformer: dateTransformer })
  rewindableUntil: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;
}
