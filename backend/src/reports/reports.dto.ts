import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export const REPORT_REASONS = [
  'fake_profile',
  'harassment',
  'spam',
  'inappropriate',
  'scam',
  'other',
];

export class CreateReportDto {
  @IsString()
  @IsNotEmpty()
  reportedUserId: string;

  @IsIn(REPORT_REASONS, { message: 'Please choose a reason.' })
  reason: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  details?: string;
}
