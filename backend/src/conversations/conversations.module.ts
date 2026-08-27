import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Conversation,
  ConversationParticipant,
} from './conversation.entity';
import { Match } from '../matches/match.entity';
import { ConversationsService } from './conversations.service';
import { ConversationsController } from './conversations.controller';
import { RecommendationsModule } from '../recommendations/recommendations.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Conversation, ConversationParticipant, Match]),
    RecommendationsModule,
  ],
  providers: [ConversationsService],
  controllers: [ConversationsController],
  exports: [ConversationsService, TypeOrmModule],
})
export class ConversationsModule {}
