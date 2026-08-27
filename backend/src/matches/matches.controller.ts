import {
  Controller,
  Get,
  Param,
  Post,
} from '@nestjs/common';
import { MatchesService } from './matches.service';
import { CurrentUser, AuthUser } from '../common/decorators';

@Controller('matches')
export class MatchesController {
  constructor(private readonly matches: MatchesService) {}

  @Get()
  list(@CurrentUser() auth: AuthUser) {
    return this.matches.list(auth.id);
  }

  @Post(':id/unmatch')
  unmatch(@CurrentUser() auth: AuthUser, @Param('id') id: string) {
    return this.matches.unmatch(auth.id, id);
  }
}
