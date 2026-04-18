import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserStatus } from '@prisma/client';
import { Prisma } from '@prisma/client';

@Injectable()
export class userRepository {
    constructor(private readonly prisma: PrismaService) { }

    async findByEmail(email: string) {
        return this.prisma.user.findUnique({ where: { email } });
    }
    async findById(id: number) {
        return this.prisma.user.findUnique({ where: { id } })
    }

    async createUser(data: Prisma.UserUncheckedCreateInput) {
        return this.prisma.user.create({ data });
    }
    async StoreHashedRefreshToken(userId: number, hashedToken: string) {
        return this.prisma.user.update({
            where: { id: userId },
            data: { hashedRefreshToken: hashedToken },
        });
    }
    async updateStatus(userId: number, status: UserStatus) {
        return this.prisma.user.update({
            where: { id: userId },
            data: { status }
        })
    }
    async removeRefreshToken(id: number,) {
        return this.prisma.user.update({
            where: { id },
            data: { hashedRefreshToken: null }
        })
    }

    async updateProfile(userId: number, data: Prisma.UserUpdateInput) {
        return this.prisma.user.update({ where: { id: userId }, data });
    }

    async findByEmailExcludingUser(email: string, excludeUserId: number) {
        return this.prisma.user.findFirst({
            where: { email, id: { not: excludeUserId } },
        });
    }

}
