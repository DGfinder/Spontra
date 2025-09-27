#!/usr/bin/env python3
"""
Populate flight durations table with European flight data.
Python equivalent of populate_flight_durations.go for Windows compatibility.
"""

import os
import sys
import math
import psycopg2
from psycopg2.extras import RealDictCursor

# European airports with coordinates for distance calculation
EUROPEAN_AIRPORTS = [
    # UK & Ireland
    {"code": "LHR", "name": "London Heathrow", "city": "London", "country": "United Kingdom", "lat": 51.4700, "lon": -0.4543},
    {"code": "LGW", "name": "London Gatwick", "city": "London", "country": "United Kingdom", "lat": 51.1537, "lon": -0.1821},
    {"code": "STN", "name": "London Stansted", "city": "London", "country": "United Kingdom", "lat": 51.8860, "lon": 0.2389},
    {"code": "MAN", "name": "Manchester", "city": "Manchester", "country": "United Kingdom", "lat": 53.3537, "lon": -2.2750},
    {"code": "EDI", "name": "Edinburgh", "city": "Edinburgh", "country": "United Kingdom", "lat": 55.9500, "lon": -3.3725},
    {"code": "DUB", "name": "Dublin", "city": "Dublin", "country": "Ireland", "lat": 53.4213, "lon": -6.2701},
    
    # France
    {"code": "CDG", "name": "Charles de Gaulle", "city": "Paris", "country": "France", "lat": 49.0097, "lon": 2.5479},
    {"code": "ORY", "name": "Orly", "city": "Paris", "country": "France", "lat": 48.7233, "lon": 2.3794},
    {"code": "NCE", "name": "Nice Côte d'Azur", "city": "Nice", "country": "France", "lat": 43.6584, "lon": 7.2159},
    {"code": "LYS", "name": "Lyon Saint-Exupéry", "city": "Lyon", "country": "France", "lat": 45.7256, "lon": 5.0811},
    {"code": "MRS", "name": "Marseille Provence", "city": "Marseille", "country": "France", "lat": 43.4393, "lon": 5.2214},
    
    # Germany
    {"code": "FRA", "name": "Frankfurt am Main", "city": "Frankfurt", "country": "Germany", "lat": 50.0379, "lon": 8.5622},
    {"code": "MUC", "name": "Munich", "city": "Munich", "country": "Germany", "lat": 48.3538, "lon": 11.7861},
    {"code": "BER", "name": "Berlin Brandenburg", "city": "Berlin", "country": "Germany", "lat": 52.3667, "lon": 13.5033},
    {"code": "DUS", "name": "Düsseldorf", "city": "Düsseldorf", "country": "Germany", "lat": 51.2895, "lon": 6.7668},
    {"code": "HAM", "name": "Hamburg", "city": "Hamburg", "country": "Germany", "lat": 53.6304, "lon": 9.9882},
    {"code": "CGN", "name": "Cologne Bonn", "city": "Cologne", "country": "Germany", "lat": 50.8659, "lon": 7.1427},
    
    # Spain
    {"code": "MAD", "name": "Madrid-Barajas", "city": "Madrid", "country": "Spain", "lat": 40.4983, "lon": -3.5676},
    {"code": "BCN", "name": "Barcelona-El Prat", "city": "Barcelona", "country": "Spain", "lat": 41.2974, "lon": 2.0833},
    {"code": "PMI", "name": "Palma de Mallorca", "city": "Palma", "country": "Spain", "lat": 39.5517, "lon": 2.7388},
    {"code": "SVQ", "name": "Sevilla", "city": "Seville", "country": "Spain", "lat": 37.4180, "lon": -5.8931},
    {"code": "VLC", "name": "Valencia", "city": "Valencia", "country": "Spain", "lat": 39.4893, "lon": -0.4816},
    {"code": "BIO", "name": "Bilbao", "city": "Bilbao", "country": "Spain", "lat": 43.3011, "lon": -2.9106},
    
    # Italy
    {"code": "FCO", "name": "Rome Fiumicino", "city": "Rome", "country": "Italy", "lat": 41.8003, "lon": 12.2389},
    {"code": "MXP", "name": "Milan Malpensa", "city": "Milan", "country": "Italy", "lat": 45.6306, "lon": 8.7281},
    {"code": "LIN", "name": "Milan Linate", "city": "Milan", "country": "Italy", "lat": 45.4451, "lon": 9.2767},
    {"code": "NAP", "name": "Naples", "city": "Naples", "country": "Italy", "lat": 40.8860, "lon": 14.2908},
    {"code": "VCE", "name": "Venice Marco Polo", "city": "Venice", "country": "Italy", "lat": 45.5053, "lon": 12.3519},
    {"code": "BGY", "name": "Milan Bergamo", "city": "Bergamo", "country": "Italy", "lat": 45.6739, "lon": 9.7042},
    
    # Netherlands
    {"code": "AMS", "name": "Amsterdam Schiphol", "city": "Amsterdam", "country": "Netherlands", "lat": 52.3105, "lon": 4.7683},
    {"code": "EIN", "name": "Eindhoven", "city": "Eindhoven", "country": "Netherlands", "lat": 51.4500, "lon": 5.3747},
    
    # Belgium
    {"code": "BRU", "name": "Brussels", "city": "Brussels", "country": "Belgium", "lat": 50.9014, "lon": 4.4844},
    {"code": "CRL", "name": "Brussels South Charleroi", "city": "Charleroi", "country": "Belgium", "lat": 50.4592, "lon": 4.4638},
    
    # Switzerland
    {"code": "ZUR", "name": "Zurich", "city": "Zurich", "country": "Switzerland", "lat": 47.4647, "lon": 8.5492},
    {"code": "GVA", "name": "Geneva", "city": "Geneva", "country": "Switzerland", "lat": 46.2381, "lon": 6.1089},
    {"code": "BSL", "name": "Basel-Mulhouse-Freiburg", "city": "Basel", "country": "Switzerland", "lat": 47.5900, "lon": 7.5291},
    
    # Austria
    {"code": "VIE", "name": "Vienna", "city": "Vienna", "country": "Austria", "lat": 48.1103, "lon": 16.5697},
    {"code": "SZG", "name": "Salzburg", "city": "Salzburg", "country": "Austria", "lat": 47.7933, "lon": 13.0043},
    
    # Scandinavia
    {"code": "ARN", "name": "Stockholm Arlanda", "city": "Stockholm", "country": "Sweden", "lat": 59.6519, "lon": 17.9186},
    {"code": "CPH", "name": "Copenhagen", "city": "Copenhagen", "country": "Denmark", "lat": 55.6181, "lon": 12.6561},
    {"code": "OSL", "name": "Oslo Gardermoen", "city": "Oslo", "country": "Norway", "lat": 60.1939, "lon": 11.1004},
    {"code": "HEL", "name": "Helsinki-Vantaa", "city": "Helsinki", "country": "Finland", "lat": 60.3172, "lon": 24.9633},
    {"code": "GOT", "name": "Gothenburg-Landvetter", "city": "Gothenburg", "country": "Sweden", "lat": 57.6628, "lon": 12.2798},
    
    # Eastern Europe
    {"code": "WAW", "name": "Warsaw Chopin", "city": "Warsaw", "country": "Poland", "lat": 52.1657, "lon": 20.9671},
    {"code": "KRK", "name": "Kraków", "city": "Kraków", "country": "Poland", "lat": 50.0777, "lon": 19.7848},
    {"code": "PRG", "name": "Prague Václav Havel", "city": "Prague", "country": "Czech Republic", "lat": 50.1008, "lon": 14.2632},
    {"code": "BUD", "name": "Budapest Ferenc Liszt", "city": "Budapest", "country": "Hungary", "lat": 47.4394, "lon": 19.2556},
    {"code": "OTP", "name": "Bucharest Henri Coandă", "city": "Bucharest", "country": "Romania", "lat": 44.5711, "lon": 26.085},
    
    # Portugal
    {"code": "LIS", "name": "Lisbon Portela", "city": "Lisbon", "country": "Portugal", "lat": 38.7813, "lon": -9.1361},
    {"code": "OPO", "name": "Porto", "city": "Porto", "country": "Portugal", "lat": 41.2481, "lon": -8.6814},
    
    # Greece
    {"code": "ATH", "name": "Athens Eleftherios Venizelos", "city": "Athens", "country": "Greece", "lat": 37.9364, "lon": 23.9445},
    {"code": "SKG", "name": "Thessaloniki", "city": "Thessaloniki", "country": "Greece", "lat": 40.5197, "lon": 22.9709},
    
    # Turkey (European part)
    {"code": "IST", "name": "Istanbul", "city": "Istanbul", "country": "Turkey", "lat": 41.2753, "lon": 28.7519},
    
    # Croatia
    {"code": "ZAG", "name": "Zagreb", "city": "Zagreb", "country": "Croatia", "lat": 45.7429, "lon": 16.0688},
    {"code": "SPU", "name": "Split", "city": "Split", "country": "Croatia", "lat": 43.5389, "lon": 16.2972},
    
    # Slovenia
    {"code": "LJU", "name": "Ljubljana Jože Pučnik", "city": "Ljubljana", "country": "Slovenia", "lat": 46.2237, "lon": 14.4576},
]

