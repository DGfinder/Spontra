-- AlterTable
ALTER TABLE "destinations" ADD COLUMN     "country_id" TEXT,
ALTER COLUMN "country_name" DROP NOT NULL;

-- CreateTable
CREATE TABLE "countries" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "countries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "theme_pois" (
    "id" TEXT NOT NULL,
    "destination_id" TEXT NOT NULL,
    "theme" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "video_url" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "theme_pois_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "countries_name_key" ON "countries"("name");

-- CreateIndex
CREATE UNIQUE INDEX "countries_code_key" ON "countries"("code");

-- CreateIndex
CREATE INDEX "theme_pois_destination_id_theme_idx" ON "theme_pois"("destination_id", "theme");

-- CreateIndex
CREATE INDEX "destinations_country_id_idx" ON "destinations"("country_id");

-- AddForeignKey
ALTER TABLE "destinations" ADD CONSTRAINT "destinations_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "theme_pois" ADD CONSTRAINT "theme_pois_destination_id_fkey" FOREIGN KEY ("destination_id") REFERENCES "destinations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
