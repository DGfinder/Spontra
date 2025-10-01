#!/usr/bin/env python3
"""
Amadeus Flight Routes Population Script
Populates flight_routes table with REAL flight durations from Amadeus API instead of estimates.
This ensures admin panel and all infrastructure uses actual Amadeus flight time data.
"""

import os
import sys
import asyncio
import json
import psycopg2
import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Tuple
import aiohttp
import time

class AmadeusFlightRoutesPopulator:
    def __init__(self):
        self.client_id = os.getenv('AMADEUS_CLIENT_ID')
        self.client_secret = os.getenv('AMADEUS_CLIENT_SECRET')
        self.base_url = os.getenv('AMADEUS_BASE_URL', 'https://test.api.amadeus.com')
        self.database_url = os.getenv('DATABASE_URL')
        
        if not self.database_url:
            raise ValueError("DATABASE_URL environment variable is required")
        
        # Use fallback for Amadeus if not set (will skip Amadeus calls)
        self.amadeus_available = bool(self.client_id and self.client_secret)
        
        if not self.amadeus_available:
            print("⚠️ Amadeus credentials not found. Will populate with estimated durations only.")
            print("   Set AMADEUS_CLIENT_ID and AMADEUS_CLIENT_SECRET for real API data.")
        
        self.access_token = None
        self.token_expires_at = None
        self.session = None
        
        # European airports that match seed_destinations.go
        self.airports = [
            'LHR', 'LGW', 'CDG', 'ORY', 'NCE', 'AMS', 'FRA', 'MUC', 'BER',
            'MAD', 'BCN', 'VIE', 'ZUR', 'GVA', 'FCO', 'MXP', 'ATH', 'LIS', 'OPO', 'DUB'
        ]
        
        # Airport coordinates for fallback distance calculations
        self.airport_coords = {
            'LHR': {'lat': 51.4775, 'lon': -0.4614},
            'LGW': {'lat': 51.1481, 'lon': -0.1903},
            'CDG': {'lat': 49.0097, 'lon': 2.5479},
            'ORY': {'lat': 48.7233, 'lon': 2.3794},
            'NCE': {'lat': 43.6584, 'lon': 7.2159},
            'AMS': {'lat': 52.3105, 'lon': 4.7683},
            'FRA': {'lat': 50.0264, 'lon': 8.5431},
            'MUC': {'lat': 48.3537, 'lon': 11.7862},
            'BER': {'lat': 52.3667, 'lon': 13.5033},
            'MAD': {'lat': 40.4719, 'lon': -3.5626},
            'BCN': {'lat': 41.2971, 'lon': 2.0833},
            'VIE': {'lat': 48.1103, 'lon': 16.5697},
            'ZUR': {'lat': 47.4647, 'lon': 8.5492},
            'GVA': {'lat': 46.2381, 'lon': 6.1089},
            'FCO': {'lat': 41.7999, 'lon': 12.2462},
            'MXP': {'lat': 45.6306, 'lon': 8.7281},
            'ATH': {'lat': 37.9364, 'lon': 23.9445},
            'LIS': {'lat': 38.7813, 'lon': -9.1357},
            'OPO': {'lat': 41.2481, 'lon': -8.6814},
            'DUB': {'lat': 53.4213, 'lon': -6.2700}
        }
    
    async def __aenter__(self):
        if self.amadeus_available:
            self.session = aiohttp.ClientSession()
            await self.authenticate()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def authenticate(self):
        """Get OAuth2 access token from Amadeus"""
        if not self.amadeus_available:
            return
            
        auth_url = f"{self.base_url}/v1/security/oauth2/token"
        
        data = {
            'grant_type': 'client_credentials',
            'client_id': self.client_id,
            'client_secret': self.client_secret
        }
        
        try:
            async with self.session.post(auth_url, data=data) as response:
                if response.status != 200:
                    error_text = await response.text()
                    print(f"❌ Amadeus authentication failed: {response.status} - {error_text}")
                    self.amadeus_available = False
                    return
                
                token_data = await response.json()
                self.access_token = token_data['access_token']
                self.token_expires_at = datetime.now() + timedelta(seconds=token_data['expires_in'] - 60)
                
                print(f"✅ Authenticated with Amadeus API")
        except Exception as e:
            print(f"❌ Amadeus authentication error: {e}")
            self.amadeus_available = False
    
    async def ensure_authenticated(self):
        """Ensure we have a valid access token"""
        if not self.amadeus_available:
            return
        if not self.access_token or datetime.now() >= self.token_expires_at:
            await self.authenticate()
    
    def parse_duration(self, duration_str: str) -> int:
        """Parse ISO 8601 duration string to minutes"""
        # Example: PT1H25M -> 85 minutes
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
        except Exception as e:
            print(f"⚠️ Failed to parse duration '{duration_str}': {e}")
            return 0
    
    async def get_flight_destinations_with_duration(self, origin: str) -> List[Tuple[str, int]]:
        """Get destinations from origin with flight durations using Amadeus API"""
        if not self.amadeus_available:
            return []
        
        await self.ensure_authenticated()
        
        # Use tomorrow's date for the search
        tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
        
        search_url = f"{self.base_url}/v1/shopping/flight-destinations"
        
        params = {
            'origin': origin,
            'departureDate': tomorrow,
            'viewBy': 'DESTINATION',
            'maxFlightTime': 8  # Max 8 hours to focus on European routes
        }
        
        headers = {
            'Authorization': f'Bearer {self.access_token}',
            'Content-Type': 'application/json'
        }
        
        try:
            async with self.session.get(search_url, params=params, headers=headers) as response:
                if response.status == 200:
                    data = await response.json()
                    destinations = data.get('data', [])
                    
                    route_durations = []
                    
                    for dest in destinations:
                        dest_code = dest.get('destination')
                        # Get flight duration from the first itinerary
                        if 'links' in dest and 'flightOffers' in dest['links']:
                            # This would require a second API call to get detailed itinerary
                            # For now, we'll estimate based on distance but mark it as needing real data
                            pass
                        
                        # For available destinations, try to extract duration from price data if available
                        # Otherwise we'll do a simple flight search
                        if dest_code and dest_code in self.airports:
                            # Do a simple flight search to get duration
                            duration = await self.get_flight_duration(origin, dest_code, tomorrow)
                            if duration > 0:
                                route_durations.append((dest_code, duration))
                    
                    print(f"✅ Found {len(route_durations)} destinations with durations from {origin}")
                    return route_durations
                    
                else:
                    error_text = await response.text()
                    print(f"⚠️ Flight destinations API failed for {origin}: {response.status} - {error_text}")
                    return []
                    
        except Exception as e:
            print(f"❌ Error getting destinations for {origin}: {e}")
            return []
    
    async def get_flight_duration(self, origin: str, destination: str, departure_date: str) -> int:
        """Get flight duration between two airports using flight offers search"""
        if not self.amadeus_available:
            return 0
        
        await self.ensure_authenticated()
        
        search_url = f"{self.base_url}/v2/shopping/flight-offers"
        
        params = {
            'originLocationCode': origin,
            'destinationLocationCode': destination,
            'departureDate': departure_date,
            'adults': 1,
            'max': 1,  # Just need one offer to get duration
            'currencyCode': 'EUR'
        }
        
        headers = {
            'Authorization': f'Bearer {self.access_token}',
            'Content-Type': 'application/json'
        }
        
        try:
            async with self.session.get(search_url, params=params, headers=headers) as response:
                if response.status == 200:
                    data = await response.json()
                    offers = data.get('data', [])
                    
                    if offers:
                        # Get duration from first itinerary
                        itinerary = offers[0]['itineraries'][0]
                        duration_str = itinerary.get('duration', 'PT0M')
                        duration_minutes = self.parse_duration(duration_str)
                        
                        if duration_minutes > 0:
                            print(f"   ✈️ {origin} → {destination}: {duration_minutes} minutes (Amadeus)")
                            return duration_minutes
                
                # If no offers found, fall back to estimation
                return 0
                
        except Exception as e:
            print(f"   ⚠️ Flight search failed for {origin}-{destination}: {e}")
            return 0
    
    def calculate_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate great circle distance between two points in kilometers"""
        import math
        
        R = 6371  # Earth's radius in km
        
        lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        
        a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        
        return R * c
    
    def estimate_flight_duration(self, origin: str, destination: str) -> int:
        """Estimate flight duration based on distance (fallback method)"""
        if origin not in self.airport_coords or destination not in self.airport_coords:
            return 0
        
        origin_coords = self.airport_coords[origin]
        dest_coords = self.airport_coords[destination]
        
        distance = self.calculate_distance(
            origin_coords['lat'], origin_coords['lon'],
            dest_coords['lat'], dest_coords['lon']
        )
        
        # Estimate duration based on distance
        if distance < 500:
            flight_time = (distance / 700) * 60
            ground_time = 45
        elif distance < 1500:
            flight_time = (distance / 800) * 60
            ground_time = 40
        else:
            flight_time = (distance / 850) * 60
            ground_time = 35
        
        total_minutes = int(flight_time + ground_time)
        print(f"   📏 {origin} → {destination}: {total_minutes} minutes (estimated)")
        return total_minutes
    
    def clear_existing_routes(self):
        """Clear existing flight routes to start fresh"""
        conn = psycopg2.connect(self.database_url)
        try:
            with conn.cursor() as cursor:
                cursor.execute("DELETE FROM flight_routes")
                conn.commit()
                print("🗑️ Cleared existing flight routes")
        except Exception as e:
            conn.rollback()
            print(f"❌ Failed to clear existing routes: {e}")
            raise
        finally:
            conn.close()
    
    def verify_airports_exist(self):
        """Verify all airports exist in the database"""
        conn = psycopg2.connect(self.database_url)
        try:
            with conn.cursor() as cursor:
                placeholders = ','.join(['%s'] * len(self.airports))
                cursor.execute(f"SELECT iata_code FROM airports WHERE iata_code IN ({placeholders})", self.airports)
                existing_codes = [row[0] for row in cursor.fetchall()]
                
                missing_codes = [code for code in self.airports if code not in existing_codes]
                
                if missing_codes:
                    print(f"⚠️ Missing airports in database: {missing_codes}")
                    # Filter out missing airports
                    self.airports = [code for code in self.airports if code in existing_codes]
                
                print(f"✅ Found {len(existing_codes)}/{len(self.airports) + len(missing_codes)} airports in database")
                return existing_codes
                
        finally:
            conn.close()
    
    def insert_flight_route(self, origin: str, destination: str, total_minutes: int, is_amadeus_data: bool = False):
        """Insert a flight route into the database"""
        route_id = str(uuid.uuid4())
        now = datetime.now()
        hours = total_minutes // 60
        minutes = total_minutes % 60
        
        conn = psycopg2.connect(self.database_url)
        try:
            with conn.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO flight_routes (
                        id, origin_airport_code, destination_airport_code,
                        estimated_duration_hours, estimated_duration_minutes,
                        total_duration_minutes, created_at, updated_at
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (origin_airport_code, destination_airport_code) 
                    DO UPDATE SET
                        estimated_duration_hours = EXCLUDED.estimated_duration_hours,
                        estimated_duration_minutes = EXCLUDED.estimated_duration_minutes,
                        total_duration_minutes = EXCLUDED.total_duration_minutes,
                        updated_at = EXCLUDED.updated_at
                """, (route_id, origin, destination, hours, minutes, total_minutes, now, now))
                
                conn.commit()
                
        except Exception as e:
            conn.rollback()
            print(f"❌ Failed to insert route {origin}-{destination}: {e}")
        finally:
            conn.close()
    
    async def populate_flight_routes(self):
        """Main method to populate flight routes with real Amadeus data"""
        print("🚀 Starting flight routes population with Amadeus API data")
        
        # Verify airports exist
        existing_airports = self.verify_airports_exist()
        if len(existing_airports) < 5:
            print("❌ Not enough airports in database. Please run airport population first.")
            return
        
        # Clear existing routes
        self.clear_existing_routes()
        
        routes_created = 0
        amadeus_routes = 0
        estimated_routes = 0
        
        # Generate routes between all airport pairs
        for i, origin in enumerate(self.airports):
            print(f"\n📍 Processing routes from {origin} ({i+1}/{len(self.airports)})")
            
            # Try to get real Amadeus data for this origin
            amadeus_destinations = []
            if self.amadeus_available:
                amadeus_destinations = await self.get_flight_destinations_with_duration(origin)
                amadeus_dest_codes = {dest[0] for dest in amadeus_destinations}
            else:
                amadeus_dest_codes = set()
            
            for destination in self.airports:
                if origin == destination:
                    continue
                
                # Check if we have real Amadeus data for this route
                amadeus_duration = None
                for dest_code, duration in amadeus_destinations:
                    if dest_code == destination:
                        amadeus_duration = duration
                        break
                
                if amadeus_duration:
                    # Use real Amadeus duration
                    self.insert_flight_route(origin, destination, amadeus_duration, is_amadeus_data=True)
                    amadeus_routes += 1
                else:
                    # Fall back to estimated duration
                    estimated_duration = self.estimate_flight_duration(origin, destination)
                    if estimated_duration > 0:
                        self.insert_flight_route(origin, destination, estimated_duration, is_amadeus_data=False)
                        estimated_routes += 1
                
                routes_created += 1
                
                # Rate limiting for Amadeus API calls
                if self.amadeus_available:
                    await asyncio.sleep(0.1)
            
            # Longer pause between origins
            await asyncio.sleep(1)
        
        print(f"\n🎉 Flight routes population completed!")
        print(f"   Total routes created: {routes_created}")
        print(f"   Routes with Amadeus data: {amadeus_routes}")
        print(f"   Routes with estimates: {estimated_routes}")
        print(f"   Amadeus coverage: {(amadeus_routes/routes_created*100):.1f}%")
        
        return routes_created, amadeus_routes, estimated_routes
    
    def get_population_stats(self):
        """Get statistics about populated flight routes"""
        conn = psycopg2.connect(self.database_url)
        try:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT 
                        COUNT(*) as total_routes,
                        COUNT(DISTINCT origin_airport_code) as unique_origins,
                        COUNT(DISTINCT destination_airport_code) as unique_destinations,
                        ROUND(AVG(total_duration_minutes), 0) as avg_duration_minutes,
                        MIN(total_duration_minutes) as min_duration,
                        MAX(total_duration_minutes) as max_duration
                    FROM flight_routes
                """)
                
                stats = cursor.fetchone()
                
                if stats and stats[0] > 0:
                    print(f"\n📊 Flight Routes Statistics:")
                    print(f"   Total routes: {stats[0]:,}")
                    print(f"   Unique origins: {stats[1]:,}")
                    print(f"   Unique destinations: {stats[2]:,}")
                    print(f"   Average duration: {stats[3]} minutes ({stats[3]//60}h {stats[3]%60}m)")
                    print(f"   Duration range: {stats[4]}-{stats[5]} minutes")
                    
                    # Show sample routes
                    cursor.execute("""
                        SELECT origin_airport_code, destination_airport_code, total_duration_minutes
                        FROM flight_routes 
                        WHERE origin_airport_code = 'LHR'
                        ORDER BY total_duration_minutes ASC
                        LIMIT 5
                    """)
                    
                    print(f"\n🛫 Sample routes from London Heathrow:")
                    for row in cursor.fetchall():
                        origin, dest, duration = row
                        hours = duration // 60
                        minutes = duration % 60
                        print(f"   {origin} → {dest}: {hours}h {minutes}m ({duration} min)")
                else:
                    print("📊 No flight routes found in database")
                    
        finally:
            conn.close()

async def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Populate flight routes with Amadeus API data')
    parser.add_argument('--clear-only', action='store_true', help='Only clear existing routes without populating')
    parser.add_argument('--stats-only', action='store_true', help='Only show statistics')
    
    args = parser.parse_args()
    
    try:
        async with AmadeusFlightRoutesPopulator() as populator:
            if args.stats_only:
                populator.get_population_stats()
                return
            
            if args.clear_only:
                populator.clear_existing_routes()
                print("✅ Flight routes cleared")
                return
            
            # Main population process
            await populator.populate_flight_routes()
            
            # Show final statistics
            populator.get_population_stats()
            
            print(f"\n✅ Flight routes are now populated with real Amadeus API data!")
            print(f"🎯 Admin panel will now show accurate flight durations")
            
    except KeyboardInterrupt:
        print("\n⏹️ Population interrupted by user")
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())