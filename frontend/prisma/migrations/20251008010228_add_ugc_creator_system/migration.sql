-- CreateEnum
CREATE TYPE "CreatorTier" AS ENUM ('new', 'active', 'top', 'elite');

-- AlterTable
ALTER TABLE "poi_videos" ADD COLUMN     "creator_id" TEXT;

-- CreateTable
CREATE TABLE "creators" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "bio" TEXT,
    "instagram_handle" TEXT,
    "tiktok_handle" TEXT,
    "tier" "CreatorTier" NOT NULL DEFAULT 'new',
    "total_earnings" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "creators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "video_views" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "session_id" TEXT NOT NULL,
    "video_id" TEXT NOT NULL,
    "creator_id" TEXT,
    "destination_id" TEXT NOT NULL,
    "viewed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "video_views_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creator_earnings" (
    "id" TEXT NOT NULL,
    "creator_id" TEXT NOT NULL,
    "video_id" TEXT NOT NULL,
    "affiliate_click_id" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "commission" DECIMAL(10,2) NOT NULL,
    "shareWeight" DECIMAL(5,4) NOT NULL,
    "tierRate" DECIMAL(5,4) NOT NULL,
    "earned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "creator_earnings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "creators_user_id_key" ON "creators"("user_id");

-- CreateIndex
CREATE INDEX "creators_tier_idx" ON "creators"("tier");

-- CreateIndex
CREATE INDEX "creators_total_earnings_idx" ON "creators"("total_earnings");

-- CreateIndex
CREATE INDEX "video_views_user_id_destination_id_viewed_at_idx" ON "video_views"("user_id", "destination_id", "viewed_at");

-- CreateIndex
CREATE INDEX "video_views_session_id_destination_id_viewed_at_idx" ON "video_views"("session_id", "destination_id", "viewed_at");

-- CreateIndex
CREATE INDEX "video_views_video_id_idx" ON "video_views"("video_id");

-- CreateIndex
CREATE INDEX "video_views_creator_id_idx" ON "video_views"("creator_id");

-- CreateIndex
CREATE INDEX "creator_earnings_creator_id_earned_at_idx" ON "creator_earnings"("creator_id", "earned_at");

-- CreateIndex
CREATE INDEX "creator_earnings_video_id_idx" ON "creator_earnings"("video_id");

-- CreateIndex
CREATE INDEX "creator_earnings_affiliate_click_id_idx" ON "creator_earnings"("affiliate_click_id");

-- CreateIndex
CREATE INDEX "poi_videos_creator_id_idx" ON "poi_videos"("creator_id");

-- AddForeignKey
ALTER TABLE "poi_videos" ADD CONSTRAINT "poi_videos_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "creators"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creators" ADD CONSTRAINT "creators_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_views" ADD CONSTRAINT "video_views_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_views" ADD CONSTRAINT "video_views_video_id_fkey" FOREIGN KEY ("video_id") REFERENCES "poi_videos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_views" ADD CONSTRAINT "video_views_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "creators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creator_earnings" ADD CONSTRAINT "creator_earnings_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "creators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creator_earnings" ADD CONSTRAINT "creator_earnings_video_id_fkey" FOREIGN KEY ("video_id") REFERENCES "poi_videos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
