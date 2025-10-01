#!/usr/bin/env python3
"""
Quick Data Population Script
Populates essential data without requiring external API keys
"""

import os
import psycopg2
import json
from datetime import datetime, timedelta

def populate_airline_data():
    """Populate enhanced airline data with logos and info"""
    
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("❌ DATABASE_URL environment variable not set")
        return
    
    airlines_data = [
        {
            'iata': 'BA', 'icao': 'BAW', 'name': 'British Airways', 'country': 'GB',
            'alliance': 'oneworld', 'logo': 'https://logos.skyscnr.com/images/airlines/favicon/BA.png',
            'website': 'https://www.britishairways.com', 'hubs': ['LHR', 'LGW']
        },
        {
            'iata': 'AF', 'icao': 'AFR', 'name': 'Air France', 'country': 'FR',
            'alliance': 'SkyTeam', 'logo': 'https://logos.skyscnr.com/images/airlines/favicon/AF.png',
            'website': 'https://www.airfrance.com', 'hubs': ['CDG', 'ORY']
        },
        {
            'iata': 'LH', 'icao': 'DLH', 'name': 'Lufthansa', 'country': 'DE',
            'alliance': 'Star Alliance', 'logo': 'https://logos.skyscnr.com/images/airlines/favicon/LH.png',
            'website': 'https://www.lufthansa.com', 'hubs': ['FRA', 'MUC']
        },
        {
            'iata': 'KL', 'icao': 'KLM', 'name': 'KLM Royal Dutch Airlines', 'country': 'NL',
            'alliance': 'SkyTeam', 'logo': 'https://logos.skyscnr.com/images/airlines/favicon/KL.png',
            'website': 'https://www.klm.com', 'hubs': ['AMS']
        },
        {
            'iata': 'FR', 'icao': 'RYR', 'name': 'Ryanair', 'country': 'IE',
            'alliance': None, 'logo': 'https://logos.skyscnr.com/images/airlines/favicon/FR.png',
            'website': 'https://www.ryanair.com', 'hubs': ['DUB', 'STN', 'BGY']
        },
        {
            'iata': 'U2', 'icao': 'EZY', 'name': 'easyJet', 'country': 'GB',
            'alliance': None, 'logo': 'https://logos.skyscnr.com/images/airlines/favicon/U2.png',
            'website': 'https://www.easyjet.com', 'hubs': ['LGW', 'LTN', 'CDG']
        },
        {
            'iata': 'LX', 'icao': 'SWR', 'name': 'Swiss International Air Lines', 'country': 'CH',
            'alliance': 'Star Alliance', 'logo': 'https://logos.skyscnr.com/images/airlines/favicon/LX.png',
            'website': 'https://www.swiss.com', 'hubs': ['ZUR', 'GVA']
        },
        {
            'iata': 'OS', 'icao': 'AUA', 'name': 'Austrian Airlines', 'country': 'AT',
            'alliance': 'Star Alliance', 'logo': 'https://logos.skyscnr.com/images/airlines/favicon/OS.png',
            'website': 'https://www.austrian.com', 'hubs': ['VIE']
        },
        {
            'iata': 'IB', 'icao': 'IBE', 'name': 'Iberia', 'country': 'ES',
            'alliance': 'oneworld', 'logo': 'https://logos.skyscnr.com/images/airlines/favicon/IB.png',
            'website': 'https://www.iberia.com', 'hubs': ['MAD']
        },
        {
            'iata': 'AZ', 'icao': 'ITY', 'name': 'ITA Airways', 'country': 'IT',
            'alliance': 'SkyTeam', 'logo': 'https://logos.skyscnr.com/images/airlines/favicon/AZ.png',
            'website': 'https://www.ita-airways.com', 'hubs': ['FCO', 'MXP']
        }
    ]
    
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("❌ DATABASE_URL environment variable not set")
        return
    conn = psycopg2.connect(database_url)
    
    try:
        with conn.cursor() as cursor:
            for airline in airlines_data:
                cursor.execute("""
                    INSERT INTO airlines_enhanced (
                        iata_code, icao_code, name, country_code, alliance, 
                        logo_url, website, hubs
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (iata_code) DO UPDATE SET
                        icao_code = EXCLUDED.icao_code,
                        name = EXCLUDED.name,
                        country_code = EXCLUDED.country_code,
                        alliance = EXCLUDED.alliance,
                        logo_url = EXCLUDED.logo_url,
                        website = EXCLUDED.website,
                        hubs = EXCLUDED.hubs,
                        last_updated = NOW()
                """, (
                    airline['iata'], airline['icao'], airline['name'], airline['country'],
                    airline['alliance'], airline['logo'], airline['website'], 
                    json.dumps(airline['hubs'])
                ))
            
            conn.commit()
            print(f"✅ Populated {len(airlines_data)} airlines with enhanced data")
            
    except Exception as e:
        conn.rollback()
        print(f"❌ Failed to populate airline data: {e}")
    finally:
        conn.close()

