-- Spontra Data Caching Tables
-- Run this to create all caching tables for API data population

-- ============================================================================
-- AMADEUS FLIGHT DATA CACHING
-- ============================================================================

-- Cached flight offers from Amadeus API
CREATE TABLE IF NOT EXISTS cached_flight_offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    origin_airport VARCHAR(3) NOT NULL,
    destination_airport VARCHAR(3) NOT NULL,
    departure_date DATE NOT NULL,
    return_date DATE,
    search_hash VARCHAR(64) NOT NULL, -- MD5 hash of search parameters
    amadeus_data JSONB NOT NULL,
    price_eur DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'EUR',
    airline_code VARCHAR(3),
    flight_number VARCHAR(10),
    duration_minutes INTEGER,
    stops INTEGER DEFAULT 0,
    cabin_class VARCHAR(20) DEFAULT 'ECONOMY',
    passengers INTEGER DEFAULT 1,
    cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_valid BOOLEAN DEFAULT true,
    api_response_time_ms INTEGER,
    
    -- Constraints
    CONSTRAINT valid_price CHECK (price_eur > 0),
    CONSTRAINT valid_dates CHECK (departure_date >= CURRENT_DATE),
    CONSTRAINT valid_return_date CHECK (return_date IS NULL OR return_date >= departure_date)
);

-- Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_cached_offers_route_date 
ON cached_flight_offers(origin_airport, destination_airport, departure_date);

CREATE INDEX IF NOT EXISTS idx_cached_offers_expires 
ON cached_flight_offers(expires_at) WHERE is_valid = true;

CREATE INDEX IF NOT EXISTS idx_cached_offers_hash 
ON cached_flight_offers(search_hash);

CREATE INDEX IF NOT EXISTS idx_cached_offers_price 
ON cached_flight_offers(price_eur) WHERE is_valid = true;

-- Enhanced airline reference data
CREATE TABLE IF NOT EXISTS airlines_enhanced (
    iata_code VARCHAR(3) PRIMARY KEY,
    icao_code VARCHAR(4) UNIQUE,
    name VARCHAR(255) NOT NULL,
    country_code VARCHAR(2),
    logo_url VARCHAR(512),
    website VARCHAR(255),
    alliance VARCHAR(50), -- Star Alliance, oneworld, SkyTeam, null
    baggage_policy JSONB, -- Structured baggage allowance data
    fleet_info JSONB, -- Aircraft types and counts
    hubs JSONB, -- Array of hub airport codes
    founded_year INTEGER,
    headquarters VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_source VARCHAR(50) DEFAULT 'amadeus'
);

-- Insert some initial airline data
INSERT INTO airlines_enhanced (iata_code, icao_code, name, country_code, alliance, logo_url) VALUES
('BA', 'BAW', 'British Airways', 'GB', 'oneworld', 'https://logos.skyscnr.com/images/airlines/favicon/BA.png'),
('AF', 'AFR', 'Air France', 'FR', 'SkyTeam', 'https://logos.skyscnr.com/images/airlines/favicon/AF.png'),
('LH', 'DLH', 'Lufthansa', 'DE', 'Star Alliance', 'https://logos.skyscnr.com/images/airlines/favicon/LH.png'),
('KL', 'KLM', 'KLM Royal Dutch Airlines', 'NL', 'SkyTeam', 'https://logos.skyscnr.com/images/airlines/favicon/KL.png'),
('FR', 'RYR', 'Ryanair', 'IE', null, 'https://logos.skyscnr.com/images/airlines/favicon/FR.png'),
('U2', 'EZY', 'easyJet', 'GB', null, 'https://logos.skyscnr.com/images/airlines/favicon/U2.png'),
('LX', 'SWR', 'Swiss International Air Lines', 'CH', 'Star Alliance', 'https://logos.skyscnr.com/images/airlines/favicon/LX.png'),
('OS', 'AUA', 'Austrian Airlines', 'AT', 'Star Alliance', 'https://logos.skyscnr.com/images/airlines/favicon/OS.png'),
('IB', 'IBE', 'Iberia', 'ES', 'oneworld', 'https://logos.skyscnr.com/images/airlines/favicon/IB.png'),
('AZ', 'ITY', 'ITA Airways', 'IT', 'SkyTeam', 'https://logos.skyscnr.com/images/airlines/favicon/AZ.png')
ON CONFLICT (iata_code) DO NOTHING;

