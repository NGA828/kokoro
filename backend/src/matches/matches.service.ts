import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Match } from './match.entity';
import { Like } from '../likes/like.entity';
import { ConversationsService } from '../conversations/conversations.service';
import { RecommendationsService } from '../recommendations/recommendations.service';

@Injectable()
export class MatchesService {
  constructor(
    @InjectRepository(Match)
    private readonly matches: Repository<Match>,
    @InjectRepository(Like)
    private readonly likes: Repository<Like>,
    private readonly conversations: ConversationsService,
    private readonly recommendations: RecommendationsService,
  ) {}

  async list(userId: string) {
    const rows = await this.matches.find({
      where: [
        { userOneId: userId, unmatched: false },
        { userTwoId: userId, unmatched: false },
      ],
      order: { createdAt: 'DESC' },
    });
    const items: Array<Record<string, unknown>> = [];
    for (const match of rows) {
      const otherId = match.otherUserId(userId);
      const card = await this.recommendations.getProfileCard(userId, otherId);
      if (!card) continue;
      const conv = match.conversationId
        ? await this.conversations.listForUser(userId).then((list) =>
            list.find((c) => c.id === match.conversationId),
          )
        : null;
      items.push({
        id: match.id,
        conversationId: match.conversationId,
        compatibility: match.compatibilityScore,
        isSuper: match.isSuper,
        createdAt: match.createdAt,
        other: card,
        lastMessageAt: conv?.lastMessageAt ?? null,
        lastMessagePreview: conv?.lastMessagePreview ?? null,
      });
    }
    return items;
  }

  async unmatch(userId: string, matchId: string) {
    const match = await this.matches.findOne({ where: { id: matchId } });
    if (!match) throw new NotFoundException('Match not found.');
    if (match.userOneId !== userId && match.userTwoId !== userId) {
      throw new ForbiddenException('Not your match.');
    }
    match.unmatched = true;
    match.unmatchedBy = userId;
    match.unmatchedAt = new Date();
    await this.matches.save(match);

    // Close the conversation so no further messages can be sent.
    if (match.conversationId) {
      await this.conversations.closeForMatch(match.id);
    }
    // Remove the likes so they can re-discover each other later if desired.
    await this.likes.delete([
      { likerId: match.userOneId, likedId: match.userTwoId },
      { likerId: match.userTwoId, likedId: match.userOneId },
    ]);
    return { success: true };
  }

  countForUser(userId: string): Promise<number> {
    return this.matches.count({
      where: [
        { userOneId: userId, unmatched: false },
        { userTwoId: userId, unmatched: false },
      ],
    });
  }
}
