import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PremiumPlan, PremiumSubscription } from './premium.entities';
import { Payment } from '../payments/payment.entity';
import { PremiumService } from './premium.service';
import { PremiumController } from './premium.controller';
import { PaymentsService } from '../payments/payments.service';
import { PaymentsController } from '../payments/payments.controller';
import { Profile } from '../profiles/profile.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PremiumPlan, PremiumSubscription, Payment, Profile]),
    NotificationsModule,
  ],
  providers: [PremiumService, PaymentsService],
  controllers: [PremiumController, PaymentsController],
  exports: [PremiumService, PaymentsService],
})
export class PremiumModule {}
