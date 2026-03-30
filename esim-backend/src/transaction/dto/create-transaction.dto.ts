import { TransactionStatus } from "@prisma/client";

type paymentMethod = 'WALLET' | 'CASH'
type channel = 'B2C' | 'B2B2C'
export type CreateTransactionDto = {
    // client details — used to resolve or create client account
    passportId: string;
    email: string;
    firstname: string;
    lastname: string;
    userId: number;
    status: string

    // transaction details
    offerId: number;
    amount: number;
    currency: string;
    channel: channel;
    paymentMethod?: paymentMethod
};