import {
  Controller,
  Get,
} from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { CurrentUser, AuthUser } from '../common/decorators';

@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversations: ConversationsService) {}

  @Get()
  list(@CurrentUser() auth: AuthUser) {
    return this.conversations.listForUser(auth.id);
  }
}
