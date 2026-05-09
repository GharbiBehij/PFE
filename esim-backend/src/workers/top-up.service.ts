import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from 'prisma/prisma.service';
import {
  LedgerType,
  LedgerReason,
  TopUpAttemptStatus,
  TopUpStatus,
} from '@prisma/client';
import { RetryableError, TerminalError } from 'src/Queue/utils/errors';
import { TopUpJobData } from '../Queue/Interfaces/Queue.interfaces';
import { TopUpOrchestrator } from '../Orchestrators/top-up.orchestrator';

const IN_FLIGHT_WINDOW_MS = 45 * 1000;

@Injectable()
export class TopUpWorkerService {
  private readonly logger = new Logger(TopUpWorkerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly topUpOrchestrator: TopUpOrchestrator,
  ) {}

  async handleTopUpCredit(job: Job<TopUpJobData>): Promise<any> {
    const { topUpRequestId, salesmanId, amount } = job.data;

    this.logger.log(
      `Processing top-up credit for TopUpRequest #${topUpRequestId} - attempt ${job.attemptsMade + 1}`,
    );

    const topUpRequest = await this.prisma.topUpRequest.findUnique({
      where: { id: topUpRequestId },
      include: { topUpAttempt: true },
    });

    if (!topUpRequest) {
      throw new TerminalError(`TopUpRequest #${topUpRequestId} not found`);
    }

    if (topUpRequest.status === TopUpStatus.CREDITED) {
      throw new TerminalError(
        `TopUpRequest #${topUpRequestId} already credited`,
      );
    }

    if (
      topUpRequest.status === TopUpStatus.REJECTED ||
      topUpRequest.status === TopUpStatus.FAILED
    ) {
      throw new TerminalError(
        `TopUpRequest #${topUpRequestId} is in terminal status ${topUpRequest.status}`,
      );
    }

    if (topUpRequest.status !== TopUpStatus.APPROVED) {
      throw new TerminalError(
        `TopUpRequest #${topUpRequestId} must be APPROVED before crediting - current: ${topUpRequest.status}`,
      );
    }

    if (topUpRequest.topUpAttempt?.status === TopUpAttemptStatus.SUCCEEDED) {
      throw new TerminalError(
        `TopUpAttempt for #${topUpRequestId} already succeeded`,
      );
    }

    let attempt: any;
    try {
      attempt = await this.prisma.$transaction(async (tx) => {
        const inFlight = await tx.topUpAttempt.findFirst({
          where: {
            topUpRequestId,
            status: TopUpAttemptStatus.STARTED,
            startedAt: { gte: new Date(Date.now() - IN_FLIGHT_WINDOW_MS) },
          },
        });

        if (inFlight) {
          throw new Error('IN_FLIGHT');
        }

        const topUpAttempt = await tx.topUpAttempt.create({
          data: {
            topUpRequestId,
            userId: salesmanId,
            amount,
            status: TopUpAttemptStatus.STARTED,
            startedAt: new Date(),
          },
        });

        const updatedUser = await tx.user.update({
          where: { id: salesmanId },
          data: { balance: { increment: amount } },
        });

        let walletTx = await tx.walletTransaction.findFirst({
          where: { transactionId: null, userId: salesmanId },
          orderBy: { createdAt: 'desc' },
        });

        if (!walletTx) {
          walletTx = await tx.walletTransaction.create({
            data: {
              userId: salesmanId,
              amount,
              paymentMethod: job.data.paymentMethod,
              status: 'COMMITTED',
              balanceAfter: updatedUser.balance,
            },
          });
        }

        await tx.walletLedger.create({
          data: {
            amount,
            type: LedgerType.CREDIT,
            reason: LedgerReason.TOP_UP,
            referenceId: topUpRequestId,
            walletId: walletTx.id,
          },
        });

        await tx.topUpRequest.update({
          where: { id: topUpRequestId },
          data: {
            status: TopUpStatus.CREDITED,
            creditedAt: new Date(),
          },
        });

        return {
          topUpAttempt,
          balanceAfter: updatedUser.balance,
          walletTransactionId: walletTx.id,
        };
      });
    } catch (err: any) {
      if (err.message === 'IN_FLIGHT') {
        throw new RetryableError(
          `In-flight top-up credit detected for #${topUpRequestId} - will retry`,
        );
      }

      if (err instanceof TerminalError) {
        await this.prisma.topUpAttempt.updateMany({
          where: {
            topUpRequestId,
            status: TopUpAttemptStatus.STARTED,
          },
          data: {
            status: TopUpAttemptStatus.FAILED,
            failureReason: err.message,
            completedAt: new Date(),
          },
        });

        await this.topUpOrchestrator.transition(
          topUpRequestId,
          TopUpStatus.FAILED,
          'top-up-worker',
        );

        throw err;
      }

      throw new RetryableError(
        `DB error processing top-up credit for #${topUpRequestId}: ${err.message}`,
      );
    }

    await this.prisma.topUpAttempt.update({
      where: { id: attempt.topUpAttempt.id },
      data: {
        status: TopUpAttemptStatus.SUCCEEDED,
        completedAt: new Date(),
      },
    });

    this.logger.log(
      `Top-up credit succeeded for TopUpRequest #${topUpRequestId} - balance after: ${attempt.balanceAfter} TND`,
    );

    return {
      success: true,
      topUpRequestId,
      balanceAfter: attempt.balanceAfter,
      walletTransactionId: attempt.walletTransactionId,
    };
  }
}
