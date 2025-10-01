#!/usr/bin/env python3
"""
Basic Flight Routes Population Script
Populates flight_routes table with essential European routes for admin panel functionality.
Updated to use Amadeus API when available, fallback to distance-based estimates.
"""

import os
import psycopg2
import math
from datetime import datetime
import uuid
import asyncio
import aiohttp
from typing import Optional

# European airports that match the seeded airports in Go service
# Using only airports that are seeded by seed_destinations.go to avoid foreign key errors
MAJOR_AIRPORTS = {
    'LHR': {'city': 'London', 'lat': 51.4775, 'lon': -0.4614},
    'LGW': {'city': 'London', 'lat': 51.1481, 'lon': -0.1903},
    'CDG': {'city': 'Paris', 'lat': 49.0097, 'lon': 2.5479},
    'ORY': {'city': 'Paris', 'lat': 48.7233, 'lon': 2.3794},
    'NCE': {'city': 'Nice', 'lat': 43.6584, 'lon': 7.2159},
    'AMS': {'city': 'Amsterdam', 'lat': 52.3105, 'lon': 4.7683},
    'FRA': {'city': 'Frankfurt', 'lat': 50.0264, 'lon': 8.5431},
    'MUC': {'city': 'Munich', 'lat': 48.3537, 'lon': 11.7862},
    'BER': {'city': 'Berlin', 'lat': 52.3667, 'lon': 13.5033},
    'MAD': {'city': 'Madrid', 'lat': 40.4719, 'lon': -3.5626},
    'BCN': {'city': 'Barcelona', 'lat': 41.2971, 'lon': 2.0833},
    'VIE': {'city': 'Vienna', 'lat': 48.1103, 'lon': 16.5697},
    'ZRH': {'city': 'Zurich', 'lat': 47.4635, 'lon': 8.5532},
    'GVA': {'city': 'Geneva', 'lat': 46.2381, 'lon': 6.1089},
    'FCO': {'city': 'Rome', 'lat': 41.7999, 'lon': 12.2462},
    'MXP': {'city': 'Milan', 'lat': 45.6306, 'lon': 8.7281},
    'ATH': {'city': 'Athens', 'lat': 37.9364, 'lon': 23.9445},
    'LIS': {'city': 'Lisbon', 'lat': 38.7813, 'lon': -9.1357},
    'OPO': {'city': 'Porto', 'lat': 41.2481, 'lon': -8.6814},
    'DUB': {'city': 'Dublin', 'lat': 53.4213, 'lon': -6.2700}
}

def calculate_distance(lat1, lon1, lat2, lon2):
    """Calculate great circle distance between two points in kilometers"""
    R = 6371  # Earth's radius in km
    
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    
    return R * c

def estimate_flight_duration(distance_km):
    """Estimate flight duration based on distance"""
    # Base calculations:
    # - Average commercial speed: 850 km/h
    # - Taxi/takeoff/landing: 30 minutes
    # - Ground delays: 15 minutes
    
    if distance_km < 500:
        # Short haul: more ground time relative to flight time
        flight_time = (distance_km / 700) * 60  # Slower average for short flights
        ground_time = 45  # 45 minutes ground time
    elif distance_km < 1500:
        # Medium haul
        flight_time = (distance_km / 800) * 60
        ground_time = 40
    else:
        # Long haul
        flight_time = (distance_km / 850) * 60
        ground_time = 35
    
    total_minutes = int(flight_time + ground_time)
    hours = total_minutes // 60
    minutes = total_minutes % 60
    
    return hours, minutes, total_minutes

class AmadeusIntegration:
    """Simple Amadeus API integration for getting real flight durations"""
    
    def __init__(self):
        self.client_id = os.getenv('AMADEUS_CLIENT_ID')
        self.client_secret = os.getenv('AMADEUS_CLIENT_SECRET') 
        self.base_url = os.getenv('AMADEUS_BASE_URL', 'https://test.api.amadeus.com')
        self.access_token = None
        self.session = None
        self.available = bool(self.client_id and self.client_secret)
        
        if not self.available:
            print("⚠️ Amadeus credentials not found. Using distance-based estimates only.")
    
    async def __aenter__(self):
        if self.available:
            self.session = aiohttp.ClientSession()
            await self.authenticate()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def authenticate(self):
        """Get OAuth2 access token"""
        if not self.available:
            return
        
        auth_url = f"{self.base_url}/v1/security/oauth2/token"
        data = {
            'grant_type': 'client_credentials',
            'client_id': self.client_id,
            'client_secret': self.client_secret
        }
        
        try:
            async with self.session.post(auth_url, data=data) as response:
                if response.status == 200:
                    token_data = await response.json()
                    self.access_token = token_data['access_token']
                    print("✅ Amadeus API authenticated")
                else:
                    print("⚠️ Amadeus authentication failed, using estimates only")
                    self.available = False
        except Exception as e:
            print(f"⚠️ Amadeus authentication error: {e}, using estimates only")
            self.available = False
    
    async def get_flight_duration(self, origin: str, destination: str) -> Optional[int]:
        """Get real flight duration from Amadeus API"""
        if not self.available or not self.access_token:
            return None
        
        # Use tomorrow's date
        from datetime import timedelta
        tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
        
        search_url = f"{self.base_url}/v2/shopping/flight-offers"
        params = {
            'originLocationCode': origin,
            'destinationLocationCode': destination,
            'departureDate': tomorrow,
            'adults': 1,
            'max': 1
        }
        
        headers = {'Authorization': f'Bearer {self.access_token}'}
        
        try:
            async with self.session.get(search_url, params=params, headers=headers) as response:
                if response.status == 200:
                    data = await response.json()
                    offers = data.get('data', [])
                    
                    if offers:
                        # Parse duration from first itinerary
                        duration_str = offers[0]['itineraries'][0].get('duration', 'PT0M')
                        return self.parse_duration(duration_str)
                        
        except Exception as e:
            print(f"   ⚠️ Amadeus lookup failed for {origin}-{destination}: {e}")
        
        return None
    
    def parse_duration(self, duration_str: str) -> int:
        """Parse ISO 8601 duration to minutes"""
        try:
            duration_str = duration_str.replace('PT', '')
            hours = 0
            minutes = 0
            
            if 'H' in duration_str:
                hours_str, remainder = duration_str.split('H', 1)
                hours = int(hours_str)
                duration_str = remainder
            
            if 'M' in duration_str:
                minutes_str = duration_str.replace('M', '')
                if minutes_str:
                    minutes = int(minutes_str)
            
            return hours * 60 + minutes
        except:
            return 0

