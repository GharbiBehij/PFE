import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransactionRepository } from './transaction.repository';
import { OfferService } from '../offer/offer.service';
import { TransactionStatus } from '@prisma/client';

@Injectable()
export class TransactionService {
  constructor(
    private readonly transactionRepository: TransactionRepository,
    private readonly offerService: OfferService,
  ) { }

  async createInitial(dto: CreateTransactionDto, userId: number) {
    const offer = await this.offerService.findbyId(dto.offerId);
    if (!offer) {
      throw new NotFoundException(`Offer with ID ${dto.offerId} not found`);
    }

    return this.transactionRepository.createInitial({
      offerId: offer.id,
      amount: offer.price,
      currency: 'TND',
      channel: dto.channel,
      userId,
      status: TransactionStatus.PENDING,
    });
  }

  async markPending(id: number) {
    return this.transactionRepository.updateStatus(id, TransactionStatus.PENDING);
  }
  async markFailed(id: number) {
    return this.transactionRepository.updateStatus(id, TransactionStatus.FAILED);
  }
  async markProcessing(id: number) {
    return this.transactionRepository.updateStatus(id, TransactionStatus.PROCESSING);
  }
  async markSucceeded(id: number) {
    return this.transactionRepository.updateStatus(id, TransactionStatus.SUCCEEDED);
  }
  async findOne(transactionId: number) {
    return this.transactionRepository.findOne(transactionId);
  }

  async getUserTransactions(userId: number) {
    const transactions = await this.transactionRepository.findManyForUser(userId);
    return {
      transactions: transactions.map((tx) => ({
        id: tx.id,
        status: tx.status,
        channel: tx.channel,
        amount: tx.amount,
        currency: tx.currency,
        userId: tx.userId,
        offerId: tx.offerId,
        createdAt: tx.createdAt,
        updatedAt: tx.updatedAt,
        esims: tx.esim,
      })),
    };
  }

  async getTransactionDetail(userId: number, transactionId: number) {
    const tx = await this.transactionRepository.findForUser(userId, transactionId);
    if (!tx) {
      throw new NotFoundException(`Transaction with ID ${transactionId} not found`);
    }

    return {
      transaction: {
        id: tx.id,
        status: tx.status,
        channel: tx.channel,
        amount: tx.amount,
        currency: tx.currency,
        userId: tx.userId,
        offerId: tx.offerId,
        createdAt: tx.createdAt,
        updatedAt: tx.updatedAt,
      },
      esims: tx.esim.map((e: any) => ({ id: e.id, status: e.status, qrCode: e.qrCode ?? null })),
    };
  }
}