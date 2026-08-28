import {
  Body,
  Controller,
  Get,
  Post,
} from '@nestjs/common';
import { PremiumService } from './premium.service';
import { PaymentsService } from '../payments/payments.service';
import { CurrentUser, AuthUser } from '../common/decorators';
import { SubscribeDto } from './premium.dto';
import { Profile } from '../profiles/profile.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/notification.entity';

@Controller('premium')
export class PremiumController {
  constructor(
    private readonly premium: PremiumService,
    private readonly payments: PaymentsService,
    @InjectRepository(Profile)
    private readonly profiles: Repository<Profile>,
    private readonly notifications: NotificationsService,
  ) {}

  @Get('plans')
  plans() {
    return this.premium.listPlans();
  }

  @Get('me')
  async me(@CurrentUser() auth: AuthUser) {
    const [entitlements, payments] = await Promise.all([
      this.premium.entitlements(auth.id),
      this.payments.listForUser(auth.id),
    ]);
    const profile = await this.profiles.findOne({
      where: { userId: auth.id },
    });
    return {
      ...entitlements,
      payments,
      boostedUntil: profile?.boostedUntil ?? null,
    };
  }

  /** Subscribe: creates a (mock) mobile-money payment and immediately
   *  confirms it — swap confirm() for a PSP webhook in production. */
  @Post('subscribe')
  async subscribe(@CurrentUser() auth: AuthUser, @Body() dto: SubscribeDto) {
    const { payment } = await this.payments.createSubscriptionPayment(
      auth.id,
      dto.planId,
      dto.payerPhone,
    );
    const result = await this.payments.confirm(payment.id, 'succeeded');
    return {
      success: true,
      payment: result.payment,
      entitlements: await this.premium.entitlements(auth.id),
    };
  }

  @Post('cancel')
  cancel(@CurrentUser() auth: AuthUser) {
    return this.premium.cancel(auth.id);
  }

  @Post('boost')
  async boost(
    @CurrentUser() auth: AuthUser,
    @Body('payerPhone') payerPhone?: string,
  ) {
    const entitlements = await this.premium.entitlements(auth.id);
    if (!entitlements.isPremium && !entitlements.includesBoost) {
      // One-off boost purchase (mock payment).
      const { payment } = await this.payments.createBoostPayment(
        auth.id,
        payerPhone,
      );
      await this.payments.confirm(payment.id, 'succeeded');
    } else {
      const profile = await this.profiles.findOne({
        where: { userId: auth.id },
      });
      if (profile) {
        profile.boostedUntil = new Date(Date.now() + 30 * 60 * 1000);
        await this.profiles.save(profile);
        await this.notifications.create({
          userId: auth.id,
          type: NotificationType.PREMIUM,
          title: 'You are boosted! 🚀',
          body: 'Your profile is shown first in Discovery for the next 30 minutes.',
        });
      }
    }
    return { success: true };
  }
}