async def populate_flight_routes():
    """Populate flight_routes table with European routes using Amadeus API when available"""
    
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("❌ DATABASE_URL environment variable not set")
        return False
    
    try:
        conn = psycopg2.connect(database_url)
        cur = conn.cursor()
        
        print("🚀 Starting flight routes population...")
        
        # Clear existing data
        cur.execute("DELETE FROM flight_routes")
        print("🗑️ Cleared existing flight routes")
        
        routes_created = 0
        amadeus_routes = 0
        estimated_routes = 0
        
        # Generate routes between all airport pairs
        airports = list(MAJOR_AIRPORTS.keys())
        
        async with AmadeusIntegration() as amadeus:
            for i, origin in enumerate(airports):
                print(f"\n📍 Processing routes from {origin} ({i+1}/{len(airports)})")
                
                for j, destination in enumerate(airports):
                    if i != j:  # Don't create routes from airport to itself
                        
                        # Try to get real Amadeus duration first
                        amadeus_duration = await amadeus.get_flight_duration(origin, destination)
                        
                        if amadeus_duration and amadeus_duration > 0:
                            # Use real Amadeus duration
                            total_minutes = amadeus_duration
                            hours = total_minutes // 60
                            minutes = total_minutes % 60
                            amadeus_routes += 1
                            print(f"  ✈️ {origin} → {destination}: {hours}h {minutes}m (Amadeus)")
                        else:
                            # Fall back to distance-based estimation
                            origin_data = MAJOR_AIRPORTS[origin]
                            dest_data = MAJOR_AIRPORTS[destination]
                            
                            distance = calculate_distance(
                                origin_data['lat'], origin_data['lon'],
                                dest_data['lat'], dest_data['lon']
                            )
                            
                            hours, minutes, total_minutes = estimate_flight_duration(distance)
                            estimated_routes += 1
                            print(f"  📏 {origin} → {destination}: {hours}h {minutes}m (estimated)")
                        
                        # Insert flight route
                        route_id = str(uuid.uuid4())
                        now = datetime.now()
                        
                        cur.execute("""
                            INSERT INTO flight_routes (
                                id, origin_airport_code, destination_airport_code,
                                estimated_duration_hours, estimated_duration_minutes,
                                total_duration_minutes, created_at, updated_at
                            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                        """, (
                            route_id, origin, destination,
                            hours, minutes, total_minutes,
                            now, now
                        ))
                        
                        routes_created += 1
                        
                        # Rate limiting for Amadeus API
                        if amadeus.available:
                            await asyncio.sleep(0.1)
                
                # Commit after each origin to avoid losing progress
                conn.commit()
        
        print(f"\n✅ Successfully created {routes_created} flight routes")
        print(f"🌍 Coverage: {len(airports)} airports with full connectivity")
        print(f"✈️ Amadeus API routes: {amadeus_routes}")
        print(f"📏 Estimated routes: {estimated_routes}")
        print(f"🎯 Amadeus coverage: {(amadeus_routes/routes_created*100):.1f}%")
        
        # Verify the data
        cur.execute("SELECT COUNT(*) FROM flight_routes")
        count = cur.fetchone()[0]
        print(f"📊 Total flight routes in database: {count}")
        
        # Show sample routes
        cur.execute("""
            SELECT origin_airport_code, destination_airport_code, total_duration_minutes
            FROM flight_routes 
            WHERE origin_airport_code = 'LHR'
            ORDER BY total_duration_minutes ASC
            LIMIT 5
        """)
        
        print("\n🛫 Sample routes from London Heathrow:")
        for row in cur.fetchall():
            origin, dest, duration = row
            hours = duration // 60
            minutes = duration % 60
            print(f"  {origin} → {dest}: {hours}h {minutes}m ({duration} min)")
        
        cur.close()
        conn.close()
        
        return True
        
    except Exception as e:
        print(f"❌ Failed to populate flight routes: {e}")
        return False

if __name__ == "__main__":
    async def main():
        success = await populate_flight_routes()
        if success:
            print("\n🎉 Flight routes population completed successfully!")
            print("✅ Admin panel should now show proper airport statistics with real Amadeus data")
            print("✅ Airport sync functionality should work correctly")
        else:
            print("\n💥 Flight routes population failed!")
            exit(1)
    
    asyncio.run(main())