-- ============================================================================
-- YOUTUBE VIDEO CONTENT CACHING
-- ============================================================================

-- Cached destination videos from YouTube
CREATE TABLE IF NOT EXISTS cached_destination_videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    destination VARCHAR(100) NOT NULL,
    activity VARCHAR(100),
    video_id VARCHAR(20) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    thumbnail_url VARCHAR(512),
    duration_seconds INTEGER,
    view_count BIGINT,
    like_count INTEGER,
    published_at TIMESTAMP,
    channel_title VARCHAR(255),
    channel_id VARCHAR(50),
    quality_score DECIMAL(3,2) DEFAULT 0, -- Our calculated quality score 0-10
    relevance_score DECIMAL(3,2) DEFAULT 0, -- How relevant to destination/activity
    is_short BOOLEAN DEFAULT false,
    language_code VARCHAR(5) DEFAULT 'en',
    cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_validated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_valid BOOLEAN DEFAULT true,
    
    -- Constraints
    CONSTRAINT valid_quality_score CHECK (quality_score >= 0 AND quality_score <= 10),
    CONSTRAINT valid_relevance_score CHECK (relevance_score >= 0 AND relevance_score <= 10)
);

-- Indexes for video lookup
CREATE INDEX IF NOT EXISTS idx_cached_videos_dest_activity 
ON cached_destination_videos(destination, activity) WHERE is_valid = true;

CREATE INDEX IF NOT EXISTS idx_cached_videos_quality 
ON cached_destination_videos(quality_score DESC, relevance_score DESC) WHERE is_valid = true;

CREATE INDEX IF NOT EXISTS idx_cached_videos_destination 
ON cached_destination_videos(destination) WHERE is_valid = true;

-- Unique constraint to prevent duplicate videos
CREATE UNIQUE INDEX IF NOT EXISTS unique_dest_activity_video 
ON cached_destination_videos(destination, COALESCE(activity, ''), video_id);

-- ============================================================================
-- AIRPORT FACILITIES AND ENHANCEMENTS
-- ============================================================================

-- Enhanced airport facilities data
CREATE TABLE IF NOT EXISTS airport_facilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    airport_code VARCHAR(3) NOT NULL REFERENCES airports(iata_code),
    facility_type VARCHAR(50) NOT NULL, -- lounge, restaurant, shop, transport, service
    facility_name VARCHAR(255),
    terminal VARCHAR(10),
    level VARCHAR(20), -- departures, arrivals, level_1, level_2, etc.
    description TEXT,
    operating_hours VARCHAR(100),
    website VARCHAR(255),
    phone VARCHAR(50),
    rating DECIMAL(2,1), -- 1.0 to 5.0
    price_range VARCHAR(10), -- $, $$, $$$, $$$$
    amenities JSONB, -- wifi, power_outlets, family_friendly, etc.
    location_details JSONB, -- coordinates within terminal, directions
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_source VARCHAR(50) DEFAULT 'manual'
);

-- Indexes for facility lookup
CREATE INDEX IF NOT EXISTS idx_facilities_airport 
ON airport_facilities(airport_code);

CREATE INDEX IF NOT EXISTS idx_facilities_type 
ON airport_facilities(facility_type);

CREATE INDEX IF NOT EXISTS idx_facilities_terminal 
ON airport_facilities(airport_code, terminal);

-- Terminal and airline mapping
CREATE TABLE IF NOT EXISTS airport_terminals (
    airport_code VARCHAR(3) NOT NULL REFERENCES airports(iata_code),
    terminal VARCHAR(10) NOT NULL,
    terminal_name VARCHAR(255),
    airlines JSONB, -- Array of airline codes using this terminal
    facilities JSONB, -- Array of available facility types
    transport_options JSONB, -- Train, bus, taxi, rental car info
    capacity_info JSONB, -- Gates, check-in counters, etc.
    coordinates JSONB, -- Terminal location within airport
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    PRIMARY KEY (airport_code, terminal)
);

-- ============================================================================
-- PRICE HISTORY AND TRENDS
-- ============================================================================

