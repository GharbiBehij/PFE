import { Injectable } from "@nestjs/common";
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateOfferDto } from './dto/create-offer.dto';
import type { UpdateOfferDto } from './dto/update-offer.dto';

@Injectable()
export class OfferRepository {
    constructor(private readonly Prisma: PrismaService) { }

    async findbyId(id: number) {
    return this.Prisma.offer.findFirst({
        where: { id, isDeleted: false },
    });
    }
    async create(transactionData: CreateOfferDto) {
        return this.Prisma.offer.create({
            data: transactionData
        });
    }
    async update(id: number, updateData: UpdateOfferDto) {
        return this.Prisma.offer.update({
            where: { id, isDeleted: false },
            data: updateData,
        });
    }
    async delete(id: number) {
        return this.Prisma.offer.update({
            where: { id, isDeleted: false },
            data: { isDeleted: true },
        });
    }
    async findAll() {
        return this.Prisma.offer.findMany({
            where: { isDeleted: false },
        });
    }
    async findByCountry(country: string) {
        return this.Prisma.offer.findMany({
            where: { country, isDeleted: false },
        });
    }
    async findPopular() {
        return this.Prisma.offer.findMany({
            where: { isDeleted: false },
                orderBy: [
                    { transactions: { _count: 'desc' } },
                    { createdAt: 'desc' },
                ],
            take: 10,
        });
    }
    async search(query: string) {
        return this.Prisma.offer.findMany({
            where: {
                OR: [
                    { country: { contains: query, mode: 'insensitive' } },
                    { Region: { contains: query, mode: 'insensitive' } },
                    { Destination: { contains: query, mode: 'insensitive' } },
                    { Category: { contains: query, mode: 'insensitive' } },
                    { title: { contains: query, mode: 'insensitive' } },
                    { description: { contains: query, mode: 'insensitive' } },
                ],
                isDeleted: false,
            },
        });
    }
    async findDestinations() {
        return this.Prisma.offer.findMany({
            where: { isDeleted: false },
            select: {
                country: true,
                Region: true,
                price: true,
            },
            distinct: ['country'],
        });
        }
     async findRegions() {
        return this.Prisma.offer.findMany({
            where: { isDeleted: false },
            select: { Region: true },
            distinct: ['Region'],
        });
    }     
    }
