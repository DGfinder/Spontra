#!/usr/bin/env python3
"""
Amadeus Flight Data Cache Population Script
Populates PostgreSQL with flight offers from Amadeus API to reduce real-time API calls
"""

import os
import sys
import asyncio
import hashlib
import json
import psycopg2
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import aiohttp
import time

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

class AmadeusFlightCache:
    def __init__(self):
        self.client_id = os.getenv('AMADEUS_CLIENT_ID')
        self.client_secret = os.getenv('AMADEUS_CLIENT_SECRET')
        self.base_url = os.getenv('AMADEUS_BASE_URL', 'https://test.api.amadeus.com')
        self.database_url = os.getenv('DATABASE_URL')
        
        if not all([self.client_id, self.client_secret, self.database_url]):
            raise ValueError("Missing required environment variables: AMADEUS_CLIENT_ID, AMADEUS_CLIENT_SECRET, DATABASE_URL")
        
        self.access_token = None
        self.token_expires_at = None
        self.session = None
        
        # Popular European routes for caching priority
        self.popular_routes = [
            ('LHR', 'CDG'), ('LHR', 'FRA'), ('LHR', 'AMS'), ('LHR', 'FCO'), ('LHR', 'MAD'),
            ('LHR', 'BCN'), ('LHR', 'MUC'), ('LHR', 'ZUR'), ('LHR', 'VIE'), ('LHR', 'BRU'),
            ('CDG', 'FRA'), ('CDG', 'FCO'), ('CDG', 'BCN'), ('CDG', 'MAD'), ('CDG', 'AMS'),
            ('FRA', 'FCO'), ('FRA', 'BCN'), ('FRA', 'MAD'), ('FRA', 'AMS'), ('FRA', 'MUC'),
            ('AMS', 'BCN'), ('AMS', 'FCO'), ('AMS', 'MAD'), ('AMS', 'MUC'), ('AMS', 'VIE'),
            ('BCN', 'FCO'), ('BCN', 'MAD'), ('BCN', 'MUC'), ('BCN', 'VIE'), ('BCN', 'ZUR'),
            ('FCO', 'MAD'), ('FCO', 'MUC'), ('FCO', 'VIE'), ('FCO', 'ZUR'), ('FCO', 'BRU'),
        ]
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        await self.authenticate()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def authenticate(self):
        """Get OAuth2 access token from Amadeus"""
        auth_url = f"{self.base_url}/v1/security/oauth2/token"
        
        data = {
            'grant_type': 'client_credentials',
            'client_id': self.client_id,
            'client_secret': self.client_secret
        }
        
        async with self.session.post(auth_url, data=data) as response:
            if response.status != 200:
                raise Exception(f"Authentication failed: {response.status}")
            
            token_data = await response.json()
            self.access_token = token_data['access_token']
            self.token_expires_at = datetime.now() + timedelta(seconds=token_data['expires_in'] - 60)
            
            print(f"✅ Authenticated with Amadeus API")
    
    async def ensure_authenticated(self):
        """Ensure we have a valid access token"""
        if not self.access_token or datetime.now() >= self.token_expires_at:
            await self.authenticate()
    
    def generate_search_hash(self, origin: str, destination: str, departure_date: str, 
                           return_date: Optional[str] = None, passengers: int = 1, 
                           cabin_class: str = 'ECONOMY') -> str:
        """Generate a hash for search parameters to use as cache key"""
        search_params = f"{origin}-{destination}-{departure_date}-{return_date or ''}-{passengers}-{cabin_class}"
        return hashlib.md5(search_params.encode()).hexdigest()
    
    async def search_flights(self, origin: str, destination: str, departure_date: str,
                           return_date: Optional[str] = None, passengers: int = 1,
                           cabin_class: str = 'ECONOMY', max_results: int = 10) -> List[Dict[Any, Any]]:
        """Search for flights using Amadeus API"""
        await self.ensure_authenticated()
        
        search_url = f"{self.base_url}/v2/shopping/flight-offers"
        
        params = {
            'originLocationCode': origin,
            'destinationLocationCode': destination,
            'departureDate': departure_date,
            'adults': passengers,
            'travelClass': cabin_class,
            'max': max_results,
            'currencyCode': 'EUR'
        }
        
        if return_date:
            params['returnDate'] = return_date
        
        headers = {
            'Authorization': f'Bearer {self.access_token}',
            'Content-Type': 'application/json'
        }
        
        start_time = time.time()
        
        try:
            async with self.session.get(search_url, params=params, headers=headers) as response:
                api_response_time = int((time.time() - start_time) * 1000)
                
                if response.status == 200:
                    data = await response.json()
                    offers = data.get('data', [])
                    
                    print(f"✅ Found {len(offers)} offers for {origin}-{destination} on {departure_date}")
                    return offers, api_response_time
                else:
                    error_text = await response.text()
                    print(f"❌ API Error {response.status}: {error_text}")
                    return [], api_response_time
                    
        except Exception as e:
            api_response_time = int((time.time() - start_time) * 1000)
            print(f"❌ Request failed: {e}")
            return [], api_response_time
    
    def extract_offer_details(self, offer: Dict[Any, Any]) -> Dict[str, Any]:
        """Extract key details from Amadeus flight offer"""
        try:
            # Get first itinerary (outbound)
            itinerary = offer['itineraries'][0]
            segments = itinerary['segments']
            first_segment = segments[0]
            last_segment = segments[-1]
            
            # Calculate total duration
            duration_str = itinerary.get('duration', 'PT0M')
            duration_minutes = self.parse_duration(duration_str)
            
            # Extract price
            price_info = offer['price']
            price_eur = float(price_info['total'])
            currency = price_info.get('currency', 'EUR')
            
            # Extract airline and flight info
            airline_code = first_segment['carrierCode']
            flight_number = f"{airline_code}{first_segment['number']}"
            
            # Count stops
            stops = len(segments) - 1
            
            return {
                'price_eur': price_eur,
                'currency': currency,
                'airline_code': airline_code,
                'flight_number': flight_number,
                'duration_minutes': duration_minutes,
                'stops': stops,
                'departure_time': first_segment['departure']['at'],
                'arrival_time': last_segment['arrival']['at']
            }
            
        except Exception as e:
            print(f"⚠️ Failed to extract offer details: {e}")
            return {}
    
    def parse_duration(self, duration_str: str) -> int:
        """Parse ISO 8601 duration string to minutes"""
        # Example: PT1H25M -> 85 minutes
        try:
            duration_str = duration_str.replace('PT', '')
            hours = 0
            minutes = 0
            
            if 'H' in duration_str:
                hours_str, remainder = duration_str.split('H')
                hours = int(hours_str)
                duration_str = remainder
            
            if 'M' in duration_str:
                minutes_str = duration_str.replace('M', '')
                if minutes_str:
                    minutes = int(minutes_str)
            
            return hours * 60 + minutes
        except:
            return 0
    
    async def cache_flight_offers(self, origin: str, destination: str, departure_date: str,
                                offers: List[Dict[Any, Any]], api_response_time: int,
                                return_date: Optional[str] = None, passengers: int = 1,
                                cabin_class: str = 'ECONOMY'):
        """Cache flight offers in PostgreSQL"""
        if not offers:
            return
        
        search_hash = self.generate_search_hash(origin, destination, departure_date, 
                                              return_date, passengers, cabin_class)
        
        # Cache for 4 hours for near-term dates, 24 hours for future dates
        departure_dt = datetime.strptime(departure_date, '%Y-%m-%d')
        days_ahead = (departure_dt - datetime.now()).days
        
        if days_ahead <= 3:
            cache_hours = 4
        elif days_ahead <= 14:
            cache_hours = 12
        else:
            cache_hours = 24
        
        expires_at = datetime.now() + timedelta(hours=cache_hours)
        
        conn = psycopg2.connect(self.database_url)
        try:
            with conn.cursor() as cursor:
                # First, invalidate existing cache for this search
                cursor.execute("""
                    UPDATE cached_flight_offers 
                    SET is_valid = false 
                    WHERE search_hash = %s
                """, (search_hash,))
                
                # Insert new offers
                for offer in offers:
                    offer_details = self.extract_offer_details(offer)
                    
                    cursor.execute("""
                        INSERT INTO cached_flight_offers (
                            origin_airport, destination_airport, departure_date, return_date,
                            search_hash, amadeus_data, price_eur, currency, airline_code,
                            flight_number, duration_minutes, stops, cabin_class, passengers,
                            expires_at, api_response_time_ms
                        ) VALUES (
                            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                        )
                    """, (
                        origin, destination, departure_date, return_date,
                        search_hash, json.dumps(offer), offer_details.get('price_eur'),
                        offer_details.get('currency', 'EUR'), offer_details.get('airline_code'),
                        offer_details.get('flight_number'), offer_details.get('duration_minutes'),
                        offer_details.get('stops', 0), cabin_class, passengers,
                        expires_at, api_response_time
                    ))
                
                conn.commit()
                print(f"✅ Cached {len(offers)} offers for {origin}-{destination} on {departure_date}")
                
        except Exception as e:
            conn.rollback()
            print(f"❌ Failed to cache offers: {e}")
        finally:
            conn.close()
    
    async def populate_popular_routes(self, days_ahead: int = 30, max_routes: int = 20):
        """Populate cache with popular routes for the next N days"""
        print(f"🛫 Starting to populate cache for {min(max_routes, len(self.popular_routes))} popular routes, {days_ahead} days ahead")
        
        routes_processed = 0
        total_offers_cached = 0
        
        for origin, destination in self.popular_routes[:max_routes]:
            print(f"\n📍 Processing route: {origin} → {destination}")
            
            route_offers = 0
            
            for days in range(1, days_ahead + 1):
                departure_date = (datetime.now() + timedelta(days=days)).strftime('%Y-%m-%d')
                
                try:
                    offers, response_time = await self.search_flights(
                        origin=origin,
                        destination=destination,
                        departure_date=departure_date,
                        max_results=5  # Limit to top 5 offers per route/date
                    )
                    
                    if offers:
                        await self.cache_flight_offers(
                            origin, destination, departure_date, offers, response_time
                        )
                        route_offers += len(offers)
                    
                    # Rate limiting: 10 requests per second max
                    await asyncio.sleep(0.1)
                    
                except Exception as e:
                    print(f"❌ Failed to process {origin}-{destination} on {departure_date}: {e}")
                    continue
            
            routes_processed += 1
            total_offers_cached += route_offers
            print(f"✅ Route {origin}-{destination}: {route_offers} offers cached")
            
            # Longer pause between routes to be respectful to the API
            await asyncio.sleep(1)
        
        print(f"\n🎉 Cache population complete!")
        print(f"   Routes processed: {routes_processed}")
        print(f"   Total offers cached: {total_offers_cached}")
        print(f"   Average offers per route: {total_offers_cached / max(routes_processed, 1):.1f}")
    
    async def cleanup_expired_cache(self):
        """Remove expired cache entries"""
        conn = psycopg2.connect(self.database_url)
        try:
            with conn.cursor() as cursor:
                cursor.execute("""
                    DELETE FROM cached_flight_offers 
                    WHERE expires_at < NOW() OR is_valid = false
                """)
                deleted_count = cursor.rowcount
                conn.commit()
                
                print(f"🧹 Cleaned up {deleted_count} expired cache entries")
                return deleted_count
        finally:
            conn.close()
    
    async def get_cache_stats(self):
        """Get cache statistics"""
        conn = psycopg2.connect(self.database_url)
        try:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT 
                        COUNT(*) as total_entries,
                        COUNT(CASE WHEN expires_at > NOW() AND is_valid THEN 1 END) as valid_entries,
                        COUNT(CASE WHEN expires_at <= NOW() OR NOT is_valid THEN 1 END) as expired_entries,
                        COUNT(DISTINCT origin_airport || '-' || destination_airport) as unique_routes,
                        ROUND(AVG(api_response_time_ms), 0) as avg_response_time_ms,
                        MIN(cached_at) as oldest_entry,
                        MAX(cached_at) as newest_entry
                    FROM cached_flight_offers
                """)
                
                stats = cursor.fetchone()
                
                if stats[0] > 0:  # If we have data
                    print(f"\n📊 Cache Statistics:")
                    print(f"   Total entries: {stats[0]:,}")
                    print(f"   Valid entries: {stats[1]:,}")
                    print(f"   Expired entries: {stats[2]:,}")
                    print(f"   Unique routes: {stats[3]:,}")
                    print(f"   Avg API response time: {stats[4]}ms")
                    print(f"   Cache age range: {stats[5]} to {stats[6]}")
                    
                    if stats[1] > 0:
                        hit_rate = (stats[1] / stats[0]) * 100
                        print(f"   Cache validity rate: {hit_rate:.1f}%")
                else:
                    print("📊 Cache is empty")
                    
        finally:
            conn.close()

async def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Populate Amadeus flight cache')
    parser.add_argument('--days', type=int, default=14, help='Days ahead to cache (default: 14)')
    parser.add_argument('--routes', type=int, default=10, help='Number of popular routes to cache (default: 10)')
    parser.add_argument('--cleanup', action='store_true', help='Clean expired cache entries')
    parser.add_argument('--stats', action='store_true', help='Show cache statistics')
    
    args = parser.parse_args()
    
    try:
        async with AmadeusFlightCache() as cache:
            if args.cleanup:
                await cache.cleanup_expired_cache()
            
            if args.stats:
                await cache.get_cache_stats()
            
            if not args.cleanup and not args.stats:
                await cache.populate_popular_routes(
                    days_ahead=args.days,
                    max_routes=args.routes
                )
                
                # Show final stats
                await cache.get_cache_stats()
                
    except KeyboardInterrupt:
        print("\n⏹️ Cache population interrupted by user")
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
