import { Module } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { WalletRepository } from './wallet.repository';
import { WalletController } from './wallet.controller';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
    controllers: [WalletController],
    providers: [WalletService, WalletRepository, PrismaService],
    exports: [WalletService, WalletRepository],
})
export class WalletModule {}
