import { enableMockFallbacks, getErrorMessage } from '@/lib/environment'

interface YouTubeVideo {
  id: string
  title: string
  description: string
  thumbnail: {
    url: string
    width: number
    height: number
  }
  channelTitle: string
  publishedAt: string
  duration?: string
  viewCount?: string
  qualityScore?: number
  isShort?: boolean
  engagementRate?: number
  source: 'youtube' | 'ugc'
}

interface YouTubeSearchParams {
  destination: string
  activity: string
  maxResults?: number
}

class YouTubeService {
  private apiKey: string
  private baseUrl = 'https://www.googleapis.com/youtube/v3'

  constructor() {
    // Use server-only API by default; client has no key. In dev fallback to mock.
    this.apiKey = ''
  }

  async searchActivityVideos({
    destination,
    activity,
    maxResults = 5
  }: YouTubeSearchParams): Promise<YouTubeVideo[]> {
    try {
      // Prefer server-side proxy route so keys never reach the client
      const res = await fetch(`/api/youtube/videos?destination=${encodeURIComponent(destination)}&activity=${encodeURIComponent(activity)}&maxResults=${maxResults}`)
      const json = await res.json()
      if (json.ok && Array.isArray(json.data)) {
        // Map to expected shape with Shorts preference scoring
        const scored = (json.data as any[]).map((v) => ({
          id: v.id,
          title: v.title,
          description: v.description,
          thumbnail: { url: v.thumbnail, width: 320, height: 180 },
          channelTitle: v.channelTitle,
          publishedAt: v.publishedAt,
          isShort: /#shorts|short/gi.test(`${v.title} ${v.description}`),
          source: 'youtube' as const,
        }))
        const ranked = await this.scoreVideos(scored, destination, activity)
        return ranked.sort((a, b) => (b.qualityScore || 0) - (a.qualityScore || 0)).slice(0, maxResults)
      }
      if (enableMockFallbacks) {
        return this.getMockVideos(destination, activity)
      }
      throw new Error('Video proxy unavailable')
    } catch (error) {
      console.error('Error fetching YouTube videos:', error)
      if (enableMockFallbacks) {
        // Fallback to mock data on error
        return this.getMockVideos(destination, activity)
      }
      throw getErrorMessage(error, 'Video search').message
    }
  }

