-- CreateEnum
CREATE TYPE "public"."MediaKind" AS ENUM ('video', 'image');

-- CreateEnum
CREATE TYPE "public"."AspectRatio" AS ENUM ('NINE_SIXTEEN', 'ONE_ONE', 'SIXTEEN_NINE');

-- CreateEnum
CREATE TYPE "public"."ActivityType" AS ENUM ('activities', 'shopping', 'restaurants', 'nature', 'culture', 'nightlife', 'beaches', 'sightseeing', 'adventure', 'relaxation');

-- CreateEnum
CREATE TYPE "public"."BudgetLevel" AS ENUM ('budget', 'mid_range', 'luxury', 'any');

-- CreateEnum
CREATE TYPE "public"."CreatorTier" AS ENUM ('explorer', 'contributor', 'ambassador', 'creator');

-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('user', 'admin', 'moderator', 'creator');

-- CreateEnum
CREATE TYPE "public"."ModerationDecision" AS ENUM ('approved', 'rejected', 'needs_review');

-- CreateEnum
CREATE TYPE "public"."TransactionType" AS ENUM ('earn', 'spend', 'bonus');

-- CreateEnum
CREATE TYPE "public"."LeaderboardType" AS ENUM ('weekly', 'monthly', 'all_time');

-- CreateEnum
CREATE TYPE "public"."CacheOperation" AS ENUM ('hit', 'miss', 'refresh', 'cleanup');

-- CreateEnum
CREATE TYPE "public"."PriceTrendEnum" AS ENUM ('rising', 'falling', 'stable');

