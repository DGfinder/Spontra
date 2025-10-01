# Scheduled Flights Schema Design

## Overview

This document outlines the enhanced database schema for transitioning from estimated flight durations to real scheduled flight data with multiple daily departures, airline information, and seasonal variations.

## Current State vs. Target State

### Current Schema (Estimated Durations)
```sql
CREATE TABLE flight_durations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    origin_airport VARCHAR(3) NOT NULL,
    destination_airport VARCHAR(3) NOT NULL,
    duration_minutes INTEGER NOT NULL,
    distance_km INTEGER NOT NULL,
    is_direct BOOLEAN NOT NULL DEFAULT true,
    typical_stops INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Limitations:**
- Single duration estimate per route
- No actual flight schedules
- No airline information
- No seasonal variations
- No real departure/arrival times

### Enhanced Schema (Scheduled Flights)

## 1. Airlines Reference Table
```sql
CREATE TABLE airlines (
    iata_code VARCHAR(3) PRIMARY KEY,
    icao_code VARCHAR(4) UNIQUE,
    name VARCHAR(255) NOT NULL,
    country_code VARCHAR(2),
    alliance VARCHAR(50), -- Star Alliance, oneworld, SkyTeam
    logo_url VARCHAR(512),
    website VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sample data
INSERT INTO airlines (iata_code, icao_code, name, country_code, alliance) VALUES
('BA', 'BAW', 'British Airways', 'GB', 'oneworld'),
('AF', 'AFR', 'Air France', 'FR', 'SkyTeam'),
('LH', 'DLH', 'Lufthansa', 'DE', 'Star Alliance'),
('FR', 'RYR', 'Ryanair', 'IE', null);
```

## 2. Aircraft Types Reference Table
```sql
CREATE TABLE aircraft_types (
    iata_code VARCHAR(3) PRIMARY KEY,
    icao_code VARCHAR(4) UNIQUE,
    manufacturer VARCHAR(100),
    model VARCHAR(100),
    variant VARCHAR(50),
    seats_economy INTEGER,
    seats_business INTEGER,
    seats_first INTEGER,
    range_km INTEGER,
    cruise_speed_kmh INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sample data
INSERT INTO aircraft_types (iata_code, icao_code, manufacturer, model, seats_economy, range_km, cruise_speed_kmh) VALUES
('320', 'A320', 'Airbus', 'A320', 150, 6150, 828),
('321', 'A321', 'Airbus', 'A321', 185, 7400, 828),
('737', 'B737', 'Boeing', '737-800', 162, 5765, 842),
('777', 'B777', 'Boeing', '777-300ER', 396, 14685, 892);
```

## 3. Core Scheduled Flights Table
```sql
CREATE TABLE scheduled_flights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Flight Identity
    flight_number VARCHAR(10) NOT NULL, -- e.g., 'BA123', 'AF456'
    airline_iata VARCHAR(3) NOT NULL REFERENCES airlines(iata_code),
    
    -- Route Information
    origin_airport VARCHAR(3) NOT NULL,
    destination_airport VARCHAR(3) NOT NULL,
    
    -- Schedule Information
    departure_time TIME NOT NULL, -- Local time at origin
    arrival_time TIME NOT NULL,   -- Local time at destination
    duration_minutes INTEGER NOT NULL,
    
    -- Aircraft and Service
    aircraft_type VARCHAR(3) REFERENCES aircraft_types(iata_code),
    service_type VARCHAR(20) DEFAULT 'passenger', -- passenger, cargo, charter
    
    -- Schedule Validity
    effective_from DATE NOT NULL,
    effective_until DATE NOT NULL,
    days_of_operation INTEGER[] NOT NULL, -- [1,2,3,4,5] = Mon-Fri, [7] = Sunday only
    
    -- Flight Characteristics
    is_direct BOOLEAN DEFAULT true,
    stops INTEGER DEFAULT 0,
    stop_airports VARCHAR(3)[], -- ['FRA'] for connections
    
    -- Operational Data
    distance_km INTEGER,
    timezone_offset_origin INTEGER, -- Hours from UTC
    timezone_offset_destination INTEGER,
    
    -- Data Source and Quality
    data_source VARCHAR(50) NOT NULL, -- 'amadeus', 'sabre', 'manual'
    confidence_score DECIMAL(3,2) DEFAULT 1.0, -- 0.0-1.0 data quality score
    last_verified TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_days CHECK (array_length(days_of_operation, 1) > 0),
    CONSTRAINT valid_dates CHECK (effective_until >= effective_from),
    CONSTRAINT valid_duration CHECK (duration_minutes > 0),
    CONSTRAINT valid_confidence CHECK (confidence_score >= 0.0 AND confidence_score <= 1.0)
);
```

## 4. Seasonal Schedule Variations
```sql
CREATE TABLE schedule_seasons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL, -- 'Summer 2025', 'Winter 2024-25'
    iata_season_code VARCHAR(10), -- 'S25', 'W24'
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Link flights to seasons
ALTER TABLE scheduled_flights ADD COLUMN season_id UUID REFERENCES schedule_seasons(id);
```

## 5. Flight Pricing History (Optional)
```sql
CREATE TABLE flight_pricing_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scheduled_flight_id UUID NOT NULL REFERENCES scheduled_flights(id),
    
    -- Pricing Information
    price_economy DECIMAL(10,2),
    price_business DECIMAL(10,2),
    price_first DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'EUR',
    
    -- Booking Information
    booking_class VARCHAR(10), -- 'Y', 'M', 'B', 'F'
    availability_economy INTEGER,
    availability_business INTEGER,
    availability_first INTEGER,
    
    -- Context
    booking_date DATE NOT NULL,
    departure_date DATE NOT NULL,
    days_until_departure INTEGER,
    provider VARCHAR(50), -- 'amadeus', 'kayak', 'expedia'
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 6. Optimized Indexes
```sql
-- Core search indexes
CREATE INDEX idx_scheduled_flights_route_time 
ON scheduled_flights(origin_airport, destination_airport, departure_time);

CREATE INDEX idx_scheduled_flights_airline_route 
ON scheduled_flights(airline_iata, origin_airport, destination_airport);

CREATE INDEX idx_scheduled_flights_validity 
ON scheduled_flights(effective_from, effective_until) 
WHERE effective_until >= CURRENT_DATE;

CREATE INDEX idx_scheduled_flights_days_operation 
ON scheduled_flights USING GIN(days_of_operation);

-- Performance indexes
CREATE INDEX idx_scheduled_flights_duration 
ON scheduled_flights(origin_airport, duration_minutes) 
WHERE is_direct = true;

CREATE INDEX idx_scheduled_flights_direct 
ON scheduled_flights(origin_airport, destination_airport) 
WHERE is_direct = true;
```

## Migration Strategy

### Phase 1: Parallel Tables
1. Create new tables alongside existing `flight_durations`
2. Populate with initial scheduled data
3. Update API endpoints to use both sources
4. Frontend displays "estimated" vs "scheduled" times

### Phase 2: Data Population
```sql
-- Populate airlines from existing data
INSERT INTO airlines (iata_code, name, country_code)
SELECT DISTINCT 
    substring(flight_number from '^([A-Z]{2})') as iata_code,
    'Unknown Airline' as name,
    'XX' as country_code
FROM scheduled_flights 
WHERE flight_number IS NOT NULL;

-- Create sample scheduled flights from existing estimates
INSERT INTO scheduled_flights (
    flight_number, airline_iata, origin_airport, destination_airport,
    departure_time, arrival_time, duration_minutes, effective_from, effective_until,
    days_of_operation, is_direct, stops, data_source
)
SELECT 
    'XX' || LPAD((ROW_NUMBER() OVER())::text, 3, '0') as flight_number,
    'XX' as airline_iata,
    origin_airport,
    destination_airport,
    '08:00'::time as departure_time,
    ('08:00'::time + (duration_minutes || ' minutes')::interval) as arrival_time,
    duration_minutes,
    CURRENT_DATE as effective_from,
    CURRENT_DATE + INTERVAL '1 year' as effective_until,
    ARRAY[1,2,3,4,5,6,7] as days_of_operation, -- Daily
    is_direct,
    typical_stops,
    'estimated' as data_source
FROM flight_durations;
```

### Phase 3: API Integration
- Integrate with Amadeus/Sabre APIs
- Replace estimated data with real schedules
- Add multiple daily flights per route
- Implement seasonal schedule updates

### Phase 4: Full Transition
- Remove `flight_durations` table
- Update all API endpoints
- Add advanced search features (by airline, time of day, etc.)

## API Endpoint Changes

### Current Endpoints (Keep for backward compatibility)
- `GET /api/v1/durations/route?origin=LHR&destination=CDG`
- `GET /api/v1/durations/origin/LHR`

### New Scheduled Flight Endpoints
```
GET /api/v1/flights/schedule?origin=LHR&destination=CDG&date=2025-09-20
GET /api/v1/flights/schedule?origin=LHR&departure_time_from=08:00&departure_time_to=12:00
GET /api/v1/flights/airlines?origin=LHR&destination=CDG
GET /api/v1/flights/aircraft-types?airline=BA
GET /api/v1/flights/seasonal?season=S25
```

## Benefits of Enhanced Schema

1. **Real Schedule Data**: Actual departure/arrival times instead of estimates
2. **Multiple Daily Flights**: 5-20 flights per route instead of single estimate
3. **Airline Information**: Brand recognition, alliances, service quality
4. **Seasonal Accuracy**: Summer/winter schedule variations
5. **Aircraft Details**: Seat maps, amenities, aircraft age
6. **Historical Pricing**: Price trends and availability patterns
7. **Advanced Search**: Filter by airline, time, aircraft type
8. **Better UX**: Real booking options with actual flight numbers

## Data Volume Estimates

- **Current**: 3,080 route estimates
- **Enhanced**: ~50,000-100,000 scheduled flights
- **Daily Updates**: ~5,000-10,000 schedule changes
- **Storage**: ~50MB for flight schedules, ~500MB with pricing history

This schema provides a solid foundation for transitioning to real scheduled flight data while maintaining backward compatibility and enabling advanced search features.
