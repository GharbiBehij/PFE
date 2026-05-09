/*
  Warnings:

  - You are about to alter the column `amount` on the `TopUpRequest` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - Added the required column `paymentMethod` to the `TopUpRequest` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TopUpAttemptStatus" AS ENUM ('STARTED', 'SUCCEEDED', 'FAILED');

-- AlterEnum
ALTER TYPE "EsimEventStatus" ADD VALUE 'PROVISIONING_ENQUEUED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TopUpStatus" ADD VALUE 'PENDING_PAYMENT';
ALTER TYPE "TopUpStatus" ADD VALUE 'PENDING_CASH';
ALTER TYPE "TopUpStatus" ADD VALUE 'CREDITED';
ALTER TYPE "TopUpStatus" ADD VALUE 'FAILED';

-- AlterTable
ALTER TABLE "TopUpRequest" ADD COLUMN     "creditedAt" TIMESTAMP(3),
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'TND',
ADD COLUMN     "failureReason" TEXT,
ADD COLUMN     "gatewayPaymentId" TEXT,
ADD COLUMN     "paymentMethod" TEXT NOT NULL,
ADD COLUMN     "paymentUrl" TEXT,
ALTER COLUMN "amount" SET DATA TYPE INTEGER;

-- CreateTable
CREATE TABLE "TopUpAttempt" (
    "id" SERIAL NOT NULL,
    "topUpRequestId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" "TopUpAttemptStatus" NOT NULL,
    "failureReason" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TopUpAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TopUpAttempt_topUpRequestId_key" ON "TopUpAttempt"("topUpRequestId");

-- CreateIndex
CREATE INDEX "TopUpAttempt_topUpRequestId_status_startedAt_idx" ON "TopUpAttempt"("topUpRequestId", "status", "startedAt");

-- CreateIndex
CREATE INDEX "TopUpRequest_salesmanId_status_idx" ON "TopUpRequest"("salesmanId", "status");

-- AddForeignKey
ALTER TABLE "TopUpAttempt" ADD CONSTRAINT "TopUpAttempt_topUpRequestId_fkey" FOREIGN KEY ("topUpRequestId") REFERENCES "TopUpRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopUpAttempt" ADD CONSTRAINT "TopUpAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
