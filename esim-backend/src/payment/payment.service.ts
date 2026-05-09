import { Injectable, Logger } from '@nestjs/common';
import { Transaction } from '@prisma/client';
import { PaymentRepository } from './payment.repository';
import { TransactionService } from '../transaction/transaction.service';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly transactionService: TransactionService,
  ) {}

  async initiatePayment(transaction: Transaction): Promise<{
    gatewayOrderId: string;
    paymentUrl: string;
  }> {
    try {
      const result = await this.paymentRepository.initiatePayment(transaction);
      this.logger.log(
        `Payment initiated for tx ${transaction.id}: gateway=${result.gatewayOrderId}`,
      );
      
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`initiatePayment failed for txId=${transaction.id}: ${message}`);
      throw error;
    }
  }

  async verifyPayment(transactionId: number): Promise<{
    paid: boolean;
    status: string;
    gatewayStatus: number;
    pan?: string;
    approvalCode?: string;
  }> {
    const transaction = await this.transactionService.findOne(transactionId);

    if (!transaction) {
      throw new Error(`Transaction ${transactionId} not found`);
    }

    const payment = await this.paymentRepository.findByTransactionId(transactionId);
    if (!payment?.gatewayPaymentId) {
      throw new Error(`Transaction ${transactionId} has no gateway payment ID`);
    }

    return this.mapVerificationResult(
      await this.paymentRepository.checkPaymentStatus(payment.gatewayPaymentId),
      transactionId,
    );
  }

  private mapVerificationResult(
    result: { status: number; pan?: string; approvalCode?: string },
    transactionId: number,
  ) {
    const paid = result.status === 2;

    let statusLabel: string;
    switch (result.status) {
      case 0:
        statusLabel = 'REGISTERED';
        break;
      case 1:
        statusLabel = 'PRE_AUTH';
        break;
      case 2:
        statusLabel = 'DEPOSITED';
        break;
      case 3:
        statusLabel = 'REVERSED';
        break;
      case 4:
        statusLabel = 'REFUNDED';
        break;
      case 5:
        statusLabel = 'ACS_INITIATED';
        break;
      case 6:
        statusLabel = 'DECLINED';
        break;
      default:
        statusLabel = 'UNKNOWN';
        break;
    }

    this.logger.log(
      `Payment verification for tx ${transactionId}: ClicToPay status=${result.status} (${statusLabel})`,
    );

    return {
      paid,
      status: statusLabel,
      gatewayStatus: result.status,
      pan: result.pan,
      approvalCode: result.approvalCode,
    };
  }
}
