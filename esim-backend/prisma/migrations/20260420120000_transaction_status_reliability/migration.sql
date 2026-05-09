-- AlterEnum: Add reliability lifecycle states to TransactionStatus
ALTER TYPE "TransactionStatus" ADD VALUE IF NOT EXISTS 'AUTHORIZED';
ALTER TYPE "TransactionStatus" ADD VALUE IF NOT EXISTS 'EXPIRED';
ALTER TYPE "TransactionStatus" ADD VALUE IF NOT EXISTS 'REFUNDED';
