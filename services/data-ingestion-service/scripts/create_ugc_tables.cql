-- Spontra UGC (User Generated Content) Database Schema
-- Execute these commands in Cassandra to create the UGC tables

-- Keyspace (if not already created)
-- CREATE KEYSPACE IF NOT EXISTS spontra WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1};
-- USE spontra;

-- User Generated Content table
CREATE TABLE IF NOT EXISTS user_generated_content (
    id UUID PRIMARY KEY,
    user_id UUID,
    activity_id TEXT,
    destination_code TEXT,
    video_url TEXT,
    thumbnail_url TEXT,
    title TEXT,
    description TEXT,
    duration INT, -- in seconds
    gps_location FROZEN<gps_coordinates>,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    
    -- Moderation and quality fields
    moderation_status TEXT, -- pending, approved, rejected
    quality_score DOUBLE,
    view_count BIGINT,
    like_count BIGINT,
    booking_count BIGINT, -- Bookings generated from this video
    
    -- Content validation
    is_verified BOOLEAN,
    verification_data FROZEN<verification_data>,
    
    -- Creator reward tracking
    earnings_generated DOUBLE,
    reward_points INT
);

-- Secondary indexes for searching
CREATE INDEX IF NOT EXISTS ON user_generated_content (activity_id);
CREATE INDEX IF NOT EXISTS ON user_generated_content (destination_code);
CREATE INDEX IF NOT EXISTS ON user_generated_content (user_id);
CREATE INDEX IF NOT EXISTS ON user_generated_content (moderation_status);
CREATE INDEX IF NOT EXISTS ON user_generated_content (quality_score);

-- UDT for GPS coordinates
CREATE TYPE IF NOT EXISTS gps_coordinates (
    latitude DOUBLE,
    longitude DOUBLE,
    accuracy DOUBLE, -- in meters
    timestamp TIMESTAMP
);

-- UDT for verification data
CREATE TYPE IF NOT EXISTS verification_data (
    device_id TEXT,
    ip_address TEXT,
    metadata MAP<TEXT, TEXT>,
    booking_ref_id TEXT -- Link to actual booking
);

-- Spontra Creators table
CREATE TABLE IF NOT EXISTS spontra_creators (
    user_id UUID PRIMARY KEY,
    email TEXT,
    username TEXT,
    full_name TEXT,
    profile_picture TEXT,
    created_at TIMESTAMP,
    last_active_at TIMESTAMP,
    
    -- Creator program status
    creator_tier TEXT, -- explorer, contributor, ambassador, creator
    total_uploads INT,
    total_views BIGINT,
    total_bookings BIGINT,
    total_earnings DOUBLE,
    reward_points INT,
    
    -- Achievements and badges
    achievements LIST<TEXT>,
    countries_visited LIST<TEXT>,
    activities_created LIST<TEXT>,
    
    -- Account settings
    is_verified BOOLEAN,
    is_active BOOLEAN,
    notification_prefs MAP<TEXT, BOOLEAN>
);

-- Secondary indexes for creators
CREATE INDEX IF NOT EXISTS ON spontra_creators (email);
CREATE INDEX IF NOT EXISTS ON spontra_creators (username);
CREATE INDEX IF NOT EXISTS ON spontra_creators (creator_tier);

-- Content Moderation table
CREATE TABLE IF NOT EXISTS content_moderation (
    id UUID PRIMARY KEY,
    content_id UUID,
    moderator_id UUID,
    reviewed_at TIMESTAMP,
    decision TEXT, -- approved, rejected, needs_review
    reason_code TEXT,
    notes TEXT,
    quality_score DOUBLE,
    auto_flags LIST<TEXT> -- AI-detected issues
);

-- Secondary indexes for moderation
CREATE INDEX IF NOT EXISTS ON content_moderation (content_id);
CREATE INDEX IF NOT EXISTS ON content_moderation (moderator_id);
CREATE INDEX IF NOT EXISTS ON content_moderation (decision);

-- Reward Transactions table
CREATE TABLE IF NOT EXISTS reward_transactions (
    id UUID PRIMARY KEY,
    user_id UUID,
    content_id UUID, -- null for non-content rewards
    transaction_type TEXT, -- earn, spend, bonus
    points_amount INT,
    euro_amount DOUBLE,
    description TEXT,
    reference_id TEXT, -- booking ID, achievement ID, etc.
    created_at TIMESTAMP,
    processed_at TIMESTAMP,
    status TEXT -- pending, processed, failed
);

-- Secondary indexes for transactions
CREATE INDEX IF NOT EXISTS ON reward_transactions (user_id);
CREATE INDEX IF NOT EXISTS ON reward_transactions (content_id);
CREATE INDEX IF NOT EXISTS ON reward_transactions (transaction_type);
CREATE INDEX IF NOT EXISTS ON reward_transactions (status);

-- Creator Analytics table (time-series data)
CREATE TABLE IF NOT EXISTS creator_analytics (
    user_id UUID,
    period TEXT, -- daily, weekly, monthly
    period_start TIMESTAMP,
    period_end TIMESTAMP,
    
    -- Performance metrics
    video_uploads INT,
    total_views BIGINT,
    unique_viewers BIGINT,
    engagement_rate DOUBLE,
    bookings_generated BIGINT,
    revenue_generated DOUBLE,
    
    -- Top performing content
    top_video_id UUID,
    top_destination TEXT,
    top_activity TEXT,
    
    created_at TIMESTAMP,
    
    PRIMARY KEY (user_id, period, period_start)
) WITH CLUSTERING ORDER BY (period ASC, period_start DESC);

