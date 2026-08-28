import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CurrentUser, AuthUser } from '../common/decorators';
import { SendMessageDto } from './messages.dto';
import { ConversationsService } from '../conversations/conversations.service';

@Controller()
export class MessagesController {
  constructor(
    private readonly messages: MessagesService,
    private readonly conversations: ConversationsService,
  ) {}

  @Get('conversations/:id/messages')
  async list(
    @CurrentUser() auth: AuthUser,
    @Param('id') id: string,
    @Query('before') before?: string,
  ) {
    await this.conversations.assertParticipant(id, auth.id);
    const [result, total] = await Promise.all([
      this.messages.listForConversation(id, before),
      this.messages.countForConversation(id),
    ]);
    return { items: result.items, hasMore: result.hasMore, total };
  }

  @Post('conversations/:id/messages')
  send(
    @CurrentUser() auth: AuthUser,
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.messages.send(id, auth.id, dto);
  }

  @Post('conversations/:id/read')
  read(@CurrentUser() auth: AuthUser, @Param('id') id: string) {
    return this.messages.markRead(id, auth.id);
  }

  @Delete('messages/:id')
  remove(@CurrentUser() auth: AuthUser, @Param('id') id: string) {
    return this.messages.deleteMessage(id, auth.id);
  }
}
