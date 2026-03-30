import { Injectable } from '@nestjs/common';
import { EsimAuditLogRepository } from './EsimAuditLog.repository.ts.js';
import { EsimEventStatus, EsimStatus, Prisma, TransactionChannel } from '@prisma/client';


@Injectable()
export class EsimAuditLogService {
  constructor(
    private readonly EsimAuditLogRepository: EsimAuditLogRepository,

  ) { }
  async log(data: {
    userId: number;
    transactionId: number;
    event: EsimEventStatus;   // Mapped to your Enum
    status: EsimStatus;
    jobId?: string;           // From BullMQ
    message?: string;
    metadata?: any;           // Maps to 'details' Json field
  }) {
    return this.EsimAuditLogRepository.createEvent(data)
  }
  async logtx(
    tx: Prisma.TransactionClient,
    data: {
      userId: number;
      transactionId: number;
      event: EsimEventStatus;
      status: EsimStatus;
      jobId?: string;
      message?: string;
      metadata?: any;
    },
  ) {
    return this.EsimAuditLogRepository.createEventTx(tx, data)
  }
}