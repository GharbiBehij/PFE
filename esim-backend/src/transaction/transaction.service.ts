import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransactionRepository } from './transaction.repository';
import { OfferService } from '../offer/offer.service';
import { TransactionStatus } from '@prisma/client';

export const TERMINAL_STATUSES = new Set<TransactionStatus>([
  TransactionStatus.FAILED,
  TransactionStatus.COMPLETED,
  TransactionStatus.SUCCEEDED,
  TransactionStatus.EXPIRED,
  TransactionStatus.REFUNDED,
]);

const transitions: Record<string, TransactionStatus[]> = {
  PENDING_PAYMENT: [
    TransactionStatus.PAID,
    TransactionStatus.FAILED,
    TransactionStatus.EXPIRED,
    TransactionStatus.AUTHORIZED,
  ],
  AUTHORIZED: [
    TransactionStatus.PAID,
    TransactionStatus.FAILED,
    TransactionStatus.EXPIRED,
  ],
  PAID: [TransactionStatus.PROVISIONING],

  PENDING: [
    TransactionStatus.PENDING_PAYMENT,
    TransactionStatus.PROCESSING,
    TransactionStatus.FAILED,
  ],
  PROCESSING: [
    TransactionStatus.PROVISIONING,
    TransactionStatus.SUCCEEDED,
    TransactionStatus.FAILED,
  ],
  PROVISIONING: [
    TransactionStatus.COMPLETED,
    TransactionStatus.SUCCEEDED,
    TransactionStatus.FAILED,
  ],

  SUCCEEDED: [],

  EXPIRED: [],
  COMPLETED: [],
  FAILED: [TransactionStatus.REFUNDED],
  REFUNDED: [],
};

@Injectable()
export class TransactionService {
  private readonly logger = new Logger(TransactionService.name);

  constructor(
    private readonly transactionRepository: TransactionRepository,
    private readonly offerService: OfferService,
  ) {}

  private assertValidTransition(
    current: TransactionStatus,
    next: TransactionStatus,
  ) {
    if (!transitions[current]?.includes(next)) {
      throw new Error(`Invalid transition: ${current} → ${next}`);
    }
  }

  async transition(
    id: number,
    next: TransactionStatus,
    source = 'unknown',
    correlationId?: string,
  ) {
    const tx = await this.transactionRepository.findOne(id);
    if (!tx) throw new NotFoundException(`Transaction ${id} not found`);

    const tag = correlationId ? ` cid=${correlationId}` : '';

    // Idempotency: already in target state → no-op (safe for duplicate webhook/job)
    if (tx.status === next) {
      this.logger.log(`[${source}] txId=${id} already ${next} — skipped${tag}`);
      return tx;
    }

    // Terminal guard: silently absorb updates to terminal transactions
    if (TERMINAL_STATUSES.has(tx.status)) {
      this.logger.warn(
        `[${source}] txId=${id} is terminal (${tx.status}) — ignoring → ${next}${tag}`,
      );
      return tx;
    }

    this.assertValidTransition(tx.status, next);
    this.logger.log(`[${source}] txId=${id} ${tx.status} → ${next}${tag}`);
    return this.transactionRepository.updateStatus(id, next);
  }

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

  async findOne(transactionId: number) {
    return this.transactionRepository.findOne(transactionId);
  }

  async getUserTransactions(userId: number) {
    const transactions =
      await this.transactionRepository.findManyForUser(userId);
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

  async findOneWithAuditContext(transactionId: number) {
    const tx = await this.transactionRepository.findOne(transactionId);
    if (!tx)
      throw new NotFoundException(`Transaction ${transactionId} not found`);

    const auditContext =
      await this.transactionRepository.findLatestAuditContext(transactionId);

    return { ...tx, auditContext };
  }

  async getTransactionDetail(userId: number, transactionId: number) {
    const tx = await this.transactionRepository.findForUser(
      userId,
      transactionId,
    );
    if (!tx) {
      throw new NotFoundException(
        `Transaction with ID ${transactionId} not found`,
      );
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
      esims: tx.esim.map((e: any) => ({
        id: e.id,
        status: e.status,
        qrCode: e.qrCode ?? null,
      })),
    };
  }
}
