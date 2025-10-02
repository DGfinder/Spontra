-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('user', 'admin');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'user',
    "is_email_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "airports" (
    "id" TEXT NOT NULL,
    "iata_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "latitude" DECIMAL(65,30),
    "longitude" DECIMAL(65,30),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_searchable" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "airports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flight_routes" (
    "id" TEXT NOT NULL,
    "origin_airport_code" TEXT NOT NULL,
    "destination_airport_code" TEXT NOT NULL,
    "total_duration_minutes" INTEGER NOT NULL,

    CONSTRAINT "flight_routes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "destinations" (
    "id" TEXT NOT NULL,
    "airport_code" TEXT NOT NULL,
    "city_name" TEXT NOT NULL,
    "country_name" TEXT NOT NULL,
    "description" TEXT,
    "image_url" TEXT,
    "popularity_score" DECIMAL(65,30),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "destinations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search_sessions" (
    "id" TEXT NOT NULL,
    "origin_airport" TEXT,
    "destination_airport" TEXT,
    "departure_date" TEXT,
    "return_date" TEXT,
    "passengers" INTEGER NOT NULL DEFAULT 1,
    "preferences" JSONB,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "search_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offer_cache" (
    "id" TEXT NOT NULL,
    "query_hash" VARCHAR(64) NOT NULL,
    "market" TEXT NOT NULL,
    "query" JSONB NOT NULL,
    "offers" JSONB NOT NULL,
    "offer_count" INTEGER NOT NULL,
    "data_source" TEXT NOT NULL DEFAULT 'amadeus',
    "is_stale" BOOLEAN NOT NULL DEFAULT false,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "offer_cache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "airports_iata_code_key" ON "airports"("iata_code");

-- CreateIndex
CREATE INDEX "airports_is_searchable_idx" ON "airports"("is_searchable");

-- CreateIndex
CREATE UNIQUE INDEX "flight_routes_origin_airport_code_destination_airport_code_key" ON "flight_routes"("origin_airport_code", "destination_airport_code");

-- CreateIndex
CREATE UNIQUE INDEX "destinations_airport_code_key" ON "destinations"("airport_code");

-- CreateIndex
CREATE INDEX "offer_cache_query_hash_idx" ON "offer_cache"("query_hash");

-- CreateIndex
CREATE INDEX "offer_cache_expires_at_is_stale_idx" ON "offer_cache"("expires_at", "is_stale");

-- AddForeignKey
ALTER TABLE "flight_routes" ADD CONSTRAINT "flight_routes_origin_airport_code_fkey" FOREIGN KEY ("origin_airport_code") REFERENCES "airports"("iata_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flight_routes" ADD CONSTRAINT "flight_routes_destination_airport_code_fkey" FOREIGN KEY ("destination_airport_code") REFERENCES "airports"("iata_code") ON DELETE RESTRICT ON UPDATE CASCADE;
