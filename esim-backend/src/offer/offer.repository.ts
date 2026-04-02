import { Injectable } from "@nestjs/common";
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class OfferRepository {
    constructor(private readonly Prisma: PrismaService) { }
    async findbyId(id: number) {
        return this.Prisma.offer.findUnique({
            where: { id }
        });
    }
    async create(transactionData: any) {
        return this.Prisma.offer.create({
            data: transactionData
        });
    }
    async update(id: number, updateData: any) {
        return this.Prisma.offer.update({
            where: { id },
            data: updateData,
        });
    }
    async delete(id: number) {
        return this.Prisma.offer.update({
            where: { id },
            data: { isDeleted: true },
        });
    }
}
