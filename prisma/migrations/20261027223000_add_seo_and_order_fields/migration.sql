-- AlterTable: Category
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "metaDescription" TEXT,
ADD COLUMN IF NOT EXISTS "metaKeywords" TEXT,
ADD COLUMN IF NOT EXISTS "metaTitle" TEXT;

-- AlterTable: Product
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "metaDescription" TEXT,
ADD COLUMN IF NOT EXISTS "metaTitle" TEXT;

-- AlterTable: Order
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "preparationStartedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "deliveryDays" INTEGER,
ADD COLUMN IF NOT EXISTS "delayNote" TEXT;

-- AlterTable: Article
ALTER TABLE "Article" ADD COLUMN IF NOT EXISTS "metaDescription" TEXT,
ADD COLUMN IF NOT EXISTS "metaKeywords" TEXT,
ADD COLUMN IF NOT EXISTS "metaTitle" TEXT;

-- AlterTable: Page
ALTER TABLE "Page" ADD COLUMN IF NOT EXISTS "metaDescription" TEXT,
ADD COLUMN IF NOT EXISTS "metaKeywords" TEXT,
ADD COLUMN IF NOT EXISTS "metaTitle" TEXT;
