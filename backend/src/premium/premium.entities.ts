import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { dateTransformer } from '../common/value-transformers';

export enum PremiumTier {
  FREE = 'free',
  PREMIUM = 'premium',
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

/** Admin-configurable premium plans. Seeded; manageable from the admin UI. */
@Entity('premium_plans')
export class PremiumPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 64 })
  name: string;

  @Column({ type: 'varchar', length: 24, default: PremiumTier.PREMIUM })
  tier: PremiumTier;

  /** Price in the smallest display unit-free integer (e.g. cents). */
  @Column({ type: 'int' })
  price: number;

  @Column({ type: 'varchar', length: 8, default: 'XAF' })
  currency: string;

  /** Billing period in days (30 monthly, 365 yearly). */
  @Column({ name: 'period_days', type: 'int' })
  periodDays: number;

  @Column({ name: 'daily_like_limit', type: 'int', default: 200 })
  dailyLikeLimit: number;

  @Column({ name: 'super_likes_per_week', type: 'int', default: 5 })
  superLikesPerWeek: number;

  @Column({ name: 'includes_boost', type: 'boolean', default: false })
  includesBoost: boolean;

  @Column({ name: 'see_who_likes_you', type: 'boolean', default: true })
  seeWhoLikesYou: boolean;

  @Column({ name: 'advanced_filters', type: 'boolean', default: true })
  advancedFilters: boolean;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  position: number;
}

@Entity('premium_subscriptions')
export class PremiumSubscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', name: 'user_id', length: 36 })
  userId: string;

  @Column({ type: 'varchar', name: 'plan_id', length: 36, nullable: true })
  planId: string | null;

  @Column({ type: 'varchar', name: 'plan_name', length: 64, default: 'Premium' })
  planName: string;

  @Column({ type: 'varchar', length: 16, default: SubscriptionStatus.ACTIVE })
  status: SubscriptionStatus;

  @Column({ name: 'started_at', type: 'datetime', transformer: dateTransformer })
  startedAt: Date;

  @Column({ name: 'expires_at', type: 'datetime', transformer: dateTransformer })
  expiresAt: Date;

  @Column({ name: 'cancelled_at', type: 'datetime', nullable: true, transformer: dateTransformer })
  cancelledAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;
}
