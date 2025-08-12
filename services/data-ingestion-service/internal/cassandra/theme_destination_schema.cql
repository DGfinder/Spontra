-- Theme-based Destination Database Schema for Cassandra
-- Designed to support the 100-city theme database with multi-theme scoring
-- Optimized for theme-based queries and destination recommendations

-- =============================================
-- KEYSPACE CREATION
-- =============================================

-- Create keyspace if not exists
CREATE KEYSPACE IF NOT EXISTS spontra_destinations 
WITH replication = {
    'class': 'SimpleStrategy',
    'replication_factor': 3
} AND durable_writes = true;

USE spontra_destinations;

-- =============================================
-- CORE DESTINATION TABLE
-- =============================================

-- Main destinations table with theme scores
CREATE TABLE IF NOT EXISTS destinations (
    -- Primary identifiers
    id UUID,
    iata_code TEXT,
    city_name TEXT,
    country_name TEXT,
    country_code TEXT,
    
    -- Theme scores (0-100 for each theme)
    theme_scores MAP<TEXT, INT>,  -- {'party': 85, 'adventure': 60, 'learn': 75, 'shopping': 65, 'beach': 90}
    
    -- Destination metadata
    highlights LIST<TEXT>,
    description TEXT,
    average_flight_time FLOAT,
    price_range TEXT,  -- 'budget', 'mid-range', 'luxury'
    best_months SET<TEXT>,  -- {'Apr', 'May', 'Jun', 'Sep', 'Oct'}
    
    -- Additional destination info
    image_url TEXT,
    popularity_score FLOAT,
    timezone TEXT,
    language SET<TEXT>,
    currency TEXT,
    visa_required BOOLEAN,
    
    -- Metadata
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    
    PRIMARY KEY (id)
) WITH comment = 'Main destinations table with multi-theme scoring';

-- Create index on IATA code for fast lookups
CREATE INDEX IF NOT EXISTS dest_iata_idx ON destinations (iata_code);

-- Create index on country for country-based queries
CREATE INDEX IF NOT EXISTS dest_country_idx ON destinations (country_code);

-- =============================================
-- THEME-OPTIMIZED QUERY TABLES
-- =============================================

-- Table optimized for theme-based destination queries
-- Allows fast retrieval of top destinations for each theme
CREATE TABLE IF NOT EXISTS destinations_by_theme (
    theme_name TEXT,           -- 'party', 'adventure', 'learn', 'shopping', 'beach'
    theme_score INT,           -- Score for this theme (0-100)
    destination_id UUID,       -- Reference to main destinations table
    iata_code TEXT,
    city_name TEXT,
    country_name TEXT,
    country_code TEXT,
    price_range TEXT,
    average_flight_time FLOAT,
    created_at TIMESTAMP,
    
    PRIMARY KEY (theme_name, theme_score, destination_id)
) WITH CLUSTERING ORDER BY (theme_score DESC, destination_id ASC)
AND comment = 'Theme-optimized table for fast theme-based queries';

-- =============================================
-- COUNTRY AGGREGATION TABLE
-- =============================================

-- Table for country-level destination aggregations
CREATE TABLE IF NOT EXISTS destinations_by_country (
    country_code TEXT,
    country_name TEXT,
    destination_id UUID,
    iata_code TEXT,
    city_name TEXT,
    theme_scores MAP<TEXT, INT>,
    price_range TEXT,
    average_flight_time FLOAT,
    popularity_score FLOAT,
    created_at TIMESTAMP,
    
    PRIMARY KEY (country_code, destination_id)
) WITH comment = 'Country-aggregated destinations for country-based queries';

-- =============================================
-- FLIGHT ROUTES TABLE (Enhanced)
-- =============================================

-- Flight routes table enhanced with theme context
CREATE TABLE IF NOT EXISTS flight_routes (
    id UUID,
    origin_airport_code TEXT,
    destination_airport_code TEXT,
    estimated_duration_hours INT,
    estimated_duration_minutes INT,
    total_duration_minutes INT,
    
    -- Theme context for the destination
    destination_theme_scores MAP<TEXT, INT>,
    destination_highlights LIST<TEXT>,
    
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    
    PRIMARY KEY (origin_airport_code, destination_airport_code)
) WITH comment = 'Flight routes with theme context';

-- Index for reverse route lookups
CREATE INDEX IF NOT EXISTS routes_dest_idx ON flight_routes (destination_airport_code);

-- =============================================
-- THEME DEFINITIONS TABLE
-- =============================================

-- Table to store theme definitions and metadata
CREATE TABLE IF NOT EXISTS theme_definitions (
    theme_key TEXT,
    theme_name TEXT,
    description TEXT,
    keywords SET<TEXT>,
    created_at TIMESTAMP,
    
    PRIMARY KEY (theme_key)
) WITH comment = 'Theme definitions and metadata';

