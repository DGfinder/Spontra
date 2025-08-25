import { adminAuthService } from './adminAuthService'

export interface SEOPage {
  id: string
  url: string
  title: string
  metaDescription: string
  type: 'destination' | 'experience' | 'category' | 'blog' | 'home'
  destination?: {
    iataCode: string
    cityName: string
    countryName: string
  }
  metrics: {
    organicTraffic: number
    impressions: number
    clicks: number
    ctr: number
    avgPosition: number
    bounceRate: number
    timeOnPage: number
    conversions: number
  }
  keywords: Array<{
    keyword: string
    position: number
    volume: number
    difficulty: number
    trend: number
    intent: 'informational' | 'navigational' | 'transactional' | 'commercial'
  }>
  issues: Array<{
    type: 'critical' | 'warning' | 'info'
    category: 'technical' | 'content' | 'meta' | 'performance'
    description: string
    recommendation: string
  }>
  lastAnalyzed: string
  lastUpdated: string
}

export interface SEOStats {
  totalPages: number
  organicTraffic: number
  avgPosition: number
  totalKeywords: number
  rankingKeywords: number
  criticalIssues: number
  opportunityScore: number
  monthlyGrowth: number
}

export interface KeywordOpportunity {
  keyword: string
  currentPosition?: number
  targetPosition: number
  volume: number
  difficulty: number
  estimatedTraffic: number
  competitorUrl?: string
}

interface SEOServiceConfig {
  baseUrl: string
  timeout: number
}

class SEOService {
  private config: SEOServiceConfig
  private googleSearchConsoleConnected: boolean = false
  private googleAnalyticsConnected: boolean = false
  private lastConnectionCheck: Date | null = null
  private connectionError: string | null = null

  constructor(config?: Partial<SEOServiceConfig>) {
    this.config = {
      baseUrl: process.env.NEXT_PUBLIC_SEO_API_URL || 'http://localhost:8084',
      timeout: 30000,
      ...config
    }
  }

  /**
   * Check service and external connections
   */
  async checkConnections(): Promise<{
    service: boolean
    googleSearchConsole: boolean
    googleAnalytics: boolean
    errors: string[]
  }> {
    const errors: string[] = []
    let serviceConnected = false
    
    try {
      const response = await this.apiRequest('/health')
      serviceConnected = true
      
      // Check external service connections
      const connectionStatus = await this.apiRequest<{
        googleSearchConsole: boolean
        googleAnalytics: boolean
      }>('/connections/status')
      
      this.googleSearchConsoleConnected = connectionStatus.googleSearchConsole
      this.googleAnalyticsConnected = connectionStatus.googleAnalytics
      
      if (!this.googleSearchConsoleConnected) {
        errors.push('Google Search Console not connected')
      }
      if (!this.googleAnalyticsConnected) {
        errors.push('Google Analytics not connected')
      }
      
    } catch (error) {
      errors.push('SEO service not available')
    }

    this.lastConnectionCheck = new Date()
    this.connectionError = errors.length > 0 ? errors.join(', ') : null

    return {
      service: serviceConnected,
      googleSearchConsole: this.googleSearchConsoleConnected,
      googleAnalytics: this.googleAnalyticsConnected,
      errors
    }
  }

