-- AlterTable
ALTER TABLE "poi_videos" ADD COLUMN     "alt_text" VARCHAR(255),
ADD COLUMN     "caption" TEXT,
ADD COLUMN     "instagram_url" TEXT;

-- AlterTable
ALTER TABLE "theme_pois" ADD COLUMN     "alt_text" VARCHAR(255),
ADD COLUMN     "caption" TEXT,
ADD COLUMN     "instagram_url" TEXT;
