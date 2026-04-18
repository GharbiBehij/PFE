-- CreateEnum
CREATE TYPE "ActivationAttemptStatus" AS ENUM ('STARTED', 'SUCCESS', 'FAILED', 'TIMED_OUT');

-- AlterEnum
ALTER TYPE "EsimStatus" ADD VALUE 'PROCESSING';

-- CreateTable
CREATE TABLE "ActivationAttempt" (
    "id" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL,
    "status" "ActivationAttemptStatus" NOT NULL,
    "providerRequestId" TEXT NOT NULL,
    "providerResponse" JSONB,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "esimId" INTEGER NOT NULL,

    CONSTRAINT "ActivationAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ActivationAttempt_providerRequestId_key" ON "ActivationAttempt"("providerRequestId");

-- CreateIndex
CREATE INDEX "ActivationAttempt_esimId_status_idx" ON "ActivationAttempt"("esimId", "status");

-- CreateIndex
CREATE INDEX "ActivationAttempt_esimId_attemptNumber_idx" ON "ActivationAttempt"("esimId", "attemptNumber");

-- AddForeignKey
ALTER TABLE "ActivationAttempt" ADD CONSTRAINT "ActivationAttempt_esimId_fkey" FOREIGN KEY ("esimId") REFERENCES "Esim"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
