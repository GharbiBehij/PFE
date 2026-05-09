/*
  Warnings:

  - The primary key for the `ActivationAttempt` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `ActivationAttempt` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "WalletAttemptStatus" AS ENUM ('STARTED', 'SUCCEEDED', 'FAILED');

-- AlterTable
ALTER TABLE "ActivationAttempt" DROP CONSTRAINT "ActivationAttempt_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "ActivationAttempt_pkey" PRIMARY KEY ("id");

-- CreateTable
CREATE TABLE "WalletAttempt" (
    "id" SERIAL NOT NULL,
    "transactionId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "type" "LedgerType" NOT NULL,
    "status" "WalletAttemptStatus" NOT NULL,
    "failureReason" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WalletAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WalletAttempt_transactionId_key" ON "WalletAttempt"("transactionId");

-- CreateIndex
CREATE INDEX "WalletAttempt_transactionId_status_startedAt_idx" ON "WalletAttempt"("transactionId", "status", "startedAt");

-- AddForeignKey
ALTER TABLE "WalletAttempt" ADD CONSTRAINT "WalletAttempt_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletAttempt" ADD CONSTRAINT "WalletAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
