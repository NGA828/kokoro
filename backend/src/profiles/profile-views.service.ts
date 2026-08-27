import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProfileView } from './profile-view.entity';

@Injectable()
export class ProfileViewsService {
  constructor(
    @InjectRepository(ProfileView)
    private readonly repo: Repository<ProfileView>,
  ) {}

  async recordView(viewerId: string, viewedId: string) {
    // One view row per viewer/viewed pair per day is enough for MVP analytics.
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    const existing = await this.repo
      .createQueryBuilder('v')
      .where('v.viewer_id = :viewer', { viewer: viewerId })
      .andWhere('v.viewed_id = :viewed', { viewed: viewedId })
      .andWhere('v.created_at >= :since', { since })
      .getOne();
    if (!existing) {
      await this.repo.save(
        this.repo.create({ viewerId, viewedId }),
      );
    }
  }

  async countViews(userId: string, sinceDays?: number): Promise<number> {
    const qb = this.repo
      .createQueryBuilder('v')
      .where('v.viewed_id = :userId', { userId });
    if (sinceDays) {
      const since = new Date();
      since.setDate(since.getDate() - sinceDays);
      qb.andWhere('v.created_at >= :since', { since });
    }
    return qb.getCount();
  }
}
