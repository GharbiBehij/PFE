/*
  Warnings:

  - Added the required column `Category` to the `Offer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `Destination` to the `Offer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `Region` to the `Offer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `description` to the `Offer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `popularity` to the `Offer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `Offer` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "EsimStatus" ADD VALUE 'PENDING';
ALTER TYPE "EsimStatus" ADD VALUE 'EXPIRED';
ALTER TYPE "EsimStatus" ADD VALUE 'DELETED';

-- AlterTable
ALTER TABLE "Esim" ADD COLUMN     "dataTotal" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "dataUsed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastUsageSync" TIMESTAMP(3),
ADD COLUMN     "offerId" INTEGER,
ADD COLUMN     "qrCode" TEXT;

-- AlterTable
ALTER TABLE "Offer" ADD COLUMN     "Category" TEXT NOT NULL,
ADD COLUMN     "Destination" TEXT NOT NULL,
ADD COLUMN     "Region" TEXT NOT NULL,
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "popularity" TEXT NOT NULL,
ADD COLUMN     "title" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "passportId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Esim_userId_idx" ON "Esim"("userId");

-- CreateIndex
CREATE INDEX "Esim_status_idx" ON "Esim"("status");

-- AddForeignKey
ALTER TABLE "Esim" ADD CONSTRAINT "Esim_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
