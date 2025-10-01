#!/usr/bin/env python3
"""
Create Destinations from Airports with Flight Data
Populates the destinations_enhanced table with airports that have flight routes
"""

import os
import psycopg2
import json

def get_default_themes_for_city(city: str, country: str) -> dict:
    """Get default theme associations for cities"""
    
    # City-specific theme associations
    city_themes = {
        'London': {'vibe': True, 'adventure': False, 'discover': True, 'indulge': True, 'nature': False},
        'Paris': {'vibe': True, 'adventure': False, 'discover': True, 'indulge': True, 'nature': False},
        'Rome': {'vibe': True, 'adventure': False, 'discover': True, 'indulge': True, 'nature': False},
        'Barcelona': {'vibe': True, 'adventure': True, 'discover': True, 'indulge': True, 'nature': True},
        'Amsterdam': {'vibe': True, 'adventure': True, 'discover': True, 'indulge': True, 'nature': True},
        'Berlin': {'vibe': True, 'adventure': True, 'discover': True, 'indulge': False, 'nature': True},
        'Prague': {'vibe': True, 'adventure': True, 'discover': True, 'indulge': True, 'nature': True},
        'Vienna': {'vibe': True, 'adventure': False, 'discover': True, 'indulge': True, 'nature': True},
        'Budapest': {'vibe': True, 'adventure': True, 'discover': True, 'indulge': True, 'nature': True},
        'Stockholm': {'vibe': True, 'adventure': True, 'discover': True, 'indulge': True, 'nature': True},
        'Copenhagen': {'vibe': True, 'adventure': True, 'discover': True, 'indulge': True, 'nature': True},
        'Oslo': {'vibe': False, 'adventure': True, 'discover': True, 'indulge': False, 'nature': True},
        'Helsinki': {'vibe': False, 'adventure': True, 'discover': True, 'indulge': False, 'nature': True},
        'Warsaw': {'vibe': True, 'adventure': False, 'discover': True, 'indulge': False, 'nature': False},
        'Lisbon': {'vibe': True, 'adventure': True, 'discover': True, 'indulge': True, 'nature': True},
        'Madrid': {'vibe': True, 'adventure': False, 'discover': True, 'indulge': True, 'nature': False},
        'Milan': {'vibe': True, 'adventure': False, 'discover': True, 'indulge': True, 'nature': False},
        'Venice': {'vibe': True, 'adventure': False, 'discover': True, 'indulge': True, 'nature': False},
        'Florence': {'vibe': True, 'adventure': False, 'discover': True, 'indulge': True, 'nature': False},
        'Athens': {'vibe': True, 'adventure': True, 'discover': True, 'indulge': False, 'nature': True},
        'Istanbul': {'vibe': True, 'adventure': False, 'discover': True, 'indulge': True, 'nature': False},
        'Zurich': {'vibe': False, 'adventure': True, 'discover': True, 'indulge': True, 'nature': True},
        'Geneva': {'vibe': False, 'adventure': True, 'discover': True, 'indulge': True, 'nature': True},
        'Brussels': {'vibe': True, 'adventure': False, 'discover': True, 'indulge': True, 'nature': False},
        'Dublin': {'vibe': True, 'adventure': True, 'discover': True, 'indulge': True, 'nature': True},
        'Edinburgh': {'vibe': True, 'adventure': True, 'discover': True, 'indulge': False, 'nature': True},
        'Manchester': {'vibe': True, 'adventure': False, 'discover': True, 'indulge': False, 'nature': False},
    }
    
    # Default for unlisted cities
    default_themes = {'vibe': True, 'adventure': False, 'discover': True, 'indulge': False, 'nature': False}
    
    return city_themes.get(city, default_themes)

def get_default_activities(city: str, themes: dict) -> dict:
    """Get default activities for each theme"""
    
    activities = {
        'vibe': [],
        'adventure': [],
        'discover': [],
        'indulge': [],
        'nature': []
    }
    
    if themes.get('vibe'):
        activities['vibe'] = ['nightlife', 'local bars', 'street art', 'live music', 'city walks']
    
    if themes.get('adventure'):
        activities['adventure'] = ['hiking', 'cycling', 'outdoor sports', 'climbing', 'water activities']
    
    if themes.get('discover'):
        activities['discover'] = ['museums', 'historical sites', 'guided tours', 'cultural events', 'architecture']
    
    if themes.get('indulge'):
        activities['indulge'] = ['fine dining', 'luxury shopping', 'spas', 'wine tasting', 'premium experiences']
    
    if themes.get('nature'):
        activities['nature'] = ['parks', 'gardens', 'beaches', 'nature walks', 'wildlife viewing']
    
    return activities

def get_default_highlights(city: str) -> list:
    """Get default highlights for major cities"""
    
    city_highlights = {
        'London': ['Big Ben', 'Tower Bridge', 'British Museum', 'Hyde Park'],
        'Paris': ['Eiffel Tower', 'Louvre Museum', 'Notre-Dame', 'Champs-Élysées'],
        'Rome': ['Colosseum', 'Vatican City', 'Trevi Fountain', 'Roman Forum'],
        'Barcelona': ['Sagrada Familia', 'Park Güell', 'Las Ramblas', 'Gothic Quarter'],
        'Amsterdam': ['Anne Frank House', 'Van Gogh Museum', 'Jordaan District', 'Canal Ring'],
        'Berlin': ['Brandenburg Gate', 'Museum Island', 'East Side Gallery', 'Reichstag'],
        'Prague': ['Prague Castle', 'Charles Bridge', 'Old Town Square', 'Astronomical Clock'],
        'Vienna': ['Schönbrunn Palace', 'St. Stephen\'s Cathedral', 'Belvedere Palace', 'Naschmarkt'],
        'Budapest': ['Parliament Building', 'Fisherman\'s Bastion', 'Széchenyi Thermal Baths', 'Danube River'],
        'Stockholm': ['Gamla Stan', 'Vasa Museum', 'ABBA Museum', 'Royal Palace'],
    }
    
    return city_highlights.get(city, [f'{city} City Center', f'{city} Historic District'])