-- CreateTable
CREATE TABLE "public"."CityTheme" (
    "id" SERIAL NOT NULL,
    "iata" VARCHAR(3) NOT NULL,
    "themeSlug" VARCHAR(32) NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "minMediaRequired" INTEGER NOT NULL DEFAULT 5,
    "maxMediaAllowed" INTEGER NOT NULL DEFAULT 10,
    "notes" TEXT,

    CONSTRAINT "CityTheme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Reel" (
    "id" SERIAL NOT NULL,
    "iata" VARCHAR(3) NOT NULL,
    "themeSlug" VARCHAR(32) NOT NULL,
    "title" TEXT,
    "caption" TEXT,
    "language" VARCHAR(8) NOT NULL DEFAULT 'en',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ReelMedia" (
    "id" SERIAL NOT NULL,
    "reelId" INTEGER NOT NULL,
    "kind" "public"."MediaKind" NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "providerId" TEXT,
    "aspect" "public"."AspectRatio" NOT NULL DEFAULT 'NINE_SIXTEEN',
    "durationMs" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    "altText" TEXT,
    "credit" TEXT,
    "license" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ReelMedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."search_analytics" (
    "id" SERIAL NOT NULL,
    "query" VARCHAR(255) NOT NULL,
    "search_count" INTEGER NOT NULL DEFAULT 1,
    "result_count" INTEGER NOT NULL DEFAULT 0,
    "search_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_searched" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."flight_routes" (
    "id" TEXT NOT NULL,
    "originAirportCode" VARCHAR(3) NOT NULL,
    "destinationAirportCode" VARCHAR(3) NOT NULL,
    "estimatedDurationHours" INTEGER NOT NULL,
    "estimatedDurationMinutes" INTEGER NOT NULL,
    "totalDurationMinutes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "flight_routes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."airports" (
    "iataCode" VARCHAR(3) NOT NULL,
    "icaoCode" VARCHAR(4),
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "countryCode" VARCHAR(2) NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "altitude" INTEGER,
    "timezone" TEXT,
    "type" TEXT,
    "source" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "airports_pkey" PRIMARY KEY ("iataCode")
);

-- CreateTable
CREATE TABLE "public"."destinations" (
    "id" TEXT NOT NULL,
    "airportCode" VARCHAR(3) NOT NULL,
    "cityName" TEXT NOT NULL,
    "countryName" TEXT NOT NULL,
    "countryCode" VARCHAR(2) NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "activities" JSONB NOT NULL,
    "popularityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "climateInfo" JSONB,
    "bestTimeToVisit" JSONB,
    "budgetInfo" JSONB,
    "timezone" TEXT,
    "language" JSONB,
    "currency" TEXT,
    "visaRequired" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "destinations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."destination_explore_requests" (
    "id" TEXT NOT NULL,
    "originAirportCode" VARCHAR(3) NOT NULL,
    "minFlightDurationHours" INTEGER NOT NULL,
    "maxFlightDurationHours" INTEGER NOT NULL,
    "preferredActivities" JSONB NOT NULL,
    "budgetLevel" TEXT NOT NULL DEFAULT 'any',
    "travelDates" JSONB,
    "maxResults" INTEGER NOT NULL DEFAULT 20,
    "includeVisaRequired" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "destination_explore_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."airport_facilities" (
    "id" TEXT NOT NULL,
    "airportCode" VARCHAR(3) NOT NULL,
    "facilityType" TEXT NOT NULL,
    "facilityName" TEXT,
    "terminal" TEXT,
    "level" TEXT,
    "description" TEXT,
    "operatingHours" TEXT,
    "website" TEXT,
    "phone" TEXT,
    "rating" DOUBLE PRECISION,
    "priceRange" TEXT,
    "amenities" JSONB,
    "locationDetails" JSONB,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataSource" TEXT NOT NULL DEFAULT 'manual',

    CONSTRAINT "airport_facilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."airport_terminals" (
    "airportCode" VARCHAR(3) NOT NULL,
    "terminal" TEXT NOT NULL,
    "terminalName" TEXT,
    "airlines" JSONB,
    "facilities" JSONB,
    "transportOptions" JSONB,
    "capacityInfo" JSONB,
    "coordinates" JSONB,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "airport_terminals_pkey" PRIMARY KEY ("airportCode","terminal")
);

-- CreateTable
CREATE TABLE "public"."cached_flight_offers" (
    "id" TEXT NOT NULL,
    "originAirport" VARCHAR(3) NOT NULL,
    "destinationAirport" VARCHAR(3) NOT NULL,
    "departureDate" DATE NOT NULL,
    "returnDate" DATE,
    "searchHash" VARCHAR(64) NOT NULL,
    "amadeusData" JSONB NOT NULL,
    "priceEur" DECIMAL(10,2),
    "currency" VARCHAR(3) NOT NULL DEFAULT 'EUR',
    "airlineCode" VARCHAR(3),
    "flightNumber" VARCHAR(10),
    "durationMinutes" INTEGER,
    "stops" INTEGER NOT NULL DEFAULT 0,
    "cabinClass" VARCHAR(20) NOT NULL DEFAULT 'ECONOMY',
    "passengers" INTEGER NOT NULL DEFAULT 1,
    "cachedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isValid" BOOLEAN NOT NULL DEFAULT true,
    "apiResponseTimeMs" INTEGER,

    CONSTRAINT "cached_flight_offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."cached_destination_videos" (
    "id" TEXT NOT NULL,
    "destination" VARCHAR(100) NOT NULL,
    "activity" VARCHAR(100),
    "videoId" VARCHAR(20) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "thumbnailUrl" VARCHAR(512),
    "durationSeconds" INTEGER,
    "viewCount" BIGINT,
    "likeCount" INTEGER,
    "publishedAt" TIMESTAMP(3),
    "channelTitle" VARCHAR(255),
    "channelId" VARCHAR(50),
    "qualityScore" DECIMAL(3,2) NOT NULL DEFAULT 0,
    "relevanceScore" DECIMAL(3,2) NOT NULL DEFAULT 0,
    "isShort" BOOLEAN NOT NULL DEFAULT false,
    "languageCode" VARCHAR(5) NOT NULL DEFAULT 'en',
    "cachedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastValidated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isValid" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "cached_destination_videos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."airlines_enhanced" (
    "iataCode" VARCHAR(3) NOT NULL,
    "icaoCode" VARCHAR(4),
    "name" VARCHAR(255) NOT NULL,
    "countryCode" VARCHAR(2),
    "logoUrl" VARCHAR(512),
    "website" VARCHAR(255),
    "alliance" VARCHAR(50),
    "baggagePolicy" JSONB,
    "fleetInfo" JSONB,
    "hubs" JSONB,
    "foundedYear" INTEGER,
    "headquarters" VARCHAR(255),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataSource" VARCHAR(50) NOT NULL DEFAULT 'amadeus',

    CONSTRAINT "airlines_enhanced_pkey" PRIMARY KEY ("iataCode")
);

-- CreateTable
CREATE TABLE "public"."price_history" (
    "id" TEXT NOT NULL,
    "originAirport" VARCHAR(3) NOT NULL,
    "destinationAirport" VARCHAR(3) NOT NULL,
    "departureDate" DATE NOT NULL,
    "returnDate" DATE,
    "airlineCode" VARCHAR(3),
    "flightNumber" VARCHAR(10),
    "cabinClass" VARCHAR(20) NOT NULL DEFAULT 'ECONOMY',
    "priceEur" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'EUR',
    "originalPrice" DECIMAL(10,2),
    "originalCurrency" VARCHAR(3),
    "bookingDate" DATE NOT NULL,
    "daysUntilDeparture" INTEGER NOT NULL,
    "passengers" INTEGER NOT NULL DEFAULT 1,
    "source" VARCHAR(50) NOT NULL,
    "searchParameters" JSONB,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."price_trends" (
    "routeHash" VARCHAR(64) NOT NULL,
    "originAirport" VARCHAR(3) NOT NULL,
    "destinationAirport" VARCHAR(3) NOT NULL,
    "cabinClass" VARCHAR(20) NOT NULL DEFAULT 'ECONOMY',
    "avgPrice7d" DECIMAL(10,2),
    "avgPrice30d" DECIMAL(10,2),
    "avgPrice90d" DECIMAL(10,2),
    "minPrice30d" DECIMAL(10,2),
    "maxPrice30d" DECIMAL(10,2),
    "medianPrice30d" DECIMAL(10,2),
    "priceTrend" "public"."PriceTrendEnum",
    "trendPercentage" DECIMAL(5,2),
    "bestBookingWindowDays" INTEGER,
    "sampleSize" INTEGER,
    "lastCalculated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_trends_pkey" PRIMARY KEY ("routeHash")
);

-- CreateTable
CREATE TABLE "public"."popular_routes" (
    "routeHash" VARCHAR(64) NOT NULL,
    "originAirport" VARCHAR(3) NOT NULL,
    "destinationAirport" VARCHAR(3) NOT NULL,
    "searchCount" INTEGER NOT NULL DEFAULT 1,
    "lastSearched" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cachePriority" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "popular_routes_pkey" PRIMARY KEY ("routeHash")
);

-- CreateTable
CREATE TABLE "public"."cache_analytics" (
    "id" TEXT NOT NULL,
    "cacheType" VARCHAR(50) NOT NULL,
    "operation" "public"."CacheOperation" NOT NULL,
    "cacheKey" VARCHAR(255),
    "responseTimeMs" INTEGER,
    "dataSizeBytes" INTEGER,
    "hitRate" DECIMAL(5,2),
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cache_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "username" VARCHAR(100),
    "password_hash" TEXT NOT NULL,
    "first_name" VARCHAR(100),
    "last_name" VARCHAR(100),
    "role" "public"."UserRole" NOT NULL DEFAULT 'user',
    "is_email_verified" BOOLEAN NOT NULL DEFAULT false,
    "profile_image_url" TEXT,
    "preferences" JSONB,
    "last_login_at" TIMESTAMP(3),
    "mfa_enabled" BOOLEAN NOT NULL DEFAULT false,
    "mfa_secret" TEXT,
    "mfa_backup_codes" JSONB,
    "mfa_last_used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."admin_audit_logs" (
    "id" TEXT NOT NULL,
    "admin_id" TEXT NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "target_id" TEXT,
    "target_type" VARCHAR(50),
    "details" JSONB NOT NULL DEFAULT '{}',
    "ip_address" TEXT,
    "user_agent" TEXT,
    "session_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."spontra_creators" (
    "userId" TEXT NOT NULL,
    "creatorTier" "public"."CreatorTier" NOT NULL DEFAULT 'explorer',
    "totalEarnings" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalViews" BIGINT NOT NULL DEFAULT 0,
    "totalBookings" INTEGER NOT NULL DEFAULT 0,
    "averageRating" DECIMAL(3,2),
    "joinedProgramAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "specialties" JSONB,
    "bio" TEXT,
    "socialLinks" JSONB,

    CONSTRAINT "spontra_creators_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "public"."user_generated_content" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "activityId" VARCHAR(50),
    "destinationCode" VARCHAR(3) NOT NULL,
    "videoUrl" TEXT,
    "thumbnailUrl" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "durationSeconds" INTEGER,
    "gpsLocation" JSONB,
    "tags" JSONB,
    "viewCount" BIGINT NOT NULL DEFAULT 0,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "shareCount" INTEGER NOT NULL DEFAULT 0,
    "qualityScore" DECIMAL(3,2) NOT NULL DEFAULT 0,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_generated_content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."content_moderation" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "moderatorId" TEXT NOT NULL,
    "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decision" "public"."ModerationDecision" NOT NULL,
    "reasonCode" TEXT,
    "notes" TEXT,
    "qualityScore" DECIMAL(3,2),
    "autoFlags" JSONB,

    CONSTRAINT "content_moderation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."reward_transactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contentId" TEXT,
    "transactionType" "public"."TransactionType" NOT NULL,
    "pointsAmount" INTEGER NOT NULL,
    "euroAmount" DECIMAL(10,2),
    "description" TEXT NOT NULL,
    "referenceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "isProcessed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "reward_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."creator_analytics" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "videoUploads" INTEGER NOT NULL DEFAULT 0,
    "totalViews" BIGINT NOT NULL DEFAULT 0,
    "uniqueViewers" BIGINT NOT NULL DEFAULT 0,
    "engagementRate" DECIMAL(5,2),
    "bookingCount" INTEGER NOT NULL DEFAULT 0,
    "revenue" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "avgQualityScore" DECIMAL(3,2),
    "topDestinations" JSONB,
    "topActivities" JSONB,

    CONSTRAINT "creator_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."content_bookings" (
    "contentId" CHAR(25) NOT NULL,
    "bookingId" CHAR(25) NOT NULL,
    "bookingDate" TIMESTAMP(3) NOT NULL,
    "bookingValue" DECIMAL(10,2) NOT NULL,
    "creatorCommission" DECIMAL(10,2) NOT NULL,
    "commissionPaid" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "content_bookings_pkey" PRIMARY KEY ("contentId","bookingDate","bookingId")
);

-- CreateTable
CREATE TABLE "public"."content_views" (
    "contentId" CHAR(25) NOT NULL,
    "viewDate" DATE NOT NULL,
    "hour" INTEGER NOT NULL,
    "viewerId" TEXT NOT NULL DEFAULT 'anonymous',
    "viewDurationSecs" INTEGER NOT NULL,
    "conversionAction" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "content_views_pkey" PRIMARY KEY ("contentId","viewDate","hour","viewerId")
);

-- CreateTable
CREATE TABLE "public"."achievements" (
    "achievementId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "iconUrl" TEXT,
    "rewardPoints" INTEGER NOT NULL,
    "rewardEuro" DECIMAL(10,2),
    "criteria" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "achievements_pkey" PRIMARY KEY ("achievementId")
);

-- CreateTable
CREATE TABLE "public"."user_achievements" (
    "userId" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rewardClaimed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "user_achievements_pkey" PRIMARY KEY ("userId","achievementId")
);

-- CreateTable
CREATE TABLE "public"."creator_leaderboard" (
    "leaderboardType" "public"."LeaderboardType" NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "rank" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "username" TEXT,
    "metricValue" BIGINT NOT NULL,
    "creatorTier" "public"."CreatorTier" NOT NULL,

    CONSTRAINT "creator_leaderboard_pkey" PRIMARY KEY ("leaderboardType","periodStart","rank")
);

-- CreateTable
CREATE TABLE "public"."providers" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "market" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "reliabilityScore" DOUBLE PRECISION NOT NULL DEFAULT 0.8,
    "expectedEPC" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "supportsInfants" BOOLEAN NOT NULL DEFAULT true,
    "allowedAirlines" TEXT,
    "currencyModes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."link_templates" (
    "id" TEXT NOT NULL,
    "providerIdRef" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "requiredTokens" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "link_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."clicks" (
    "id" TEXT NOT NULL,
    "clickId" TEXT NOT NULL,
    "providerRef" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "queryHash" TEXT NOT NULL,
    "priceShown" DECIMAL(18,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "market" TEXT NOT NULL,
    "sessionId" TEXT,
    "userAgent" TEXT,
    "ipHash" TEXT,
    "landed200" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clicks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."conversions" (
    "id" TEXT NOT NULL,
    "clickId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "commission" DECIMAL(18,2) NOT NULL,
    "saleAmount" DECIMAL(18,2),
    "currency" TEXT NOT NULL,
    "providerRef" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "rawPayload" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."offer_cache" (
    "id" TEXT NOT NULL,
    "queryHash" VARCHAR(64) NOT NULL,
    "market" VARCHAR(2) NOT NULL,
    "query" JSONB NOT NULL,
    "offers" JSONB NOT NULL,
    "offerCount" INTEGER NOT NULL DEFAULT 0,
    "dataSource" TEXT NOT NULL DEFAULT 'amadeus',
    "isStale" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "offer_cache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."synthetic_checks" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "market" TEXT NOT NULL,
    "testQuery" JSONB NOT NULL,
    "statusCode" INTEGER,
    "responseTimeMs" INTEGER,
    "finalHost" TEXT,
    "titleHash" TEXT,
    "errorMessage" TEXT,
    "isHealthy" BOOLEAN NOT NULL DEFAULT true,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "synthetic_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."price_accuracy" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "originalPrice" DECIMAL(18,2) NOT NULL,
    "repricedPrice" DECIMAL(18,2),
    "currency" TEXT NOT NULL,
    "priceChanged" BOOLEAN NOT NULL DEFAULT false,
    "percentageChange" DECIMAL(5,2),
    "checkType" TEXT NOT NULL,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_accuracy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CityTheme_iata_idx" ON "public"."CityTheme"("iata");

-- CreateIndex
CREATE INDEX "CityTheme_themeSlug_idx" ON "public"."CityTheme"("themeSlug");

-- CreateIndex
CREATE UNIQUE INDEX "CityTheme_iata_themeSlug_key" ON "public"."CityTheme"("iata", "themeSlug");

-- CreateIndex
CREATE INDEX "Reel_iata_themeSlug_isActive_idx" ON "public"."Reel"("iata", "themeSlug", "isActive");

-- CreateIndex
CREATE INDEX "ReelMedia_reelId_isActive_idx" ON "public"."ReelMedia"("reelId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "search_analytics_query_key" ON "public"."search_analytics"("query");

-- CreateIndex
CREATE INDEX "search_analytics_query_idx" ON "public"."search_analytics"("query");

-- CreateIndex
CREATE INDEX "search_analytics_search_count_idx" ON "public"."search_analytics"("search_count" DESC);

-- CreateIndex
CREATE INDEX "search_analytics_last_searched_idx" ON "public"."search_analytics"("last_searched" DESC);

-- CreateIndex
CREATE INDEX "flight_routes_originAirportCode_idx" ON "public"."flight_routes"("originAirportCode");

-- CreateIndex
CREATE INDEX "flight_routes_originAirportCode_destinationAirportCode_idx" ON "public"."flight_routes"("originAirportCode", "destinationAirportCode");

-- CreateIndex
CREATE INDEX "flight_routes_originAirportCode_totalDurationMinutes_idx" ON "public"."flight_routes"("originAirportCode", "totalDurationMinutes");

-- CreateIndex
CREATE INDEX "airports_city_idx" ON "public"."airports"("city");

-- CreateIndex
CREATE INDEX "airports_countryCode_idx" ON "public"."airports"("countryCode");

-- CreateIndex
CREATE INDEX "airports_isActive_idx" ON "public"."airports"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "destinations_airportCode_key" ON "public"."destinations"("airportCode");

-- CreateIndex
CREATE INDEX "destinations_airportCode_idx" ON "public"."destinations"("airportCode");

-- CreateIndex
CREATE INDEX "destinations_countryCode_idx" ON "public"."destinations"("countryCode");

-- CreateIndex
CREATE INDEX "destinations_popularityScore_idx" ON "public"."destinations"("popularityScore");

-- CreateIndex
CREATE INDEX "destination_explore_requests_originAirportCode_idx" ON "public"."destination_explore_requests"("originAirportCode");

-- CreateIndex
CREATE INDEX "destination_explore_requests_createdAt_idx" ON "public"."destination_explore_requests"("createdAt");

-- CreateIndex
CREATE INDEX "airport_facilities_airportCode_idx" ON "public"."airport_facilities"("airportCode");

-- CreateIndex
CREATE INDEX "airport_facilities_facilityType_idx" ON "public"."airport_facilities"("facilityType");

-- CreateIndex
CREATE INDEX "airport_facilities_airportCode_terminal_idx" ON "public"."airport_facilities"("airportCode", "terminal");

-- CreateIndex
CREATE INDEX "cached_flight_offers_originAirport_destinationAirport_depar_idx" ON "public"."cached_flight_offers"("originAirport", "destinationAirport", "departureDate");

-- CreateIndex
CREATE INDEX "cached_flight_offers_expiresAt_isValid_idx" ON "public"."cached_flight_offers"("expiresAt", "isValid");

-- CreateIndex
CREATE INDEX "cached_flight_offers_searchHash_idx" ON "public"."cached_flight_offers"("searchHash");

-- CreateIndex
CREATE INDEX "cached_flight_offers_priceEur_isValid_idx" ON "public"."cached_flight_offers"("priceEur", "isValid");

-- CreateIndex
CREATE INDEX "cached_destination_videos_destination_activity_isValid_idx" ON "public"."cached_destination_videos"("destination", "activity", "isValid");

-- CreateIndex
CREATE INDEX "cached_destination_videos_qualityScore_relevanceScore_isVal_idx" ON "public"."cached_destination_videos"("qualityScore", "relevanceScore", "isValid");

-- CreateIndex
CREATE INDEX "cached_destination_videos_destination_isValid_idx" ON "public"."cached_destination_videos"("destination", "isValid");

-- CreateIndex
CREATE UNIQUE INDEX "cached_destination_videos_destination_activity_videoId_key" ON "public"."cached_destination_videos"("destination", "activity", "videoId");

-- CreateIndex
CREATE UNIQUE INDEX "airlines_enhanced_icaoCode_key" ON "public"."airlines_enhanced"("icaoCode");

-- CreateIndex
CREATE INDEX "price_history_originAirport_destinationAirport_idx" ON "public"."price_history"("originAirport", "destinationAirport");

-- CreateIndex
CREATE INDEX "price_history_departureDate_idx" ON "public"."price_history"("departureDate");

-- CreateIndex
CREATE INDEX "price_history_bookingDate_idx" ON "public"."price_history"("bookingDate");

-- CreateIndex
CREATE INDEX "price_history_daysUntilDeparture_idx" ON "public"."price_history"("daysUntilDeparture");

-- CreateIndex
CREATE INDEX "price_trends_originAirport_destinationAirport_idx" ON "public"."price_trends"("originAirport", "destinationAirport");

-- CreateIndex
CREATE INDEX "price_trends_lastCalculated_idx" ON "public"."price_trends"("lastCalculated");

-- CreateIndex
CREATE UNIQUE INDEX "popular_routes_originAirport_destinationAirport_key" ON "public"."popular_routes"("originAirport", "destinationAirport");

-- CreateIndex
CREATE INDEX "cache_analytics_cacheType_operation_idx" ON "public"."cache_analytics"("cacheType", "operation");

-- CreateIndex
CREATE INDEX "cache_analytics_recordedAt_idx" ON "public"."cache_analytics"("recordedAt");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "public"."users"("username");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_sessions_sessionToken_key" ON "public"."user_sessions"("sessionToken");

-- CreateIndex
CREATE INDEX "user_sessions_userId_idx" ON "public"."user_sessions"("userId");

-- CreateIndex
CREATE INDEX "user_sessions_expiresAt_idx" ON "public"."user_sessions"("expiresAt");

-- CreateIndex
CREATE INDEX "admin_audit_logs_admin_id_idx" ON "public"."admin_audit_logs"("admin_id");

-- CreateIndex
CREATE INDEX "admin_audit_logs_action_idx" ON "public"."admin_audit_logs"("action");

-- CreateIndex
CREATE INDEX "admin_audit_logs_created_at_idx" ON "public"."admin_audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "admin_audit_logs_target_id_target_type_idx" ON "public"."admin_audit_logs"("target_id", "target_type");

-- CreateIndex
CREATE INDEX "user_generated_content_userId_idx" ON "public"."user_generated_content"("userId");

-- CreateIndex
CREATE INDEX "user_generated_content_destinationCode_idx" ON "public"."user_generated_content"("destinationCode");

-- CreateIndex
CREATE INDEX "user_generated_content_activityId_idx" ON "public"."user_generated_content"("activityId");

-- CreateIndex
CREATE INDEX "user_generated_content_isApproved_isPublic_idx" ON "public"."user_generated_content"("isApproved", "isPublic");

-- CreateIndex
CREATE INDEX "user_generated_content_qualityScore_idx" ON "public"."user_generated_content"("qualityScore");

-- CreateIndex
CREATE INDEX "content_moderation_contentId_idx" ON "public"."content_moderation"("contentId");

-- CreateIndex
CREATE INDEX "content_moderation_moderatorId_idx" ON "public"."content_moderation"("moderatorId");

-- CreateIndex
CREATE INDEX "content_moderation_decision_idx" ON "public"."content_moderation"("decision");

-- CreateIndex
CREATE INDEX "reward_transactions_userId_idx" ON "public"."reward_transactions"("userId");

-- CreateIndex
CREATE INDEX "reward_transactions_transactionType_idx" ON "public"."reward_transactions"("transactionType");

-- CreateIndex
CREATE INDEX "reward_transactions_createdAt_idx" ON "public"."reward_transactions"("createdAt");

-- CreateIndex
CREATE INDEX "creator_analytics_userId_period_idx" ON "public"."creator_analytics"("userId", "period");

-- CreateIndex
CREATE INDEX "creator_analytics_periodStart_idx" ON "public"."creator_analytics"("periodStart");

-- CreateIndex
CREATE INDEX "content_bookings_bookingDate_idx" ON "public"."content_bookings"("bookingDate");

-- CreateIndex
CREATE INDEX "content_views_viewDate_idx" ON "public"."content_views"("viewDate");

-- CreateIndex
CREATE INDEX "creator_leaderboard_userId_idx" ON "public"."creator_leaderboard"("userId");

-- CreateIndex
CREATE INDEX "providers_market_isActive_idx" ON "public"."providers"("market", "isActive");

-- CreateIndex
CREATE INDEX "providers_expectedEPC_idx" ON "public"."providers"("expectedEPC");

-- CreateIndex
CREATE UNIQUE INDEX "providers_providerId_market_key" ON "public"."providers"("providerId", "market");

-- CreateIndex
CREATE UNIQUE INDEX "link_templates_providerIdRef_key" ON "public"."link_templates"("providerIdRef");

-- CreateIndex
CREATE UNIQUE INDEX "clicks_clickId_key" ON "public"."clicks"("clickId");

-- CreateIndex
CREATE INDEX "clicks_providerId_market_createdAt_idx" ON "public"."clicks"("providerId", "market", "createdAt");

-- CreateIndex
CREATE INDEX "clicks_sessionId_idx" ON "public"."clicks"("sessionId");

-- CreateIndex
CREATE INDEX "clicks_clickId_idx" ON "public"."clicks"("clickId");

-- CreateIndex
CREATE INDEX "conversions_providerId_createdAt_idx" ON "public"."conversions"("providerId", "createdAt");

-- CreateIndex
CREATE INDEX "conversions_status_createdAt_idx" ON "public"."conversions"("status", "createdAt");

-- CreateIndex
CREATE INDEX "offer_cache_queryHash_idx" ON "public"."offer_cache"("queryHash");

-- CreateIndex
CREATE INDEX "offer_cache_market_createdAt_idx" ON "public"."offer_cache"("market", "createdAt");

-- CreateIndex
CREATE INDEX "offer_cache_expiresAt_isStale_idx" ON "public"."offer_cache"("expiresAt", "isStale");

-- CreateIndex
CREATE INDEX "synthetic_checks_providerId_market_checkedAt_idx" ON "public"."synthetic_checks"("providerId", "market", "checkedAt");

-- CreateIndex
CREATE INDEX "synthetic_checks_isHealthy_checkedAt_idx" ON "public"."synthetic_checks"("isHealthy", "checkedAt");

-- CreateIndex
CREATE INDEX "price_accuracy_providerId_checkedAt_idx" ON "public"."price_accuracy"("providerId", "checkedAt");

-- CreateIndex
CREATE INDEX "price_accuracy_priceChanged_checkedAt_idx" ON "public"."price_accuracy"("priceChanged", "checkedAt");

-- AddForeignKey
ALTER TABLE "public"."Reel" ADD CONSTRAINT "Reel_iata_themeSlug_fkey" FOREIGN KEY ("iata", "themeSlug") REFERENCES "public"."CityTheme"("iata", "themeSlug") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReelMedia" ADD CONSTRAINT "ReelMedia_reelId_fkey" FOREIGN KEY ("reelId") REFERENCES "public"."Reel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."destinations" ADD CONSTRAINT "destinations_airportCode_fkey" FOREIGN KEY ("airportCode") REFERENCES "public"."airports"("iataCode") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."destination_explore_requests" ADD CONSTRAINT "destination_explore_requests_originAirportCode_fkey" FOREIGN KEY ("originAirportCode") REFERENCES "public"."destinations"("airportCode") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."airport_facilities" ADD CONSTRAINT "airport_facilities_airportCode_fkey" FOREIGN KEY ("airportCode") REFERENCES "public"."airports"("iataCode") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."airport_terminals" ADD CONSTRAINT "airport_terminals_airportCode_fkey" FOREIGN KEY ("airportCode") REFERENCES "public"."airports"("iataCode") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_sessions" ADD CONSTRAINT "user_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."admin_audit_logs" ADD CONSTRAINT "admin_audit_logs_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."spontra_creators" ADD CONSTRAINT "spontra_creators_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_generated_content" ADD CONSTRAINT "ugc_user_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_generated_content" ADD CONSTRAINT "ugc_creator_fkey" FOREIGN KEY ("userId") REFERENCES "public"."spontra_creators"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_generated_content" ADD CONSTRAINT "user_generated_content_destinationCode_fkey" FOREIGN KEY ("destinationCode") REFERENCES "public"."destinations"("airportCode") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."content_moderation" ADD CONSTRAINT "content_moderation_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "public"."user_generated_content"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."content_moderation" ADD CONSTRAINT "content_moderation_moderatorId_fkey" FOREIGN KEY ("moderatorId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reward_transactions" ADD CONSTRAINT "reward_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."creator_analytics" ADD CONSTRAINT "creator_analytics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."spontra_creators"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."content_bookings" ADD CONSTRAINT "content_bookings_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "public"."user_generated_content"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."content_views" ADD CONSTRAINT "content_views_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "public"."user_generated_content"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_achievements" ADD CONSTRAINT "user_achievements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_achievements" ADD CONSTRAINT "user_achievements_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "public"."achievements"("achievementId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."creator_leaderboard" ADD CONSTRAINT "creator_leaderboard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."spontra_creators"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."link_templates" ADD CONSTRAINT "link_templates_providerIdRef_fkey" FOREIGN KEY ("providerIdRef") REFERENCES "public"."providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."clicks" ADD CONSTRAINT "click_provider_fkey" FOREIGN KEY ("providerRef") REFERENCES "public"."providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."conversions" ADD CONSTRAINT "conversions_clickId_fkey" FOREIGN KEY ("clickId") REFERENCES "public"."clicks"("clickId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."conversions" ADD CONSTRAINT "conversion_provider_fkey" FOREIGN KEY ("providerRef") REFERENCES "public"."providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
