import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { LikesService } from './likes.service';
import { CurrentUser, AuthUser } from '../common/decorators';

@Controller('likes')
export class LikesController {
  constructor(private readonly likes: LikesService) {}

  @Post(':userId')
  like(
    @CurrentUser() auth: AuthUser,
    @Param('userId') userId: string,
    @Query('type') type?: string,
  ) {
    const t = type === 'superlike' ? 'superlike' : type === 'pass' ? 'pass' : 'like';
    return this.likes.act(auth.id, userId, t as never);
  }

  @Delete(':userId')
  removeLike(@CurrentUser() auth: AuthUser, @Param('userId') userId: string) {
    // Removing a like before it's reciprocated = pass-undo handled via rewind;
    // a direct delete simply deletes the swipe if no match exists.
    return this.likes.rewindTarget(auth.id, userId);
  }

  @Post('actions/rewind')
  rewind(@CurrentUser() auth: AuthUser) {
    return this.likes.rewind(auth.id);
  }

  @Get('received')
  received(@CurrentUser() auth: AuthUser) {
    return this.likes.receivedLikes(auth.id);
  }

  @Get('sent')
  sent(@CurrentUser() auth: AuthUser) {
    return this.likes.sentLikes(auth.id);
  }

  @Get('quota')
  quota(@CurrentUser() auth: AuthUser) {
    return this.likes.quota(auth.id);
  }
}
