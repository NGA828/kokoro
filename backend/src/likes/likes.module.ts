import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Like } from './like.entity';
import { Match } from '../matches/match.entity';
import { UserSettings } from '../users/user-settings.entity';
import { Profile } from '../profiles/profile.entity';
import { LikesService } from './likes.service';
import { LikesController } from './likes.controller';
import { BlocksModule } from '../blocks/blocks.module';
import { PremiumModule } from '../premium/premium.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { RecommendationsModule } from '../recommendations/recommendations.module';
import { ConversationsModule } from '../conversations/conversations.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Like, Match, UserSettings, Profile]),
    BlocksModule,
    PremiumModule,
    NotificationsModule,
    RecommendationsModule,
    ConversationsModule,
  ],
  providers: [LikesService],
  controllers: [LikesController],
  exports: [LikesService],
})
export class LikesModule {}
