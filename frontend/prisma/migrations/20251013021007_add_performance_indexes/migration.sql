-- CreateIndex
CREATE INDEX "airports_city_idx" ON "airports"("city");

-- CreateIndex
CREATE INDEX "airports_country_idx" ON "airports"("country");

-- CreateIndex
CREATE INDEX "airports_passenger_volume_idx" ON "airports"("passenger_volume" DESC);

-- CreateIndex
CREATE INDEX "airports_is_active_is_searchable_idx" ON "airports"("is_active", "is_searchable");

-- CreateIndex
CREATE INDEX "creator_earnings_hold_release_at_is_paid_idx" ON "creator_earnings"("hold_release_at", "is_paid");

-- CreateIndex
CREATE INDEX "creator_earnings_is_paid_earned_at_idx" ON "creator_earnings"("is_paid", "earned_at");

-- CreateIndex
CREATE INDEX "destinations_city_name_idx" ON "destinations"("city_name");

-- CreateIndex
CREATE INDEX "destinations_popularity_score_idx" ON "destinations"("popularity_score" DESC);

-- CreateIndex
CREATE INDEX "destinations_slug_idx" ON "destinations"("slug");

-- CreateIndex
CREATE INDEX "flight_routes_total_duration_minutes_idx" ON "flight_routes"("total_duration_minutes");

-- CreateIndex
CREATE INDEX "flight_routes_origin_airport_code_total_duration_minutes_idx" ON "flight_routes"("origin_airport_code", "total_duration_minutes");

-- CreateIndex
CREATE INDEX "flight_routes_destination_airport_code_idx" ON "flight_routes"("destination_airport_code");

-- CreateIndex
CREATE INDEX "hotels_primary_theme_idx" ON "hotels"("primary_theme");

-- CreateIndex
CREATE INDEX "hotels_is_active_price_level_idx" ON "hotels"("is_active", "price_level");

-- CreateIndex
CREATE INDEX "theme_pois_theme_idx" ON "theme_pois"("theme");

-- CreateIndex
CREATE INDEX "theme_pois_destination_id_display_order_idx" ON "theme_pois"("destination_id", "display_order");

-- CreateIndex
CREATE INDEX "video_views_creator_id_viewed_at_idx" ON "video_views"("creator_id", "viewed_at" DESC);
