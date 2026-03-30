import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { TransactionRepository } from '../transaction/transaction.repository';
import { EsimAuditLogService } from 'src/ProvisionningEvent/EsimAuditLog.service';
import { RetryableError, TerminalError } from './errors';
import { ActivateJobData } from 'src/Queue/Interfaces/Queue.interfaces';
import { EsimEventStatus, EsimStatus } from '@prisma/client';
import { MockProviderAdapter } from '../esim/adapters/mock-provider.adapter';
import { Job } from 'bullmq';

@Injectable()
export class ActivationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly transactionRepo: TransactionRepository,
    private readonly providerAdapter: MockProviderAdapter,
    private readonly esimAuditLogService: EsimAuditLogService,
  ) { }

  async handleActivation(job: Job<ActivateJobData>) {
    const { transactionId, userId, channel } = job.data;

    // ✅ fetch transaction with offer in one query — no need for offerService
    let tx: any;
    try {
      tx = await this.prisma.transaction.findUnique({
        where: { id: transactionId },
        include: { offer: true },
      });
    } catch (err: any) {
      throw new RetryableError(`DB error fetching transaction: ${err.message}`);
    }
    if (!tx)
      throw new TerminalError('Transaction not found');
    if (!tx.offer)
      throw new TerminalError('Offer not found');

    // ✅ idempotency guard — skip if esim already exists for this transaction
    let existingEsim: any;
    try {
      const existingEsim = await this.prisma.esim.findFirst({
        where: { transactionId },
      });
    } catch (err: any) {
      throw new RetryableError(`DB error checking existing eSIM: ${err.message}`);
    }
    if (existingEsim) return;

    // ✅ get both ids directly from the included offer
    const offerId = tx.offer.id;
    const providerId = tx.offer.providerId;

    await this.esimAuditLogService.log({
      transactionId,
      userId,
      event: EsimEventStatus.ACTIVATION_REQUESTED,
      status: EsimStatus.NOT_ACTIVE,
      message: `Activation requested via ${channel}`,
    });

    let esimData: { iccid: string; activationCode: string; expiryDate: Date };
    try {
      esimData = await this.providerAdapter.createEsim({
        offerId,       // ✅ number from tx.offer.id
        transactionId,
      });
    } catch (err: any) {
      if (isTransient(err)) {
        throw new RetryableError(err.message); // ✅ worker retries automatically
      }
      await this.transactionRepo.updateStatus(transactionId, 'FAILED');
      await this.esimAuditLogService.log({
        transactionId,
        userId,
        event: EsimEventStatus.ACTIVATION_FAILED,
        status: EsimStatus.NOT_ACTIVE,
        message: err.message,
      });
      throw new TerminalError(err.message);
    }

    // ✅ atomic create
    await this.prisma.$transaction(async (prismaTx) => {
      await prismaTx.esim.create({
        data: {
          iccid: esimData.iccid,
          activationCode: esimData.activationCode,
          expiryDate: esimData.expiryDate,
          activatedAt: new Date(),     // ✅ set activation time
          status: EsimStatus.NOT_ACTIVE,
          event: EsimEventStatus.ACTIVATION_REQUESTED,
          userId,
          providerId,
          transactionId,
        },
      });
    });

    // ✅ mark transaction succeeded after esim created
    await this.transactionRepo.updateStatus(transactionId, 'SUCCEEDED');
  }
}

function isTransient(err: any): boolean {
  return err?.status >= 500 || err?.code === 'ECONNRESET' || err?.code === 'ETIMEDOUT';
}