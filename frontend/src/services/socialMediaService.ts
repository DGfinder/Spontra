import { adminAuthService } from './adminAuthService'

export interface SocialPost {
  id: string
  platform: 'instagram' | 'facebook' | 'twitter' | 'youtube' | 'linkedin' | 'tiktok'
  content: {
    text: string
    mediaType: 'image' | 'video' | 'carousel' | 'story' | 'reel'
    mediaUrls: string[]
    hashtags: string[]
    mentions: string[]
  }
  destination?: {
    iataCode: string
    cityName: string
    countryName: string
  }
  status: 'draft' | 'scheduled' | 'published' | 'failed'
  scheduledAt?: string
  publishedAt?: string
  metrics: {
    impressions: number
    reach: number
    likes: number
    comments: number
    shares: number
    clicks: number
    saves: number
    engagementRate: number
    clickThroughRate: number
  }
  performance: {
    trend: number
    compared_to: 'previous_post' | 'average'
    best_time?: string
    demographics: {
      topCountries: Array<{ country: string; percentage: number }>
      ageGroups: Array<{ range: string; percentage: number }>
      gender: { male: number; female: number; other: number }
    }
  }
  createdAt: string
  updatedAt: string
}

export interface SocialStats {
  totalPosts: number
  totalFollowers: number
  totalImpressions: number
  avgEngagementRate: number
  topPerformingPost: string
  growthRate: number
  platformBreakdown: Array<{
    platform: string
    followers: number
    posts: number
    engagement: number
    growth: number
  }>
}

export interface ContentIdea {
  id: string
  title: string
  description: string
  destination: string
  suggestedPlatforms: string[]
  estimatedEngagement: number
  trendingScore: number
  hashtags: string[]
  contentType: 'image' | 'video' | 'carousel' | 'story'
  urgency: 'low' | 'medium' | 'high'
}

export interface PlatformConnection {
  platform: string
  connected: boolean
  accountName?: string
  followers?: number
  lastSync?: string
  error?: string
}

interface SocialMediaServiceConfig {
  baseUrl: string
  timeout: number
}

class SocialMediaService {
  private config: SocialMediaServiceConfig
  private platformConnections: Map<string, boolean> = new Map()
  private lastConnectionCheck: Date | null = null
  private connectionErrors: string[] = []

  constructor(config?: Partial<SocialMediaServiceConfig>) {
    this.config = {
      baseUrl: process.env.NEXT_PUBLIC_SOCIAL_API_URL || 'http://localhost:8086',
      timeout: 30000,
      ...config
    }
  }

  /**
   * Check service and social platform connections
   */
  async checkConnections(): Promise<{
    service: boolean
    platforms: PlatformConnection[]
    errors: string[]
  }> {
    const errors: string[] = []
    let serviceConnected = false
    const platforms: PlatformConnection[] = []
    
    try {
      const response = await this.apiRequest('/health')
      serviceConnected = true
      
      // Check social platform connections
      const connectionStatus = await this.apiRequest<{
        platforms: Array<{
          platform: string
          connected: boolean
          accountName?: string
          followers?: number
          lastSync?: string
          error?: string
        }>
      }>('/connections/status')
      
      connectionStatus.platforms.forEach(platform => {
        this.platformConnections.set(platform.platform, platform.connected)
        platforms.push(platform)
        
        if (!platform.connected) {
          errors.push(`${platform.platform} not connected`)
        }
      })
      
    } catch (error) {
      errors.push('Social media service not available')
    }

    this.lastConnectionCheck = new Date()
    this.connectionErrors = errors

    return {
      service: serviceConnected,
      platforms,
      errors
    }
  }

  /**
   * Get connection status without making requests
   */
  getConnectionStatus() {
    return {
      service: true,
      platforms: Array.from(this.platformConnections.entries()).map(([platform, connected]) => ({
        platform,
        connected
      })),
      lastChecked: this.lastConnectionCheck,
      errors: this.connectionErrors
    }
  }

  /**
   * Make authenticated API request
   */
  private async apiRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const token = adminAuthService.getToken()
    
    if (!token) {
      throw new Error('No authentication token available')
    }

