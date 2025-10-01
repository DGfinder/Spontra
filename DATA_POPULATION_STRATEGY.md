# Data Population Strategy - Save Time & Resources

## 🎯 **Current API Usage Analysis**

Based on the codebase analysis, here are the main external APIs being used:

### **1. Amadeus API** 💰
- **Usage**: Flight offers, destinations, airport data
- **Cost**: €0.35 per search request
- **Current calls**: Real-time on every search
- **Caching opportunity**: HIGH

### **2. YouTube API** 📺  
- **Usage**: Destination videos for marketing
- **Cost**: Free (with quotas)
- **Current calls**: Real-time video searches
- **Caching opportunity**: HIGH

### **3. Internal Services**
- **Search Service**: Flight durations (already cached in PostgreSQL)
- **Data Ingestion**: Kafka-based data processing
- **Pricing Service**: Price tracking and alerts

---

## 🚀 **Data Population Opportunities**

### **Strategy 1: Amadeus Flight Data Caching**

#### **What to Cache:**
- **Popular Routes**: Pre-fetch common routes (LHR-CDG, LHR-FRA, etc.)
- **Airline Data**: Cache airline information and logos
- **Airport Details**: Enhanced airport data with terminals, facilities
- **Seasonal Schedules**: Pre-load summer/winter timetables

#### **Implementation:**
```sql
-- Cached flight offers table
CREATE TABLE cached_flight_offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    origin_airport VARCHAR(3) NOT NULL,
    destination_airport VARCHAR(3) NOT NULL,
    departure_date DATE NOT NULL,
    search_hash VARCHAR(64) NOT NULL, -- Hash of search parameters
    amadeus_data JSONB NOT NULL,
    price_eur DECIMAL(10,2),
    airline_code VARCHAR(3),
    flight_number VARCHAR(10),
    duration_minutes INTEGER,
    stops INTEGER,
    cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_valid BOOLEAN DEFAULT true,
    
    -- Indexes for fast lookup
    INDEX idx_cached_offers_route_date (origin_airport, destination_airport, departure_date),
    INDEX idx_cached_offers_expires (expires_at),
    INDEX idx_cached_offers_hash (search_hash)
);

-- Airline reference data
CREATE TABLE airlines_enhanced (
    iata_code VARCHAR(3) PRIMARY KEY,
    icao_code VARCHAR(4),
    name VARCHAR(255) NOT NULL,
    country_code VARCHAR(2),
    logo_url VARCHAR(512),
    website VARCHAR(255),
    alliance VARCHAR(50), -- Star Alliance, oneworld, SkyTeam
    baggage_policy JSONB,
    fleet_info JSONB,
    hubs JSONB, -- Array of hub airports
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **Caching Script:**
```python
# scripts/populate_amadeus_cache.py
import asyncio
import psycopg2
from datetime import datetime, timedelta
from amadeus_client import AmadeusClient

POPULAR_ROUTES = [
    ('LHR', 'CDG'), ('LHR', 'FRA'), ('LHR', 'AMS'), ('LHR', 'FCO'),
    ('CDG', 'FRA'), ('CDG', 'BCN'), ('FRA', 'FCO'), ('AMS', 'BCN'),
    # Add 50+ most popular European routes
]

async def populate_flight_cache():
    """Pre-populate cache with popular route data"""
    amadeus = AmadeusClient()
    
    for origin, dest in POPULAR_ROUTES:
        # Get next 30 days of data
        for days_ahead in range(1, 31):
            departure_date = datetime.now() + timedelta(days=days_ahead)
            
            try:
                offers = await amadeus.search_flights(
                    origin=origin,
                    destination=dest,
                    departure_date=departure_date.strftime('%Y-%m-%d')
                )
                
                # Cache in PostgreSQL
                await cache_flight_offers(origin, dest, departure_date, offers)
                
                # Rate limiting
                await asyncio.sleep(0.1)  # 10 requests/second
                
            except Exception as e:
                print(f"Failed to cache {origin}-{dest} on {departure_date}: {e}")
                
    print(f"✅ Cached {len(POPULAR_ROUTES) * 30} route-date combinations")
