// purchase-handling.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { TransactionRepository } from '../transaction/transaction.repository';
import { EsimAuditLogService } from 'src/ProvisionningEvent/EsimAuditLog.service';
import { RetryableError, TerminalError } from './errors';
import { PurchaseJobData } from 'src/Queue/Interfaces/Queue.interfaces';
import { EsimEventStatus, EsimStatus } from '@prisma/client';
import { Job } from 'bullmq';
import { MockProviderAdapter } from 'src/esim/adapters/mock-provider.adapter';

@Injectable()
export class PurchaseService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly transactionRepo: TransactionRepository,
        private readonly esimAuditLogService: EsimAuditLogService,
        private readonly ProviderAdapter: MockProviderAdapter
    ) { }

    async handlePurchase(job: Job<PurchaseJobData>) {
        const { transactionId, userId, channel } = job.data;

        // ✅ check transaction — retryable if DB down, terminal if not found
        let tx: any;
        try {
            tx = await this.prisma.transaction.findUnique({
                where: { id: transactionId },
            });
        } catch (err: any) {
            throw new RetryableError(`DB error fetching transaction: ${err.message}`);
        }

        if (!tx) throw new TerminalError('Transaction not found');

        // ✅ check payment status in DB — retryable if DB down
        let payment: any;
        try {
            payment = await this.prisma.payment.findUnique({
                where: { transactionId },
            });
        } catch (err: any) {
            throw new RetryableError(`DB error fetching payment: ${err.message}`);
        }

        if (!payment) throw new TerminalError('Payment not found');

        // ✅ for B2B2C — check wallet balance in DB
        if (channel === 'B2B2C') {
            let wallet: any;
            try {
                wallet = await this.prisma.walletTransaction.findUnique({
                    where: { transactionId },
                });
            } catch (err: any) {
                throw new RetryableError(`DB error fetching wallet: ${err.message}`);
            }

            if (!wallet) throw new TerminalError('Wallet transaction not found');

            // ✅ terminal — retrying won't add funds
            if (wallet.status === 'RELEASED') {
                throw new TerminalError('Wallet transaction already released');
            }
        }
        let providerStatus: any;
        try {
            providerStatus = await this.ProviderAdapter.getStatus(transactionId);
        } catch (err: any) {
            throw new RetryableError(`Provider unreachable: ${err.message}`);
        }
        if (providerStatus.status === 'PENDING') {
            // ✅ provider still processing — retry later
            throw new RetryableError(`Provider still processing transaction ${transactionId}`);
        }
        if (providerStatus.status === 'FAILED') {
            // ✅ provider permanently failed — no point retrying
            await this.transactionRepo.updateStatus(transactionId, 'FAILED');
            await this.esimAuditLogService.log({
                transactionId,
                userId,
                event: EsimEventStatus.PROVISIONING_FAILED,
                status: EsimStatus.NOT_ACTIVE,
                message: `Provider rejected transaction: ${providerStatus.message}`,
            });
            throw new TerminalError(`Provider failed: ${providerStatus.message}`);
        }

        // ✅ update transaction to PROCESSING — retryable if DB down
        try {
            await this.transactionRepo.updateStatus(transactionId, 'PROCESSING');
        } catch (err: any) {
            throw new RetryableError(`DB error updating transaction status: ${err.message}`);
        }

        await this.esimAuditLogService.log({
            transactionId,
            userId,
            event: EsimEventStatus.PROVISIONING_STARTED,
            status: EsimStatus.NOT_ACTIVE,
            message: `Purchase handling started via ${channel}`,
        });
    }
}