def create_destinations_from_airports():
    """Create destination records from airports with flight data"""
    
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("❌ DATABASE_URL environment variable not set")
        return
    
    conn = psycopg2.connect(database_url)
    
    try:
        with conn.cursor() as cursor:
            # Create the destinations_enhanced table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS destinations_enhanced (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    airport_code VARCHAR(3) NOT NULL UNIQUE,
                    city_name VARCHAR(255),
                    country_name VARCHAR(255),
                    country_code VARCHAR(2),
                    
                    -- Theme associations (boolean flags)
                    themes JSONB DEFAULT '{}',
                    
                    -- Content
                    description TEXT,
                    highlights JSONB DEFAULT '[]',
                    activities JSONB DEFAULT '{}',
                    videos JSONB DEFAULT '{}',
                    
                    -- Media
                    hero_image VARCHAR(512),
                    
                    -- Status
                    is_featured BOOLEAN DEFAULT false,
                    is_active BOOLEAN DEFAULT true,
                    
                    -- Metadata
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            """)
            
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_destinations_enhanced_airport 
                ON destinations_enhanced(airport_code);
            """)
            
            # Get all airports that have flight data
            cursor.execute("""
                SELECT DISTINCT
                    a.iata_code,
                    a.name,
                    a.city,
                    a.country,
                    a.country_code,
                    a.is_active
                FROM airports a
                WHERE EXISTS (
                    SELECT 1 FROM flight_durations fd 
                    WHERE fd.destination_airport = a.iata_code
                )
                AND a.is_active = true
                ORDER BY a.city
            """)
            
            airports_data = cursor.fetchall()
            
            destinations_created = 0
            
            for airport in airports_data:
                airport_code, name, city, country, country_code, is_active = airport
                
                # Get theme associations for this city
                themes = get_default_themes_for_city(city, country)
                activities = get_default_activities(city, themes)
                highlights = get_default_highlights(city)
                
                # Create basic description
                description = f"{city} is a vibrant destination in {country}, accessible via {airport_code} airport. "
                active_themes = [theme for theme, active in themes.items() if active]
                if active_themes:
                    description += f"Perfect for {', '.join(active_themes)} experiences."
                
                # Insert or update destination
                cursor.execute("""
                    INSERT INTO destinations_enhanced (
                        airport_code, city_name, country_name, country_code,
                        themes, description, highlights, activities, videos
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (airport_code) DO UPDATE SET
                        city_name = EXCLUDED.city_name,
                        country_name = EXCLUDED.country_name,
                        country_code = EXCLUDED.country_code,
                        themes = EXCLUDED.themes,
                        description = EXCLUDED.description,
                        highlights = EXCLUDED.highlights,
                        activities = EXCLUDED.activities,
                        videos = EXCLUDED.videos,
                        updated_at = NOW()
                """, (
                    airport_code,
                    city,
                    country,
                    country_code,
                    json.dumps(themes),
                    description,
                    json.dumps(highlights),
                    json.dumps(activities),
                    json.dumps({'vibe': [], 'adventure': [], 'discover': [], 'indulge': [], 'nature': []})
                ))
                
                destinations_created += 1
                print(f"✅ Created destination: {city} ({airport_code}) - Themes: {', '.join([t for t, active in themes.items() if active])}")
            
            conn.commit()
            
            print(f"\n🎉 Destinations creation complete!")
            print(f"   Created/updated: {destinations_created} destinations")
            print(f"   All destinations have flight route data")
            
            # Show summary by theme
            cursor.execute("""
                SELECT 
                    COUNT(*) as total_destinations,
                    COUNT(CASE WHEN (themes->>'vibe')::boolean = true THEN 1 END) as vibe_count,
                    COUNT(CASE WHEN (themes->>'adventure')::boolean = true THEN 1 END) as adventure_count,
                    COUNT(CASE WHEN (themes->>'discover')::boolean = true THEN 1 END) as discover_count,
                    COUNT(CASE WHEN (themes->>'indulge')::boolean = true THEN 1 END) as indulge_count,
                    COUNT(CASE WHEN (themes->>'nature')::boolean = true THEN 1 END) as nature_count
                FROM destinations_enhanced
            """)
            
            stats = cursor.fetchone()
            print(f"\n📊 Theme Distribution:")
            print(f"   Total destinations: {stats[0]}")
            print(f"   Vibe: {stats[1]} destinations")
            print(f"   Adventure: {stats[2]} destinations")
            print(f"   Discover: {stats[3]} destinations")
            print(f"   Indulge: {stats[4]} destinations")
            print(f"   Nature: {stats[5]} destinations")
            
    except Exception as e:
        conn.rollback()
        print(f"❌ Failed to create destinations: {e}")
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    create_destinations_from_airports()
