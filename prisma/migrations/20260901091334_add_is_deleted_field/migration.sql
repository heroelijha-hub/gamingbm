/*
  Warnings:

  - You are about to drop the column `tags` on the `Product` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "deliveredAt" TIMESTAMP(3),
ADD COLUMN     "reviewRequestSent" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "tags",
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "reviewerEmail" TEXT,
ADD COLUMN     "reviewerName" TEXT,
ALTER COLUMN "userId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Media" (
    "id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT,
    "altText" TEXT,
    "description" TEXT,
    "legend" TEXT,
    "link" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ForceSales" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL
);

-- CreateTable
CREATE TABLE "_SaleTogether" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Media_url_key" ON "Media"("url");

-- CreateIndex
CREATE UNIQUE INDEX "_ForceSales_AB_unique" ON "_ForceSales"("A", "B");

-- CreateIndex
CREATE INDEX "_ForceSales_B_index" ON "_ForceSales"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_SaleTogether_AB_unique" ON "_SaleTogether"("A", "B");

-- CreateIndex
CREATE INDEX "_SaleTogether_B_index" ON "_SaleTogether"("B");

-- CreateIndex
CREATE INDEX "AbandonedCart_status_lastActive_idx" ON "AbandonedCart"("status", "lastActive");

-- CreateIndex
CREATE INDEX "ChatMessage_sessionId_createdAt_idx" ON "ChatMessage"("sessionId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_isRead_isAdmin_idx" ON "Notification"("isRead", "isAdmin");

-- CreateIndex
CREATE INDEX "Order_userId_status_idx" ON "Order"("userId", "status");

-- CreateIndex
CREATE INDEX "Product_isDeleted_idx" ON "Product"("isDeleted");

-- AddForeignKey
ALTER TABLE "_ForceSales" ADD CONSTRAINT "_ForceSales_A_fkey" FOREIGN KEY ("A") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ForceSales" ADD CONSTRAINT "_ForceSales_B_fkey" FOREIGN KEY ("B") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SaleTogether" ADD CONSTRAINT "_SaleTogether_A_fkey" FOREIGN KEY ("A") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SaleTogether" ADD CONSTRAINT "_SaleTogether_B_fkey" FOREIGN KEY ("B") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
