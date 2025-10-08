-- AlterTable
ALTER TABLE "affiliate_clicks" ADD COLUMN     "session_id" TEXT;

-- CreateIndex
CREATE INDEX "affiliate_clicks_session_id_idx" ON "affiliate_clicks"("session_id");

-- AddForeignKey
ALTER TABLE "creator_earnings" ADD CONSTRAINT "creator_earnings_affiliate_click_id_fkey" FOREIGN KEY ("affiliate_click_id") REFERENCES "affiliate_clicks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
