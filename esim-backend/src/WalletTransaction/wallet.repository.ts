import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { LedgerReason, LedgerType } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class WalletRepository {
    constructor(private readonly prisma: PrismaService) { }

    // ── RESERVE ────────────────────────────────────────────────────────────────
    async ReserveAmount(userId: number, transactionId: number, amount: number, paymentMethod: string) {
        return this.prisma.$transaction(async (tx) => {
            const user = await tx.user.findUnique({ where: { id: userId } });
            if (!user) throw new NotFoundException('User not found');
            if (user.balance < amount) throw new BadRequestException('Insufficient balance');

            const newBalance = user.balance - amount;

            await tx.user.update({
                where: { id: userId },
                data: { balance: newBalance },
            });

            const walletTx = await tx.walletTransaction.create({
                data: {
                    userId,
                    transactionId,
                    amount,
                    paymentMethod,
                    status: 'RESERVED',
                    balanceAfter: newBalance,
                },
            });

            // ✅ ledger entry for RESERVE
            await tx.walletLedger.create({
                data: {
                    walletId: walletTx.id,
                    amount,
                    type: LedgerType.DEBIT,
                    reason: LedgerReason.RESERVE,
                    referenceId: transactionId,
                },
            });

            return walletTx;
        });
    }

    // ── COMMIT ─────────────────────────────────────────────────────────────────
    async commitReservedFunds(transactionId: number) {
        return this.prisma.$transaction(async (tx) => {
            const walletTx = await tx.walletTransaction.findUnique({ where: { transactionId } });
            if (!walletTx) throw new NotFoundException('WalletTransaction not found');
            if (walletTx.status !== 'RESERVED') {
                throw new BadRequestException(`Cannot commit — current status: ${walletTx.status}`);
            }

            const updated = await tx.walletTransaction.update({
                where: { transactionId },
                data: { status: 'COMMITTED' },
            });

            // ✅ ledger entry for COMMIT
            await tx.walletLedger.create({
                data: {
                    walletId: walletTx.id,
                    amount: walletTx.amount,
                    type: LedgerType.DEBIT,
                    reason: LedgerReason.COMMIT,
                    referenceId: transactionId,
                },
            });

            return updated;
        });
    }

    // ── RELEASE ────────────────────────────────────────────────────────────────
    async releaseReservedFunds(transactionId: number) {
        return this.prisma.$transaction(async (tx) => {
            const walletTx = await tx.walletTransaction.findUnique({ where: { transactionId } });
            if (!walletTx) throw new NotFoundException('WalletTransaction not found');
            if (walletTx.status !== 'RESERVED') {
                throw new BadRequestException(`Cannot release — current status: ${walletTx.status}`);
            }

            const updatedUser = await tx.user.update({
                where: { id: walletTx.userId },
                data: { balance: { increment: walletTx.amount } },
            });

            const updated = await tx.walletTransaction.update({
                where: { transactionId },
                data: {
                    status: 'RELEASED',
                    balanceAfter: updatedUser.balance,
                },
            });

            // ✅ ledger entry for RELEASE
            await tx.walletLedger.create({
                data: {
                    walletId: walletTx.id,
                    amount: walletTx.amount,
                    type: LedgerType.CREDIT,  // ✅ credit because funds go back to user
                    reason: LedgerReason.RELEASE,
                    referenceId: transactionId,
                },
            });

            return updated;
        });
    }

    // ── MANUAL LEDGER ──────────────────────────────────────────────────────────
    async logLedger(walletId: number, amount: number, type: LedgerType, reason: LedgerReason, referenceId: number) {
        return this.prisma.walletLedger.create({
            data: { walletId, amount, type, reason, referenceId },
        });
    }

    async findUnique(transactionId: number) {
        return this.prisma.walletTransaction.findUnique({ where: { transactionId } });
    }

    // ── BALANCE & HISTORY ──────────────────────────────────────────────────────
    async getBalance(userId: number) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, balance: true },
        });
        if (!user) throw new NotFoundException('User not found');
        return user;
    }

    async getWalletHistory(userId: number, page: number, limit: number) {
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            this.prisma.walletTransaction.findMany({
                where: { userId },
                include: { ledgerEntries: true },
                orderBy: { id: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.walletTransaction.count({ where: { userId } }),
        ]);
        return { data, total, page, limit };
    }

    async getSalesmanTopUpHistory(salesmanId: number, page: number, limit: number) {
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            this.prisma.topUpRequest.findMany({
                where: { salesmanId },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.topUpRequest.count({ where: { salesmanId } }),
        ]);
        return { data, total, page, limit };
    }

    // ── TOP-UP ─────────────────────────────────────────────────────────────────
    async requestTopUp(salesmanId: number, amount: number) {
        return this.prisma.topUpRequest.create({
            data: { salesmanId, amount, status: 'PENDING' },
        });
    }

    async getPendingTopUps(page: number, limit: number) {
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            this.prisma.topUpRequest.findMany({
                where: { status: 'PENDING' },
                include: { salesman: true },
                orderBy: { createdAt: 'asc' },
                skip,
                take: limit,
            }),
            this.prisma.topUpRequest.count({ where: { status: 'PENDING' } }),
        ]);
        return { data, total, page, limit };
    }

    async approveTopUp(topUpId: number, adminId: number) {
        return this.prisma.$transaction(async (tx) => {
            const topUp = await tx.topUpRequest.findUnique({ where: { id: topUpId } });
            if (!topUp) throw new NotFoundException('Top-up request not found');
            if (topUp.status !== 'PENDING') throw new BadRequestException('Top-up request is not pending');

            const updatedTopUp = await tx.topUpRequest.update({
                where: { id: topUpId },
                data: { status: 'APPROVED', reviewedBy: adminId },
            });

            const updatedUser = await tx.user.update({
                where: { id: topUp.salesmanId },
                data: { balance: { increment: topUp.amount } },
            });

            const walletTx = await tx.walletTransaction.create({
                data: {
                    userId: topUp.salesmanId,
                    amount: topUp.amount,
                    paymentMethod: 'TOP_UP',
                    status: 'COMMITTED',
                    balanceAfter: updatedUser.balance,
                },
            });

            // ✅ ledger entry for TOP_UP
            await tx.walletLedger.create({
                data: {
                    walletId: walletTx.id,
                    amount: topUp.amount,
                    type: LedgerType.CREDIT,
                    reason: LedgerReason.TOP_UP,
                    referenceId: topUpId,
                },
            });

            return updatedTopUp;
        });
    }

    async rejectTopUp(topUpId: number, adminId: number) {
        return this.prisma.$transaction(async (tx) => {
            const topUp = await tx.topUpRequest.findUnique({ where: { id: topUpId } });
            if (!topUp) throw new NotFoundException('Top-up request not found');
            if (topUp.status !== 'PENDING') throw new BadRequestException('Top-up request is not pending');

            return tx.topUpRequest.update({
                where: { id: topUpId },
                data: { status: 'REJECTED', reviewedBy: adminId },
            });
        });
    }
}