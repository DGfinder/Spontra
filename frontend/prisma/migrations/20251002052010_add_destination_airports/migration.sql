-- DropIndex
DROP INDEX "public"."destinations_airport_code_key";

-- AlterTable
ALTER TABLE "destinations" ALTER COLUMN "airport_code" DROP NOT NULL;

-- CreateTable
CREATE TABLE "destination_airports" (
    "id" TEXT NOT NULL,
    "destination_id" TEXT NOT NULL,
    "airport_code" TEXT NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "destination_airports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "destination_airports_destination_id_idx" ON "destination_airports"("destination_id");

-- CreateIndex
CREATE INDEX "destination_airports_airport_code_idx" ON "destination_airports"("airport_code");

-- CreateIndex
CREATE UNIQUE INDEX "destination_airports_destination_id_airport_code_key" ON "destination_airports"("destination_id", "airport_code");

-- AddForeignKey
ALTER TABLE "destination_airports" ADD CONSTRAINT "destination_airports_destination_id_fkey" FOREIGN KEY ("destination_id") REFERENCES "destinations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "destination_airports" ADD CONSTRAINT "destination_airports_airport_code_fkey" FOREIGN KEY ("airport_code") REFERENCES "airports"("iata_code") ON DELETE CASCADE ON UPDATE CASCADE;
