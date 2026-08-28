import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, AccountStatus } from './user.entity';
import { UserSettings, ProfileVisibility } from './user-settings.entity';
import { UpdateSettingsDto, ChangePasswordDto } from './users.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(UserSettings)
    private readonly settingsRepo: Repository<UserSettings>,
  ) {}

  findById(id: string): Promise<User | null> {
    return this.users.findOne({ where: { id } });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.users.findOne({ where: { email: email.toLowerCase().trim() } });
  }

  async getOrCreateSettings(userId: string): Promise<UserSettings> {
    let settings = await this.settingsRepo.findOne({ where: { userId } });
    if (!settings) {
      settings = this.settingsRepo.create({ userId });
      settings = await this.settingsRepo.save(settings);
    }
    return settings;
  }

  async getSettings(userId: string) {
    return this.getOrCreateSettings(userId);
  }

  async updateSettings(userId: string, dto: UpdateSettingsDto) {
    const settings = await this.getOrCreateSettings(userId);
    Object.assign(settings, dto);
    if (dto.profileVisibility) {
      settings.profileVisibility = dto.profileVisibility as ProfileVisibility;
    }
    return this.settingsRepo.save(settings);
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('User not found.');
    const ok = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!ok) throw new BadRequestException('Current password is incorrect.');
    user.passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.users.save(user);
    return { success: true };
  }

  async setStatus(userId: string, status: AccountStatus) {
    await this.users.update({ id: userId }, { status });
    return { success: true };
  }

  /** Soft delete: anonymise PII and mark deleted (keeps rows for referential
   *  integrity of messages/matches while removing the account from the app). */
  async deleteAccount(userId: string) {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('User not found.');
    user.status = AccountStatus.DELETED;
    user.email = `deleted+${userId}@kokoromarch.local`;
    user.name = 'Deleted user';
    user.passwordHash = await bcrypt.hash(Date.now() + Math.random() + '', 12);
    user.refreshTokenHash = null;
    user.resetTokenHash = null;
    await this.users.save(user);
    return { success: true };
  }

  async touchLastActive(userId: string) {
    await this.users.update({ id: userId }, { lastActiveAt: new Date() });
  }
}