-- Historical price data for trend analysis
CREATE TABLE IF NOT EXISTS price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    origin_airport VARCHAR(3) NOT NULL,
    destination_airport VARCHAR(3) NOT NULL,
    departure_date DATE NOT NULL,
    return_date DATE,
    airline_code VARCHAR(3),
    flight_number VARCHAR(10),
    cabin_class VARCHAR(20) DEFAULT 'ECONOMY',
    price_eur DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    original_price DECIMAL(10,2),
    original_currency VARCHAR(3),
    booking_date DATE NOT NULL,
    days_until_departure INTEGER,
    passengers INTEGER DEFAULT 1,
    source VARCHAR(50) NOT NULL, -- amadeus, kayak, direct, skyscanner
    search_parameters JSONB, -- Store original search params
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_price CHECK (price_eur > 0),
    CONSTRAINT valid_days_until CHECK (days_until_departure >= 0)
);

-- Indexes for price analysis
CREATE INDEX IF NOT EXISTS idx_price_history_route 
ON price_history(origin_airport, destination_airport);

CREATE INDEX IF NOT EXISTS idx_price_history_date 
ON price_history(departure_date);

CREATE INDEX IF NOT EXISTS idx_price_history_booking 
ON price_history(booking_date);

CREATE INDEX IF NOT EXISTS idx_price_history_days_until 
ON price_history(days_until_departure);

-- Pre-calculated price trends for fast lookup
CREATE TABLE IF NOT EXISTS price_trends (
    route_hash VARCHAR(64) PRIMARY KEY, -- MD5(origin+destination+cabin_class)
    origin_airport VARCHAR(3) NOT NULL,
    destination_airport VARCHAR(3) NOT NULL,
    cabin_class VARCHAR(20) DEFAULT 'ECONOMY',
    avg_price_7d DECIMAL(10,2),
    avg_price_30d DECIMAL(10,2),
    avg_price_90d DECIMAL(10,2),
    min_price_30d DECIMAL(10,2),
    max_price_30d DECIMAL(10,2),
    median_price_30d DECIMAL(10,2),
    price_trend VARCHAR(20), -- rising, falling, stable
    trend_percentage DECIMAL(5,2), -- % change over 30 days
    best_booking_window_days INTEGER, -- Optimal days before departure
    sample_size INTEGER, -- Number of data points used
    last_calculated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_price_trends_route (origin_airport, destination_airport),
    INDEX idx_price_trends_updated (last_calculated)
);

-- ============================================================================
-- CACHE MANAGEMENT AND ANALYTICS
-- ============================================================================

-- Cache performance tracking
CREATE TABLE IF NOT EXISTS cache_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cache_type VARCHAR(50) NOT NULL, -- flight_offers, videos, facilities, prices
    operation VARCHAR(20) NOT NULL, -- hit, miss, refresh, cleanup
    cache_key VARCHAR(255),
    response_time_ms INTEGER,
    data_size_bytes INTEGER,
    hit_rate DECIMAL(5,2), -- Calculated hit rate percentage
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_cache_analytics_type_operation (cache_type, operation),
    INDEX idx_cache_analytics_recorded (recorded_at)
);

-- Popular routes tracking for cache prioritization
CREATE TABLE IF NOT EXISTS popular_routes (
    route_hash VARCHAR(64) PRIMARY KEY,
    origin_airport VARCHAR(3) NOT NULL,
    destination_airport VARCHAR(3) NOT NULL,
    search_count INTEGER DEFAULT 1,
    last_searched TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    cache_priority INTEGER DEFAULT 0, -- Higher = more important to cache
    
    -- Update search count and last searched time
    CONSTRAINT unique_route UNIQUE (origin_airport, destination_airport)
);

-- ============================================================================
-- CLEANUP AND MAINTENANCE FUNCTIONS
-- ============================================================================

