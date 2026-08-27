import {
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

/** Accepts absolute http(s) URLs AND root-relative local media paths. */
const MediaUrl = () =>
  Matches(/^(https?:\/\/\S+|\/media\/\S+)$/, {
    message: 'Photo must be a valid URL or an uploaded media path.',
  });

const GENDERS = ['female', 'male', 'other'];
const INTENTIONS = ['long_term', 'serious', 'friendship', 'casual', 'not_sure'];

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  dob?: string;

  @IsOptional()
  @IsIn(GENDERS)
  gender?: string;

  @IsOptional()
  @IsString()
  @MaxLength(600)
  bio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  country?: string;

  @IsOptional()
  @MediaUrl()
  @MaxLength(500)
  mainPhotoUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  avatarStyle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  profileTheme?: string;
}

export class OnboardingDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  dob?: string;

  @IsOptional()
  @IsIn(GENDERS)
  gender?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  country?: string;

  @IsOptional()
  @IsString()
  @MaxLength(600)
  bio?: string;

  @IsOptional()
  @MediaUrl()
  @MaxLength(500)
  mainPhotoUrl?: string;

  @IsOptional()
  @IsIn(INTENTIONS)
  intention?: string;

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
  @IsArray()
  @IsString({ each: true })
  interestIds?: string[];
}

export class PhotoDto {
  @IsString()
  @MediaUrl()
  @MaxLength(500)
  url: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  source?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  publicId?: string;
}
