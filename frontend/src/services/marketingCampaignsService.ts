import { adminAuthService } from './adminAuthService'

export interface Campaign {
  id: string
  name: string
  description: string
  type: 'awareness' | 'conversion' | 'engagement' | 'retention' | 'seasonal'
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'critical'
  startDate: string
  endDate: string
  budget: {
    allocated: number
    spent: number
    remaining: number
  }
  targeting: {
    destinations: string[]
    demographics: {
      ageRange: string
      interests: string[]
      behaviors: string[]
    }
    channels: Array<'email' | 'social' | 'push' | 'web' | 'influencer'>
  }
  metrics: {
    impressions: number
    clicks: number
    conversions: number
    ctr: number
    conversionRate: number
    roas: number
    reach: number
    engagement: number
  }
  content: {
    creatives: Array<{
      id: string
      type: 'image' | 'video' | 'carousel' | 'story'
      name: string
      performance: number
    }>
    copy: Array<{
      id: string
      variant: string
      performance: number
    }>
  }
  team: Array<{
    userId: string
    name: string
    role: 'manager' | 'creative' | 'analyst' | 'copywriter'
  }>
  createdAt: string
  updatedAt: string
}

export interface CampaignStats {
  totalCampaigns: number
  activeCampaigns: number
  totalBudget: number
  totalSpent: number
  averageROAS: number
  totalConversions: number
  totalImpressions: number
  averageCTR: number
}

export interface CreateCampaignRequest {
  name: string
  description: string
  type: Campaign['type']
  priority: Campaign['priority']
  startDate: string
  endDate: string
  budget: number
  destinations: string[]
  channels: Array<'email' | 'social' | 'push' | 'web' | 'influencer'>
}

interface MarketingCampaignsServiceConfig {
  baseUrl: string
  timeout: number
}

class MarketingCampaignsService {
  private config: MarketingCampaignsServiceConfig
  private isConnected: boolean = false
  private lastConnectionCheck: Date | null = null
  private connectionError: string | null = null

  constructor(config?: Partial<MarketingCampaignsServiceConfig>) {
    this.config = {
      baseUrl: process.env.NEXT_PUBLIC_MARKETING_API_URL || 'http://localhost:8083',
      timeout: 30000,
      ...config
    }
  }

  /**
   * Check service connection status
   */
  async checkConnection(): Promise<{ connected: boolean; error?: string }> {
    try {
      const response = await this.apiRequest('/health', { method: 'GET' })
      this.isConnected = true
      this.connectionError = null
      this.lastConnectionCheck = new Date()
      return { connected: true }
    } catch (error) {
      this.isConnected = false
      this.connectionError = error instanceof Error ? error.message : 'Unknown connection error'
      this.lastConnectionCheck = new Date()
      return { connected: false, error: this.connectionError }
    }
  }

  /**
   * Get connection status without making a request
   */
  getConnectionStatus() {
    return {
      connected: this.isConnected,
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
        // Token expired, try to refresh
        const refreshed = await adminAuthService.refreshToken()
        if (refreshed) {
          // Retry the request with new token
          return this.apiRequest(endpoint, options)
        } else {
          // Refresh failed, redirect to login
          adminAuthService.logout()
          throw new Error('Authentication expired')
        }
      }
      
      throw new Error(`Marketing Campaigns API request failed: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data
  }

  /**
   * Get all campaigns with filtering
   */
  async getCampaigns(filters: {
    type?: string
    status?: string
    search?: string
    sortBy?: string
    page?: number
    limit?: number
  } = {}): Promise<{ campaigns: Campaign[]; total: number; hasMore: boolean }> {
    try {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '' && value !== null) {
          params.set(key, value.toString())
        }
      })

      const data = await this.apiRequest<{ campaigns: Campaign[]; total: number; hasMore: boolean }>(
        `/campaigns?${params}`
      )
      
      return data
    } catch (error) {
      console.error('Failed to fetch campaigns:', error)
      throw new Error('Marketing Campaigns service not available')
    }
  }

  /**
   * Get campaign statistics
   */
  async getCampaignStats(): Promise<CampaignStats> {
    try {
      return await this.apiRequest<CampaignStats>('/campaigns/stats')
    } catch (error) {
      console.error('Failed to fetch campaign stats:', error)
      throw new Error('Campaign statistics not available')
    }
  }

  /**
   * Get campaign by ID
   */
  async getCampaign(id: string): Promise<Campaign> {
    try {
      return await this.apiRequest<Campaign>(`/campaigns/${id}`)
    } catch (error) {
      console.error(`Failed to fetch campaign ${id}:`, error)
      throw new Error('Campaign data not available')
    }
  }

  /**
   * Create new campaign
   */
  async createCampaign(campaign: CreateCampaignRequest): Promise<Campaign> {
    try {
      return await this.apiRequest<Campaign>('/campaigns', {
        method: 'POST',
        body: JSON.stringify(campaign)
      })
    } catch (error) {
      console.error('Failed to create campaign:', error)
      throw new Error('Unable to create campaign')
    }
  }

  /**
   * Update campaign
   */
  async updateCampaign(id: string, updates: Partial<Campaign>): Promise<Campaign> {
    try {
      return await this.apiRequest<Campaign>(`/campaigns/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      })
    } catch (error) {
      console.error(`Failed to update campaign ${id}:`, error)
      throw new Error('Unable to update campaign')
    }
  }

  /**
   * Delete campaign
   */
  async deleteCampaign(id: string): Promise<boolean> {
    try {
      await this.apiRequest(`/campaigns/${id}`, {
        method: 'DELETE'
      })
      return true
    } catch (error) {
      console.error(`Failed to delete campaign ${id}:`, error)
      throw new Error('Unable to delete campaign')
    }
  }

  /**
   * Update campaign status (play, pause, stop)
   */
  async updateCampaignStatus(id: string, status: 'active' | 'paused' | 'completed' | 'cancelled'): Promise<boolean> {
    try {
      await this.apiRequest(`/campaigns/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      })
      return true
    } catch (error) {
      console.error(`Failed to update campaign status ${id}:`, error)
      throw new Error('Unable to update campaign status')
    }
  }

  /**
   * Get campaign performance metrics
   */
  async getCampaignMetrics(id: string, timeRange: '24h' | '7d' | '30d' | '90d' = '7d'): Promise<any> {
    try {
      return await this.apiRequest(`/campaigns/${id}/metrics?range=${timeRange}`)
    } catch (error) {
      console.error(`Failed to fetch campaign metrics ${id}:`, error)
      throw new Error('Campaign metrics not available')
    }
  }

  /**
   * Export campaign data
   */
  async exportCampaigns(filters: any = {}, format: 'csv' | 'xlsx' = 'csv'): Promise<Blob> {
    try {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '' && value !== null) {
          params.set(key, value.toString())
        }
      })
      params.set('format', format)

      const response = await fetch(`${this.config.baseUrl}/campaigns/export?${params}`, {
        headers: {
          'Authorization': `Bearer ${adminAuthService.getToken()}`
        }
      })

      if (!response.ok) {
        throw new Error('Export failed')
      }

      return await response.blob()
    } catch (error) {
      console.error('Failed to export campaigns:', error)
      throw new Error('Export not available')
    }
  }
}

// Singleton instance
export const marketingCampaignsService = new MarketingCampaignsService()
export default marketingCampaignsService