-- AlterTable
ALTER TABLE "countries" ADD COLUMN     "map_svg" TEXT;

-- CreateTable
CREATE TABLE "affiliate_clicks" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "destination_id" TEXT,
    "partner" TEXT NOT NULL,
    "click_url" TEXT NOT NULL,
    "origin_airport" TEXT,
    "destination_airport" TEXT,
    "referrer" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "converted" BOOLEAN NOT NULL DEFAULT false,
    "converted_at" TIMESTAMP(3),
    "commission" DECIMAL(10,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "affiliate_clicks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "affiliate_clicks_user_id_idx" ON "affiliate_clicks"("user_id");

-- CreateIndex
CREATE INDEX "affiliate_clicks_destination_id_idx" ON "affiliate_clicks"("destination_id");

-- CreateIndex
CREATE INDEX "affiliate_clicks_partner_idx" ON "affiliate_clicks"("partner");

-- CreateIndex
CREATE INDEX "affiliate_clicks_created_at_idx" ON "affiliate_clicks"("created_at");

-- CreateIndex
CREATE INDEX "affiliate_clicks_converted_idx" ON "affiliate_clicks"("converted");
