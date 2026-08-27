import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import {
  PremiumPlan,
  PremiumSubscription,
  PremiumTier,
  SubscriptionStatus,
} from './premium.entities';

const FREE_DAILY_LIKES = 10;
const FREE_SUPER_LIKES_WEEK = 1;

export interface Entitlements {
  isPremium: boolean;
  tier: PremiumTier;
  dailyLikeLimit: number;
  superLikesPerWeek: number;
  seeWhoLikesYou: boolean;
  advancedFilters: boolean;
  includesBoost: boolean;
  subscription: PremiumSubscription | null;
}

@Injectable()
export class PremiumService {
  constructor(
    @InjectRepository(PremiumPlan)
    private readonly plans: Repository<PremiumPlan>,
    @InjectRepository(PremiumSubscription)
    private readonly subscriptions: Repository<PremiumSubscription>,
  ) {}

  listPlans() {
    return this.plans.find({ where: { isActive: true }, order: { position: 'ASC', price: 'ASC' } });
  }

  async activeSubscription(userId: string): Promise<PremiumSubscription | null> {
    const sub = await this.subscriptions.findOne({
      where: { userId, status: SubscriptionStatus.ACTIVE },
      order: { expiresAt: 'DESC' },
    });
    if (sub && sub.expiresAt && sub.expiresAt.getTime() < Date.now()) {
      sub.status = SubscriptionStatus.EXPIRED;
      await this.subscriptions.save(sub);
      return null;
    }
    return sub;
  }

  async entitlements(userId: string): Promise<Entitlements> {
    const sub = await this.activeSubscription(userId);
    if (!sub) {
      return {
        isPremium: false,
        tier: PremiumTier.FREE,
        dailyLikeLimit: FREE_DAILY_LIKES,
        superLikesPerWeek: FREE_SUPER_LIKES_WEEK,
        seeWhoLikesYou: false,
        advancedFilters: false,
        includesBoost: false,
        subscription: null,
      };
    }
    const plan = sub.planId
      ? await this.plans.findOne({ where: { id: sub.planId } })
      : null;
    return {
      isPremium: true,
      tier: PremiumTier.PREMIUM,
      dailyLikeLimit: plan?.dailyLikeLimit ?? 200,
      superLikesPerWeek: plan?.superLikesPerWeek ?? 5,
      seeWhoLikesYou: plan?.seeWhoLikesYou ?? true,
      advancedFilters: plan?.advancedFilters ?? true,
      includesBoost: plan?.includesBoost ?? false,
      subscription: sub,
    };
  }

  async grantSubscription(userId: string, plan: PremiumPlan): Promise<PremiumSubscription> {
    // Expire any existing active subscription.
    await this.subscriptions.update(
      { userId, status: SubscriptionStatus.ACTIVE },
      { status: SubscriptionStatus.EXPIRED },
    );
    const now = new Date();
    const expires = new Date(now.getTime() + plan.periodDays * 24 * 60 * 60 * 1000);
    const sub = this.subscriptions.create({
      userId,
      planId: plan.id,
      planName: plan.name,
      status: SubscriptionStatus.ACTIVE,
      startedAt: now,
      expiresAt: expires,
    });
    return this.subscriptions.save(sub);
  }

  async cancel(userId: string) {
    const sub = await this.activeSubscription(userId);
    if (sub) {
      sub.status = SubscriptionStatus.CANCELLED;
      sub.cancelledAt = new Date();
      await this.subscriptions.save(sub);
    }
    return { success: true };
  }

  /** Boost: profile shown first for 30 minutes. */
  async activateBoost(userId: string, minutes = 30) {
    // Boost logic lives against profiles table; the controller calls
    // profiles service. Here we just validate entitlement timing.
    return { boostedUntil: new Date(Date.now() + minutes * 60 * 1000) };
  }

  async allSubscriptions() {
    return this.subscriptions.find({ order: { createdAt: 'DESC' }, take: 200 });
  }
}
