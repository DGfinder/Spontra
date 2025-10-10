-- CreateTable
CREATE TABLE "hotels" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city_name" TEXT NOT NULL,
    "country_id" TEXT,
    "destination_id" TEXT,
    "primary_theme" TEXT NOT NULL,
    "description" TEXT,
    "address" TEXT,
    "price_per_night" DECIMAL(10,2),
    "price_level" INTEGER NOT NULL DEFAULT 3,
    "rating" DECIMAL(3,2),
    "main_image_url" TEXT,
    "image_urls" TEXT[],
    "booking_com_url" TEXT,
    "expedia_url" TEXT,
    "hotels_dot_com_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hotels_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "hotels_city_name_primary_theme_idx" ON "hotels"("city_name", "primary_theme");

-- CreateIndex
CREATE INDEX "hotels_destination_id_idx" ON "hotels"("destination_id");

-- CreateIndex
CREATE INDEX "hotels_is_active_idx" ON "hotels"("is_active");

-- AddForeignKey
ALTER TABLE "hotels" ADD CONSTRAINT "hotels_destination_id_fkey" FOREIGN KEY ("destination_id") REFERENCES "destinations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
