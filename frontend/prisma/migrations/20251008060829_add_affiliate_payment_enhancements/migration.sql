-- AlterTable
ALTER TABLE "affiliate_clicks" ADD COLUMN     "affiliate_id" TEXT,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN     "departure_date" TEXT,
ADD COLUMN     "displayed_price" DECIMAL(10,2),
ADD COLUMN     "return_date" TEXT;

-- AlterTable
ALTER TABLE "creator_earnings" ADD COLUMN     "hold_release_at" TIMESTAMP(3),
ADD COLUMN     "is_paid" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "paid_at" TIMESTAMP(3),
ADD COLUMN     "payout_id" TEXT;

-- AlterTable
ALTER TABLE "creators" ADD COLUMN     "bank_account_name" TEXT,
ADD COLUMN     "bank_account_number" VARCHAR(255),
ADD COLUMN     "bank_routing_number" VARCHAR(255),
ADD COLUMN     "last_payout_at" TIMESTAMP(3),
ADD COLUMN     "payout_method" TEXT,
ADD COLUMN     "payout_minimum" DECIMAL(10,2) NOT NULL DEFAULT 25,
ADD COLUMN     "payout_schedule" TEXT NOT NULL DEFAULT 'monthly',
ADD COLUMN     "pending_payout" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "stripe_account_id" TEXT,
ADD COLUMN     "tax_country" TEXT NOT NULL DEFAULT 'US',
ADD COLUMN     "tax_id" VARCHAR(255),
ADD COLUMN     "tax_id_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "w9_form_submitted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "w9_form_url" TEXT,
ADD COLUMN     "wise_recipient_id" TEXT;

-- CreateTable
CREATE TABLE "payouts" (
    "id" TEXT NOT NULL,
    "creator_id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "method" TEXT NOT NULL,
    "earnings_count" INTEGER NOT NULL DEFAULT 0,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "transaction_id" TEXT,
    "payment_email" TEXT,
    "failure_reason" TEXT,
    "admin_notes" TEXT,
    "processing_fee" DECIMAL(10,2),
    "net_amount" DECIMAL(10,2),
    "initiated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "failed_at" TIMESTAMP(3),

    CONSTRAINT "payouts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "payouts_creator_id_status_idx" ON "payouts"("creator_id", "status");

-- CreateIndex
CREATE INDEX "payouts_status_initiated_at_idx" ON "payouts"("status", "initiated_at");

-- CreateIndex
CREATE INDEX "payouts_completed_at_idx" ON "payouts"("completed_at");

-- CreateIndex
CREATE INDEX "affiliate_clicks_partner_created_at_idx" ON "affiliate_clicks"("partner", "created_at");

-- CreateIndex
CREATE INDEX "creator_earnings_creator_id_is_paid_idx" ON "creator_earnings"("creator_id", "is_paid");

-- CreateIndex
CREATE INDEX "creator_earnings_hold_release_at_idx" ON "creator_earnings"("hold_release_at");

-- AddForeignKey
ALTER TABLE "creator_earnings" ADD CONSTRAINT "creator_earnings_payout_id_fkey" FOREIGN KEY ("payout_id") REFERENCES "payouts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "creators"("id") ON DELETE CASCADE ON UPDATE CASCADE;
