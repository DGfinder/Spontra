-- AlterTable
ALTER TABLE "flight_routes" ADD COLUMN     "data_source" TEXT,
ADD COLUMN     "is_direct" BOOLEAN,
ADD COLUMN     "is_estimated" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "last_updated" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "flight_routes_is_direct_idx" ON "flight_routes"("is_direct");

-- CreateIndex
CREATE INDEX "flight_routes_is_estimated_idx" ON "flight_routes"("is_estimated");
