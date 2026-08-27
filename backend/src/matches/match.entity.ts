import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { dateTransformer } from '../common/value-transformers';

@Entity('matches')
@Index('idx_match_users', ['userOneId', 'userTwoId'], { unique: true })
export class Match {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'varchar', name: 'user_one_id', length: 36 })
  userOneId: string;

  @Index()
  @Column({ type: 'varchar', name: 'user_two_id', length: 36 })
  userTwoId: string;

  @Column({ type: 'varchar', name: 'conversation_id', length: 36, nullable: true })
  conversationId: string | null;

  @Column({ name: 'compatibility_score', type: 'int', default: 0 })
  compatibilityScore: number;

  @Column({ name: 'is_super', type: 'boolean', default: false })
  isSuper: boolean;

  @Column({ name: 'unmatched', type: 'boolean', default: false })
  unmatched: boolean;

  @Column({ type: 'varchar', name: 'unmatched_by', length: 36, nullable: true })
  unmatchedBy: string | null;

  @Column({ name: 'unmatched_at', type: 'datetime', nullable: true, transformer: dateTransformer })
  unmatchedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;

  otherUserId(userId: string): string {
    return userId === this.userOneId ? this.userTwoId : this.userOneId;
  }
}
