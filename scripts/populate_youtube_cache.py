#!/usr/bin/env python3
"""
YouTube Video Cache Population Script
Populates PostgreSQL with destination videos to reduce YouTube API quota usage
"""

import os
import sys
import asyncio
import psycopg2
import aiohttp
import json
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

class YouTubeVideoCache:
    def __init__(self):
        self.api_key = os.getenv('YOUTUBE_API_KEY')
        self.database_url = os.getenv('SEARCH_DATABASE_URL', os.getenv('DATABASE_URL'))
        
        if not all([self.api_key, self.database_url]):
            raise ValueError("Missing required environment variables: YOUTUBE_API_KEY, DATABASE_URL")
        
        self.base_url = 'https://www.googleapis.com/youtube/v3'
        self.session = None
        
        # Destinations to cache (European cities from our flight data)
        self.destinations = [
            'London', 'Paris', 'Rome', 'Barcelona', 'Amsterdam', 'Frankfurt',
            'Berlin', 'Munich', 'Vienna', 'Prague', 'Budapest', 'Stockholm',
            'Copenhagen', 'Oslo', 'Helsinki', 'Warsaw', 'Lisbon', 'Madrid',
            'Milan', 'Venice', 'Florence', 'Athens', 'Istanbul', 'Zurich',
            'Geneva', 'Brussels', 'Dublin', 'Edinburgh', 'Manchester'
        ]
        
        # Activity types to cache
        self.activities = [
            'adventure', 'party', 'learn', 'shopping', 'food', 'culture',
            'nightlife', 'museums', 'parks', 'architecture', 'art', 'history',
            'walking tour', 'local guide', 'hidden gems', 'photography'
        ]
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def search_videos(self, query: str, max_results: int = 10) -> List[Dict[str, Any]]:
        """Search for videos using YouTube Data API"""
        search_url = f"{self.base_url}/search"
        
        params = {
            'part': 'snippet',
            'q': query,
            'type': 'video',
            'maxResults': max_results,
            'order': 'relevance',
            'videoDuration': 'any',
            'videoDefinition': 'any',
            'key': self.api_key
        }
        
        try:
            async with self.session.get(search_url, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    videos = data.get('items', [])
                    
                    # Get additional video details
                    if videos:
                        video_ids = [video['id']['videoId'] for video in videos]
                        enhanced_videos = await self.get_video_details(video_ids)
                        return enhanced_videos
                    
                    return []
                else:
                    error_text = await response.text()
                    print(f"❌ YouTube API Error {response.status}: {error_text}")
                    return []
                    
        except Exception as e:
            print(f"❌ YouTube search failed: {e}")
            return []
    
    async def get_video_details(self, video_ids: List[str]) -> List[Dict[str, Any]]:
        """Get detailed video information including statistics"""
        details_url = f"{self.base_url}/videos"
        
        params = {
            'part': 'snippet,statistics,contentDetails',
            'id': ','.join(video_ids),
            'key': self.api_key
        }
        
        try:
            async with self.session.get(details_url, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    return data.get('items', [])
                return []
        except Exception as e:
            print(f"❌ Failed to get video details: {e}")
            return []
    
    def calculate_quality_score(self, video: Dict[str, Any], destination: str, activity: str) -> float:
        """Calculate quality score for video relevance"""
        try:
            snippet = video['snippet']
            stats = video.get('statistics', {})
            
            title = snippet.get('title', '').lower()
            description = snippet.get('description', '').lower()
            
            score = 0.0
            
            # Title relevance (40% weight)
            if destination.lower() in title:
                score += 4.0
            if activity and activity.lower() in title:
                score += 2.0
            
            # Description relevance (20% weight)
            if destination.lower() in description:
                score += 1.0
            if activity and activity.lower() in description:
                score += 1.0
            
            # Video statistics (40% weight)
            view_count = int(stats.get('viewCount', 0))
            like_count = int(stats.get('likeCount', 0))
            
            # Normalize view count (log scale)
            if view_count > 0:
                import math
                view_score = min(2.0, math.log10(view_count) / 3)  # Max 2 points
                score += view_score
            
            # Like ratio
            if view_count > 0 and like_count > 0:
                like_ratio = like_count / view_count
                if like_ratio > 0.01:  # 1% like ratio is good
                    score += 1.0
                elif like_ratio > 0.005:  # 0.5% like ratio is decent
                    score += 0.5
            
            # Duration preference (prefer 5-20 minute videos)
            duration_str = video.get('contentDetails', {}).get('duration', 'PT0S')
            duration_seconds = self.parse_youtube_duration(duration_str)
            
            if 300 <= duration_seconds <= 1200:  # 5-20 minutes
                score += 1.0
            elif 120 <= duration_seconds <= 300:  # 2-5 minutes
                score += 0.5
            
            return min(10.0, score)  # Cap at 10.0
            
        except Exception as e:
            print(f"⚠️ Failed to calculate quality score: {e}")
            return 0.0
    
    def parse_youtube_duration(self, duration_str: str) -> int:
        """Parse YouTube duration string to seconds"""
        # Example: PT4M13S -> 253 seconds
        try:
            import re
            match = re.match(r'PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?', duration_str)
            if match:
                hours = int(match.group(1) or 0)
                minutes = int(match.group(2) or 0)
                seconds = int(match.group(3) or 0)
                return hours * 3600 + minutes * 60 + seconds
            return 0
        except:
            return 0
    
    def detect_short_content(self, video: Dict[str, Any]) -> bool:
        """Detect if video is YouTube Shorts content"""
        try:
            title = video['snippet'].get('title', '').lower()
            description = video['snippet'].get('description', '').lower()
            
            # Check for shorts indicators
            shorts_indicators = ['#shorts', 'short', 'shorts']
            return any(indicator in title or indicator in description for indicator in shorts_indicators)
        except:
            return False
    
    async def cache_videos(self, destination: str, activity: Optional[str], videos: List[Dict[str, Any]]):
        """Cache videos in PostgreSQL"""
        if not videos:
            return
        
        conn = psycopg2.connect(self.database_url)
        try:
            with conn.cursor() as cursor:
                for video in videos:
                    try:
                        snippet = video['snippet']
                        stats = video.get('statistics', {})
                        content_details = video.get('contentDetails', {})
                        
                        quality_score = self.calculate_quality_score(video, destination, activity or '')
                        is_short = self.detect_short_content(video)
                        duration_seconds = self.parse_youtube_duration(content_details.get('duration', 'PT0S'))
                        
                        cursor.execute("""
                            INSERT INTO cached_destination_videos (
                                destination, activity, video_id, title, description,
                                thumbnail_url, duration_seconds, view_count, like_count,
                                published_at, channel_title, channel_id, quality_score,
                                relevance_score, is_short, language_code
                            ) VALUES (
                                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                            )
                            ON CONFLICT (destination, COALESCE(activity, ''), video_id) 
                            DO UPDATE SET
                                title = EXCLUDED.title,
                                view_count = EXCLUDED.view_count,
                                like_count = EXCLUDED.like_count,
                                quality_score = EXCLUDED.quality_score,
                                last_validated = NOW()
                        """, (
                            destination,
                            activity,
                            video['id'],
                            snippet.get('title', '')[:255],
                            snippet.get('description', ''),
                            snippet.get('thumbnails', {}).get('high', {}).get('url'),
                            duration_seconds,
                            int(stats.get('viewCount', 0)),
                            int(stats.get('likeCount', 0)),
                            snippet.get('publishedAt'),
                            snippet.get('channelTitle', '')[:255],
                            snippet.get('channelId'),
                            quality_score,
                            quality_score,  # Use same as relevance for now
                            is_short,
                            'en'  # Default to English
                        ))
                        
                    except Exception as e:
                        print(f"⚠️ Failed to cache video {video.get('id')}: {e}")
                        continue
                
                conn.commit()
                print(f"✅ Cached {len(videos)} videos for {destination}" + (f" ({activity})" if activity else ""))
                
        except Exception as e:
            conn.rollback()
            print(f"❌ Failed to cache videos: {e}")
        finally:
            conn.close()
    
    async def populate_destination_videos(self, max_destinations: int = 10):
        """Populate video cache for destinations and activities"""
        print(f"📺 Starting to populate video cache for {min(max_destinations, len(self.destinations))} destinations")
        
        destinations_processed = 0
        total_videos_cached = 0
        
        for destination in self.destinations[:max_destinations]:
            print(f"\n🎬 Processing destination: {destination}")
            
            destination_videos = 0
            
            # Cache general destination videos
            query = f"{destination} travel guide"
            videos = await self.search_videos(query, max_results=5)
            if videos:
                await self.cache_videos(destination, None, videos)
                destination_videos += len(videos)
            
            # Cache activity-specific videos
            for activity in self.activities[:8]:  # Limit to top 8 activities
                query = f"{destination} {activity} travel"
                videos = await self.search_videos(query, max_results=3)
                if videos:
                    await self.cache_videos(destination, activity, videos)
                    destination_videos += len(videos)
                
                # Rate limiting
                await asyncio.sleep(0.5)
            
            destinations_processed += 1
            total_videos_cached += destination_videos
            print(f"✅ Destination {destination}: {destination_videos} videos cached")
            
            # Longer pause between destinations
            await asyncio.sleep(2)
        
        print(f"\n🎉 Video cache population complete!")
        print(f"   Destinations processed: {destinations_processed}")
        print(f"   Total videos cached: {total_videos_cached}")
        print(f"   Average videos per destination: {total_videos_cached / max(destinations_processed, 1):.1f}")

async def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Populate YouTube video cache')
    parser.add_argument('--destinations', type=int, default=5, help='Number of destinations to cache (default: 5)')
    parser.add_argument('--cleanup', action='store_true', help='Clean old video cache')
    parser.add_argument('--stats', action='store_true', help='Show cache statistics')
    
    args = parser.parse_args()
    
    try:
        async with YouTubeVideoCache() as cache:
            if args.cleanup:
                await cache.cleanup_old_videos()
            
            if args.stats:
                await cache.get_cache_stats()
            
            if not args.cleanup and not args.stats:
                await cache.populate_destination_videos(max_destinations=args.destinations)
                
    except KeyboardInterrupt:
        print("\n⏹️ Video cache population interrupted by user")
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
