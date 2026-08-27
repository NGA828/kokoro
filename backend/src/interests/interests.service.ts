import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Interest, UserInterest } from './interest.entity';

@Injectable()
export class InterestsService {
  constructor(
    @InjectRepository(Interest)
    private readonly interests: Repository<Interest>,
    @InjectRepository(UserInterest)
    private readonly userInterests: Repository<UserInterest>,
  ) {}

  listAll() {
    return this.interests.find({
      where: { active: true },
      order: { category: 'ASC', name: 'ASC' },
    });
  }

  /** Include inactive ones for admin management. */
  listAllAdmin() {
    return this.interests.find({ order: { category: 'ASC', name: 'ASC' } });
  }

  async forUser(userId: string): Promise<Interest[]> {
    const rows = await this.userInterests.find({
      where: { userId },
      relations: ['interest'],
    });
    return rows.map((r) => r.interest).filter(Boolean);
  }

  async userInterestIds(userId: string): Promise<string[]> {
    const rows = await this.userInterests.find({ where: { userId } });
    return rows.map((r) => r.interestId);
  }

  async setForUser(userId: string, interestIds: string[]): Promise<Interest[]> {
    const unique = [...new Set(interestIds)].filter(Boolean);
    // Validate they exist.
    if (unique.length) {
      const found = await this.interests.count({ where: { id: In(unique) } });
      if (found !== unique.length) {
        // Gracefully ignore unknown ids rather than 500-ing onboarding.
      }
    }
    await this.userInterests.delete({ userId });
    if (unique.length) {
      await this.userInterests.save(
        unique.map((interestId) => this.userInterests.create({ userId, interestId })),
      );
    }
    return this.forUser(userId);
  }

  async countShared(userIdA: string, userIdB: string): Promise<number> {
    const a = await this.userInterestIds(userIdA);
    const b = new Set(await this.userInterestIds(userIdB));
    return a.filter((id) => b.has(id)).length;
  }

  async sharedInterests(userIdA: string, userIdB: string): Promise<Interest[]> {
    const a = await this.forUser(userIdA);
    const bIds = new Set(await this.userInterestIds(userIdB));
    return a.filter((i) => bIds.has(i.id));
  }

  create(data: Partial<Interest>) {
    return this.interests.save(this.interests.create(data));
  }

  async setActive(id: string, active: boolean) {
    await this.interests.update({ id }, { active });
    return { success: true };
  }
}