# Routes that typically require connections due to limited direct service
LONG_HAUL_ROUTES = {
    "LIS": ["HEL", "OSL", "ARN", "WAW", "BUD", "OTP"],  # Lisbon to Nordic/Eastern Europe
    "OPO": ["HEL", "OSL", "ARN", "WAW", "BUD", "OTP"],  # Porto to Nordic/Eastern Europe
    "ATH": ["OSL", "ARN", "GOT", "EDI", "DUB"],        # Athens to Nordic/UK
    "SKG": ["LHR", "CDG", "FRA", "AMS", "OSL"],        # Thessaloniki often connects
    "HEL": ["LIS", "OPO", "PMI", "SVQ", "NAP"],        # Helsinki to Southern Europe
    "OSL": ["ATH", "SKG", "NAP", "PMI", "SVQ"],        # Oslo to Southern Europe
}

def calculate_distance(lat1, lon1, lat2, lon2):
    """Calculate the great circle distance between two points using Haversine formula."""
    earth_radius = 6371  # Earth's radius in kilometers
    
    # Convert degrees to radians
    lat1_rad = math.radians(lat1)
    lon1_rad = math.radians(lon1)
    lat2_rad = math.radians(lat2)
    lon2_rad = math.radians(lon2)
    
    # Haversine formula
    dlat = lat2_rad - lat1_rad
    dlon = lon2_rad - lon1_rad
    
    a = (math.sin(dlat/2)**2 + 
         math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon/2)**2)
    
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    
    return earth_radius * c

