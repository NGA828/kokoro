import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './notification.entity';
import { UserSettings } from '../users/user-settings.entity';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { RealtimeModule } from '../common/realtime.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, UserSettings]),
    RealtimeModule,
  ],
  providers: [NotificationsService],
  controllers: [NotificationsController],
  exports: [NotificationsService],
})
export class NotificationsModule {}
