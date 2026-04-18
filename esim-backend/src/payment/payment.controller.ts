import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { Transaction } from '../Common/entities/transaction.entity';
import { TransactionService } from 'src/transaction/transaction.service';
import {
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PaymentResponseDto } from './dto/payment-response.dto';
import { ErrorResponseDto } from '../Common/dto/error-response.dto';

@ApiTags('payment')
@Controller('payment')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly transactionService: TransactionService
  ) { }

  @Post()
  @ApiOperation({ summary: 'Initiate payment for a transaction' })
  @ApiQuery({ name: 'transactionId', type: Number, required: false, example: 9001 })
  @ApiResponse({ status: 201, type: PaymentResponseDto })
  @ApiResponse({ status: 400, type: ErrorResponseDto })
  create(@Body() createPaymentDto: CreatePaymentDto, TransactionId: number) {
    return this.paymentService.initiatePayment(createPaymentDto, TransactionId);
  }
}
