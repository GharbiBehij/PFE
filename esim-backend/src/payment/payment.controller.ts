import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { Transaction } from 'src/esim/dto/transaction.entity';
import { TransactionService } from 'src/transaction/transaction.service';

@Controller('payment')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly transactionService: TransactionService
  ) { }

  @Post()
  create(@Body() createPaymentDto: CreatePaymentDto, TransactionId: number) {
    return this.paymentService.initiatePayment(createPaymentDto, TransactionId);
  }
}
