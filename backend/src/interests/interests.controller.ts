import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';
import { InterestsService } from './interests.service';
import { CurrentUser, AuthUser, Roles } from '../common/decorators';

class CreateInterestDto {
  @IsString() @MaxLength(64) slug: string;
  @IsString() @MaxLength(120) name: string;
  @IsOptional() @IsString() @MaxLength(16) emoji?: string;
  @IsOptional() @IsString() @MaxLength(24) category?: string;
}

class ToggleInterestDto {
  @IsBoolean() active: boolean;
}

@Controller('interests')
export class InterestsController {
  constructor(private readonly service: InterestsService) {}

  @Get()
  list() {
    return this.service.listAll();
  }

  @Get('me')
  async mine(@CurrentUser() auth: AuthUser) {
    return this.service.forUser(auth.id);
  }

  @Post()
  @Roles('admin')
  create(@Body() dto: CreateInterestDto) {
    return this.service.create({
      slug: dto.slug,
      name: dto.name,
      emoji: dto.emoji ?? null,
      category: dto.category as never,
      active: true,
    });
  }

  @Patch(':id')
  @Roles('admin')
  toggle(@Param('id') id: string, @Body() dto: ToggleInterestDto) {
    return this.service.setActive(id, dto.active);
  }
}
