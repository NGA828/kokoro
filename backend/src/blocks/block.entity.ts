import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { dateTransformer } from '../common/value-transformers';

/** A directional block: blocker cannot see/interact with blocked (and vice
 *  versa because discovery/messaging checks both directions). */
@Entity('blocks')
@Index('idx_block_pair', ['blockerId', 'blockedId'], { unique: true })
export class Block {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'varchar', name: 'blocker_id', length: 36 })
  blockerId: string;

  @Index()
  @Column({ type: 'varchar', name: 'blocked_id', length: 36 })
  blockedId: string;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;
}