-- Function to clean expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_cache() 
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    -- Clean expired flight offers
    DELETE FROM cached_flight_offers 
    WHERE expires_at < NOW() OR is_valid = false;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Clean old video cache (older than 30 days)
    DELETE FROM cached_destination_videos 
    WHERE last_validated < NOW() - INTERVAL '30 days' OR is_valid = false;
    
    -- Clean old price history (older than 1 year)
    DELETE FROM price_history 
    WHERE recorded_at < NOW() - INTERVAL '1 year';
    
    -- Update cache analytics
    INSERT INTO cache_analytics (cache_type, operation, response_time_ms)
    VALUES ('all', 'cleanup', deleted_count);
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate cache hit rates
CREATE OR REPLACE FUNCTION calculate_cache_hit_rate(cache_type_param VARCHAR(50)) 
RETURNS DECIMAL(5,2) AS $$
DECLARE
    hit_rate DECIMAL(5,2);
BEGIN
    SELECT 
        ROUND(
            (COUNT(CASE WHEN operation = 'hit' THEN 1 END) * 100.0 / 
             NULLIF(COUNT(CASE WHEN operation IN ('hit', 'miss') THEN 1 END), 0)), 
            2
        )
    INTO hit_rate
    FROM cache_analytics 
    WHERE cache_type = cache_type_param 
    AND recorded_at > NOW() - INTERVAL '24 hours';
    
    RETURN COALESCE(hit_rate, 0.00);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- INITIAL DATA AND CONFIGURATION
-- ============================================================================

-- Insert popular European routes for priority caching
INSERT INTO popular_routes (route_hash, origin_airport, destination_airport, cache_priority) VALUES
(MD5('LHR-CDG'), 'LHR', 'CDG', 100),
(MD5('LHR-FRA'), 'LHR', 'FRA', 95),
(MD5('LHR-AMS'), 'LHR', 'AMS', 90),
(MD5('LHR-FCO'), 'LHR', 'FCO', 85),
(MD5('CDG-FRA'), 'CDG', 'FRA', 80),
(MD5('CDG-BCN'), 'CDG', 'BCN', 75),
(MD5('FRA-FCO'), 'FRA', 'FCO', 70),
(MD5('AMS-BCN'), 'AMS', 'BCN', 65),
(MD5('LHR-MAD'), 'LHR', 'MAD', 60),
(MD5('CDG-FCO'), 'CDG', 'FCO', 55)
ON CONFLICT (route_hash) DO NOTHING;

-- Create a view for easy cache status monitoring
CREATE OR REPLACE VIEW cache_status_summary AS
SELECT 
    'flight_offers' as cache_type,
    COUNT(*) as total_entries,
    COUNT(CASE WHEN expires_at > NOW() AND is_valid THEN 1 END) as valid_entries,
    COUNT(CASE WHEN expires_at <= NOW() OR NOT is_valid THEN 1 END) as expired_entries,
    ROUND(AVG(EXTRACT(EPOCH FROM (expires_at - cached_at))/3600), 2) as avg_ttl_hours
FROM cached_flight_offers

UNION ALL

SELECT 
    'destination_videos' as cache_type,
    COUNT(*) as total_entries,
    COUNT(CASE WHEN is_valid THEN 1 END) as valid_entries,
    COUNT(CASE WHEN NOT is_valid THEN 1 END) as expired_entries,
    ROUND(AVG(EXTRACT(EPOCH FROM (NOW() - cached_at))/86400), 2) as avg_age_days
FROM cached_destination_videos

UNION ALL

SELECT 
    'price_history' as cache_type,
    COUNT(*) as total_entries,
    COUNT(CASE WHEN recorded_at > NOW() - INTERVAL '30 days' THEN 1 END) as recent_entries,
    COUNT(CASE WHEN recorded_at <= NOW() - INTERVAL '30 days' THEN 1 END) as old_entries,
    ROUND(AVG(EXTRACT(EPOCH FROM (NOW() - recorded_at))/86400), 2) as avg_age_days
FROM price_history;

COMMENT ON TABLE cached_flight_offers IS 'Cached Amadeus flight offers to reduce API calls and improve response times';
COMMENT ON TABLE cached_destination_videos IS 'Cached YouTube videos for destinations and activities to reduce API quota usage';
COMMENT ON TABLE airport_facilities IS 'Enhanced airport facility information for better user experience';
COMMENT ON TABLE price_history IS 'Historical price data for trend analysis and price predictions';

-- Grant permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO spontra_app;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO spontra_app;

SELECT 'Cache tables created successfully! 🚀' as status;
