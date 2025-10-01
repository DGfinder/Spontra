#!/usr/bin/env python3
"""
Core Search Workflow Cache Population
Focuses on theme-destination combinations using existing flight data
"""

import os
import psycopg2
import json
import hashlib
from datetime import datetime, timedelta

def calculate_theme_score(city: str, theme: str) -> float:
    """Calculate theme score for a city based on characteristics"""
    theme_scores = {
        'adventure': {
            'Barcelona': 9.1, 'Prague': 8.7, 'Budapest': 8.5, 'Berlin': 8.3,
            'Rome': 8.0, 'Amsterdam': 7.8, 'Vienna': 7.5, 'Paris': 7.2,
            'London': 8.5, 'Madrid': 7.8, 'Munich': 7.6, 'Stockholm': 8.0
        },
        'party': {
            'Barcelona': 9.5, 'Berlin': 9.3, 'London': 9.2, 'Amsterdam': 9.0,
            'Paris': 8.8, 'Prague': 8.2, 'Madrid': 8.5, 'Rome': 7.5,
            'Vienna': 7.0, 'Munich': 7.8, 'Stockholm': 7.2, 'Copenhagen': 8.0
        },
        'culture': {
            'Rome': 9.9, 'Paris': 9.8, 'London': 9.5, 'Prague': 9.2,
            'Vienna': 9.0, 'Amsterdam': 8.9, 'Barcelona': 8.7, 'Berlin': 8.5,
            'Madrid': 8.8, 'Munich': 8.2, 'Stockholm': 8.0, 'Budapest': 8.8
        },
        'shopping': {
            'Paris': 9.6, 'London': 9.3, 'Milan': 9.0, 'Barcelona': 8.2,
            'Berlin': 8.0, 'Amsterdam': 7.5, 'Madrid': 8.0, 'Rome': 7.8,
            'Vienna': 7.5, 'Munich': 7.8, 'Stockholm': 7.0, 'Copenhagen': 7.2
        },
        'learn': {
            'Rome': 9.5, 'Paris': 9.2, 'London': 9.0, 'Prague': 8.9,
            'Vienna': 8.8, 'Berlin': 8.8, 'Amsterdam': 8.5, 'Barcelona': 8.0,
            'Madrid': 8.2, 'Munich': 8.5, 'Stockholm': 8.3, 'Budapest': 8.6
        }
    }
    
    return theme_scores.get(theme, {}).get(city, 7.0)  # Default score 7.0

