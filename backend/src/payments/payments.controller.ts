import { Body, Controller, Post } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentWebhookDto } from '../premium/premium.dto';
import { Public } from '../common/decorators';

/**
 * PSP webhook endpoint. In production this would be signature-verified per
 * provider (MTN MoMo, Orange Money, Paystack, Flutterwave...). The mock flow
 * can also drive it for end-to-end testing.
 */
@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Public()
  @Post('webhook')
  webhook(@Body() dto: PaymentWebhookDto) {
    return this.payments.confirm(dto.paymentId, dto.status, dto.providerRef);
  }
}