def is_long_haul_european_route(origin, destination):
    """Determine if a route typically requires connections."""
    if origin in LONG_HAUL_ROUTES:
        if destination in LONG_HAUL_ROUTES[origin]:
            return True
    
    if destination in LONG_HAUL_ROUTES:
        if origin in LONG_HAUL_ROUTES[destination]:
            return True
    
    return False

def calculate_flight_duration(origin, destination):
    """Calculate flight duration between two airports."""
    # Calculate great circle distance
    distance = calculate_distance(origin["lat"], origin["lon"], 
                                destination["lat"], destination["lon"])
    
    # Average commercial aircraft speed: 850 km/h
    # Add time for taxi, takeoff, climb, descent, landing: 30-45 minutes
    avg_speed = 850.0  # km/h
    base_time = 35.0   # minutes for taxi, takeoff, landing procedures
    
    flight_time = (distance / avg_speed) * 60  # Convert to minutes
    total_time = int(flight_time + base_time)
    
    # Determine if direct flight is typical
    is_direct = True
    stops = 0
    
    # Routes over 3000km or between certain regions often have stops
    if distance > 3000:
        is_direct = False
        stops = 1
        total_time += 60  # Add connection time
    
    # Some specific route adjustments based on real-world aviation
    if is_long_haul_european_route(origin["code"], destination["code"]):
        is_direct = False
        stops = 1
        total_time += 60
    
    # Minimum flight time of 45 minutes (short hops)
    if total_time < 45:
        total_time = 45
    
    # Maximum reasonable flight time within Europe: 8 hours
    if total_time > 480:
        total_time = 480
    
    return {
        "origin_airport": origin["code"],
        "destination_airport": destination["code"],
        "duration_minutes": total_time,
        "distance_km": int(distance),
        "is_direct": is_direct,
        "typical_stops": stops
    }

