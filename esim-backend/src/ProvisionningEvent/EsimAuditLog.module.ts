import { Module, forwardRef } from '@nestjs/common';
import { EsimAuditLogService } from './EsimAuditLog.service';
import { EsimAuditLogRepository } from './EsimAuditLog.repository.ts';
import { PrismaService } from '../../prisma/prisma.service';
import { TransactionModule } from '../transaction/transaction.module';
import { EsimModule } from '../esim/esim.module';

@Module({
  imports: [forwardRef(() => TransactionModule), forwardRef(() => EsimModule)],
  providers: [EsimAuditLogService, EsimAuditLogRepository, PrismaService],
  exports: [EsimAuditLogService],
})
export class ProvisioningModule { }
