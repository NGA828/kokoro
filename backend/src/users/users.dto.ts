import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional()
  @IsIn(['public', 'hidden'])
  profileVisibility?: string;

  @IsOptional()
  @IsBoolean()
  showOnlineStatus?: boolean;

  @IsOptional()
  @IsBoolean()
  showDistance?: boolean;

  @IsOptional()
  @IsBoolean()
  notifMessage?: boolean;

  @IsOptional()
  @IsBoolean()
  notifLike?: boolean;

  @IsOptional()
  @IsBoolean()
  notifMatch?: boolean;

  @IsOptional()
  @IsBoolean()
  notifSystem?: boolean;
}

export class ChangePasswordDto {
  @IsString()
  @MinLength(1)
  currentPassword: string;

  @IsString()
  @MinLength(8, { message: 'New password must be at least 8 characters.' })
  newPassword: string;
}
