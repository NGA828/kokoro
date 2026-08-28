import { Body, Controller, Get, Put } from '@nestjs/common';
import {
  IsIn,
  IsInt,
  IsOptional,
  Max,
  Min,
} from 'class-validator';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Preference } from './preference.entity';
import { CurrentUser, AuthUser } from '../common/decorators';

class UpdatePreferenceDto {
  @IsOptional()
  @IsIn(['female', 'male', 'other', 'everyone'])
  showMe?: string;

  @IsOptional()
  @IsInt()
  @Min(18)
  @Max(99)
  ageMin?: number;

  @IsOptional()
  @IsInt()
  @Min(18)
  @Max(99)
  ageMax?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(500)
  maxDistanceKm?: number;

  @IsOptional()
  @IsIn(['long_term', 'serious', 'friendship', 'casual', 'not_sure'])
  intention?: string;
}

@Controller('preferences')
export class PreferencesController {
  constructor(
    @InjectRepository(Preference)
    private readonly repo: Repository<Preference>,
  ) {}

  @Get()
  async get(@CurrentUser() auth: AuthUser) {
    let pref = await this.repo.findOne({ where: { userId: auth.id } });
    if (!pref) {
      pref = await this.repo.save(this.repo.create({ userId: auth.id }));
    }
    return pref;
  }

  @Put()
  async update(@CurrentUser() auth: AuthUser, @Body() dto: UpdatePreferenceDto) {
    let pref = await this.repo.findOne({ where: { userId: auth.id } });
    if (!pref) pref = this.repo.create({ userId: auth.id });
    Object.assign(pref, dto);
    if (pref.ageMin && pref.ageMax && pref.ageMin > pref.ageMax) {
      [pref.ageMin, pref.ageMax] = [pref.ageMax, pref.ageMin];
    }
    return this.repo.save(pref);
  }
}
