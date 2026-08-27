import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import {
  OnboardingDto,
  PhotoDto,
  UpdateProfileDto,
} from './profiles.dto';
import { CurrentUser, AuthUser } from '../common/decorators';
import { ProfileViewsService } from './profile-views.service';
import { BlocksService } from '../blocks/blocks.service';
import { InterestsService } from '../interests/interests.service';
import { RecommendationsService } from '../recommendations/recommendations.service';

@Controller('profiles')
export class ProfilesController {
  constructor(
    private readonly profiles: ProfilesService,
    private readonly views: ProfileViewsService,
    private readonly blocks: BlocksService,
    private readonly interests: InterestsService,
    private readonly recommendations: RecommendationsService,
  ) {}

  @Get('me')
  me(@CurrentUser() auth: AuthUser) {
    return this.profiles.getMyProfile(auth.id);
  }

  @Patch('me')
  update(@CurrentUser() auth: AuthUser, @Body() dto: UpdateProfileDto) {
    return this.profiles.update(auth.id, dto);
  }

  @Post('onboarding')
  onboarding(@CurrentUser() auth: AuthUser, @Body() dto: OnboardingDto) {
    return this.profiles.completeOnboarding(auth.id, dto);
  }

  @Post('me/photos')
  addPhoto(@CurrentUser() auth: AuthUser, @Body() dto: PhotoDto) {
    return this.profiles.addPhoto(auth.id, dto.url, dto.source, dto.publicId);
  }

  @Delete('me/photos/:photoId')
  removePhoto(@CurrentUser() auth: AuthUser, @Param('photoId') photoId: string) {
    return this.profiles.removePhoto(auth.id, photoId);
  }

  @Post('me/photos/:photoId/main')
  setMainPhoto(@CurrentUser() auth: AuthUser, @Param('photoId') photoId: string) {
    return this.profiles.setMainPhoto(auth.id, photoId);
  }

  @Post('me/verification')
  requestVerification(@CurrentUser() auth: AuthUser) {
    return this.profiles.requestVerification(auth.id);
  }

  @Get(':userId')
  async view(@CurrentUser() auth: AuthUser, @Param('userId') userId: string) {
    const [profileCard, blocked, interests, compatibility] = await Promise.all([
      this.recommendations.getProfileCard(auth.id, userId),
      this.blocks.hasAnyBlock(auth.id, userId),
      this.interests.forUser(userId),
      this.recommendations.compatibility(auth.id, userId),
    ]);
    if (!profileCard) {
      return { notFound: true };
    }
    // Record a profile view (not on own profile).
    if (auth.id !== userId && !blocked) {
      await this.views.recordView(auth.id, userId);
    }
    return {
      ...profileCard,
      interests,
      compatibility,
      blocked,
      isOwn: auth.id === userId,
    };
  }
}
