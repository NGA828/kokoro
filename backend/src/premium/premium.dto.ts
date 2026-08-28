import { IsIn, IsOptional, IsString, Matches } from 'class-validator';

export class SubscribeDto {
  @IsString()
  planId: string;

  /**
   * Optional mock mobile-money reference (MTN MoMo / Orange Money style).
   * The mock provider simply confirms payment; a real PSP integration would
   * receive a provider webhook instead.
   */
  @IsOptional()
  @Matches(/^\+?[0-9]{6,15}$/, {
    message: 'Enter a valid mobile money phone number.',
  })
  payerPhone?: string;
}

export class PaymentWebhookDto {
  @IsString()
  paymentId: string;

  @IsIn(['succeeded', 'failed'])
  status: 'succeeded' | 'failed';

  @IsOptional()
  @IsString()
  providerRef?: string;
}
