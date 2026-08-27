import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Like, LikeType } from './like.entity';
import { Match } from '../matches/match.entity';
import { BlocksService } from '../blocks/blocks.service';
import { PremiumService } from '../premium/premium.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RecommendationsService } from '../recommendations/recommendations.service';
import { ConversationsService } from '../conversations/conversations.service';
import { NotificationType } from '../notifications/notification.entity';
import { UserSettings } from '../users/user-settings.entity';
import { Profile } from '../profiles/profile.entity';
import { startOfWeek } from '../common/time';

@Injectable()
export class LikesService {
  constructor(
    @InjectRepository(Like) private readonly likes: Repository<Like>,
    @InjectRepository(Match) private readonly matches: Repository<Match>,
    @InjectRepository(UserSettings)
    private readonly settingsRepo: Repository<UserSettings>,
    @InjectRepository(Profile)
    private readonly profiles: Repository<Profile>,
    private readonly blocks: BlocksService,
    private readonly premium: PremiumService,
    private readonly notifications: NotificationsService,
    private readonly recommendations: RecommendationsService,
    private readonly conversations: ConversationsService,
  ) {}

  private startOfToday(): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private async assertCanAct(likerId: string, likedId: string, type: LikeType) {
    if (likerId === likedId) {
      throw new BadRequestException('You cannot interact with your own profile.');
    }
    if (await this.blocks.hasAnyBlock(likerId, likedId)) {
      throw new ForbiddenException('This profile is not available.');
    }
    const entitlements = await this.premium.entitlements(likerId);

    if (type === LikeType.SUPERLIKE) {
      const weekStart = startOfWeek(new Date());
      const used = await this.likes
        .createQueryBuilder('l')
        .where('l.liker_id = :id', { id: likerId })
        .andWhere('l.type = :t', { t: LikeType.SUPERLIKE })
        .andWhere('l.created_at >= :s', { s: weekStart })
        .getCount();
      if (used >= entitlements.superLikesPerWeek) {
        throw new ForbiddenException(
          `You've used all your Super Likes this week${entitlements.isPremium ? '' : ' — upgrade to Premium for more'}.`,
        );
      }
    } else if (type === LikeType.LIKE) {
      const todayCount = await this.likes
        .createQueryBuilder('l')
        .where('l.liker_id = :id', { id: likerId })
        .andWhere('l.type = :t', { t: LikeType.LIKE })
        .andWhere('l.created_at >= :s', { s: this.startOfToday() })
        .getCount();
      if (todayCount >= entitlements.dailyLikeLimit) {
        throw new ForbiddenException(
          `You've reached today's like limit${entitlements.isPremium ? '' : ' — upgrade to Premium for unlimited likes'}.`,
        );
      }
    }
  }

