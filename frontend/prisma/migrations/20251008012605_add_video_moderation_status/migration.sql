-- AlterTable
ALTER TABLE "poi_videos" ADD COLUMN     "rejection_reason" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'pending';

-- CreateIndex
CREATE INDEX "poi_videos_status_idx" ON "poi_videos"("status");
