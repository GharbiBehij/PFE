import { Module } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { WalletRepository } from './wallet.repository';
import { WalletController } from './wallet.controller';

@Module({
    controllers: [WalletController],
    providers: [WalletService, WalletRepository],
    exports: [WalletService, WalletRepository],
})
export class WalletModule {}
