import { Module } from '@nestjs/common';
import { OfferService } from './offer.service';
import { OfferController } from './offer.controller';
import { OfferRepository } from './offer.repository';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [OfferController],
  providers: [OfferService, OfferRepository, PrismaService],
  exports: [OfferService],
})
export class OfferModule {}
