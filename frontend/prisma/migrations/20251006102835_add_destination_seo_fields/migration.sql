-- AlterTable
ALTER TABLE "destinations" ADD COLUMN     "slug" TEXT,
ADD COLUMN     "meta_title" TEXT,
ADD COLUMN     "meta_description" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "destinations_slug_key" ON "destinations"("slug");
