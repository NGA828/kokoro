import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { dateTransformer } from '../common/value-transformers';

export enum PaymentStatus {
  PENDING = 'pending',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum PaymentKind {
  SUBSCRIPTION = 'subscription',
  BOOST = 'boost',
}

/**
 * Payment record. Only references and metadata are stored here — never card
 * numbers, mobile-money PINs or other sensitive credentials. Designed so real
 * African PSPs (MTN Mobile Money, Orange Money, Flutterwave, Paystack...) can
 * be attached behind a provider interface.
 */
@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'varchar', name: 'user_id', length: 36 })
  userId: string;

  @Column({ type: 'varchar', length: 16, default: PaymentKind.SUBSCRIPTION })
  kind: PaymentKind;

  @Column({ type: 'varchar', name: 'plan_id', length: 36, nullable: true })
  planId: string | null;

  @Column({ type: 'int' })
  amount: number;

  @Column({ type: 'varchar', length: 8, default: 'XAF' })
  currency: string;

  @Column({ type: 'varchar', name: 'provider', length: 32, default: 'mock' })
  provider: string;

  @Column({ type: 'varchar', name: 'provider_ref', length: 128, nullable: true })
  providerRef: string | null;

  @Column({ type: 'varchar', length: 16, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  /** Mobile-money phone number or masked reference (no PINs, ever). */
  @Column({ type: 'varchar', name: 'payer_reference', length: 128, nullable: true })
  payerReference: string | null;

  @Column({ name: 'paid_at', type: 'datetime', nullable: true, transformer: dateTransformer })
  paidAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;
}
