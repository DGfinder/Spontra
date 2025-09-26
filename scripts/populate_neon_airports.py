#!/usr/bin/env python3
"""
Neon Airport Database Population Script
Migrates airport data from CSV to Neon PostgreSQL with proper schema and indexing.
"""
import os
import csv
import psycopg2
from urllib.parse import urlparse
import sys

def main():
    # Get DATABASE_URL
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        print("❌ DATABASE_URL not found in environment variables")
        print("Please set DATABASE_URL with your Neon connection string")
        sys.exit(1)

    print("🔗 Connecting to Neon database...")
    
    # Parse connection string
    try:
        url = urlparse(database_url)
        conn = psycopg2.connect(
            host=url.hostname,
            port=url.port,
            database=url.path[1:],
            user=url.username,
            password=url.password,
            sslmode='require'
        )
        print("✅ Connected to Neon database successfully")
    except Exception as e:
        print(f"❌ Failed to connect to database: {e}")
        sys.exit(1)

    try:
        with conn.cursor() as cur:
            # Create airports table with proper schema
            print("📋 Creating airports table schema...")
            cur.execute("""
                CREATE TABLE IF NOT EXISTS airports (
                    iata_code VARCHAR(3) PRIMARY KEY,
                    icao_code VARCHAR(4),
                    name VARCHAR(255) NOT NULL,
                    city VARCHAR(100) NOT NULL,
                    country VARCHAR(100) NOT NULL,
                    latitude DECIMAL(10,8),
                    longitude DECIMAL(11,8),
                    timezone VARCHAR(50),
                    elevation INTEGER,
                    url TEXT,
                    state VARCHAR(100),
                    airport_type VARCHAR(10),
                    city_code VARCHAR(5),
                    county VARCHAR(100),
                    is_active BOOLEAN DEFAULT true,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            """)

            # Create search performance indexes
            print("📊 Creating search indexes...")
            
            # Regular indexes for fast pattern matching
            cur.execute("CREATE INDEX IF NOT EXISTS idx_airports_iata_lower ON airports(LOWER(iata_code));")
            cur.execute("CREATE INDEX IF NOT EXISTS idx_airports_icao_lower ON airports(LOWER(icao_code));")
            cur.execute("CREATE INDEX IF NOT EXISTS idx_airports_name_lower ON airports(LOWER(name));")
            cur.execute("CREATE INDEX IF NOT EXISTS idx_airports_city_lower ON airports(LOWER(city));")
            cur.execute("CREATE INDEX IF NOT EXISTS idx_airports_country ON airports(country);")
            cur.execute("CREATE INDEX IF NOT EXISTS idx_airports_active ON airports(is_active) WHERE is_active = true;")
            cur.execute("CREATE INDEX IF NOT EXISTS idx_airports_search_combined ON airports(city, name, country) WHERE is_active = true;")
            
            # Composite index for search performance
            cur.execute("CREATE INDEX IF NOT EXISTS idx_airports_search_priority ON airports(is_active, iata_code, city, name) WHERE is_active = true;")
            
            conn.commit()
            print("✅ Database schema and indexes created successfully")

            # Load airport data from CSV using optimized batch processing
            csv_path = '/mnt/c/Users/Hayde/OneDrive/Desktop/Spontra/Spontra/frontend/airports.csv'
            if not os.path.exists(csv_path):
                # Try alternative path
                csv_path = '/mnt/c/Users/Hayde/OneDrive/Desktop/Spontra/Spontra/airports.csv'
            
            if not os.path.exists(csv_path):
                print(f"❌ Airport CSV file not found at {csv_path}")
                sys.exit(1)

            print(f"📂 Reading airport data from: {csv_path}")
            
            # Count total rows first for progress tracking
            with open(csv_path, 'r', encoding='utf-8') as f:
                total_rows = sum(1 for line in f) - 1  # Subtract header
            print(f"📊 Total airports to process: {total_rows:,}")
            
            with open(csv_path, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                
                count = 0
                errors = 0
                batch = []
                batch_size = 100  # Process in smaller batches
                
                print("🚀 Starting batch processing...")
                
                for row in reader:
                    if row['code'] and len(row['code']) == 3:
                        try:
                            # Prepare data for batch insert
                            airport_data = (
                                row['code'].upper(),
                                row['icao'].upper() if row['icao'] else None,
                                row['name'],
                                row['city'],
                                row['country'],
                                float(row['latitude']) if row['latitude'] else None,
                                float(row['longitude']) if row['longitude'] else None,
                                row['time_zone'] if row['time_zone'] else None,
                                int(float(row['elevation'])) if row['elevation'] else None,
                                row['url'] if row['url'] else None,
                                row['state'] if row['state'] else None,
                                row['type'] if row['type'] else None,
                                row['city_code'] if row['city_code'] else None,
                                row['county'] if row['county'] else None
                            )
                            batch.append(airport_data)
                            
                            # Process batch when it reaches batch_size
                            if len(batch) >= batch_size:
                                try:
                                    cur.executemany("""
                                        INSERT INTO airports (iata_code, icao_code, name, city, country, 
                                                            latitude, longitude, timezone, elevation, 
                                                            url, state, airport_type, city_code, county)
                                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                                        ON CONFLICT (iata_code) DO UPDATE SET
                                            icao_code = EXCLUDED.icao_code,
                                            name = EXCLUDED.name,
                                            city = EXCLUDED.city,
                                            country = EXCLUDED.country,
                                            latitude = EXCLUDED.latitude,
                                            longitude = EXCLUDED.longitude,
                                            timezone = EXCLUDED.timezone,
                                            elevation = EXCLUDED.elevation,
                                            url = EXCLUDED.url,
                                            state = EXCLUDED.state,
                                            airport_type = EXCLUDED.airport_type,
                                            city_code = EXCLUDED.city_code,
                                            county = EXCLUDED.county,
                                            updated_at = NOW()
                                    """, batch)
                                    count += len(batch)
                                    conn.commit()
                                    
                                    progress = (count / total_rows) * 100
                                    print(f"✅ Processed {count:,}/{total_rows:,} airports ({progress:.1f}%)")
                                    
                                except Exception as e:
                                    print(f"❌ Batch insert failed: {e}")
                                    # Try individual inserts for this batch
                                    for single_airport in batch:
                                        try:
                                            cur.execute("""
                                                INSERT INTO airports (iata_code, icao_code, name, city, country, 
                                                                    latitude, longitude, timezone, elevation, 
                                                                    url, state, airport_type, city_code, county)
                                                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                                                ON CONFLICT (iata_code) DO NOTHING
                                            """, single_airport)
                                            count += 1
                                        except Exception as single_error:
                                            errors += 1
                                            if errors <= 10:
                                                print(f"⚠️  Error inserting {single_airport[0]}: {single_error}")
                                    conn.commit()
                                
                                batch = []  # Clear batch
                                
                        except Exception as e:
                            errors += 1
                            if errors <= 10:
                                print(f"⚠️  Error processing {row['code']}: {e}")
                
                # Process remaining batch
                if batch:
                    try:
                        cur.executemany("""
                            INSERT INTO airports (iata_code, icao_code, name, city, country, 
                                                latitude, longitude, timezone, elevation, 
                                                url, state, airport_type, city_code, county)
                            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                            ON CONFLICT (iata_code) DO UPDATE SET
                                icao_code = EXCLUDED.icao_code,
                                name = EXCLUDED.name,
                                city = EXCLUDED.city,
                                country = EXCLUDED.country,
                                latitude = EXCLUDED.latitude,
                                longitude = EXCLUDED.longitude,
                                timezone = EXCLUDED.timezone,
                                elevation = EXCLUDED.elevation,
                                url = EXCLUDED.url,
                                state = EXCLUDED.state,
                                airport_type = EXCLUDED.airport_type,
                                city_code = EXCLUDED.city_code,
                                county = EXCLUDED.county,
                                updated_at = NOW()
                        """, batch)
                        count += len(batch)
                        conn.commit()
                        print(f"✅ Final batch: {len(batch)} airports")
                    except Exception as e:
                        print(f"❌ Final batch failed: {e}")
                        for single_airport in batch:
                            try:
                                cur.execute("""
                                    INSERT INTO airports (iata_code, icao_code, name, city, country, 
                                                        latitude, longitude, timezone, elevation, 
                                                        url, state, airport_type, city_code, county)
                                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                                    ON CONFLICT (iata_code) DO NOTHING
                                """, single_airport)
                                count += 1
                            except:
                                errors += 1
                        conn.commit()
                
                print(f"🎉 Successfully processed {count:,} airports")
                if errors > 0:
                    print(f"⚠️  {errors} records had errors and were skipped")

            # Verify data and show statistics
            cur.execute("SELECT COUNT(*) FROM airports WHERE is_active = true;")
            total_airports = cur.fetchone()[0]
            
            cur.execute("SELECT COUNT(DISTINCT country) FROM airports WHERE is_active = true;")
            total_countries = cur.fetchone()[0]
            
            cur.execute("SELECT COUNT(DISTINCT city) FROM airports WHERE is_active = true;")
            total_cities = cur.fetchone()[0]
            
            print(f"📊 Database Statistics:")
            print(f"   • Total active airports: {total_airports:,}")
            print(f"   • Countries covered: {total_countries:,}")
            print(f"   • Cities covered: {total_cities:,}")
            
            # Test search functionality
            print("\n🔍 Testing search functionality...")
            test_queries = ['london', 'paris', 'new york', 'lhr', 'cdg']
            
            for query in test_queries:
                cur.execute("""
                    SELECT COUNT(*) FROM airports
                    WHERE is_active = true
                    AND (
                        LOWER(iata_code) LIKE LOWER(%s) || '%%'
                        OR LOWER(name) LIKE '%%' || LOWER(%s) || '%%'
                        OR LOWER(city) LIKE '%%' || LOWER(%s) || '%%'
                        OR LOWER(country) LIKE '%%' || LOWER(%s) || '%%'
                    )
                """, [query] * 4)
                
                result_count = cur.fetchone()[0]
                print(f"   • '{query}': {result_count} results")

    except Exception as e:
        print(f"❌ Error during database operations: {e}")
        conn.rollback()
        sys.exit(1)
    
    finally:
        conn.close()
        print("🔚 Database connection closed")

    print("\n🎉 Airport database population completed successfully!")
    print("✅ Your airport autosearch is now ready to use with real data.")

if __name__ == "__main__":
    main()