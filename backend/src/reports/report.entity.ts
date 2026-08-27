import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { dateTransformer } from '../common/value-transformers';

export enum ReportReason {
  FAKE_PROFILE = 'fake_profile',
  HARASSMENT = 'harassment',
  SPAM = 'spam',
  INAPPROPRIATE = 'inappropriate',
  SCAM = 'scam',
  OTHER = 'other',
}

export enum ReportStatus {
  OPEN = 'open',
  REVIEWING = 'reviewing',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed',
}

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'varchar', name: 'reporter_id', length: 36 })
  reporterId: string;

  @Index()
  @Column({ type: 'varchar', name: 'reported_id', length: 36 })
  reportedId: string;

  @Column({ type: 'varchar', length: 24 })
  reason: ReportReason;

  @Column({ type: 'text', nullable: true })
  details: string | null;

  @Column({ type: 'varchar', length: 16, default: ReportStatus.OPEN })
  status: ReportStatus;

  @Column({ type: 'varchar', name: 'resolved_by', length: 36, nullable: true })
  resolvedBy: string | null;

  @Column({ name: 'resolved_at', type: 'datetime', nullable: true, transformer: dateTransformer })
  resolvedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;
}
