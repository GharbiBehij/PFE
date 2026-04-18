import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { Prisma, TransactionStatus, EsimStatus, EsimEventStatus } from '@prisma/client';
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

    async findByUserId(userId: number) {
        return this.prisma.esim.findMany({
            where: { userId },
            include: { offer: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findByIdWithOffer(id: number) {
        return this.prisma.esim.findUnique({
            where: { id:id },
            include: { offer: true },
        });
    }

    async updateUsage(id: number, dataUsed: number) {
        return this.prisma.esim.update({
            where: { id },
            data: { dataUsed, lastUsageSync: new Date() },
            include: { offer: true },
        });
    }

    async updateStatus(id: number, status: EsimStatus) {
        return this.prisma.esim.update({
            where: { id },
            data: { status },
        });
    }

    async updateStatusTx(tx: any, id: number, status: EsimStatus, event?: EsimEventStatus) {
        return tx.esim.update({
            where: { id },
            data: { status, ...(event !== undefined && { event }) },
        });
    }

    async softDelete(id: number) {
        return this.prisma.esim.update({
            where: { id },
            data: { status: EsimStatus.DELETED },
        });
    }

    async aggregateDestinationsByCountryAndCoverageType(): Promise<
        Array<{
            country: string;
            Region: string;
            coverageType: string;
            _count: { _all: number };
            _min: { price: number | null };
            _max: { price: number | null };
        }>
    > {
        try {
            const rows = await this.prisma.offer.groupBy({
                by: ['country', 'Region', 'coverageType'],
                where: {
                    isDeleted: false,
                },
                _count: {
                    _all: true,
                },
                _min: {
                    price: true,
                },
                _max: {
                    price: true,
                },
            });

            return rows.map((row) => ({
                country: row.country,
                Region: row.Region,
                coverageType: String(row.coverageType),
                _count: { _all: row._count._all ?? 0 },
                _min: { price: row._min.price },
                _max: { price: row._max.price },
            }));
        } catch (error: any) {
            // P2022 => column missing in current database schema.
            if (error?.code !== 'P2022') {
                throw error;
            }
        }

        // Backward-compatible fallback for databases that have not added Offer.coverageType yet.
        const fallbackRows = await this.prisma.offer.groupBy({
            by: ['country', 'Region'],
            where: {
                isDeleted: false,
            },
            _count: {
                _all: true,
            },
            _min: {
                price: true,
            },
            _max: {
                price: true,
            },
        });

        return fallbackRows.map((row) => ({
            country: row.country,
            Region: row.Region,
            coverageType: 'LOCAL',
            _count: { _all: row._count._all ?? 0 },
            _min: { price: row._min.price },
            _max: { price: row._max.price },
        }));
    }
}