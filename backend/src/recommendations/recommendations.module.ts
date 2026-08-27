import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Profile } from '../profiles/profile.entity';
import { ProfilePhoto } from '../profiles/profile-photo.entity';
import { ProfileView } from '../profiles/profile-view.entity';
import { Preference } from '../preferences/preference.entity';
import { Like } from '../likes/like.entity';
import { Match } from '../matches/match.entity';
import { Block } from '../blocks/block.entity';
import { Interest, UserInterest } from '../interests/interest.entity';
import { User } from '../users/user.entity';
import { UserSettings } from '../users/user-settings.entity';
import { RecommendationsService } from './recommendations.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Profile,
      ProfilePhoto,
      ProfileView,
      Preference,
      Like,
      Match,
      Block,
      Interest,
      UserInterest,
      User,
      UserSettings,
    ]),
  ],
  providers: [RecommendationsService],
  exports: [RecommendationsService],
})
export class RecommendationsModule {}
