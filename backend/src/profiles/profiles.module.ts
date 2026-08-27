import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Profile } from './profile.entity';
import { ProfilePhoto } from './profile-photo.entity';
import { ProfileView } from './profile-view.entity';
import { Preference } from '../preferences/preference.entity';
import { UserInterest, Interest } from '../interests/interest.entity';
import { User } from '../users/user.entity';
import { ProfilesService } from './profiles.service';
import { ProfileViewsService } from './profile-views.service';
import { ProfilesController } from './profiles.controller';
import { RecommendationsModule } from '../recommendations/recommendations.module';
import { BlocksModule } from '../blocks/blocks.module';
import { InterestsModule } from '../interests/interests.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Profile,
      ProfilePhoto,
      ProfileView,
      Preference,
      UserInterest,
      Interest,
      User,
    ]),
    RecommendationsModule,
    BlocksModule,
    InterestsModule,
  ],
  providers: [ProfilesService, ProfileViewsService],
  controllers: [ProfilesController],
  exports: [ProfilesService, ProfileViewsService],
})
export class ProfilesModule {}
