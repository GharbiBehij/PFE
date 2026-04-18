import { Injectable } from "@nestjs/common";
import { PrismaService } from "prisma/prisma.service";
import { TransactionStatus, Prisma } from "@prisma/client";

@Injectable()
export class TransactionRepository {
    constructor(private readonly prisma: PrismaService) { }
    async createInitial(data: Prisma.TransactionUncheckedCreateInput) {
        return this.prisma.transaction.create({
            data: {
                ...data,
                status: 'PENDING',
            }
        });
    }
    async updateStatus(id: number, status: TransactionStatus) {
        return this.prisma.transaction.update({
            where: { id },
            data: { status },
        });
    }

    async updateStatusTx(tx: any, id: number, status: TransactionStatus) {
        return tx.transaction.update({
            where: { id },
            data: { status },
        });
    }
    async findOne(transactionid: number) {
        return this.prisma.transaction.findUnique({
            where: { id: transactionid }
        })
    }

    async findForUser(userId: number, transactionId: number) {
        return this.prisma.transaction.findFirst({
            where: { id: transactionId, userId },
            include: { esim: true },
        });
    }

    async findManyForUser(userId: number) {
        return this.prisma.transaction.findMany({
            where: { userId },
            include: { esim: true },
            orderBy: { createdAt: 'desc' },
        });
    }

}
