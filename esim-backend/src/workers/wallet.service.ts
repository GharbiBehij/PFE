import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from 'prisma/prisma.service';
import {
  AuditLayer,
  AuditTrigger,
  SystemEvent,
  LedgerReason,
  LedgerType,
  TransactionStatus,
  WalletAttemptStatus,
  WalletStatus,
} from '@prisma/client';
import { RetryableError, TerminalError } from '../Queue/utils/errors';
import { WalletJobData } from 'src/esim/interfaces/wallet-job.interface';
import { AuditLogService } from 'src/AuditLog/AuditLog.service';

const IN_FLIGHT_WINDOW_MS = 60 * 1000;

@Injectable()
export class WalletWorkerService {
  private readonly logger = new Logger(WalletWorkerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async handleWalletDebit(job: Job<WalletJobData>): Promise<any> {
    const { transactionId, userId, amount } = job.data;

    this.logger.log(
      `Processing wallet debit for transaction ${transactionId} - attempt ${job.attemptsMade + 1}`,
    );

    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { walletAttempt: true },
    });

    if (!transaction) {
      throw new TerminalError(`Transaction ${transactionId} not found`);
    }

    if (transaction.status === TransactionStatus.COMPLETED) {
      this.logger.log(
        `Transaction ${transactionId} already completed - skipping`,
      );
      return { status: 'ALREADY_COMPLETED', transactionId };
    }

    if (transaction.status === TransactionStatus.FAILED) {
      throw new TerminalError(`Transaction ${transactionId} already failed`);
    }

    if (transaction.walletAttempt?.status === WalletAttemptStatus.SUCCEEDED) {
      this.logger.log(
        `Wallet debit for transaction ${transactionId} already succeeded - skipping`,
      );
      return { status: 'ALREADY_DEBITED', transactionId };
    }

    let attempt: any;
    try {
      attempt = await this.prisma.$transaction(async (tx) => {
        const inFlight = await tx.walletAttempt.findFirst({
          where: {
            transactionId,
            status: WalletAttemptStatus.STARTED,
            startedAt: { gte: new Date(Date.now() - IN_FLIGHT_WINDOW_MS) },
          },
        });

        if (inFlight) {
          throw new Error('IN_FLIGHT');
        }

        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { id: true, balance: true },
        });

        if (!user) {
          throw new TerminalError(`User ${userId} not found`);
        }

        if (user.balance < amount) {
          throw new TerminalError('INSUFFICIENT_BALANCE');
        }

        const walletAttempt = await tx.walletAttempt.create({
          data: {
            transactionId,
            userId,
            amount,
            type: LedgerType.DEBIT,
            status: WalletAttemptStatus.STARTED,
            startedAt: new Date(),
          },
        });

        const walletTransaction = await tx.walletTransaction.update({
          where: { transactionId },
          data: { status: WalletStatus.RESERVED },
        });

        const updatedUser = await tx.user.update({
          where: { id: userId },
          data: { balance: { decrement: amount } },
        });

        await tx.walletLedger.create({
          data: {
            amount,
            type: LedgerType.DEBIT,
            reason: LedgerReason.RESERVE,
            referenceId: transactionId,
            walletId: walletTransaction.id,
          },
        });

        return {
          walletAttempt,
          balanceAfter: updatedUser.balance,
          walletTransactionId: walletTransaction.id,
        };
      });
    } catch (err: any) {
      if (err.message === 'IN_FLIGHT') {
        throw new RetryableError(
          `In-flight wallet debit detected for transaction ${transactionId} - will retry after cooldown`,
        );
      }
      if (err.code === 'P2002') {
        throw new RetryableError(
          'Concurrent attempt claim detected — will retry after cooldown',
        );
      }
      if (err instanceof TerminalError) {
        await this.auditLogService.log({
          transactionId,
          userId,
          layer: AuditLayer.WALLET,
          event: SystemEvent.WALLET_FAILED,
          toStatus: 'FAILED',
          triggeredBy: AuditTrigger.WORKER,
          jobId: job.id,
          attemptNumber: job.attemptsMade,
          message: err.message,
          details: {
            amount,
            attemptsMade: job.attemptsMade,
          },
        });

        await this.prisma.walletAttempt.updateMany({
          where: {
            transactionId,
            status: WalletAttemptStatus.STARTED,
          },
          data: {
            status: WalletAttemptStatus.FAILED,
            failureReason: err.message,
            completedAt: new Date(),
          },
        });

        throw err;
      }

      throw new RetryableError(
        `DB error processing wallet debit for transaction ${transactionId}: ${err.message}`,
      );
    }
    await this.prisma.walletAttempt.update({
      where: { id: attempt.walletAttempt.id },
      data: {
        status: WalletAttemptStatus.SUCCEEDED,
        completedAt: new Date(),
      },
    });

    this.logger.log(
      `Wallet debit succeeded for transaction ${transactionId} - balance after: ${attempt.balanceAfter}`,
    );

    return {
      success: true,
      transactionId,
      balanceAfter: attempt.balanceAfter,
      walletTransactionId: attempt.walletTransactionId,
      status: WalletStatus.RESERVED,
    };
  }
}
