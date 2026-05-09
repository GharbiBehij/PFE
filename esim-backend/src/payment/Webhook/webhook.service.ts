import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Get, Query, Redirect } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/Guards/JwtAuthGuard';
import { PaymentVerificationService } from '../payment-verification.service';
import { PaymentVerifyDto } from '../dto/payment-verify.dto';

@ApiTags('payment')
@SkipThrottle()
@Controller('payment')
export class PaymentVerifyController {
  private readonly logger = new Logger(PaymentVerifyController.name);

  constructor(
    private readonly verificationService: PaymentVerificationService,
  ) {}

  @Post('verify')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify ClicToPay payment status after redirect',
  })
  @ApiResponse({
    status: 200,
    schema: {
      properties: {
        status: { type: 'string', enum: ['SUCCESS', 'FAILED'] },
        transactionId: { type: 'number' },
      },
    },
  })
  async verifyPayment(
    @Body() dto: PaymentVerifyDto,
  ): Promise<{ status: 'SUCCESS' | 'FAILED'; transactionId: number }> {
    this.logger.log(`[verify] Verifying orderId=${dto.orderId}`);
    return this.verificationService.verifyAndProcess(dto.orderId);
  }
  // ── NEW: ClicToPay success redirect ───────────────────────────────
  @Get('redirect/success')
  @Redirect()
  redirectSuccess(@Query('orderId') orderId: string) {
    this.logger.log(`[redirect] success orderId=${orderId}`);
    return {
      url: `netyfly://payment/success?orderId=${orderId ?? ''}`,
      statusCode: 302,
    };
  }

  // ── NEW: ClicToPay fail redirect ───────────────────────────────────
  @Get('redirect/fail')
  @Redirect()
  redirectFail(@Query('orderId') orderId: string) {
    this.logger.log(`[redirect] fail orderId=${orderId}`);
    return {
      url: `netyfly://payment/fail?orderId=${orderId ?? ''}`,
      statusCode: 302,
    };
  }
}
