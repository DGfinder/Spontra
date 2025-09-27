#!/usr/bin/env python3
"""
Correct Theme-Destination Cache Population
Uses the actual themes: vibe, adventure, discover, indulge, nature
Focuses on destination availability rather than theme scores
"""

import os
import psycopg2
import json
import hashlib
from datetime import datetime, timedelta

def get_destination_characteristics(city: str, country: str) -> dict:
    """Get destination characteristics without theme scoring"""
    
    # City characteristics for theme matching (not scores)
    city_characteristics = {
        'Barcelona': {
            'vibe': True,      # Great nightlife and city energy
            'adventure': True, # Outdoor activities, beaches
            'discover': True,  # Rich history and culture
            'indulge': True,   # Great food and shopping
            'nature': True     # Beaches and parks
        },
        'Paris': {
            'vibe': True,      # Iconic city atmosphere
            'adventure': False, # More urban than adventure
            'discover': True,  # Museums, history, art
            'indulge': True,   # Luxury shopping, fine dining
            'nature': False    # Limited nature activities
        },
        'Rome': {
            'vibe': True,      # Historic city energy
            'adventure': False, # More cultural than adventure
            'discover': True,  # Ancient history, archaeology
            'indulge': True,   # Italian cuisine, fashion
            'nature': False    # Urban destination
        },
        'London': {
            'vibe': True,      # Vibrant city life
            'adventure': False, # Urban destination
            'discover': True,  # Museums, history, culture
            'indulge': True,   # Shopping, dining, theater
            'nature': False    # Limited nature within city
        },
        'Amsterdam': {
            'vibe': True,      # Unique city culture
            'adventure': True, # Cycling, canals
            'discover': True,  # Museums, history
            'indulge': True,   # Cafes, shopping
            'nature': True     # Parks, canals, nearby countryside
        },
        'Berlin': {
            'vibe': True,      # Dynamic nightlife and culture
            'adventure': True, # Urban exploration, street art
            'discover': True,  # History, museums
            'indulge': False,  # More alternative than luxury
            'nature': True     # Parks, lakes
        },
        'Prague': {
            'vibe': True,      # Beautiful historic atmosphere
            'adventure': True, # Outdoor activities nearby
            'discover': True,  # Rich history and architecture
            'indulge': True,   # Good food and beer culture
            'nature': True     # Countryside access
        },
        'Vienna': {
            'vibe': True,      # Classical city atmosphere
            'adventure': False, # More cultural than adventure
            'discover': True,  # Imperial history, museums
            'indulge': True,   # Coffee culture, classical music
            'nature': True     # Parks, nearby Alps
        },
        'Budapest': {
            'vibe': True,      # Thermal baths, ruin bars
            'adventure': True, # Outdoor activities, Danube
            'discover': True,  # History, architecture
            'indulge': True,   # Spa culture, cuisine
            'nature': True     # River, hills, thermal springs
        },
        'Stockholm': {
            'vibe': True,      # Scandinavian design culture
            'adventure': True, # Archipelago, outdoor activities
            'discover': True,  # Museums, old town
            'indulge': True,   # Design, cuisine
            'nature': True     # Islands, forests, water
        }
    }
    
    # Default characteristics for cities not specifically defined
    default_characteristics = {
        'vibe': True,      # Most cities have some vibe
        'adventure': False, # Conservative default
        'discover': True,  # Most cities have discovery potential
        'indulge': False,  # Conservative default
        'nature': False    # Conservative default
    }
    
    return city_characteristics.get(city, default_characteristics)

def populate_theme_destination_cache():
    """Populate theme-destination cache with correct themes and no scoring"""
    
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("❌ DATABASE_URL environment variable not set")
        return
    
    # Correct themes from the codebase
    themes = ['vibe', 'adventure', 'discover', 'indulge', 'nature']
    origins = ['LHR', 'CDG', 'FRA', 'AMS', 'FCO', 'MAD', 'BCN']
    
    # Flight time ranges for different search patterns
    flight_time_ranges = [
        (0, 120),    # 0-2 hours (short haul)
        (120, 240),  # 2-4 hours (medium haul)
        (240, 360),  # 4-6 hours (long haul)
        (0, 360),    # 0-6 hours (all destinations)
    ]
    
    conn = psycopg2.connect(database_url)
    
    try:
        with conn.cursor() as cursor:
            # Clear existing cache with old themes
            cursor.execute("DELETE FROM cached_theme_destinations")
            
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
                            # Filter destinations that match the theme
                            destinations = []
                            for dest in destinations_data:
                                airport_code, name, city, country, country_code, duration, distance, is_direct, stops = dest
                                
                                # Check if this destination fits the theme
                                characteristics = get_destination_characteristics(city, country)
                                
                                if characteristics.get(theme, False):
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
                                        "theme_match": theme,
                                        "characteristics": characteristics,
                                        "highlights": [
                                            f"Direct flight in {duration} minutes" if is_direct else f"{duration} minutes with {stops} stop(s)",
                                            f"Great for {theme} experiences"
                                        ]
                                    })
                            
                            if destinations:  # Only cache if we have matching destinations
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
                                print(f"  ✅ {theme} ({min_time}-{max_time}min): {len(destinations)} matching destinations")
                            else:
                                print(f"  ⚪ {theme} ({min_time}-{max_time}min): No matching destinations")
            
            conn.commit()
            print(f"\n🎉 Correct theme cache population complete!")
            print(f"   Total cache entries: {total_cached}")
            print(f"   Themes: {', '.join(themes)}")
            
            # Show cache statistics by theme
            cursor.execute("""
                SELECT 
                    theme,
                    COUNT(*) as cache_entries,
                    SUM(destination_count) as total_destinations
                FROM cached_theme_destinations
                GROUP BY theme
                ORDER BY theme
            """)
            
            print(f"\n📊 Cache by Theme:")
            for row in cursor.fetchall():
                print(f"   {row[0].capitalize()}: {row[2]} destinations ({row[1]} cache entries)")
            
    except Exception as e:
        conn.rollback()
        print(f"❌ Failed to populate cache: {e}")
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    populate_theme_destination_cache()
