/*
  Warnings:

  - You are about to drop the column `event` on the `Esim` table. All the data in the column will be lost.
  - You are about to drop the `EsimAuditLog` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "statusDomain" AS ENUM ('ESIM', 'TRANSACTION');

-- CreateEnum
CREATE TYPE "AuditLayer" AS ENUM ('PAYMENT', 'PROVISIONING', 'ACTIVATION', 'WALLET', 'SYSTEM');

-- CreateEnum
CREATE TYPE "AuditTrigger" AS ENUM ('PAYMENT_GATEWAY', 'WEBHOOK', 'PROVIDER', 'WORKER', 'SCHEDULER', 'USER', 'SYSTEM');

-- CreateEnum
CREATE TYPE "SystemEvent" AS ENUM ('PAYMENT_INITIATED', 'PAYMENT_AUTHORIZED', 'PAYMENT_CONFIRMED', 'PAYMENT_FAILED', 'PAYMENT_EXPIRED', 'PAYMENT_REFUNDED', 'PAYMENT_WEBHOOK_RECEIVED', 'WALLET_RESERVED', 'WALLET_COMMITTED', 'WALLET_RELEASED', 'WALLET_FAILED', 'PROVISIONING_ENQUEUED', 'PROVISIONING_STARTED', 'PROVISIONING_SUCCESS', 'PROVISIONING_FAILED', 'PROVIDER_PROCESSING', 'PROVIDER_TIMEOUT', 'PROVIDER_NO_RESPONSE', 'PURCHASE_REQUESTED', 'ACTIVATION_REQUESTED', 'ACTIVATION_PROCESSING', 'ACTIVATION_SUCCESS', 'ACTIVATION_FAILED', 'RETRY_ATTEMPT', 'RECONCILIATION_TRIGGERED', 'ILLEGAL_TRANSITION_ATTEMPTED');

-- DropForeignKey
ALTER TABLE "EsimAuditLog" DROP CONSTRAINT "EsimAuditLog_transactionId_fkey";

-- AlterTable
ALTER TABLE "Esim" DROP COLUMN "event";

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "clientSecret" TEXT,
ALTER COLUMN "paymentUrl" DROP NOT NULL;

-- DropTable
DROP TABLE "EsimAuditLog";

-- DropEnum
DROP TYPE "EsimEventStatus";

-- DropEnum
DROP TYPE "OfferCategory";

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "layer" "AuditLayer" NOT NULL,
    "event" "SystemEvent" NOT NULL,
    "eventVersion" INTEGER NOT NULL DEFAULT 1,
    "userId" INTEGER NOT NULL,
    "jobId" TEXT,
    "attemptNumber" INTEGER,
    "sessionId" TEXT,
    "requestId" TEXT,
    "fromStatus" TEXT,
    "toStatus" TEXT NOT NULL,
    "statusDomain" "statusDomain" NOT NULL,
    "triggeredBy" "AuditTrigger" NOT NULL,
    "trigger" TEXT,
    "durationMs" INTEGER,
    "providerLatencyMs" INTEGER,
    "providerCode" TEXT,
    "paymentProvider" TEXT,
    "message" TEXT,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "transactionId" INTEGER NOT NULL,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditLog_transactionId_createdAt_idx" ON "AuditLog"("transactionId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_layer_event_idx" ON "AuditLog"("layer", "event");

-- CreateIndex
CREATE INDEX "AuditLog_event_triggeredBy_idx" ON "AuditLog"("event", "triggeredBy");

-- CreateIndex
CREATE INDEX "AuditLog_userId_createdAt_idx" ON "AuditLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_providerCode_event_idx" ON "AuditLog"("providerCode", "event");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
