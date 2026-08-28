import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { User } from '../users/user.entity';
import { Profile } from '../profiles/profile.entity';
import { Match } from '../matches/match.entity';
import { Message } from '../messages/message.entity';
import { Report } from '../reports/report.entity';
import { Block } from '../blocks/block.entity';
import { Like } from '../likes/like.entity';
import { Payment } from '../payments/payment.entity';
import { PremiumSubscription } from '../premium/premium.entities';
import { ProfileView } from '../profiles/profile-view.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Profile,
      Match,
      Message,
      Report,
      Block,
      Like,
      Payment,
      PremiumSubscription,
      ProfileView,
    ]),
  ],
  providers: [AdminService],
  controllers: [AdminController],
})
export class AdminModule {}