def create_table_if_not_exists(cursor):
    """Create the flight_durations table if it doesn't exist."""
    create_table_sql = """
    CREATE TABLE IF NOT EXISTS flight_durations (
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
    """
    
    create_index_sql = """
    CREATE INDEX IF NOT EXISTS idx_flight_durations_route 
    ON flight_durations(origin_airport, destination_airport);
    """
    
    cursor.execute(create_table_sql)
    cursor.execute(create_index_sql)
    print("✅ Table and indexes created successfully")

def clear_existing_data(cursor):
    """Clear existing flight duration data."""
    print("🧹 Clearing existing flight duration data...")
    cursor.execute("DELETE FROM flight_durations")
    print("✅ Existing data cleared successfully")

def populate_flight_durations(cursor):
    """Generate and insert flight duration data."""
    print(f"🛫 Generating flight durations for {len(EUROPEAN_AIRPORTS)} airports...")
    
    # Prepare insert statement
    insert_sql = """
        INSERT INTO flight_durations 
        (origin_airport, destination_airport, duration_minutes, distance_km, is_direct, typical_stops) 
        VALUES (%s, %s, %s, %s, %s, %s)
    """
    
    count = 0
    batch_data = []
    
    # Generate durations between all airport pairs
    for i, origin in enumerate(EUROPEAN_AIRPORTS):
        for j, destination in enumerate(EUROPEAN_AIRPORTS):
            if i == j:
                continue  # Skip same airport
            
            duration = calculate_flight_duration(origin, destination)
            
            batch_data.append((
                duration["origin_airport"],
                duration["destination_airport"],
                duration["duration_minutes"],
                duration["distance_km"],
                duration["is_direct"],
                duration["typical_stops"]
            ))
            
            count += 1
            if count % 100 == 0:
                print(f"📊 Prepared {count} flight durations...")
    
    # Insert all data in batches
    print("💾 Inserting flight duration records...")
    cursor.executemany(insert_sql, batch_data)
    
    print(f"✅ Successfully inserted {count} flight duration records")
    return count

def main():
    """Main function to populate flight durations."""
    # Get database URL from environment or use default
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("❌ DATABASE_URL environment variable not set")
        return
    
    try:
        # Connect to database
        print("🔌 Connecting to database...")
        conn = psycopg2.connect(database_url)
        conn.autocommit = False
        
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            print("✅ Connected to database successfully")
            
            # Create table if it doesn't exist
            create_table_if_not_exists(cursor)
            
            # Clear existing data
            clear_existing_data(cursor)
            
            # Generate and insert flight durations
            count = populate_flight_durations(cursor)
            
            # Commit the transaction
            conn.commit()
            print(f"🎉 Flight duration database populated successfully with {count} records!")
            
    except psycopg2.Error as e:
        print(f"❌ Database error: {e}")
        if conn:
            conn.rollback()
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    main()