  /** Like / super-like / pass on a profile. Creates a match on mutual like. */
  async act(likerId: string, likedId: string, type: LikeType) {
    await this.assertCanAct(likerId, likedId, type);

    // Upsert the swipe (unique pair) so re-acting updates the decision.
    let action = await this.likes.findOne({ where: { likerId, likedId } });
    if (action) {
      action.type = type;
      action.rewindableUntil = new Date(Date.now() + 24 * 3600 * 1000);
    } else {
      action = this.likes.create({
        likerId,
        likedId,
        type,
        rewindableUntil: new Date(Date.now() + 24 * 3600 * 1000),
      });
    }
    await this.likes.save(action);

    if (type === LikeType.PASS) {
      return { matched: false };
    }

    // A match requires a like/superlike in the opposite direction.
    const reciprocal = await this.likes.findOne({
      where: { likerId: likedId, likedId: likerId },
    });
    const mutual =
      reciprocal &&
      (reciprocal.type === LikeType.LIKE ||
        reciprocal.type === LikeType.SUPERLIKE);

    if (!mutual) {
      // Notify the recipient (teaser for regular likes).
      const theirProfile = await this.profiles.findOne({
        where: { userId: likerId },
      });
      const entitlements = await this.premium.entitlements(likedId);
      if (type === LikeType.SUPERLIKE) {
        await this.notifications.create({
          userId: likedId,
          type: NotificationType.SUPERLIKE,
          title: `${theirProfile?.name ?? 'Someone'} Super Liked you! 🌟`,
          body: 'Swipe to find out who — this could be your moment.',
          data: { fromUserId: likerId },
        });
      } else if (entitlements.seeWhoLikesYou) {
        await this.notifications.create({
          userId: likedId,
          type: NotificationType.LIKE,
          title: `${theirProfile?.name ?? 'Someone'} liked you ❤️`,
          body: 'Like them back and see if it is a match.',
          data: { fromUserId: likerId },
        });
      } else {
        await this.notifications.create({
          userId: likedId,
          type: NotificationType.LIKE,
          title: 'You have a new like ❤️',
          body: 'Someone liked your profile. Upgrade to see who, or keep discovering!',
        });
      }
      return { matched: false, superLike: type === LikeType.SUPERLIKE };
    }

    // ── Mutual like → create the match ──────────────────────────────
    const existing = await this.findMatchBetween(likerId, likedId);
    let match: Match;
    let conversationId: string;
    const comp = await this.recommendations.compatibility(likerId, likedId);

    if (existing) {
      match = existing;
      match.unmatched = false;
      match.unmatchedBy = null;
      match.unmatchedAt = null;
      conversationId = match.conversationId!;
      await this.matches.save(match);
    } else {
      const conversation = await this.conversations.createForMatch(
        likerId,
        likedId,
      );
      conversationId = conversation.id;
      const [a, b] = [likerId, likedId].sort();
      match = this.matches.create({
        userOneId: a,
        userTwoId: b,
        conversationId: conversation.id,
        compatibilityScore: comp?.score ?? 0,
        isSuper: type === LikeType.SUPERLIKE || reciprocal.type === LikeType.SUPERLIKE,
      });
      match = await this.matches.save(match);
      await this.conversations.attachMatch(conversation.id, match.id);
    }

    // Mark both likes as matched.
    await this.likes.update(
      { likerId, likedId },
      { isMatched: true },
    );
    await this.likes.update(
      { likerId: likedId, likedId: likerId },
      { isMatched: true },
    );

    // Notify both parties.
    const [p1, p2] = await Promise.all([
      this.profiles.findOne({ where: { userId: likerId } }),
      this.profiles.findOne({ where: { userId: likedId } }),
    ]);
    for (const [uid, other] of [
      [likerId, p2],
      [likedId, p1],
    ] as const) {
      await this.notifications.create({
        userId: uid,
        type: NotificationType.MATCH,
        title: "It's a Match! ❤️",
        body: `You and ${other?.name ?? 'each other'} liked each other. Say hello!`,
        data: {
          matchId: match.id,
          conversationId,
          otherUserId: uid === likerId ? likedId : likerId,
          name: other?.name,
          photo: other?.mainPhotoUrl,
        },
      });
    }

    const card = await this.recommendations.getProfileCard(likerId, likedId);
    return {
      matched: true,
      match: { id: match.id, conversationId, compatibilityScore: match.compatibilityScore },
      other: card,
    };
  }

  findMatchBetween(a: string, b: string): Promise<Match | null> {
    return this.matches.findOne({
      where: [
        { userOneId: a, userTwoId: b },
        { userOneId: b, userTwoId: a },
      ],
    });
  }

  /** Remove a specific outgoing swipe (only allowed before a match forms). */
  async rewindTarget(userId: string, targetId: string) {
    const like = await this.likes.findOne({
      where: { likerId: userId, likedId: targetId },
    });
    if (!like) return { success: true };
    if (like.isMatched) {
      throw new BadRequestException(
        'You already matched — unmatch from the Matches page instead.',
      );
    }
    await this.likes.delete({ id: like.id });
    return { success: true };
  }