def populate_airport_facilities():
    """Populate basic airport facilities for major airports"""
    
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("❌ DATABASE_URL environment variable not set")
        return
    
    facilities_data = [
        # London Heathrow
        {'airport': 'LHR', 'type': 'lounge', 'name': 'British Airways Galleries Lounge', 'terminal': '5', 'rating': 4.2},
        {'airport': 'LHR', 'type': 'restaurant', 'name': 'Gordon Ramsay Plane Food', 'terminal': '5', 'rating': 4.0},
        {'airport': 'LHR', 'type': 'transport', 'name': 'Heathrow Express', 'terminal': 'All', 'rating': 4.5},
        {'airport': 'LHR', 'type': 'shop', 'name': 'Harrods', 'terminal': '5', 'rating': 4.3},
        
        # Charles de Gaulle
        {'airport': 'CDG', 'type': 'lounge', 'name': 'Air France Business Lounge', 'terminal': '2E', 'rating': 4.1},
        {'airport': 'CDG', 'type': 'transport', 'name': 'RER B Train', 'terminal': 'All', 'rating': 3.8},
        {'airport': 'CDG', 'type': 'restaurant', 'name': 'Ladurée', 'terminal': '2E', 'rating': 4.4},
        
        # Frankfurt
        {'airport': 'FRA', 'type': 'lounge', 'name': 'Lufthansa Business Lounge', 'terminal': '1', 'rating': 4.3},
        {'airport': 'FRA', 'type': 'transport', 'name': 'S-Bahn S8/S9', 'terminal': 'All', 'rating': 4.2},
        
        # Amsterdam Schiphol
        {'airport': 'AMS', 'type': 'lounge', 'name': 'KLM Crown Lounge', 'terminal': 'All', 'rating': 4.0},
        {'airport': 'AMS', 'type': 'transport', 'name': 'NS Train', 'terminal': 'All', 'rating': 4.4},
        {'airport': 'AMS', 'type': 'service', 'name': 'Schiphol Library', 'terminal': 'All', 'rating': 4.6},
    ]
    
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("❌ DATABASE_URL environment variable not set")
        return
    conn = psycopg2.connect(database_url)
    
    try:
        with conn.cursor() as cursor:
            for facility in facilities_data:
                cursor.execute("""
                    INSERT INTO airport_facilities (
                        airport_code, facility_type, facility_name, terminal, rating
                    ) VALUES (%s, %s, %s, %s, %s)
                    ON CONFLICT DO NOTHING
                """, (
                    facility['airport'], facility['type'], facility['name'], 
                    facility['terminal'], facility['rating']
                ))
            
            conn.commit()
            print(f"✅ Populated {len(facilities_data)} airport facilities")
            
    except Exception as e:
        conn.rollback()
        print(f"❌ Failed to populate facilities: {e}")
    finally:
        conn.close()

def populate_sample_videos():
    """Populate sample destination videos without API calls"""
    
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("❌ DATABASE_URL environment variable not set")
        return
    
    sample_videos = [
        {
            'destination': 'London', 'activity': 'adventure', 'video_id': 'dQw4w9WgXcQ',
            'title': 'London Adventure Guide - Hidden Gems', 'quality_score': 8.5
        },
        {
            'destination': 'London', 'activity': 'party', 'video_id': 'dQw4w9WgXcR',
            'title': 'London Nightlife - Best Bars and Clubs', 'quality_score': 7.8
        },
        {
            'destination': 'Paris', 'activity': 'culture', 'video_id': 'dQw4w9WgXcS',
            'title': 'Paris Cultural Tour - Museums and Art', 'quality_score': 9.2
        },
        {
            'destination': 'Paris', 'activity': 'food', 'video_id': 'dQw4w9WgXcT',
            'title': 'Paris Food Guide - Local Cuisine', 'quality_score': 8.9
        },
        {
            'destination': 'Rome', 'activity': 'history', 'video_id': 'dQw4w9WgXcU',
            'title': 'Rome Historical Sites - Ancient Wonders', 'quality_score': 9.0
        }
    ]
    
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("❌ DATABASE_URL environment variable not set")
        return
    conn = psycopg2.connect(database_url)
    
    try:
        with conn.cursor() as cursor:
            for video in sample_videos:
                cursor.execute("""
                    INSERT INTO cached_destination_videos (
                        destination, activity, video_id, title, quality_score,
                        relevance_score, duration_seconds, view_count
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (destination, COALESCE(activity, ''), video_id) DO NOTHING
                """, (
                    video['destination'], video['activity'], video['video_id'],
                    video['title'], video['quality_score'], video['quality_score'],
                    300, 100000  # 5 min duration, 100k views
                ))
            
            conn.commit()
            print(f"✅ Populated {len(sample_videos)} sample destination videos")
            
    except Exception as e:
        conn.rollback()
        print(f"❌ Failed to populate sample videos: {e}")
    finally:
        conn.close()

def main():
    print("🚀 Starting Quick Data Population...")
    print("=" * 50)
    
    try:
        # 1. Populate airline data
        print("✈️ Populating airline data...")
        populate_airline_data()
        
        # 2. Populate airport facilities
        print("🏢 Populating airport facilities...")
        populate_airport_facilities()
        
        # 3. Populate sample videos
        print("📺 Populating sample videos...")
        populate_sample_videos()
        
        print("\n" + "=" * 50)
        print("🎉 Quick data population complete!")
        print("\nWhat's been added:")
        print("  • 10 major European airlines with logos and hub info")
        print("  • 12 airport facilities (lounges, transport, restaurants)")
        print("  • 5 sample destination videos for testing")
        print("\nNext steps:")
        print("  • Get Amadeus API credentials to populate real flight data")
        print("  • Get YouTube API key to populate video content")
        print("  • Run the admin panel to see the enhanced data")
        
    except Exception as e:
        print(f"❌ Error during population: {e}")

if __name__ == "__main__":
    main()
