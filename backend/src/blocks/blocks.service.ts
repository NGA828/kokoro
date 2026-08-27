import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Block } from './block.entity';

@Injectable()
export class BlocksService {
  constructor(
    @InjectRepository(Block)
    private readonly repo: Repository<Block>,
  ) {}

  async block(blockerId: string, blockedId: string): Promise<Block> {
    if (blockerId === blockedId) {
      throw new Error('Cannot block yourself.');
    }
    const existing = await this.repo.findOne({
      where: { blockerId, blockedId },
    });
    if (existing) return existing;
    const block = this.repo.create({ blockerId, blockedId });
    return this.repo.save(block);
  }

  async unblock(blockerId: string, blockedId: string) {
    await this.repo.delete({ blockerId, blockedId });
    return { success: true };
  }

  /** True if either direction of block exists between the two users. */
  async hasAnyBlock(userA: string, userB: string): Promise<boolean> {
    const count = await this.repo.count({
      where: [
        { blockerId: userA, blockedId: userB },
        { blockerId: userB, blockedId: userA },
      ],
    });
    return count > 0;
  }

  /** All user ids blocked BY or blocking the given user (excluded from discovery). */
  async excludedUserIds(userId: string): Promise<string[]> {
    const rows = await this.repo.find({
      where: [{ blockerId: userId }, { blockedId: userId }],
    });
    const ids = new Set<string>();
    for (const r of rows) {
      ids.add(r.blockerId);
      ids.add(r.blockedId);
    }
    ids.delete(userId);
    return [...ids];
  }

  listForUser(userId: string): Promise<Block[]> {
    return this.repo.find({
      where: { blockerId: userId },
      order: { createdAt: 'DESC' },
    });
  }
}
