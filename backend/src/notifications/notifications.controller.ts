import {
  Controller,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CurrentUser, AuthUser } from '../common/decorators';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  async list(@CurrentUser() auth: AuthUser) {
    const [items, unread] = await Promise.all([
      this.service.list(auth.id),
      this.service.unreadCount(auth.id),
    ]);
    return { items, unread };
  }

  @Patch(':id/read')
  markRead(@CurrentUser() auth: AuthUser, @Param('id') id: string) {
    return this.service.markRead(auth.id, id);
  }

  @Post('read-all')
  markAllRead(@CurrentUser() auth: AuthUser) {
    return this.service.markAllRead(auth.id);
  }
}
