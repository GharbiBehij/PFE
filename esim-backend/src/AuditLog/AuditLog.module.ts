import { Module, forwardRef } from '@nestjs/common';
import { AuditLogService } from './AuditLog.service';
import { AuditLogRepository } from './AuditLog.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { TransactionModule } from '../transaction/transaction.module';
import { EsimModule } from '../esim/esim.module';

@Module({
  imports: [forwardRef(() => TransactionModule), forwardRef(() => EsimModule)],
  providers: [AuditLogService, AuditLogRepository, PrismaService],
  exports: [AuditLogService],
})
export class ProvisioningModule {}