-- Content by Activity table (for fast lookups)
CREATE TABLE IF NOT EXISTS content_by_activity (
    activity_id TEXT,
    destination_code TEXT,
    quality_score DOUBLE,
    created_at TIMESTAMP,
    content_id UUID,
    user_id UUID,
    title TEXT,
    thumbnail_url TEXT,
    video_url TEXT,
    view_count BIGINT,
    booking_count BIGINT,
    
    PRIMARY KEY ((activity_id, destination_code), quality_score, created_at, content_id)
) WITH CLUSTERING ORDER BY (quality_score DESC, created_at DESC);

-- Creator leaderboard table (for gamification)
CREATE TABLE IF NOT EXISTS creator_leaderboard (
    leaderboard_type TEXT, -- weekly, monthly, all_time
    period_start TIMESTAMP,
    rank INT,
    user_id UUID,
    username TEXT,
    metric_value BIGINT, -- views, bookings, earnings
    creator_tier TEXT,
    
    PRIMARY KEY ((leaderboard_type, period_start), rank)
) WITH CLUSTERING ORDER BY (rank ASC);

-- Bookings generated by content (for revenue tracking)
CREATE TABLE IF NOT EXISTS content_bookings (
    content_id UUID,
    booking_id UUID,
    booking_date TIMESTAMP,
    booking_value DOUBLE,
    creator_commission DOUBLE,
    commission_paid BOOLEAN,
    
    PRIMARY KEY (content_id, booking_date, booking_id)
) WITH CLUSTERING ORDER BY (booking_date DESC);

-- Content views tracking (for analytics)
CREATE TABLE IF NOT EXISTS content_views (
    content_id UUID,
    view_date DATE,
    hour INT,
    viewer_id UUID,
    view_duration INT, -- seconds watched
    conversion_action TEXT, -- none, like, share, book
    
    PRIMARY KEY ((content_id, view_date), hour, viewer_id)
) WITH CLUSTERING ORDER BY (hour ASC);

-- Achievement definitions table
CREATE TABLE IF NOT EXISTS achievements (
    achievement_id TEXT PRIMARY KEY,
    name TEXT,
    description TEXT,
    icon_url TEXT,
    reward_points INT,
    reward_euro DOUBLE,
    criteria MAP<TEXT, TEXT>, -- flexible criteria storage
    is_active BOOLEAN,
    created_at TIMESTAMP
);

-- User achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
    user_id UUID,
    achievement_id TEXT,
    earned_at TIMESTAMP,
    reward_claimed BOOLEAN,
    
    PRIMARY KEY (user_id, achievement_id)
);

-- Insert some initial achievement definitions
INSERT INTO achievements (achievement_id, name, description, icon_url, reward_points, reward_euro, criteria, is_active, created_at) VALUES 
('first_upload', 'First Steps', 'Upload your first travel video', '/achievements/first-upload.png', 10, 1.0, {'uploads': '1'}, true, toTimestamp(now()));

INSERT INTO achievements (achievement_id, name, description, icon_url, reward_points, reward_euro, criteria, is_active, created_at) VALUES 
('globe_trotter', 'Globe Trotter', 'Share videos from 5 different countries', '/achievements/globe-trotter.png', 50, 10.0, {'countries': '5'}, true, toTimestamp(now()));

INSERT INTO achievements (achievement_id, name, description, icon_url, reward_points, reward_euro, criteria, is_active, created_at) VALUES 
('activity_expert', 'Activity Expert', 'Upload 10 videos of the same activity type', '/achievements/activity-expert.png', 75, 15.0, {'same_activity': '10'}, true, toTimestamp(now()));

INSERT INTO achievements (achievement_id, name, description, icon_url, reward_points, reward_euro, criteria, is_active, created_at) VALUES 
('conversion_king', 'Conversion King', 'Generate 50 bookings from your content', '/achievements/conversion-king.png', 200, 50.0, {'bookings': '50'}, true, toTimestamp(now()));

-- Create materialized views for faster queries
CREATE MATERIALIZED VIEW IF NOT EXISTS content_by_user AS
    SELECT user_id, created_at, content_id, activity_id, destination_code, title, moderation_status, quality_score
    FROM user_generated_content
    WHERE user_id IS NOT NULL AND created_at IS NOT NULL AND content_id IS NOT NULL
    PRIMARY KEY (user_id, created_at, content_id)
    WITH CLUSTERING ORDER BY (created_at DESC);

CREATE MATERIALIZED VIEW IF NOT EXISTS approved_content_by_destination AS
    SELECT destination_code, quality_score, created_at, content_id, activity_id, title, thumbnail_url, view_count
    FROM user_generated_content
    WHERE destination_code IS NOT NULL AND moderation_status IS NOT NULL AND quality_score IS NOT NULL 
          AND created_at IS NOT NULL AND content_id IS NOT NULL AND moderation_status = 'approved'
    PRIMARY KEY (destination_code, quality_score, created_at, content_id)
    WITH CLUSTERING ORDER BY (quality_score DESC, created_at DESC);