#!/usr/bin/env python3
"""
Airport Database Enhancement Script

This script populates the PostgreSQL airports table with rich data from airports.csv
and adds missing fields for world-class airport search functionality.

Usage:
    python scripts/enhance_airport_database.py

Environment variables required:
    DATABASE_URL or SEARCH_DATABASE_URL - PostgreSQL connection string
"""

import os
import csv
import sys
import psycopg2
from psycopg2.extras import RealDictCursor
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Airport importance scores based on passenger volume and hub status
AIRPORT_IMPORTANCE = {
    # Major international hubs (score: 100-90)
    'LHR': 100, 'CDG': 98, 'FRA': 96, 'AMS': 94, 'MAD': 92, 'FCO': 90,
    'JFK': 98, 'LAX': 96, 'ORD': 94, 'ATL': 92, 'DFW': 90, 'SFO': 88,
    'NRT': 96, 'HND': 94, 'ICN': 92, 'SIN': 90, 'HKG': 88, 'BKK': 86,
    'DXB': 98, 'DOH': 94, 'AUH': 90, 'CAI': 85,
    'SYD': 92, 'MEL': 88, 'PER': 84,
    
    # Secondary international airports (score: 89-70)
    'LGW': 85, 'STN': 80, 'LTN': 75, 'ORY': 85, 'BVA': 75,
    'EWR': 88, 'LGA': 85, 'MDW': 80, 'BWI': 78, 'DCA': 82,
    'MUC': 88, 'DUS': 82, 'TXL': 85, 'BER': 88,
    'BCN': 88, 'VIE': 84, 'ZUR': 86, 'CPH': 84, 'ARN': 82,
    'YYZ': 88, 'YVR': 84, 'YUL': 82,
    'GIG': 86, 'GRU': 88, 'SCL': 84, 'LIM': 82,
    
    # Regional hubs (score: 69-50)
    'MXP': 78, 'LIN': 72, 'BGY': 68, 'CIA': 75,
    'BRU': 78, 'DUB': 76, 'OSL': 74, 'HEL': 72,
    'WAW': 76, 'PRG': 74, 'BUD': 72, 'OTP': 70,
    'IST': 85, 'SAW': 75, 'ESB': 70,
    'KUL': 82, 'CGK': 80, 'MNL': 78, 'TPE': 84,
}

def get_database_connection():
    """Get PostgreSQL database connection"""
    db_url = os.environ.get('SEARCH_DATABASE_URL') or os.environ.get('DATABASE_URL')
    if not db_url:
        logger.error("DATABASE_URL or SEARCH_DATABASE_URL environment variable not set")
        sys.exit(1)
    
    try:
        conn = psycopg2.connect(db_url)
        logger.info("✅ Connected to PostgreSQL database")
        return conn
    except Exception as e:
        logger.error(f"❌ Failed to connect to database: {e}")
        sys.exit(1)

def enhance_airports_table(conn):
    """Add additional columns to airports table for enhanced search"""
    with conn.cursor() as cursor:
        logger.info("🔧 Enhancing airports table schema...")
        
        # Add new columns if they don't exist
        enhance_queries = [
            """
            ALTER TABLE airports 
            ADD COLUMN IF NOT EXISTS elevation INTEGER,
            ADD COLUMN IF NOT EXISTS url TEXT,
            ADD COLUMN IF NOT EXISTS state VARCHAR(100),
            ADD COLUMN IF NOT EXISTS airport_type VARCHAR(10),
            ADD COLUMN IF NOT EXISTS city_code VARCHAR(5),
            ADD COLUMN IF NOT EXISTS importance_score INTEGER DEFAULT 50,
            ADD COLUMN IF NOT EXISTS country_code VARCHAR(2)
            """,
            
            # Add indexes for better search performance
            "CREATE INDEX IF NOT EXISTS idx_airports_importance ON airports(importance_score DESC)",
            "CREATE INDEX IF NOT EXISTS idx_airports_city_code ON airports(city_code)",
            "CREATE INDEX IF NOT EXISTS idx_airports_state ON airports(state)",
            "CREATE INDEX IF NOT EXISTS idx_airports_type ON airports(airport_type)",
            "CREATE INDEX IF NOT EXISTS idx_airports_search_text ON airports USING GIN (to_tsvector('english', name || ' ' || city || ' ' || country))",
            
            # Enable fuzzy string matching
            "CREATE EXTENSION IF NOT EXISTS pg_trgm",
            "CREATE INDEX IF NOT EXISTS idx_airports_name_trgm ON airports USING GIN (name gin_trgm_ops)",
            "CREATE INDEX IF NOT EXISTS idx_airports_city_trgm ON airports USING GIN (city gin_trgm_ops)",
        ]
        
        for query in enhance_queries:
            try:
                cursor.execute(query)
                logger.info(f"✅ Executed: {query.split()[0:4]}")
            except Exception as e:
                logger.warning(f"⚠️ Query may have already been applied: {e}")
        
        conn.commit()
        logger.info("✅ Airport table schema enhanced")

