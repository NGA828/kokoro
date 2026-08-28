import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { dateTransformer } from '../common/value-transformers';

@Entity('profile_views')
@Index('idx_view_pair', ['viewerId', 'viewedId'])
export class ProfileView {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'varchar', name: 'viewer_id', length: 36 })
  viewerId: string;

  @Index()
  @Column({ type: 'varchar', name: 'viewed_id', length: 36 })
  viewedId: string;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;
}
