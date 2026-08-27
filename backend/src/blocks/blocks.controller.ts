import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  Post,
} from '@nestjs/common';
import { BlocksService } from './blocks.service';
import { CurrentUser, AuthUser } from '../common/decorators';
import { RecommendationsService } from '../recommendations/recommendations.service';

@Controller('blocks')
export class BlocksController {
  constructor(
    private readonly blocks: BlocksService,
    private readonly recommendations: RecommendationsService,
  ) {}

  @Post(':userId')
  async block(@CurrentUser() auth: AuthUser, @Param('userId') userId: string) {
    if (auth.id === userId) throw new BadRequestException('Invalid user.');
    await this.blocks.block(auth.id, userId);
    return { success: true };
  }

  @Delete(':userId')
  unblock(@CurrentUser() auth: AuthUser, @Param('userId') userId: string) {
    return this.blocks.unblock(auth.id, userId);
  }

  @Get()
  async list(@CurrentUser() auth: AuthUser) {
    const rows = await this.blocks.listForUser(auth.id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items: any[] = [];
    for (const b of rows) {
      const card = await this.recommendations.getProfileCard(
        auth.id,
        b.blockedId,
        { skipBlockCheck: true },
      );
      if (card) items.push({ block: b, user: card });
    }
    return items;
  }
}
