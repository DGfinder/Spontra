-- CreateIndex
CREATE UNIQUE INDEX "clicks_sessionId_offerId_providerId_key" ON "clicks"("sessionId", "offerId", "providerId");