-- Insert theme definitions
INSERT INTO theme_definitions (theme_key, theme_name, description, keywords, created_at) VALUES
('party', 'Social & Entertainment', 'Nightlife, bars, clubs, music festivals, food scenes, social dining experiences', {'nightlife', 'bars', 'clubs', 'restaurants', 'music', 'festivals', 'social'}, toTimestamp(now()));

INSERT INTO theme_definitions (theme_key, theme_name, description, keywords, created_at) VALUES
('adventure', 'Active & Outdoor', 'Hiking, extreme sports, nature activities, budget backpacking, outdoor wellness', {'hiking', 'sports', 'nature', 'outdoor', 'backpacking', 'adventure', 'mountains'}, toTimestamp(now()));

INSERT INTO theme_definitions (theme_key, theme_name, description, keywords, created_at) VALUES
('learn', 'Cultural & Creative', 'Museums, history, arts districts, creative scenes, digital nomad hubs, education', {'museums', 'history', 'culture', 'arts', 'creative', 'learning', 'architecture'}, toTimestamp(now()));

INSERT INTO theme_definitions (theme_key, theme_name, description, keywords, created_at) VALUES
('shopping', 'Luxury & Indulgent', 'Fashion, luxury shopping, spas, wellness experiences, romantic getaways, premium services', {'shopping', 'luxury', 'fashion', 'spas', 'wellness', 'romance', 'premium'}, toTimestamp(now()));

INSERT INTO theme_definitions (theme_key, theme_name, description, keywords, created_at) VALUES
('beach', 'Relaxation & Family', 'Coastal destinations, family activities, leisure travel, beach wellness, water sports', {'beach', 'coast', 'family', 'relaxation', 'water', 'leisure', 'islands'}, toTimestamp(now()));

-- =============================================
-- DESTINATION RECOMMENDATIONS CACHE
-- =============================================

-- Cache table for pre-computed destination recommendations
CREATE TABLE IF NOT EXISTS destination_recommendations_cache (
    cache_key TEXT,            -- e.g., "LHR_party_4h_20241201"
    origin_airport TEXT,
    theme_name TEXT,
    max_flight_hours INT,
    generation_date DATE,
    recommendations_json TEXT,  -- JSON array of recommendations
    expires_at TIMESTAMP,
    created_at TIMESTAMP,
    
    PRIMARY KEY (cache_key)
) WITH default_time_to_live = 86400  -- 24 hour TTL
AND comment = 'Cache for pre-computed theme-based recommendations';

-- =============================================
-- ANALYTICS TABLES
-- =============================================

-- Table for tracking theme popularity and usage analytics
CREATE TABLE IF NOT EXISTS theme_analytics (
    theme_name TEXT,
    date DATE,
    search_count COUNTER,
    destination_click_count COUNTER,
    
    PRIMARY KEY (theme_name, date)
) WITH comment = 'Analytics for theme usage and popularity';

-- Table for destination popularity analytics
CREATE TABLE IF NOT EXISTS destination_analytics (
    destination_id UUID,
    iata_code TEXT,
    date DATE,
    view_count COUNTER,
    search_count COUNTER,
    click_count COUNTER,
    
    PRIMARY KEY (destination_id, date)
) WITH comment = 'Analytics for destination popularity';

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Additional indexes for common query patterns
CREATE INDEX IF NOT EXISTS dest_price_range_idx ON destinations (price_range);
CREATE INDEX IF NOT EXISTS dest_flight_time_idx ON destinations (average_flight_time);
CREATE INDEX IF NOT EXISTS routes_duration_idx ON flight_routes (total_duration_minutes);

-- =============================================
-- MATERIALIZED VIEWS
-- =============================================

-- Materialized view for top destinations by theme score
CREATE MATERIALIZED VIEW IF NOT EXISTS top_destinations_by_theme AS
SELECT theme_name, theme_score, destination_id, iata_code, city_name, country_name, price_range
FROM destinations_by_theme
WHERE theme_name IS NOT NULL 
  AND theme_score IS NOT NULL 
  AND destination_id IS NOT NULL
PRIMARY KEY (theme_name, theme_score, destination_id)
WITH CLUSTERING ORDER BY (theme_score DESC);

-- Materialized view for destinations by price range
CREATE MATERIALIZED VIEW IF NOT EXISTS destinations_by_price_range AS
SELECT price_range, average_flight_time, destination_id, iata_code, city_name, country_name
FROM destinations
WHERE price_range IS NOT NULL 
  AND average_flight_time IS NOT NULL 
  AND id IS NOT NULL
PRIMARY KEY (price_range, average_flight_time, id)
WITH CLUSTERING ORDER BY (average_flight_time ASC);