  private async searchWithOptions(
    destination: string, 
    activity: string, 
    duration: 'short' | 'medium', 
    order: 'relevance' | 'viewCount'
  ): Promise<YouTubeVideo[]> {
    const query = this.buildSearchQuery(destination, activity)
    
    const searchUrl = new URL(`${this.baseUrl}/search`)
    searchUrl.searchParams.append('part', 'snippet')
    searchUrl.searchParams.append('q', query)
    searchUrl.searchParams.append('type', 'video')
    searchUrl.searchParams.append('videoDuration', duration)
    searchUrl.searchParams.append('videoDefinition', 'high')
    searchUrl.searchParams.append('maxResults', '10')
    searchUrl.searchParams.append('order', order)
    searchUrl.searchParams.append('publishedAfter', this.getRecentDateISO()) // Recent content only
    searchUrl.searchParams.append('key', this.apiKey)

    const response = await fetch(searchUrl.toString())
    
    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`)
    }

    const data = await response.json()
    return this.parseSearchResults(data)
  }

  private deduplicateVideos(videos: YouTubeVideo[]): YouTubeVideo[] {
    const seen = new Set<string>()
    return videos.filter(video => {
      if (seen.has(video.id)) return false
      seen.add(video.id)
      return true
    })
  }

  private async scoreVideos(videos: YouTubeVideo[], destination: string, activity: string): Promise<YouTubeVideo[]> {
    return videos.map(video => ({
      ...video,
      qualityScore: this.calculateQualityScore(video, destination, activity),
      source: 'youtube' as const
    }))
  }

  private calculateQualityScore(video: YouTubeVideo, destination: string, activity: string): number {
    let score = 0
    
    // Title relevance (max 30 points)
    const titleLower = video.title.toLowerCase()
    const destLower = destination.toLowerCase()
    const activityLower = activity.toLowerCase()
    
    if (titleLower.includes(destLower)) score += 15
    if (titleLower.includes(activityLower)) score += 15
    
    // Travel keywords bonus (max 20 points)
    const travelKeywords = ['travel', 'guide', 'visit', 'tour', 'experience', 'explore', 'trip', 'vlog']
    const matchedKeywords = travelKeywords.filter(keyword => titleLower.includes(keyword))
    score += Math.min(matchedKeywords.length * 5, 20)
    
    // Channel credibility (max 25 points)
    const channelLower = video.channelTitle.toLowerCase()
    if (channelLower.includes('travel')) score += 10
    if (channelLower.includes('tourism')) score += 10
    if (channelLower.includes('official')) score += 5
    
    // Recency bonus (max 15 points)
    const publishDate = new Date(video.publishedAt)
    const monthsAgo = (Date.now() - publishDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
    if (monthsAgo < 6) score += 15
    else if (monthsAgo < 12) score += 10
    else if (monthsAgo < 24) score += 5
    
    // Duration preference (max 10 points)
    // Prefer shorter content for mobile consumption
    if (video.isShort) score += 10
    
    return Math.min(score, 100) // Cap at 100
  }

  private getRecentDateISO(): string {
    // Get content from last 2 years for freshness
    const date = new Date()
    date.setFullYear(date.getFullYear() - 2)
    return date.toISOString()
  }

  private buildSearchQuery(destination: string, activity: string): string {
    // Optimize search terms for travel content discovery
    const activityTerms = {
      'hiking': 'hiking trail mountain nature',
      'food-tour': 'food tour cuisine local restaurant',
      'cultural-walk': 'historic city culture museum architecture',
      'nightlife': 'nightlife bars clubs evening entertainment',
      'nature-park': 'nature park wildlife conservation',
      'shopping': 'shopping market boutique local crafts',
      'adventure': 'adventure outdoor sports activities',
      'beaches': 'beach coast water activities',
      'sightseeing': 'sightseeing landmarks attractions tours'
    }

    const enhancedActivity = activityTerms[activity as keyof typeof activityTerms] || activity
    
    return `${destination} ${enhancedActivity} travel vlog short`
  }

  private parseSearchResults(data: any): YouTubeVideo[] {
    if (!data.items) return []

    return data.items.map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: {
        url: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
        width: item.snippet.thumbnails.medium?.width || 320,
        height: item.snippet.thumbnails.medium?.height || 180
      },
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
      isShort: this.detectShortContent(item.snippet),
      source: 'youtube' as const
    }))
  }

  private detectShortContent(snippet: any): boolean {
    // Detect if content is likely a short based on title/description patterns
    const title = snippet.title.toLowerCase()
    const description = snippet.description?.toLowerCase() || ''
    
    // Common short indicators
    const shortIndicators = ['#shorts', 'short', '60 seconds', 'quick', 'in 1 minute', 'tiktok']
    return shortIndicators.some(indicator => 
      title.includes(indicator) || description.includes(indicator)
    )
  }

  private getMockVideos(destination: string, activity: string): YouTubeVideo[] {
    // Mock data for development/fallback
    return [
      {
        id: `mock-${activity}-1`,
        title: `Amazing ${activity} in ${destination} - Travel Guide #shorts`,
        description: `Discover the best ${activity} experiences in ${destination}. Join us on this incredible journey!`,
        thumbnail: {
          url: `/api/placeholder/320/180?text=${activity}+in+${destination}`,
          width: 320,
          height: 180
        },
        channelTitle: 'Spontra Travel',
        publishedAt: new Date().toISOString(),
        qualityScore: 85,
        isShort: true,
        source: 'youtube' as const
      },
      {
        id: `mock-${activity}-2`,
        title: `Local's Guide to ${activity} in ${destination}`,
        description: `Insider tips and hidden gems for ${activity} enthusiasts visiting ${destination}.`,
        thumbnail: {
          url: `/api/placeholder/320/180?text=Local+${activity}+Guide`,
          width: 320,
          height: 180
        },
        channelTitle: 'Local Experts Travel',
        publishedAt: new Date().toISOString(),
        qualityScore: 78,
        isShort: false,
        source: 'youtube' as const
      },
      {
        id: `mock-${activity}-3`,
        title: `60 Second ${activity} Experience - ${destination} Quick Tour`,
        description: `Quick ${activity} highlights in ${destination}. Perfect for spontaneous travelers! #shorts`,
        thumbnail: {
          url: `/api/placeholder/320/180?text=Quick+${activity}+Tour`,
          width: 320,
          height: 180
        },
        channelTitle: 'Travel Shorts',
        publishedAt: new Date().toISOString(),
        qualityScore: 92,
        isShort: true,
        source: 'youtube' as const
      }
    ]
  }

  getVideoEmbedUrl(videoId: string): string {
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`
  }

  getVideoWatchUrl(videoId: string): string {
    return `https://www.youtube.com/watch?v=${videoId}`
  }
}

export const youtubeService = new YouTubeService()
export type { YouTubeVideo, YouTubeSearchParams }