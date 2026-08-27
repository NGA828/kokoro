import { Module } from '@nestjs/common';
import { DiscoveryController } from './discovery.controller';
import { RecommendationsModule } from '../recommendations/recommendations.module';
import { LikesModule } from '../likes/likes.module';

@Module({
  imports: [RecommendationsModule, LikesModule],
  controllers: [DiscoveryController],
})
export class DiscoveryModule {}
