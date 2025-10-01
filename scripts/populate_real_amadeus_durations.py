#!/usr/bin/env python3
"""
Real Amadeus Flight Durations Population Script
Uses the working Flight Offers API to get real flight durations and populate the database.
"""

import os
import asyncio
import aiohttp
import psycopg2
import uuid
from datetime import datetime, timedelta
from typing import Optional

class RealAmadeusPopulator:
    def __init__(self):
        self.client_id = os.getenv('AMADEUS_CLIENT_ID')
        self.client_secret = os.getenv('AMADEUS_CLIENT_SECRET')
        self.base_url = 'https://test.api.amadeus.com'
        self.database_url = os.getenv('DATABASE_URL')
        self.access_token = None
        self.session = None
        
        # European airports
        self.airports = [
            'LHR', 'LGW', 'CDG', 'ORY', 'NCE', 'AMS', 'FRA', 'MUC', 'BER',
            'MAD', 'BCN', 'VIE', 'GVA', 'FCO', 'MXP', 'ATH', 'LIS', 'OPO', 'DUB'
        ]
        
        if not all([self.client_id, self.client_secret, self.database_url]):
            raise ValueError("Missing required environment variables")
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        await self.authenticate()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def authenticate(self):
        auth_url = f"{self.base_url}/v1/security/oauth2/token"
        data = {
            'grant_type': 'client_credentials',
            'client_id': self.client_id,
            'client_secret': self.client_secret
        }
        
        async with self.session.post(auth_url, data=data) as response:
            if response.status == 200:
                token_data = await response.json()
                self.access_token = token_data['access_token']
                print("✅ Amadeus authentication successful")
            else:
                raise Exception(f"Authentication failed: {response.status}")
    
    def parse_duration(self, duration_str: str) -> int:
        """Parse ISO 8601 duration to minutes (PT1H15M -> 75)"""
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
    
    async def get_real_flight_duration(self, origin: str, destination: str) -> Optional[int]:
        """Get real flight duration using flight offers API"""
        tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
        
        params = {
            'originLocationCode': origin,
            'destinationLocationCode': destination,
            'departureDate': tomorrow,
            'adults': 1,
            'max': 1
        }
        
        headers = {'Authorization': f'Bearer {self.access_token}'}
        search_url = f"{self.base_url}/v2/shopping/flight-offers"
        
        try:
            async with self.session.get(search_url, params=params, headers=headers) as response:
                if response.status == 200:
                    data = await response.json()
                    offers = data.get('data', [])
                    
                    if offers:
                        duration_str = offers[0]['itineraries'][0].get('duration', 'PT0M')
                        duration_minutes = self.parse_duration(duration_str)
                        
                        if duration_minutes > 0:
                            print(f"   ✈️ {origin} → {destination}: {duration_minutes} minutes (Real Amadeus)")
                            return duration_minutes
                
        except Exception as e:
            print(f"   ⚠️ API call failed for {origin}-{destination}: {e}")
        
        return None
    
    def estimate_duration(self, origin: str, destination: str) -> int:
        """Fallback estimation based on known route patterns"""
        # Simple estimates for common European routes
        route_estimates = {
            ('LHR', 'CDG'): 75, ('LHR', 'AMS'): 75, ('LHR', 'FRA'): 90, ('LHR', 'MAD'): 135,
            ('CDG', 'LHR'): 75, ('CDG', 'AMS'): 80, ('CDG', 'FRA'): 85, ('CDG', 'MAD'): 120,
            ('AMS', 'LHR'): 75, ('AMS', 'CDG'): 80, ('AMS', 'FRA'): 85, ('AMS', 'BCN'): 135,
            ('FRA', 'LHR'): 90, ('FRA', 'CDG'): 85, ('FRA', 'AMS'): 85, ('FRA', 'VIE'): 85,
        }
        
        key = (origin, destination)
        reverse_key = (destination, origin)
        
        if key in route_estimates:
            return route_estimates[key]
        elif reverse_key in route_estimates:
            return route_estimates[reverse_key]
        else:
            # Default estimate based on distance zones
            return 120  # 2 hours for unknown European routes
    
    async def populate_routes(self):
        """Populate flight routes with real Amadeus data where possible"""
        print("🚀 Starting real Amadeus flight routes population...")
        
        # Clear existing routes
        conn = psycopg2.connect(self.database_url)
        with conn.cursor() as cur:
            cur.execute("DELETE FROM flight_routes")
            conn.commit()
        conn.close()
        print("🗑️ Cleared existing routes")
        
        total_routes = 0
        amadeus_routes = 0
        estimated_routes = 0
        
        # Process routes between all airport pairs
        for i, origin in enumerate(self.airports):
            print(f"\\n📍 Processing routes from {origin} ({i+1}/{len(self.airports)})")
            
            for destination in self.airports:
                if origin == destination:
                    continue
                
                # Try to get real Amadeus duration
                real_duration = await self.get_real_flight_duration(origin, destination)
                
                if real_duration:
                    duration_minutes = real_duration
                    amadeus_routes += 1
                else:
                    # Use fallback estimate
                    duration_minutes = self.estimate_duration(origin, destination)
                    estimated_routes += 1
                    print(f"   📏 {origin} → {destination}: {duration_minutes} minutes (estimated)")
                
                # Insert into database
                hours = duration_minutes // 60
                minutes = duration_minutes % 60
                
                conn = psycopg2.connect(self.database_url)
                with conn.cursor() as cur:
                    cur.execute("""
                        INSERT INTO flight_routes (
                            id, origin_airport_code, destination_airport_code,
                            estimated_duration_hours, estimated_duration_minutes,
                            total_duration_minutes, created_at, updated_at
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    """, (
                        str(uuid.uuid4()), origin, destination,
                        hours, minutes, duration_minutes,
                        datetime.now(), datetime.now()
                    ))
                    conn.commit()
                conn.close()
                
                total_routes += 1
                
                # Rate limiting
                await asyncio.sleep(0.2)
        
        print(f"\\n🎉 Route population completed!")
        print(f"   Total routes: {total_routes}")
        print(f"   Real Amadeus routes: {amadeus_routes}")
        print(f"   Estimated routes: {estimated_routes}")
        print(f"   Amadeus coverage: {(amadeus_routes/total_routes*100):.1f}%")
        
        return total_routes, amadeus_routes, estimated_routes

async def main():
    try:
        async with RealAmadeusPopulator() as populator:
            await populator.populate_routes()
            print("\\n✅ Flight routes now contain real Amadeus data where available!")
    except Exception as e:
        print(f"❌ Error: {e}")
        return False
    return True

if __name__ == "__main__":
    success = asyncio.run(main())
    if not success:
        exit(1)