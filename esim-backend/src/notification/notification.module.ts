import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NotificationService } from './notification.service';
import { NotificationRepository } from './notification.repository';
import { PrismaService } from '../../prisma/prisma.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [NotificationService, NotificationRepository, PrismaService],
  exports: [NotificationService],
})
export class NotificationModule {}
