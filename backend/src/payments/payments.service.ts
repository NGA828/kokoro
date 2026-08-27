import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentKind, PaymentStatus } from './payment.entity';
import { PremiumPlan } from '../premium/premium.entities';
import { PremiumService } from '../premium/premium.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/notification.entity';
import { Profile } from '../profiles/profile.entity';

/**
 * Payment abstraction. The mock provider simulates the Mobile-Money
 * (MTN MoMo / Orange Money) flow: create pending payment → confirm →
 * entitlement granted. Real PSPs implement the same interface and confirm
 * via signed webhooks (see PaymentsController.webhook).
 */
@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(Payment)
    private readonly payments: Repository<Payment>,
    @InjectRepository(PremiumPlan)
    private readonly plans: Repository<PremiumPlan>,
    @InjectRepository(Profile)
    private readonly profiles: Repository<Profile>,
    private readonly premium: PremiumService,
    private readonly notifications: NotificationsService,
  ) {}

  async createSubscriptionPayment(
    userId: string,
    planId: string,
    payerPhone?: string,
  ) {
    const plan = await this.plans.findOne({ where: { id: planId, isActive: true } });
    if (!plan) throw new NotFoundException('Plan not found.');
    const payment = this.payments.create({
      userId,
      kind: PaymentKind.SUBSCRIPTION,
      planId: plan.id,
      amount: plan.price,
      currency: plan.currency,
      provider: process.env.PAYMENT_PROVIDER || 'mock',
      payerReference: payerPhone ?? null,
      status: PaymentStatus.PENDING,
      providerRef: `MOCK-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    });
    const saved = await this.payments.save(payment);
    // Mock provider auto-confirms in dev; in production the PSP webhook does it.
    return { payment: saved, mock: true };
  }

  async createBoostPayment(userId: string, payerPhone?: string) {
    const payment = this.payments.create({
      userId,
      kind: PaymentKind.BOOST,
      amount: 500,
      currency: 'XAF',
      provider: process.env.PAYMENT_PROVIDER || 'mock',
      payerReference: payerPhone ?? null,
      status: PaymentStatus.PENDING,
      providerRef: `MOCK-BOOST-${Date.now()}`,
    });
    return { payment: await this.payments.save(payment), mock: true };
  }

  /** Confirm a payment (called by the mock flow or a PSP webhook). */
  async confirm(paymentId: string, status: 'succeeded' | 'failed', providerRef?: string) {
    const payment = await this.payments.findOne({ where: { id: paymentId } });
    if (!payment) throw new NotFoundException('Payment not found.');
    if (payment.status !== PaymentStatus.PENDING) return { payment };

    payment.status =
      status === 'succeeded' ? PaymentStatus.SUCCEEDED : PaymentStatus.FAILED;
    payment.paidAt = status === 'succeeded' ? new Date() : null;
    if (providerRef) payment.providerRef = providerRef;
    await this.payments.save(payment);

    if (status === 'succeeded') {
      await this.fulfill(payment);
    }
    return { payment };
  }

  private async fulfill(payment: Payment) {
    if (payment.kind === PaymentKind.SUBSCRIPTION) {
      const plan = await this.plans.findOne({ where: { id: payment.planId! } });
      if (plan) {
        const sub = await this.premium.grantSubscription(payment.userId, plan);
        await this.notifications.create({
          userId: payment.userId,
          type: NotificationType.PREMIUM,
          title: 'Welcome to Kokoro Premium ✨',
          body: `Your ${plan.name} plan is active until ${sub.expiresAt.toDateString()}. Enjoy unlimited likes and more!`,
          data: { subscriptionId: sub.id },
        });
      }
    } else if (payment.kind === PaymentKind.BOOST) {
      const profile = await this.profiles.findOne({
        where: { userId: payment.userId },
      });
      if (profile) {
        profile.boostedUntil = new Date(Date.now() + 30 * 60 * 1000);
        await this.profiles.save(profile);
        await this.notifications.create({
          userId: payment.userId,
          type: NotificationType.PREMIUM,
          title: 'You are boosted! 🚀',
          body: 'Your profile is shown first in Discovery for the next 30 minutes.',
        });
      }
    }
  }

  listForUser(userId: string) {
    return this.payments.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  listAll() {
    return this.payments.find({ order: { createdAt: 'DESC' }, take: 200 });
  }
}
