-- Spontra Database Initialization Script

-- Create databases for different services
CREATE DATABASE user_service_db;
CREATE DATABASE search_service_db;

-- Connect to user_service_db
\c user_service_db;

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    date_of_birth DATE,
    phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false
);

-- User preferences
CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    preferred_currency VARCHAR(3) DEFAULT 'USD',
    preferred_language VARCHAR(5) DEFAULT 'en',
    default_departure_airport VARCHAR(3),
    newsletter_subscribed BOOLEAN DEFAULT false,
    price_alerts_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Price alerts
CREATE TABLE price_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    origin_airport VARCHAR(3) NOT NULL,
    destination_airport VARCHAR(3) NOT NULL,
    departure_date DATE NOT NULL,
    return_date DATE,
    max_price DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'USD',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Search history
CREATE TABLE search_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    origin_airport VARCHAR(3) NOT NULL,
    destination_airport VARCHAR(3) NOT NULL,
    departure_date DATE NOT NULL,
    return_date DATE,
    passengers INTEGER DEFAULT 1,
    search_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Connect to search_service_db
\c search_service_db;

-- Airports reference data
CREATE TABLE airports (
    iata_code VARCHAR(3) PRIMARY KEY,
    icao_code VARCHAR(4),
    name VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    timezone VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Airlines reference data
CREATE TABLE airlines (
    iata_code VARCHAR(2) PRIMARY KEY,
    icao_code VARCHAR(3),
    name VARCHAR(255) NOT NULL,
    country VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Aircraft types
CREATE TABLE aircraft_types (
    code VARCHAR(10) PRIMARY KEY,
    manufacturer VARCHAR(100),
    model VARCHAR(100),
    capacity INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Flight routes cache
CREATE TABLE flight_routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    origin_airport VARCHAR(3) REFERENCES airports(iata_code),
    destination_airport VARCHAR(3) REFERENCES airports(iata_code),
    airline_code VARCHAR(2) REFERENCES airlines(iata_code),
    flight_number VARCHAR(10),
    aircraft_type VARCHAR(10) REFERENCES aircraft_types(code),
    duration_minutes INTEGER,
    distance_km INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX idx_price_alerts_user_id ON price_alerts(user_id);
CREATE INDEX idx_price_alerts_route ON price_alerts(origin_airport, destination_airport);
CREATE INDEX idx_search_history_user_id ON search_history(user_id);
CREATE INDEX idx_search_history_timestamp ON search_history(search_timestamp);
CREATE INDEX idx_airports_city ON airports(city);
CREATE INDEX idx_airports_country ON airports(country);
CREATE INDEX idx_flight_routes_origin_dest ON flight_routes(origin_airport, destination_airport);
CREATE INDEX idx_flight_routes_airline ON flight_routes(airline_code);