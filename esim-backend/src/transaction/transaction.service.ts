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
}