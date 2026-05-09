import { Injectable } from '@nestjs/common';
import { TransactionStatus } from '@prisma/client';
import { PaymentService } from '../payment.service';
import { WalletService } from '../../WalletTransaction/wallet.service';
import { CreateTransactionDto } from '../../transaction/dto/create-transaction.dto';
import { Transaction } from '@prisma/client';

export enum FundingSource {
  GATEWAY = 'GATEWAY',
  WALLET = 'WALLET',
}

export interface FundingResult {
  transactionId: number;
  status: 'FUNDED' | 'PENDING' | 'FAILED';
  paymentUrl?: string;
  clientSecret?: string;
  type?: 'REDIRECT' | 'INTENT';
  error?: string;
}

@Injectable()
export class FundingService {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly walletService: WalletService,
  ) {}

  async execute(
    source: FundingSource,
    dto: CreateTransactionDto,
    transactionId: number,
    userId: number,
    salesmanId?: number,
  ): Promise<FundingResult> {
    if (source === FundingSource.GATEWAY) {
      return this.fundViaGateway(dto, transactionId, userId);
    }
    return this.fundViaWallet(dto, transactionId, salesmanId!);
  }

  async releaseWalletFunds(transactionId: number): Promise<void> {
    await this.walletService.releaseReservedFunds(transactionId);
  }

  private async fundViaGateway(
    dto: CreateTransactionDto,
    transactionId: number,
    userId: number,
  ): Promise<FundingResult> {
    try {
      const transaction = {
        id: transactionId,
        userId,
        amount: dto.amount,
        currency: dto.currency,
        status: TransactionStatus.PENDING_PAYMENT,
      } as Transaction;

      const result = await this.paymentService.initiatePayment(transaction);
      return {
        transactionId,
        status: 'PENDING',
        paymentUrl: result.paymentUrl,
        type: 'REDIRECT',
      };
    } catch (error) {
      return {
        transactionId,
        status: 'FAILED',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async fundViaWallet(
    dto: CreateTransactionDto,
    transactionId: number,
    salesmanId: number,
  ): Promise<FundingResult> {
    try {
      await this.walletService.ReserveAmount(
        salesmanId,
        transactionId,
        dto.amount,
        dto.paymentMethod ?? 'WALLET',
      );
      return { transactionId, status: 'FUNDED' };
    } catch (error) {
      return {
        transactionId,
        status: 'FAILED',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
