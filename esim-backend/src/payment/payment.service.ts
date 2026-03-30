import { Injectable } from '@nestjs/common';
import { PaymentRepository } from './payment.repository';
import { TransactionService } from '../transaction/transaction.service';
import { EsimAuditLogService } from '../ProvisionningEvent/EsimAuditLog.service';
import { TransactionStatus } from '@prisma/client';
import { CreatePaymentDto } from 'src/payment/dto/create-payment.dto';

export interface PaymentResponse {
  success: boolean;
  paymentId?: string;
  retryable?: boolean;
  error?: string;
}

@Injectable()
export class PaymentService {
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly transactionService: TransactionService,
    private readonly EsimAuditLogService: EsimAuditLogService,
  ) { }

  async initiatePayment(dto: CreatePaymentDto, transactionId: number): Promise<PaymentResponse> {
    const providerResponse = this.simulateProviderCall();
    const paymentStatus = providerResponse.success ? 'SUCCESS' : 'FAILED';

    await this.paymentRepository.initiatePayment({
      transactionId,
      userId: dto.userId || 1, // Optional rollback context
      amount: dto.amount || 100,
      paymentProvider: 'MOCK_STRIPE',//later switched with the real provider 
      providerRefId: providerResponse.paymentId || 'failed_tx_' + Date.now(),
      status: paymentStatus,
      rawResponse: providerResponse as any,
    });

    return providerResponse;
  }

  async initiatePaymentTx(tx: any, dto: CreatePaymentDto, transactionId: number): Promise<PaymentResponse> {
    const providerResponse = this.simulateProviderCall();
    const paymentStatus = providerResponse.success ? 'SUCCESS' : 'FAILED';

    await this.paymentRepository.initiatePaymentTx(tx, {
      transactionId,
      userId: dto.userId || 1,
      amount: dto.amount || 100,
      paymentProvider: 'MOCK_STRIPE',
      providerRefId: providerResponse.paymentId || 'failed_tx_' + Date.now(),
      status: paymentStatus,
      rawResponse: providerResponse as any,
    });

    return providerResponse;
  }

  async handlePaymentResult(
    transactionId: number,
    paymentResult: PaymentResponse
  ): Promise<{ status: 'SUCCESS' | 'FAILED' | 'RETRY' }> {

    if (paymentResult.success) {
      await this.paymentRepository.updatePaymentStatus(transactionId, 'SUCCESS', paymentResult as any);
      await this.EsimAuditLogService.log('PAYMENT_SUCCESS' as any);
      return { status: 'SUCCESS' };
    }

    if (paymentResult.retryable) {
      await this.paymentRepository.updatePaymentStatus(transactionId, 'PENDING', paymentResult as any);
      await this.EsimAuditLogService.log('RETRY_ATTEMPT' as any,);
      return { status: 'RETRY' };
    }

    // Failure AND NOT retryable
    await this.paymentRepository.updatePaymentStatus(transactionId, 'FAILED', paymentResult as any);
    await this.transactionService.markFailed(transactionId, TransactionStatus);
    await this.EsimAuditLogService.log('PAYMENT_FAILED' as any);

    return { status: 'FAILED' };
  }

  private simulateProviderCall(): PaymentResponse {
    const rand = Math.random();

    if (rand < 0.7) {
      return {
        success: true,
        paymentId: 'pay_' + Math.random().toString(36).substring(2, 10),
      };
    }
    else if (rand < 0.9) {
      return {
        success: false,
        retryable: true,
        error: 'Network timeout during payment gateway calling. Please try again.',
      };
    }
    else {
      return {
        success: false,
        retryable: false,
        error: 'Card declined (insufficient funds or fraud).',
      };
    }
  }

  findAll() {
    return 'This action returns all payment';
  }
}
