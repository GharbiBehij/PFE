import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Query,
  Redirect,
  UseGuards,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../src/auth/Guards/JwtAuthGuard';
import { PaymentVerificationService } from '../payment/payment-verification.service';
import { PaymentVerifyDto } from '../payment/dto/payment-verify.dto';

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
  @ApiOperation({ summary: 'Verify ClicToPay payment after redirect' })
  async verifyPayment(
    @Body() dto: PaymentVerifyDto,
  ): Promise<{ status: 'SUCCESS' | 'FAILED'; transactionId: number }> {
    this.logger.log(`[verify] orderId=${dto.orderId}`);
    return this.verificationService.verifyAndProcess(dto.orderId);
  }

  @Get('redirect/success')
  @Redirect()
  redirectSuccess(@Query('orderId') orderId: string) {
    this.logger.log(`[redirect] success orderId=${orderId}`);
    return {
      url: `netyfly://payment/success?orderId=${orderId ?? ''}`,
      statusCode: 302,
    };
  }

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