  /** Undo the most recent swipe (rewind). Premium: any in 24h; free: last, 1h. */
  async rewind(userId: string) {
    const entitlements = await this.premium.entitlements(userId);
    const windowHours = entitlements.isPremium ? 24 : 1;
    const since = new Date(Date.now() - windowHours * 3600 * 1000);
    const last = await this.likes.findOne({
      where: { likerId: userId },
      order: { createdAt: 'DESC' },
    });
    if (!last || last.createdAt < since || last.isMatched) {
      throw new BadRequestException('Nothing to undo right now.');
    }
    const restoredUserId = last.likedId;
    await this.likes.delete({ id: last.id });
    const card = await this.recommendations.getProfileCard(userId, restoredUserId);
    return { restored: card };
  }

  /** People who liked me (premium sees all; free gets a blurred teaser set). */
  async receivedLikes(userId: string) {
    const entitlements = await this.premium.entitlements(userId);
    const rows = await this.likes.find({
      where: { likedId: userId, type: LikeType.LIKE, isMatched: false },
      order: { createdAt: 'DESC' },
    });
    const superRows = await this.likes.find({
      where: { likedId: userId, type: LikeType.SUPERLIKE, isMatched: false },
      order: { createdAt: 'DESC' },
    });
    const all = [...superRows, ...rows];
    const items: Array<Record<string, unknown>> = [];
    for (const row of all) {
      const card = await this.recommendations.getProfileCard(userId, row.likerId);
      if (!card) continue;
      items.push({
        ...card,
        isSuperLike: row.type === LikeType.SUPERLIKE,
        blurred: !entitlements.seeWhoLikesYou && row.type !== LikeType.SUPERLIKE,
        likedAt: row.createdAt,
      });
    }
    const visible = entitlements.seeWhoLikesYou
      ? items
      : items.map((i, idx) => (i.isSuperLike ? i : { ...i, blurred: idx >= 3 }));
    return {
      items: visible,
      totalCount: items.length,
      isPremium: entitlements.isPremium,
    };
  }

  /** People I liked (who haven't matched yet). */
  async sentLikes(userId: string) {
    const rows = await this.likes.find({
      where: [
        { likerId: userId, type: LikeType.LIKE, isMatched: false },
        { likerId: userId, type: LikeType.SUPERLIKE, isMatched: false },
      ],
      order: { createdAt: 'DESC' },
    });
    const items: Array<Record<string, unknown>> = [];
    for (const row of rows) {
      const card = await this.recommendations.getProfileCard(userId, row.likedId);
      if (!card) continue;
      items.push({ ...card, isSuperLike: row.type === LikeType.SUPERLIKE });
    }
    return { items };
  }

  /** Remaining likes today (for UI gating). */
  async quota(userId: string) {
    const entitlements = await this.premium.entitlements(userId);
    const usedToday = await this.likes
      .createQueryBuilder('l')
      .where('l.liker_id = :id', { id: userId })
      .andWhere('l.type = :t', { t: LikeType.LIKE })
      .andWhere('l.created_at >= :s', { s: this.startOfToday() })
      .getCount();
    const weekStart = startOfWeek(new Date());
    const superUsed = await this.likes
      .createQueryBuilder('l')
      .where('l.liker_id = :id', { id: userId })
      .andWhere('l.type = :t', { t: LikeType.SUPERLIKE })
      .andWhere('l.created_at >= :s', { s: weekStart })
      .getCount();
    return {
      isPremium: entitlements.isPremium,
      likesUsed: usedToday,
      likesLimit: entitlements.dailyLikeLimit,
      likesRemaining: Math.max(0, entitlements.dailyLikeLimit - usedToday),
      superUsed,
      superLimit: entitlements.superLikesPerWeek,
      superRemaining: Math.max(0, entitlements.superLikesPerWeek - superUsed),
    };
  }
}
