-- CreateTable
CREATE TABLE "public"."auth_logs" (
    "id" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL DEFAULT false,
    "userAgent" TEXT,
    "sessionId" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."postback_logs" (
    "id" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "reason" TEXT,
    "signature" TEXT,
    "payload" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "postback_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."rate_limit_logs" (
    "id" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "violations" INTEGER NOT NULL DEFAULT 1,
    "userAgent" TEXT,
    "sessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rate_limit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."api_logs" (
    "id" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "responseTimeMs" INTEGER,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "auth_logs_ipAddress_success_idx" ON "public"."auth_logs"("ipAddress", "success");

-- CreateIndex
CREATE INDEX "auth_logs_createdAt_idx" ON "public"."auth_logs"("createdAt");

-- CreateIndex
CREATE INDEX "auth_logs_success_createdAt_idx" ON "public"."auth_logs"("success", "createdAt");

-- CreateIndex
CREATE INDEX "postback_logs_network_verified_idx" ON "public"."postback_logs"("network", "verified");

-- CreateIndex
CREATE INDEX "postback_logs_ipAddress_verified_idx" ON "public"."postback_logs"("ipAddress", "verified");

-- CreateIndex
CREATE INDEX "postback_logs_createdAt_idx" ON "public"."postback_logs"("createdAt");

-- CreateIndex
CREATE INDEX "postback_logs_verified_createdAt_idx" ON "public"."postback_logs"("verified", "createdAt");

-- CreateIndex
CREATE INDEX "rate_limit_logs_ipAddress_endpoint_idx" ON "public"."rate_limit_logs"("ipAddress", "endpoint");

-- CreateIndex
CREATE INDEX "rate_limit_logs_endpoint_createdAt_idx" ON "public"."rate_limit_logs"("endpoint", "createdAt");

-- CreateIndex
CREATE INDEX "rate_limit_logs_createdAt_idx" ON "public"."rate_limit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "api_logs_endpoint_statusCode_idx" ON "public"."api_logs"("endpoint", "statusCode");

-- CreateIndex
CREATE INDEX "api_logs_statusCode_createdAt_idx" ON "public"."api_logs"("statusCode", "createdAt");

-- CreateIndex
CREATE INDEX "api_logs_createdAt_idx" ON "public"."api_logs"("createdAt");

-- CreateIndex
CREATE INDEX "api_logs_endpoint_createdAt_idx" ON "public"."api_logs"("endpoint", "createdAt");