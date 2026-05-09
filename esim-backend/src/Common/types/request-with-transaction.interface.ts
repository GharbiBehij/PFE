// src/common/types/request-with-transaction.interface.ts
import { TransactionStatus } from '@prisma/client';
import { Request } from 'express';

export interface RequestWithTransaction extends Request {
  transaction: { id: number; status: TransactionStatus };
}
