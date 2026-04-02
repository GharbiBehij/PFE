import { Injectable } from '@nestjs/common';
import { CreateTransactionDto } from 'src/transaction/dto/create-transaction.dto';
import { TransactionService } from 'src/transaction/transaction.service';
import { EsimProducer } from 'src/Queue/esim.producer';
import { userService } from 'src/user/user.service';
import { WalletService } from '../WalletTransaction/wallet.service';
import { EsimEventStatus, EsimStatus, Role,LedgerType,LedgerReason } from '@prisma/client';
import { EsimAuditLogService } from 'src/ProvisionningEvent/EsimAuditLog.service';
import { PaymentService } from '../payment/payment.service'
import { randomBytes } from 'crypto';

@Injectable()
export class EsimPurchaseOrchestrator {
    constructor(
        private readonly transactionService: TransactionService,
        private readonly userService: userService,
        private readonly esimProducer: EsimProducer,
        private readonly paymentService: PaymentService,
        private readonly esimAuditLogService: EsimAuditLogService,
        private readonly walletService: WalletService,
    ) { }

    async purchaseEsim(dto: CreateTransactionDto, salesmanId: number) {
        // 1. check salesman exists
        const salesman = await this.userService.findById(salesmanId);
        if (!salesman) throw new Error('Salesman does not exist');

        // 2. resolve client — fetch existing or create new
        const client = await this.resolveClient(dto);

        // 3. create transaction linked to client
        const transaction = await this.transactionService.createInitial(dto, client.id);

        await this.esimAuditLogService.log({
            transactionId: transaction.id,
            userId: client.id,
            event: EsimEventStatus.PURCHASE_REQUESTED,
            status: EsimStatus.NOT_ACTIVE,
            message: `Purchase initiated via ${dto.channel}`,
        });

        if (dto.channel === 'B2C') {
            return this.processB2C(dto, client.id, transaction.id);
        }

        if (dto.channel === 'B2B2C') {
            return this.processB2B2C(dto, client.id, salesmanId, transaction.id);
        }
    }

    private async resolveClient(dto: CreateTransactionDto) {
        // ✅ fetch existing client by email or passportId
        const existing = await this.userService.findByEmail(dto.email);
        if (existing) return existing;

        // ✅ create new client with CUSTOMER role
        return this.userService.create({
            passportId: dto.passportId,
            email: dto.email,
            firstname: dto.firstname,
            lastname: dto.lastname,
            Password: randomBytes(8).toString('hex'),
            role: Role.CUSTOMER,
        });
    }

    private async processB2C(
        dto: CreateTransactionDto,
        userId: number,
        transactionId: number,
    ) {
        const paymentResponse = await this.paymentService.initiatePayment(dto, transactionId);

        if (!paymentResponse.success) {
            await this.transactionService.markFailed(transactionId);
            await this.esimAuditLogService.log({
                transactionId,
                userId,
                event: EsimEventStatus.PAYMENT_FAILED,
                status: EsimStatus.NOT_ACTIVE,
                message: paymentResponse.error,
            });
            return { transactionId, message: 'PAYMENT_FAILED', error: paymentResponse.error };
        }

        

        try {
            await this.esimProducer.enqueuePurchase({
                transactionId,
                userId: userId,
                channel: dto.channel,
                offerId: dto.offerId,
                amount: dto.amount,
                currency: dto.currency,
            });
        } catch (error) {
            await this.transactionService.markFailed(transactionId);
            await this.esimAuditLogService.log({
                transactionId,
                userId,
                event: EsimEventStatus.PROVISIONING_FAILED,
                status: EsimStatus.NOT_ACTIVE,
                message: `Failed to enqueue job: ${error instanceof Error ? error.message : String(error)}`,
            });
            return { transactionId, message: 'QUEUE_FAILED' };
        }

        return { transactionId, message: 'SUCCESS' };
    }

    private async processB2B2C(
        dto: CreateTransactionDto,
        clientId: number,
        salesmanId: number,
        transactionId: number,
    ) {
        // ✅ deduct from salesman wallet → status: RESERVED
        let wallet: any;
        try {
            wallet = await this.walletService.ReserveAmount(
                salesmanId,
                transactionId,
                dto.amount,
                dto.paymentMethod ?? 'WALLET',
            );
        } catch (error) {
            await this.transactionService.markFailed(transactionId);
            await this.esimAuditLogService.log({
                transactionId,
                userId: clientId,
                event: EsimEventStatus.WALLET_FAILED,
                status: EsimStatus.NOT_ACTIVE,
                message: error instanceof Error ? error.message : String(error),
            });
            return { transactionId, message: 'WALLET_FAILED', error: error instanceof Error ? error.message : String(error) };
        }

        try {
            await this.esimProducer.enqueuePurchase({
                transactionId,
                userId: clientId,
                channel: dto.channel,
                offerId: dto.offerId,
                amount: dto.amount,
                currency: dto.currency,
                paymentMethod: dto.paymentMethod,
            });
        } catch (error) {
            // ✅ enqueue failed — release RESERVED funds back to salesman
            await this.walletService.releaseReservedFunds(transactionId);
            await this.transactionService.markFailed(transactionId);
            await this.esimAuditLogService.log({
                transactionId,
                userId: clientId,
                event: EsimEventStatus.PROVISIONING_FAILED,
                status: EsimStatus.NOT_ACTIVE,
                message: `Failed to enqueue job: ${error instanceof Error ? error.message : String(error)}`,
            });
            return { transactionId, message: 'QUEUE_FAILED' };
        }

        return { transactionId, message: 'SUCCESS' };
    }
}