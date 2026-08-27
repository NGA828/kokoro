import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Match } from './match.entity';
import { Like } from '../likes/like.entity';
import { MatchesService } from './matches.service';
import { MatchesController } from './matches.controller';
import { ConversationsModule } from '../conversations/conversations.module';
import { RecommendationsModule } from '../recommendations/recommendations.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Match, Like]),
    ConversationsModule,
    RecommendationsModule,
  ],
  providers: [MatchesService],
  controllers: [MatchesController],
  exports: [MatchesService],
})
export class MatchesModule {}
