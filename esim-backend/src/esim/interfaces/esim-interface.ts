import { TransactionChannel, Prisma } from '@prisma/client';

// 1. What the Worker receives from the Producer
export interface EsimJobPayload {
    transactionId: number;
    userId: number;
    channel: TransactionChannel;
    offerId: string;
    quantity: number;
}

// 2. What the Audit Log needs (Using Prisma's own types!)
export type AuditLogInput = Prisma.EsimAuditLogUncheckedCreateInput;

// 3. What the Orchestrator returns to the Controller
export interface PurchaseResponse {
    transactionId: number;
    message: 'SUCCESS' | 'QUEUE_FAILED' | 'PAYMENT_FAILED';
    status: string;
}