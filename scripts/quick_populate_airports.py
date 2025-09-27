#!/usr/bin/env python3
"""
Quick Airport Population Script
Populates just the European airports we need for flight routes.
"""

import os
import psycopg2
import csv
from datetime import datetime
import uuid

# Airports we need for flight routes
REQUIRED_AIRPORTS = {
    'LHR', 'LGW', 'CDG', 'ORY', 'NCE', 'AMS', 'FRA', 'MUC', 'BER',
    'MAD', 'BCN', 'VIE', 'ZUR', 'GVA', 'FCO', 'MXP', 'ATH', 'LIS', 'OPO', 'DUB'
}

def populate_airports():
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("❌ DATABASE_URL environment variable not set")
        return False

    # Read the airports.csv file
    airports_file = '/mnt/c/Users/Hayde/OneDrive/Desktop/Spontra/Spontra/airports.csv'
    
    try:
        airports_to_insert = []
        
        with open(airports_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                if row['code'] in REQUIRED_AIRPORTS:
                    airports_to_insert.append(row)
        
        print(f"📍 Found {len(airports_to_insert)} required airports in CSV file")
        
        # Connect to database and insert airports
        conn = psycopg2.connect(database_url)
        cur = conn.cursor()
        
        # Clear existing airports (optional)
        cur.execute("DELETE FROM airports WHERE iata_code = ANY(%s)", (list(REQUIRED_AIRPORTS),))
        print("🗑️ Cleared existing required airports")
        
        inserted = 0
        now = datetime.now()
        
        for airport in airports_to_insert:
            try:
                cur.execute("""
                    INSERT INTO airports (
                        iata_code, icao_code, name, city, country, 
                        latitude, longitude, timezone, is_active, 
                        created_at, updated_at
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (iata_code) DO UPDATE SET
                        icao_code = EXCLUDED.icao_code,
                        name = EXCLUDED.name,
                        city = EXCLUDED.city,
                        country = EXCLUDED.country,
                        latitude = EXCLUDED.latitude,
                        longitude = EXCLUDED.longitude,
                        timezone = EXCLUDED.timezone,
                        updated_at = EXCLUDED.updated_at
                """, (
                    airport['code'],
                    airport.get('icao', '') or None,
                    airport['name'],
                    airport['city'], 
                    airport['country'],
                    float(airport['latitude']) if airport['latitude'] else None,
                    float(airport['longitude']) if airport['longitude'] else None,
                    airport.get('time_zone') or None,
                    True,  # is_active
                    now,
                    now
                ))
                inserted += 1
                print(f"  ✅ {airport['code']}: {airport['name']} ({airport['city']}, {airport['country']})")
                
            except Exception as e:
                print(f"  ❌ Failed to insert {airport['code']}: {e}")
        
        conn.commit()
        print(f"\n✅ Successfully inserted {inserted} airports")
        
        # Verify the results
        cur.execute("SELECT COUNT(*) FROM airports WHERE iata_code = ANY(%s)", (list(REQUIRED_AIRPORTS),))
        count = cur.fetchone()[0]
        print(f"📊 Total required airports in database: {count}/{len(REQUIRED_AIRPORTS)}")
        
        cur.close()
        conn.close()
        
        return True
        
    except Exception as e:
        print(f"❌ Failed to populate airports: {e}")
        return False

if __name__ == "__main__":
    success = populate_airports()
    if success:
        print("\n🎉 Airport population completed!")
        print("✅ Ready to populate flight routes")
    else:
        print("\n💥 Airport population failed!")
        exit(1)