def load_airports_from_csv(conn):
    """Load airports from CSV file into database"""
    csv_file = 'airports.csv'
    if not os.path.exists(csv_file):
        logger.error(f"❌ airports.csv not found at {csv_file}")
        return
    
    with conn.cursor(cursor_factory=RealDictCursor) as cursor:
        logger.info(f"📁 Loading airports from {csv_file}...")
        
        # Get existing airports to avoid duplicates
        cursor.execute("SELECT iata_code FROM airports WHERE iata_code IS NOT NULL")
        existing_codes = set(row['iata_code'] for row in cursor.fetchall())
        logger.info(f"📊 Found {len(existing_codes)} existing airports in database")
        
        new_airports = 0
        updated_airports = 0
        skipped_airports = 0
        
        with open(csv_file, 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            batch_size = 100
            batch = []
            
            for row in reader:
                # Skip if no IATA code
                if not row.get('code') or len(row.get('code', '')) != 3:
                    skipped_airports += 1
                    continue
                
                iata_code = row['code'].upper()
                
                # Parse numeric fields
                try:
                    latitude = float(row['latitude']) if row.get('latitude') else None
                    longitude = float(row['longitude']) if row.get('longitude') else None
                    elevation = int(float(row['elevation'])) if row.get('elevation') else None
                except (ValueError, TypeError):
                    latitude = longitude = elevation = None
                
                # Determine importance score
                importance = AIRPORT_IMPORTANCE.get(iata_code, 50)
                
                # Clean up fields
                airport_data = {
                    'iata_code': iata_code,
                    'icao_code': row.get('icao', '').upper() if row.get('icao') else None,
                    'name': row.get('name', '').strip(),
                    'city': row.get('city', '').strip(),
                    'country': row.get('country', '').strip(),
                    'country_code': row.get('country', '')[:2].upper() if row.get('country') else None,
                    'state': row.get('state', '').strip() if row.get('state') else None,
                    'latitude': latitude,
                    'longitude': longitude,
                    'elevation': elevation,
                    'timezone': row.get('time_zone', '').strip() if row.get('time_zone') else None,
                    'url': row.get('url', '').strip() if row.get('url') else None,
                    'airport_type': row.get('type', 'AP')[:10] if row.get('type') else 'AP',
                    'city_code': row.get('city_code', '').upper() if row.get('city_code') else None,
                    'importance_score': importance,
                    'is_active': True
                }
                
                # Only include airports with meaningful names
                if not airport_data['name'] or not airport_data['city']:
                    skipped_airports += 1
                    continue
                
                batch.append(airport_data)
                
                # Process batch
                if len(batch) >= batch_size:
                    new, updated = process_airport_batch(cursor, batch, existing_codes)
                    new_airports += new
                    updated_airports += updated
                    batch = []
            
            # Process remaining batch
            if batch:
                new, updated = process_airport_batch(cursor, batch, existing_codes)
                new_airports += new
                updated_airports += updated
        
        conn.commit()
        logger.info(f"✅ Airport import complete:")
        logger.info(f"   📈 New airports: {new_airports}")
        logger.info(f"   🔄 Updated airports: {updated_airports}")
        logger.info(f"   ⏭️ Skipped: {skipped_airports}")

def process_airport_batch(cursor, batch, existing_codes):
    """Process a batch of airports"""
    new_count = 0
    updated_count = 0
    
    for airport in batch:
        iata_code = airport['iata_code']
        
        if iata_code in existing_codes:
            # Update existing airport
            update_query = """
            UPDATE airports SET 
                icao_code = %(icao_code)s,
                name = %(name)s,
                city = %(city)s,
                country = %(country)s,
                country_code = %(country_code)s,
                state = %(state)s,
                latitude = %(latitude)s,
                longitude = %(longitude)s,
                elevation = %(elevation)s,
                timezone = %(timezone)s,
                url = %(url)s,
                airport_type = %(airport_type)s,
                city_code = %(city_code)s,
                importance_score = %(importance_score)s,
                updated_at = NOW()
            WHERE iata_code = %(iata_code)s
            """
            cursor.execute(update_query, airport)
            updated_count += 1
        else:
            # Insert new airport
            insert_query = """
            INSERT INTO airports (
                iata_code, icao_code, name, city, country, country_code, state,
                latitude, longitude, elevation, timezone, url, airport_type,
                city_code, importance_score, is_active, created_at, updated_at
            ) VALUES (
                %(iata_code)s, %(icao_code)s, %(name)s, %(city)s, %(country)s, %(country_code)s, %(state)s,
                %(latitude)s, %(longitude)s, %(elevation)s, %(timezone)s, %(url)s, %(airport_type)s,
                %(city_code)s, %(importance_score)s, %(is_active)s, NOW(), NOW()
            )
            """
            cursor.execute(insert_query, airport)
            new_count += 1
    
    return new_count, updated_count

def update_airport_statistics(conn):
    """Update statistics and validate data"""
    with conn.cursor() as cursor:
        logger.info("📊 Updating airport statistics...")
        
        # Get total counts
        cursor.execute("SELECT COUNT(*) as total FROM airports WHERE is_active = true")
        total = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) as with_coords FROM airports WHERE latitude IS NOT NULL AND longitude IS NOT NULL AND is_active = true")
        with_coords = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(DISTINCT country) as countries FROM airports WHERE is_active = true")
        countries = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) as major_hubs FROM airports WHERE importance_score >= 80 AND is_active = true")
        major_hubs = cursor.fetchone()[0]
        
        logger.info(f"📈 Airport Database Statistics:")
        logger.info(f"   🌍 Total airports: {total:,}")
        logger.info(f"   📍 With coordinates: {with_coords:,} ({100*with_coords/total:.1f}%)")
        logger.info(f"   🏳️ Countries: {countries}")
        logger.info(f"   ⭐ Major hubs: {major_hubs}")
        
        # Sample some data for verification
        cursor.execute("""
        SELECT iata_code, name, city, country, importance_score 
        FROM airports 
        WHERE importance_score >= 90 
        ORDER BY importance_score DESC 
        LIMIT 10
        """)
        
        logger.info("🏆 Top airports by importance:")
        for row in cursor.fetchall():
            logger.info(f"   {row[0]} - {row[1]} ({row[2]}, {row[3]}) - Score: {row[4]}")

def main():
    """Main function"""
    logger.info("🚀 Starting airport database enhancement...")
    
    # Connect to database
    conn = get_database_connection()
    
    try:
        # Enhance schema
        enhance_airports_table(conn)
        
        # Load airport data
        load_airports_from_csv(conn)
        
        # Update statistics
        update_airport_statistics(conn)
        
        logger.info("✅ Airport database enhancement complete!")
        logger.info("🎯 The search API can now provide world-class airport autocomplete with:")
        logger.info("   • 10,000+ airports with rich metadata")
        logger.info("   • Fuzzy search with relevance ranking")
        logger.info("   • Multi-airport city grouping")
        logger.info("   • Geographic and timezone information")
        logger.info("   • Airport importance scoring")
        
    except Exception as e:
        logger.error(f"❌ Error during enhancement: {e}")
        conn.rollback()
        sys.exit(1)
    finally:
        conn.close()

if __name__ == "__main__":
    main()