    const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
      },
      signal: AbortSignal.timeout(this.config.timeout)
    })

    if (!response.ok) {
      if (response.status === 401) {
        const refreshed = await adminAuthService.refreshToken()
        if (refreshed) {
          return this.apiRequest(endpoint, options)
        } else {
          adminAuthService.logout()
          throw new Error('Authentication expired')
        }
      }
      
      throw new Error(`Social Media API request failed: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data
  }

  /**
   * Get social media statistics
   */
  async getSocialStats(timeRange: '7d' | '30d' | '90d' = '30d'): Promise<SocialStats> {
    try {
      const connectedPlatforms = Array.from(this.platformConnections.values()).some(connected => connected)
      if (!connectedPlatforms) {
        throw new Error('No social media platforms connected')
      }

      return await this.apiRequest<SocialStats>(`/stats?range=${timeRange}`)
    } catch (error) {
      console.error('Failed to fetch social media stats:', error)
      throw new Error('Social media statistics not available - please connect social media accounts')
    }
  }

  /**
   * Get all posts
   */
  async getPosts(filters: {
    platform?: string
    status?: string
    search?: string
    sortBy?: string
    page?: number
    limit?: number
  } = {}): Promise<{ posts: SocialPost[]; total: number; hasMore: boolean }> {
    try {
      const connectedPlatforms = Array.from(this.platformConnections.values()).some(connected => connected)
      if (!connectedPlatforms) {
        throw new Error('No social media platforms connected')
      }

      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '' && value !== null) {
          params.set(key, value.toString())
        }
      })

      return await this.apiRequest<{ posts: SocialPost[]; total: number; hasMore: boolean }>(
        `/posts?${params}`
      )
    } catch (error) {
      console.error('Failed to fetch social media posts:', error)
      throw new Error('Social media posts not available - connect your social accounts')
    }
  }

  /**
   * Get post by ID
   */
  async getPost(id: string): Promise<SocialPost> {
    try {
      return await this.apiRequest<SocialPost>(`/posts/${id}`)
    } catch (error) {
      console.error(`Failed to fetch post ${id}:`, error)
      throw new Error('Post data not available')
    }
  }

  /**
   * Create new post
   */
  async createPost(post: {
    platform: string
    content: string
    mediaType: string
    mediaUrls?: string[]
    hashtags?: string[]
    destination?: string
    scheduledAt?: string
  }): Promise<SocialPost> {
    try {
      const platformConnected = this.platformConnections.get(post.platform)
      if (!platformConnected) {
        throw new Error(`${post.platform} account not connected`)
      }

      return await this.apiRequest<SocialPost>('/posts', {
        method: 'POST',
        body: JSON.stringify(post)
      })
    } catch (error) {
      console.error('Failed to create post:', error)
      throw new Error(`Unable to create post on ${post.platform}`)
    }
  }

  /**
   * Update post
   */
  async updatePost(id: string, updates: Partial<SocialPost>): Promise<SocialPost> {
    try {
      return await this.apiRequest<SocialPost>(`/posts/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      })
    } catch (error) {
      console.error(`Failed to update post ${id}:`, error)
      throw new Error('Unable to update post')
    }
  }

  /**
   * Delete post
   */
  async deletePost(id: string): Promise<boolean> {
    try {
      await this.apiRequest(`/posts/${id}`, {
        method: 'DELETE'
      })
      return true
    } catch (error) {
      console.error(`Failed to delete post ${id}:`, error)
      throw new Error('Unable to delete post')
    }
  }

  /**
   * Get content ideas
   */
  async getContentIdeas(filters: {
    destination?: string
    platform?: string
    urgency?: string
    limit?: number
  } = {}): Promise<ContentIdea[]> {
    try {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '' && value !== null) {
          params.set(key, value.toString())
        }
      })

      return await this.apiRequest<ContentIdea[]>(`/ideas?${params}`)
    } catch (error) {
      console.error('Failed to fetch content ideas:', error)
      throw new Error('Content ideas not available')
    }
  }

  /**
   * Generate content ideas with AI
   */
  async generateContentIdeas(prompt: {
    destination?: string
    theme?: string
    platforms?: string[]
    contentType?: string
  }): Promise<ContentIdea[]> {
    try {
      return await this.apiRequest<ContentIdea[]>('/ideas/generate', {
        method: 'POST',
        body: JSON.stringify(prompt)
      })
    } catch (error) {
      console.error('Failed to generate content ideas:', error)
      throw new Error('Content idea generation not available')
    }
  }

  /**
   * Connect social media platform
   */
  async connectPlatform(platform: string, authCode: string): Promise<boolean> {
    try {
      const result = await this.apiRequest<{ success: boolean; accountName?: string }>(`/connections/${platform}`, {
        method: 'POST',
        body: JSON.stringify({ authCode })
      })
      
      if (result.success) {
        this.platformConnections.set(platform, true)
      }
      
      return result.success
    } catch (error) {
      console.error(`Failed to connect ${platform}:`, error)
      throw new Error(`${platform} connection failed`)
    }
  }

  /**
   * Disconnect social media platform
   */
  async disconnectPlatform(platform: string): Promise<boolean> {
    try {
      await this.apiRequest(`/connections/${platform}`, {
        method: 'DELETE'
      })
      
      this.platformConnections.set(platform, false)
      return true
    } catch (error) {
      console.error(`Failed to disconnect ${platform}:`, error)
      throw new Error(`${platform} disconnection failed`)
    }
  }

  /**
   * Sync platform data
   */
  async syncPlatformData(platform?: string): Promise<{ success: boolean; synced: string[] }> {
    try {
      const endpoint = platform ? `/sync/${platform}` : '/sync'
      return await this.apiRequest<{ success: boolean; synced: string[] }>(endpoint, {
        method: 'POST'
      })
    } catch (error) {
      console.error('Failed to sync platform data:', error)
      throw new Error('Platform data sync failed')
    }
  }

  /**
   * Get platform analytics
   */
  async getPlatformAnalytics(platform: string, timeRange: '7d' | '30d' | '90d' = '30d'): Promise<any> {
    try {
      const platformConnected = this.platformConnections.get(platform)
      if (!platformConnected) {
        throw new Error(`${platform} account not connected`)
      }

      return await this.apiRequest(`/analytics/${platform}?range=${timeRange}`)
    } catch (error) {
      console.error(`Failed to fetch ${platform} analytics:`, error)
      throw new Error(`${platform} analytics not available`)
    }
  }

  /**
   * Export social media report
   */
  async exportSocialReport(filters: any = {}, format: 'csv' | 'pdf' = 'csv'): Promise<Blob> {
    try {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '' && value !== null) {
          params.set(key, value.toString())
        }
      })
      params.set('format', format)

      const response = await fetch(`${this.config.baseUrl}/export?${params}`, {
        headers: {
          'Authorization': `Bearer ${adminAuthService.getToken()}`
        }
      })

      if (!response.ok) {
        throw new Error('Export failed')
      }

      return await response.blob()
    } catch (error) {
      console.error('Failed to export social media report:', error)
      throw new Error('Social media report export not available')
    }
  }
}

// Singleton instance
export const socialMediaService = new SocialMediaService()
export default socialMediaService