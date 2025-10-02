-- AlterTable
ALTER TABLE "countries" ADD COLUMN     "image_url" TEXT;

-- CreateTable
CREATE TABLE "poi_videos" (
    "id" TEXT NOT NULL,
    "poi_id" TEXT NOT NULL,
    "video_url" TEXT NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "poi_videos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "poi_videos_poi_id_idx" ON "poi_videos"("poi_id");

-- AddForeignKey
ALTER TABLE "poi_videos" ADD CONSTRAINT "poi_videos_poi_id_fkey" FOREIGN KEY ("poi_id") REFERENCES "theme_pois"("id") ON DELETE CASCADE ON UPDATE CASCADE;
