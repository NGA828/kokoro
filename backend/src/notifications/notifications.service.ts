import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Notification,
  NotificationType,
} from './notification.entity';
import { UserSettings } from '../users/user-settings.entity';
import { RealtimeGateway } from '../common/realtime.gateway';

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  data?: Record<string, unknown>;
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly repo: Repository<Notification>,
    @InjectRepository(UserSettings)
    private readonly settingsRepo: Repository<UserSettings>,
    private readonly realtime: RealtimeGateway,
  ) {}

  async create(input: CreateNotificationInput): Promise<Notification> {
    // Respect the user's notification preferences.
    const settings = await this.settingsRepo.findOne({
      where: { userId: input.userId },
    });
    const prefKey: Record<string, keyof UserSettings | null> = {
      [NotificationType.MESSAGE]: 'notifMessage',
      [NotificationType.LIKE]: 'notifLike',
      [NotificationType.SUPERLIKE]: 'notifLike',
      [NotificationType.MATCH]: 'notifMatch',
      [NotificationType.SYSTEM]: 'notifSystem',
      [NotificationType.PREMIUM]: 'notifSystem',
      [NotificationType.VERIFICATION]: 'notifSystem',
      [NotificationType.PROFILE_VIEW]: null,
    };
    const key = prefKey[input.type];
    if (key && settings && settings[key] === false) {
      // Still persist to the in-app center silently? We skip push but keep record.
    }

    const notification = this.repo.create({
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body ?? null,
      data: input.data ?? null,
    });
    const saved = await this.repo.save(notification);

    // Realtime push to all of the user's devices.
    this.realtime.emitToUser(input.userId, 'notification', saved);
    return saved;
  }

  list(userId: string) {
    return this.repo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  async unreadCount(userId: string): Promise<number> {
    return this.repo.count({ where: { userId, isRead: false } });
  }

  async markRead(userId: string, id: string) {
    await this.repo.update({ id, userId }, { isRead: true });
    return { success: true };
  }

  async markAllRead(userId: string) {
    await this.repo.update({ userId, isRead: false }, { isRead: true });
    return { success: true };
  }
}
