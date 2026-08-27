import { Controller, Get, Query } from '@nestjs/common';
import { RecommendationsService } from '../recommendations/recommendations.service';
import { CurrentUser, AuthUser } from '../common/decorators';
import { LikesService } from '../likes/likes.service';

@Controller('discover')
export class DiscoveryController {
  constructor(
    private readonly recommendations: RecommendationsService,
    private readonly likes: LikesService,
  ) {}

  @Get()
  async discover(
    @CurrentUser() auth: AuthUser,
    @Query('showMe') showMe?: string,
    @Query('ageMin') ageMin?: string,
    @Query('ageMax') ageMax?: string,
    @Query('maxDistanceKm') maxDistanceKm?: string,
    @Query('intention') intention?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const result = await this.recommendations.discover(auth.id, {
      showMe,
      ageMin: ageMin ? parseInt(ageMin, 10) : undefined,
      ageMax: ageMax ? parseInt(ageMax, 10) : undefined,
      maxDistanceKm: maxDistanceKm ? parseInt(maxDistanceKm, 10) : undefined,
      intention,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
    const quota = await this.likes.quota(auth.id);
    return { ...result, quota };
  }
}