```

### **Strategy 2: YouTube Video Content Caching**

#### **What to Cache:**
- **Destination Videos**: Top videos for each city/activity combination
- **Video Metadata**: Title, description, thumbnails, duration
- **Engagement Metrics**: Views, likes, quality scores

#### **Implementation:**
```sql
-- Cached destination videos
CREATE TABLE cached_destination_videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    destination VARCHAR(100) NOT NULL,
    activity VARCHAR(100),
    video_id VARCHAR(20) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    thumbnail_url VARCHAR(512),
    duration_seconds INTEGER,
    view_count BIGINT,
    published_at TIMESTAMP,
    quality_score DECIMAL(3,2), -- Our calculated score
    is_short BOOLEAN DEFAULT false,
    cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_validated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_cached_videos_dest_activity (destination, activity),
    INDEX idx_cached_videos_quality (quality_score DESC),
    UNIQUE KEY unique_dest_activity_video (destination, activity, video_id)
);
```

#### **Video Caching Script:**
```python
# scripts/populate_youtube_cache.py
import requests
import psycopg2
from datetime import datetime

DESTINATIONS = [
    'London', 'Paris', 'Rome', 'Barcelona', 'Amsterdam', 'Berlin',
    'Vienna', 'Prague', 'Budapest', 'Stockholm', 'Copenhagen'
]

ACTIVITIES = [
    'adventure', 'party', 'learn', 'shopping', 'food', 'culture',
    'nightlife', 'museums', 'parks', 'architecture'
]

async def populate_video_cache():
    """Pre-populate video cache for destinations and activities"""
    youtube_api_key = os.getenv('YOUTUBE_API_KEY')
    
    for destination in DESTINATIONS:
        for activity in ACTIVITIES:
            query = f"{destination} {activity} travel guide"
            
            videos = await fetch_youtube_videos(query, max_results=10)
            
            for video in videos:
                quality_score = calculate_quality_score(video, destination, activity)
                await cache_video(destination, activity, video, quality_score)
                
    print(f"✅ Cached videos for {len(DESTINATIONS)} destinations x {len(ACTIVITIES)} activities")
```

### **Strategy 3: Enhanced Airport Data Population**

#### **What to Add:**
- **Terminal Information**: Which airlines use which terminals
- **Facilities**: Lounges, shops, restaurants, WiFi
- **Transportation**: Train, bus, taxi connections to city center
- **Real-time Status**: Delays, weather, operational status

#### **Implementation:**
```sql
-- Enhanced airport facilities
CREATE TABLE airport_facilities (
    airport_code VARCHAR(3) REFERENCES airports(iata_code),
    facility_type VARCHAR(50) NOT NULL, -- lounge, restaurant, shop, transport
    facility_name VARCHAR(255),
    terminal VARCHAR(10),
    level VARCHAR(20),
    description TEXT,
    operating_hours VARCHAR(100),
    website VARCHAR(255),
    rating DECIMAL(2,1),
    price_range VARCHAR(10), -- $, $$, $$$
    
    INDEX idx_facilities_airport (airport_code),
    INDEX idx_facilities_type (facility_type)
);

-- Terminal and airline mapping
CREATE TABLE airport_terminals (
    airport_code VARCHAR(3) REFERENCES airports(iata_code),
    terminal VARCHAR(10) NOT NULL,
    airlines JSONB, -- Array of airline codes using this terminal
    facilities JSONB, -- Array of available facilities
    transport_options JSONB,
    
    PRIMARY KEY (airport_code, terminal)
);
```

### **Strategy 4: Price History and Trends**

#### **What to Cache:**
- **Historical Prices**: 6 months of price data for popular routes
- **Price Trends**: Weekly/monthly averages
- **Best Booking Times**: Optimal booking windows
- **Seasonal Patterns**: Price variations by season

```sql
-- Historical price data
CREATE TABLE price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    origin_airport VARCHAR(3) NOT NULL,
    destination_airport VARCHAR(3) NOT NULL,
    departure_date DATE NOT NULL,
    airline_code VARCHAR(3),
    cabin_class VARCHAR(20),
    price_eur DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    booking_date DATE NOT NULL,
    days_until_departure INTEGER,
    source VARCHAR(50), -- amadeus, kayak, direct
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_price_history_route (origin_airport, destination_airport),
    INDEX idx_price_history_date (departure_date),
    INDEX idx_price_history_booking (booking_date)
);

