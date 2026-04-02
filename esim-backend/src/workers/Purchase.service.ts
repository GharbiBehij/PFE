// purchase.service.ts
// Responsibility: Validate preconditions → call Provider.createEsim → persist eSIM record atomically
import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { TransactionRepository } from '../transaction/transaction.repository';
import { EsimAuditLogService } from 'src/ProvisionningEvent/EsimAuditLog.service';
import { RetryableError, TerminalError } from './errors';
import { PurchaseJobData } from 'src/Queue/Interfaces/Queue.interfaces';
import { EsimEventStatus, EsimStatus, LedgerType, LedgerReason } from '@prisma/client';
import { Job } from 'bullmq';
import { ProviderAdapter } from 'src/esim/interfaces/provider-adapter.interface';
import { PROVIDER_ADAPTER } from 'src/esim/adapters/provider-adapter.token';
import { WalletService } from '../WalletTransaction/wallet.service';

@Injectable()
export class PurchaseService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly transactionRepo: TransactionRepository,
        private readonly esimAuditLogService: EsimAuditLogService,
        @Inject(PROVIDER_ADAPTER) private readonly providerAdapter: ProviderAdapter,
        private readonly walletService: WalletService
    ) { }

    async handlePurchase(job: Job<PurchaseJobData>) {
        const { transactionId, userId, channel, offerId } = job.data;

        // ──────────────────────────────────────────────────────────────
        // 1. PRECONDITION CHECKS
        // ──────────────────────────────────────────────────────────────

        // Fetch transaction with offer in one query
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
            throw new TerminalError('Offer not found on transaction');

        // For B2C: verify payment was recorded
        if (channel === 'B2C') {
            let payment: any;
            try {
                payment = await this.prisma.payment.findUnique({ where: { transactionId } });
            } catch (err: any) {
                throw new RetryableError(`DB error fetching payment: ${err.message}`);
            }
            if (!payment) throw new TerminalError('Payment record not found');
        }

        // For B2B2C: idempotency guard on wallet status
        if (channel === 'B2B2C') {
            let wallet: any;
            try {
                wallet = await this.prisma.walletTransaction.findUnique
                    ({ where: { transactionId } });
            } catch (err: any) {
                throw new RetryableError(`DB error fetching wallet: ${err.message}`);
            }

            if (!wallet) throw new TerminalError('Wallet transaction not found');

            // RELEASED = funds already refunded (previous failure), COMMITTED = already succeeded
            // Both mean: do not re-process
            if (wallet.status === 'RELEASED' || wallet.status === 'COMMITTED') {
                throw new TerminalError(`Cannot proceed — wallet already ${wallet.status}`);
            }
        }

        // ──────────────────────────────────────────────────────────────
        // 2. CALL PROVIDER TO CREATE ESIM
        // ──────────────────────────────────────────────────────────────

        await this.esimAuditLogService.log({
            transactionId,
            userId,
            event: EsimEventStatus.PROVISIONING_STARTED,
            status: EsimStatus.NOT_ACTIVE,
            message: `eSIM creation requested via ${channel}`,
        });

        let esimData: { iccid: string; activationCode: string; expiryDate: Date };
        try {
            esimData = await this.providerAdapter.createEsim({
                transactionId,
                offerId,
                country: tx.offer.country,
                dataVolume: tx.offer.dataVolume,
                validityDays: tx.offer.validityDays,
                providerId: tx.offer.providerId,
                userId,
            });
        } catch (err: any) {
            // Infrastructure error (5xx, timeout, network reset) → BullMQ will retry
            if (isInfraError(err)) {
                throw new RetryableError(`Provider infrastructure error: ${err.message}`);
            }

            // Business error (4xx, out of stock, invalid plan) → release funds if B2B2C, then fail
            if (channel === 'B2B2C') {
                const releasedWallet = await this.walletService.releaseReservedFunds(transactionId);
                await this.walletService.logLedger(
                    releasedWallet.id,
                    tx.offer.price, // assuming tx.offer.price is the wallet amount reserved
                    LedgerType.CREDIT,
                    LedgerReason.RELEASE,
                    transactionId
                );
            }
            await this.transactionRepo.updateStatus(transactionId, 'FAILED');
            await this.esimAuditLogService.log({
                transactionId,
                userId,
                event: EsimEventStatus.PROVISIONING_FAILED,
                status: EsimStatus.NOT_ACTIVE,
                message: `Provider rejected eSIM creation: ${err.message}`,
            });
            throw new TerminalError(`Provider business error: ${err.message}`);
        }

        // ──────────────────────────────────────────────────────────────
        // 3. PERSIST ESIM RECORD ATOMICALLY & MARK TRANSACTION PROCESSING
        // ──────────────────────────────────────────────────────────────

        try {
            await this.prisma.$transaction(async (prismaTx) => {
                await prismaTx.esim.create({
                    data: {
                        iccid: esimData.iccid,
                        activationCode: esimData.activationCode,
                        expiryDate: esimData.expiryDate,
                        status: EsimStatus.NOT_ACTIVE,
                        event: EsimEventStatus.PROVISIONING_STARTED,
                        userId,
                        providerId: tx.offer.providerId,
                        transactionId,
                    },
                });

                await prismaTx.transaction.update({
                    where: { id: transactionId },
                    data: { status: 'PROCESSING' },
                });
            });
        } catch (err: any) {
            throw new RetryableError(`DB error persisting eSIM record: ${err.message}`);
        }
        if (channel === 'B2B2C') {
            try {
                const committedWallet = await this.walletService.commitReservedFunds(transactionId);
                await this.walletService.logLedger(
                    committedWallet.id,
                    committedWallet.amount,
                    LedgerType.DEBIT,
                    LedgerReason.COMMIT,
                    transactionId
                );
            } catch (err: any) {
                // ✅ retryable — eSIM already created, just need to commit wallet
                throw new RetryableError(`DB error committing wallet funds: ${err.message}`);
            }
        }
        await this.esimAuditLogService.log({
            transactionId,
            userId,
            event: EsimEventStatus.PROVIDER_PROCESSING,
            status: EsimStatus.NOT_ACTIVE,
            message: `eSIM created (iccid: ${esimData.iccid}), awaiting activation`,
        });
    }
}

function isInfraError(err: any): boolean {
    return err?.status >= 500 || err?.code === 'ECONNRESET' || err?.code === 'ETIMEDOUT';
}