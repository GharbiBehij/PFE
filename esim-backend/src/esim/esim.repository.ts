import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { Prisma, TransactionStatus } from '@prisma/client';
import { UpdateEsimDto } from './dto/update-esim.dto';

@Injectable()
export class EsimRepository {
    constructor(private readonly prisma: PrismaService) { }

    // Using Prisma.EsimUncheckedCreateInput ensures you only pass valid schema fields
    async create(data: Prisma.EsimUncheckedCreateInput) {
        return this.prisma.esim.create({
            data,
        });
    }

    // Accepts the 2 arguments exactly as the Service sends them
    async createAndLinkTransaction(data: Prisma.EsimUncheckedCreateInput, transactionId: number) {
        return this.prisma.$transaction(async (tx) => {
            // 1. Create the Esim
            const esim = await tx.esim.create({ data });

            // 2. Update the Transaction to hold the new esimId
            await tx.transaction.update({
                where: { id: transactionId },
                data: {
                    esimId: esim.id,
                    status: TransactionStatus.PROCESSING // Using proper Enum
                },
            });

            return esim;
        });
    }

    // Fixed parameter name to 'id' to prevent confusion
    async findById(id: number) {
        return this.prisma.esim.findUnique({
            where: { id: id }
        });
    }

    // Fixed relational search logic
    async findByTransactionId(transactionId: number) {
        // Query the transaction to get the nested eSIM
        const transaction = await this.prisma.transaction.findUnique({
            where: { id: transactionId },
            include: { esim: true }
        });

        return transaction?.esim || null;
    }

    async UpdateEsim(id: number, data: UpdateEsimDto) {
        return this.prisma.esim.update({
            where: { id: id },
            data
        });
    }
}