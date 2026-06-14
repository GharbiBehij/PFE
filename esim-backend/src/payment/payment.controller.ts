import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  Post,
  Query,
  Req,
  Res,
  Redirect,
  UseGuards,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard } from 'src/auth/Guards/JwtAuthGuard';
import { Request, Response } from 'express';
import { PaymentService } from './payment.service';
import { TransactionService } from '../transaction/transaction.service';
import { PaymentVerifyDto } from './dto/payment-verify.dto';

@Controller('payment')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly transactionService: TransactionService,
  ) {}

  // ── INIT PAYMENT ─────────────────────────────────────
  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Query('transactionId', ParseIntPipe) transactionId: number) {
    const transaction = await this.transactionService.findOne(transactionId);

    if (!transaction) {
      throw new BadRequestException('Transaction not found');
    }

    return this.paymentService.initiatePayment(transaction);
  }

  // ── VERIFY (POLLING - READ ONLY) ─────────────────────
  @Get('verify')
  @UseGuards(JwtAuthGuard)
  async verifyPayment(
    @Query('transactionId', ParseIntPipe) transactionId: number,
    @Req() req: Request,
  ) {
    const userId = (req.user as any).userId;

    const transaction = await this.transactionService.findOne(transactionId);

    if (!transaction || transaction.userId !== userId) {
      throw new BadRequestException('Transaction not found');
    }

    return {
      transactionId,
      status: transaction.status,
    };
  }

  // ── VERIFY + PROCESS (AFTER REDIRECT) ────────────────
  @Post('verify')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async verifyAndProcess(@Body() dto: PaymentVerifyDto) {
    return this.paymentService.verifyAndProcess(dto.orderId);
  }

  // ── REDIRECT SUCCESS ─────────────────────────────────
  @Get('redirect/success')
  @SkipThrottle()
  @Redirect()
  redirectSuccess(@Query('orderId') orderId: string) {
    return {
      url: `netyfly://payment/success?orderId=${orderId ?? ''}`,
      statusCode: 302,
    };
  }

  // ── REDIRECT FAIL ────────────────────────────────────
  @Get('redirect/fail')
  @SkipThrottle()
  @Redirect()
  redirectFail(@Query('orderId') orderId: string) {
    return {
      url: `netyfly://payment/fail?orderId=${orderId ?? ''}`,
      statusCode: 302,
    };
  }

  // ── MOCK PAYMENT PAGE (dev/mock mode only) ───────────
  // When PROVIDER_TYPE=mock, ClicToPayService.registerOrder() returns a formUrl
  // pointing here. This page auto-redirects to the success callback so the full
  // B2C flow can be exercised without a real gateway.
  @Get('mock/pay')
  @SkipThrottle()
  mockPay(
    @Query('orderId') orderId: string,
    @Query('returnUrl') returnUrl: string,
    @Res() res: Response,
  ) {
    const safeReturn = decodeURIComponent(returnUrl || '');
    const separator = safeReturn.includes('?') ? '&' : '?';
    const redirect = `${safeReturn}${separator}orderId=${orderId ?? ''}`;
    res.send(
      `<html><head><meta http-equiv="refresh" content="0;url=${redirect}"></head>` +
      `<body style="font-family:sans-serif;text-align:center;padding:40px">` +
      `<p>Paiement mock en cours…</p></body></html>`,
    );
  }

}
// Webhook is handled by WebhookController in Webhook/webhook.controller.ts