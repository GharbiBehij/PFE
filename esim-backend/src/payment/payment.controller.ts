import {
  BadRequestException,
  Body,
  Controller,
  Get,
  ParseIntPipe,
  Post,
  Query,
  Req,
  Redirect,
  UseGuards,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TransactionStatus } from '@prisma/client';
import { Request } from 'express';
import { JwtAuthGuard } from 'src/auth/Guards/JwtAuthGuard';
import { ErrorResponseDto } from '../Common/dto/error-response.dto';
import { IdempotencyGuard } from '../Common/guards/idempotency.guard';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentResponseDto } from './dto/payment-response.dto';
import { PaymentService } from './payment.service';
import { TransactionService } from '../transaction/transaction.service';

@ApiTags('payment')
@Controller('payment')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly transactionService: TransactionService,
  ) {}

  @Post()
  @UseGuards(IdempotencyGuard)
  @ApiOperation({ summary: 'Initiate payment for a transaction' })
  @ApiQuery({
    name: 'transactionId',
    type: Number,
    required: true,
    example: 9001,
  })
  @ApiResponse({ status: 201, type: PaymentResponseDto })
  @ApiResponse({ status: 400, type: ErrorResponseDto })
  async create(
    @Body() _createPaymentDto: CreatePaymentDto,
    @Query('transactionId', ParseIntPipe) _transactionId: number,
    @Req() _req: Request,
  ) {
    return this.transactionService
      .findOne(_transactionId)
      .then((transaction) => {
        if (!transaction) {
          throw new BadRequestException('Transaction not found');
        }
        return this.paymentService.initiatePayment(transaction);
      });
  }

  @Get('verify')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Verify payment status after ClicToPay redirect' })
  @ApiQuery({ name: 'transactionId', type: Number, required: true })
  @ApiResponse({ status: 200, description: 'Payment verification result' })
  async verifyPayment(
    @Query('transactionId', ParseIntPipe) transactionId: number,
    @Req() req: Request,
  ) {
    const userId = (req.user as any).userId;

    const transaction = await this.transactionService.findOne(transactionId);
    if (!transaction || transaction.userId !== userId) {
      throw new BadRequestException('Transaction not found');
    }

    const result = await this.paymentService.verifyPayment(transactionId);

    if (result.paid) {
      await this.transactionService.transition(
        transactionId,
        TransactionStatus.COMPLETED,
        'payment-controller',
      );
      // TODO: enqueue eSIM provisioning job here if not already handled by existing verification flow.
    }

    if (result.gatewayStatus === 6) {
      await this.transactionService.transition(
        transactionId,
        TransactionStatus.FAILED,
        'payment-controller',
      );
    }

    return {
      transactionId,
      paid: result.paid,
      status: result.status,
      maskedPan: result.pan,
    };
  }
  @Get('redirect/success')
  @SkipThrottle()
  @Redirect()
  redirectSuccess(@Query('orderId') orderId: string) {
    return {
      url: `netyfly://payment/success?orderId=${orderId ?? ''}`,
      statusCode: 302,
    };
  }

  @Get('redirect/fail')
  @SkipThrottle()
  @Redirect()
  redirectFail(@Query('orderId') orderId: string) {
    return {
      url: `netyfly://payment/fail?orderId=${orderId ?? ''}`,
      statusCode: 302,
    };
  }
  }

