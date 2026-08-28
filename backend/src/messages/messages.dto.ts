import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

export class SendMessageDto {
  @ValidateIf((o) => !o.attachmentUrl)
  @IsString()
  @MaxLength(3000)
  body?: string;

  @IsOptional()
  @Matches(/^(https?:\/\/\S+|\/media\/\S+)$/, {
    message: 'Attachment must be a valid URL or uploaded media.',
  })
  @MaxLength(500)
  attachmentUrl?: string;

  @IsOptional()
  @IsIn(['image', 'voice'])
  attachmentKind?: 'image' | 'voice';

  @IsOptional()
  @IsString()
  @MaxLength(64)
  attachmentMime?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  durationSec?: number;
}
