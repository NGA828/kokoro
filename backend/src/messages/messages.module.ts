import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message, MessageAttachment } from './message.entity';
import { ConversationParticipant } from '../conversations/conversation.entity';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { ConversationsModule } from '../conversations/conversations.module';
import { BlocksModule } from '../blocks/blocks.module';
import { RealtimeModule } from '../common/realtime.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message, MessageAttachment, ConversationParticipant]),
    ConversationsModule,
    BlocksModule,
    RealtimeModule,
    NotificationsModule,
  ],
  providers: [MessagesService],
  controllers: [MessagesController],
  exports: [MessagesService],
})
export class MessagesModule {}