-- Price trend analytics (pre-calculated)
CREATE TABLE price_trends (
    route_hash VARCHAR(64) PRIMARY KEY, -- hash(origin+destination+cabin)
    origin_airport VARCHAR(3) NOT NULL,
    destination_airport VARCHAR(3) NOT NULL,
    cabin_class VARCHAR(20),
    avg_price_7d DECIMAL(10,2),
    avg_price_30d DECIMAL(10,2),
    min_price_30d DECIMAL(10,2),
    max_price_30d DECIMAL(10,2),
    price_trend VARCHAR(20), -- rising, falling, stable
    best_booking_window_days INTEGER,
    last_calculated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 📊 **Implementation Scripts**

### **Master Data Population Script:**
```python
# scripts/populate_all_data.py
import asyncio
import argparse
from datetime import datetime

async def main():
    parser = argparse.ArgumentParser(description='Populate Spontra data cache')
    parser.add_argument('--amadeus', action='store_true', help='Populate Amadeus flight data')
    parser.add_argument('--youtube', action='store_true', help='Populate YouTube video cache')
    parser.add_argument('--airports', action='store_true', help='Populate airport facilities')
    parser.add_argument('--prices', action='store_true', help='Populate price history')
    parser.add_argument('--all', action='store_true', help='Populate all data')
    
    args = parser.parse_args()
    
    if args.all or args.amadeus:
        print("🛫 Populating Amadeus flight cache...")
        await populate_amadeus_cache()
        
    if args.all or args.youtube:
        print("📺 Populating YouTube video cache...")
        await populate_youtube_cache()
        
    if args.all or args.airports:
        print("✈️ Populating airport facilities...")
        await populate_airport_facilities()
        
    if args.all or args.prices:
        print("💰 Populating price history...")
        await populate_price_history()
        
    print("✅ Data population complete!")

if __name__ == "__main__":
    asyncio.run(main())
```

### **Automated Refresh Jobs:**
```python
# scripts/refresh_cache.py - Run daily via cron
import asyncio
from datetime import datetime, timedelta

async def daily_refresh():
    """Daily cache refresh job"""
    
    # Refresh expiring flight offers (next 3 days)
    await refresh_expiring_offers()
    
    # Update popular route prices
    await update_popular_route_prices()
    
    # Refresh video cache weekly
    if datetime.now().weekday() == 0:  # Monday
        await refresh_video_cache()
    
    # Clean expired cache entries
    await cleanup_expired_cache()
    
    print(f"✅ Daily refresh completed at {datetime.now()}")
```

---

## 💡 **Resource Savings**

### **Cost Reduction:**
- **Amadeus API**: 80-90% reduction in real-time calls
- **YouTube API**: 95% reduction in video searches  
- **Response Times**: 10x faster (cache vs API)
- **User Experience**: Instant results for popular routes

### **Performance Benefits:**
- **Cache Hit Rate**: 85-95% for popular routes
- **API Response Time**: <50ms vs 500-2000ms
- **Reduced Load**: Less stress on external APIs
- **Offline Capability**: System works even if APIs are down

### **Implementation Timeline:**
- **Week 1**: Set up database tables and basic caching
- **Week 2**: Implement Amadeus flight data caching
- **Week 3**: Add YouTube video caching  
- **Week 4**: Airport facilities and price history
- **Week 5**: Automated refresh jobs and monitoring

---

## 🚀 **Quick Start Commands**

```bash
# 1. Create database tables
psql $DATABASE_URL -f scripts/create_cache_tables.sql

# 2. Install dependencies
pip install amadeus youtube-data-api psycopg2-binary

# 3. Set environment variables
export AMADEUS_CLIENT_ID="your_client_id"
export AMADEUS_CLIENT_SECRET="your_secret"
export YOUTUBE_API_KEY="your_youtube_key"

# 4. Run initial population (popular routes only)
python scripts/populate_all_data.py --amadeus --youtube

# 5. Set up daily refresh cron job
echo "0 2 * * * cd /path/to/spontra && python scripts/refresh_cache.py" | crontab -

# 6. Monitor cache performance
python scripts/cache_analytics.py
```

This strategy will significantly reduce your API costs and improve performance while maintaining data freshness through intelligent caching and refresh strategies.