  /**
   * Get connection status without making requests
   */
  getConnectionStatus() {
    return {
      service: true, // Assume service is up unless proven otherwise
      googleSearchConsole: this.googleSearchConsoleConnected,
      googleAnalytics: this.googleAnalyticsConnected,
      lastChecked: this.lastConnectionCheck,
      error: this.connectionError
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
      
      throw new Error(`SEO API request failed: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data
  }

  /**
   * Get SEO statistics
   */
  async getSEOStats(): Promise<SEOStats> {
    try {
      return await this.apiRequest<SEOStats>('/stats')
    } catch (error) {
      console.error('Failed to fetch SEO stats:', error)
      throw new Error('SEO statistics not available - check Google Search Console connection')
    }
  }

  /**
   * Get pages with SEO data
   */
  async getPages(filters: {
    type?: string
    issues?: string
    search?: string
    sortBy?: string
    page?: number
    limit?: number
  } = {}): Promise<{ pages: SEOPage[]; total: number; hasMore: boolean }> {
    try {
      if (!this.googleSearchConsoleConnected && !this.googleAnalyticsConnected) {
        throw new Error('No SEO data sources connected')
      }

      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.set(key, value.toString())
        }
      })

      return await this.apiRequest<{ pages: SEOPage[]; total: number; hasMore: boolean }>(
        `/pages?${params}`
      )
    } catch (error) {
      console.error('Failed to fetch SEO pages:', error)
      throw new Error('SEO data not available - please connect Google Search Console and Analytics')
    }
  }

  /**
   * Get page details
   */
  async getPage(id: string): Promise<SEOPage> {
    try {
      return await this.apiRequest<SEOPage>(`/pages/${id}`)
    } catch (error) {
      console.error(`Failed to fetch page ${id}:`, error)
      throw new Error('Page SEO data not available')
    }
  }

  /**
   * Get keyword opportunities
   */
  async getKeywordOpportunities(filters: {
    difficulty?: 'low' | 'medium' | 'high'
    volume?: number
    limit?: number
  } = {}): Promise<KeywordOpportunity[]> {
    try {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.set(key, value.toString())
        }
      })

      return await this.apiRequest<KeywordOpportunity[]>(`/opportunities?${params}`)
    } catch (error) {
      console.error('Failed to fetch keyword opportunities:', error)
      throw new Error('Keyword opportunity data not available')
    }
  }

  /**
   * Run site crawl
   */
  async runSiteCrawl(): Promise<{ jobId: string; estimatedDuration: number }> {
    try {
      return await this.apiRequest<{ jobId: string; estimatedDuration: number }>('/crawl/start', {
        method: 'POST'
      })
    } catch (error) {
      console.error('Failed to start site crawl:', error)
      throw new Error('Unable to start site crawl')
    }
  }

  /**
   * Get crawl status
   */
  async getCrawlStatus(jobId: string): Promise<{
    status: 'pending' | 'running' | 'completed' | 'failed'
    progress: number
    pagesProcessed: number
    totalPages: number
    errors: string[]
  }> {
    try {
      return await this.apiRequest(`/crawl/${jobId}/status`)
    } catch (error) {
      console.error(`Failed to get crawl status ${jobId}:`, error)
      throw new Error('Crawl status not available')
    }
  }

  /**
   * Auto-optimize page
   */
  async autoOptimizePage(pageId: string, optimizations: string[]): Promise<{
    success: boolean
    applied: string[]
    failed: string[]
    recommendations: string[]
  }> {
    try {
      return await this.apiRequest(`/pages/${pageId}/optimize`, {
        method: 'POST',
        body: JSON.stringify({ optimizations })
      })
    } catch (error) {
      console.error(`Failed to optimize page ${pageId}:`, error)
      throw new Error('Auto-optimization not available')
    }
  }

  /**
   * Connect Google Search Console
   */
  async connectGoogleSearchConsole(authCode: string): Promise<boolean> {
    try {
      const result = await this.apiRequest<{ success: boolean }>('/connections/google-search-console', {
        method: 'POST',
        body: JSON.stringify({ authCode })
      })
      
      if (result.success) {
        this.googleSearchConsoleConnected = true
      }
      
      return result.success
    } catch (error) {
      console.error('Failed to connect Google Search Console:', error)
      throw new Error('Google Search Console connection failed')
    }
  }

  /**
   * Connect Google Analytics
   */
  async connectGoogleAnalytics(authCode: string): Promise<boolean> {
    try {
      const result = await this.apiRequest<{ success: boolean }>('/connections/google-analytics', {
        method: 'POST',
        body: JSON.stringify({ authCode })
      })
      
      if (result.success) {
        this.googleAnalyticsConnected = true
      }
      
      return result.success
    } catch (error) {
      console.error('Failed to connect Google Analytics:', error)
      throw new Error('Google Analytics connection failed')
    }
  }

  /**
   * Export SEO report
   */
  async exportSEOReport(filters: any = {}, format: 'csv' | 'pdf' = 'csv'): Promise<Blob> {
    try {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
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
      console.error('Failed to export SEO report:', error)
      throw new Error('SEO report export not available')
    }
  }
}

// Singleton instance
export const seoService = new SEOService()
export default seoService