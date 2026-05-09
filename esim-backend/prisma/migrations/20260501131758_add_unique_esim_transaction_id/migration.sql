/*
  Warnings:

  - A unique constraint covering the columns `[transactionId]` on the table `Esim` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "providerStatus" AS ENUM ('SUCCESS', 'FAILED', 'PENDING');

-- CreateIndex
CREATE UNIQUE INDEX "Esim_transactionId_key" ON "Esim"("transactionId");