def populate_theme_destination_cache():
    """Populate core theme-destination combinations using existing flight data"""
    
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("❌ DATABASE_URL environment variable not set")
        return
    
    # Core themes and origins
    themes = ['adventure', 'party', 'learn', 'shopping', 'culture']
    origins = ['LHR', 'CDG', 'FRA', 'AMS', 'FCO', 'MAD', 'BCN']
    
    # Flight time ranges that users commonly search
    flight_time_ranges = [
        (0, 120),    # 0-2 hours (short haul)
        (120, 240),  # 2-4 hours (medium haul)
        (240, 360),  # 4-6 hours (long haul)
        (0, 360),    # 0-6 hours (all destinations)
    ]
    
    conn = psycopg2.connect(database_url)
    
    try:
        with conn.cursor() as cursor:
            # First, create the cache table if it doesn't exist
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS cached_theme_destinations (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    origin_airport VARCHAR(3) NOT NULL,
                    theme VARCHAR(50) NOT NULL,
                    min_flight_time INTEGER DEFAULT 0,
                    max_flight_time INTEGER DEFAULT 1440,
                    destinations JSONB NOT NULL,
                    destination_count INTEGER NOT NULL,
                    cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
                    search_hash VARCHAR(64) NOT NULL UNIQUE
                );
            """)
            
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_theme_destinations_search 
                ON cached_theme_destinations(origin_airport, theme, min_flight_time, max_flight_time);
            """)
            
            total_cached = 0
            
            for origin in origins:
                print(f"\n🛫 Processing origin: {origin}")
                
                for theme in themes:
                    for min_time, max_time in flight_time_ranges:
                        # Get destinations from existing flight_durations data
                        cursor.execute("""
                            SELECT 
                                fd.destination_airport,
                                a.name,
                                a.city,
                                a.country,
                                a.country_code,
                                fd.duration_minutes,
                                fd.distance_km,
                                fd.is_direct,
                                fd.typical_stops
                            FROM flight_durations fd
                            JOIN airports a ON a.iata_code = fd.destination_airport
                            WHERE fd.origin_airport = %s 
                            AND fd.duration_minutes BETWEEN %s AND %s
                            AND a.is_active = true
                            ORDER BY fd.duration_minutes
                            LIMIT 20
                        """, (origin, min_time, max_time))
                        
                        destinations_data = cursor.fetchall()
                        
                        if destinations_data:
                            # Transform to expected API format
                            destinations = []
                            for dest in destinations_data:
                                airport_code, name, city, country, country_code, duration, distance, is_direct, stops = dest
                                
                                # Calculate theme score for this city
                                theme_score = calculate_theme_score(city, theme)
                                
                                destinations.append({
                                    "destination": {
                                        "airport_code": airport_code,
                                        "city_name": city,
                                        "country_name": country,
                                        "country_code": country_code,
                                        "name": name
                                    },
                                    "flight_route": {
                                        "total_duration_minutes": duration,
                                        "distance_km": distance,
                                        "is_direct": is_direct,
                                        "typical_stops": stops
                                    },
                                    "theme_scores": {
                                        theme: theme_score
                                    },
                                    "overall_score": theme_score,
                                    "highlights": [
                                        f"Direct flight in {duration} minutes" if is_direct else f"{duration} minutes with {stops} stop(s)",
                                        f"Perfect for {theme} activities"
                                    ]
                                })
                            
                            # Generate cache key
                            search_params = f"{origin}-{theme}-{min_time}-{max_time}"
                            search_hash = hashlib.md5(search_params.encode()).hexdigest()
                            
                            # Cache for 24 hours
                            expires_at = datetime.now() + timedelta(hours=24)
                            
                            # Insert cache entry
                            cursor.execute("""
                                INSERT INTO cached_theme_destinations (
                                    origin_airport, theme, min_flight_time, max_flight_time,
                                    destinations, destination_count, search_hash, expires_at
                                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                                ON CONFLICT (search_hash) DO UPDATE SET
                                    destinations = EXCLUDED.destinations,
                                    destination_count = EXCLUDED.destination_count,
                                    cached_at = NOW(),
                                    expires_at = EXCLUDED.expires_at
                            """, (
                                origin, theme, min_time, max_time,
                                json.dumps(destinations), len(destinations),
                                search_hash, expires_at
                            ))
                            
                            total_cached += 1
                            print(f"  ✅ {theme} ({min_time}-{max_time}min): {len(destinations)} destinations")
            
            conn.commit()
            print(f"\n🎉 Core cache population complete!")
            print(f"   Total cache entries: {total_cached}")
            print(f"   Coverage: {len(origins)} origins × {len(themes)} themes × {len(flight_time_ranges)} time ranges")
            
            # Show cache statistics
            cursor.execute("""
                SELECT 
                    origin_airport,
                    theme,
                    SUM(destination_count) as total_destinations,
                    COUNT(*) as cache_entries
                FROM cached_theme_destinations
                GROUP BY origin_airport, theme
                ORDER BY origin_airport, theme
            """)
            
            print(f"\n📊 Cache Statistics:")
            for row in cursor.fetchall():
                print(f"   {row[0]} - {row[1]}: {row[2]} destinations ({row[3]} cache entries)")
            
    except Exception as e:
        conn.rollback()
        print(f"❌ Failed to populate cache: {e}")
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    populate_theme_destination_cache()
