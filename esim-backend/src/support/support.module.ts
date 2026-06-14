import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupportController } from './support.controller';
import { SupportService } from './support.service';
import { SupportRepository } from './support.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [ConfigModule, NotificationModule],
  controllers: [SupportController],
  providers: [SupportService, SupportRepository, PrismaService],
})
export class SupportModule {}
