import { adminAuthService } from './adminAuthService'

export interface EmailCampaign {
  id: string
  name: string
  subject: string
  previewText: string
  type: 'newsletter' | 'promotional' | 'transactional' | 'drip' | 'welcome' | 'abandoned_cart'
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused'
  template: {
    id: string
    name: string
    thumbnail?: string
  }
  audience: {
    segmentName: string
    totalRecipients: number
    criteria: string[]
  }
  scheduling: {
    sendNow: boolean
    scheduledAt?: string
    timezone: string
    frequency?: 'once' | 'daily' | 'weekly' | 'monthly'
  }
  content: {
    destinations: string[]
    personalizedContent: boolean
    callToAction: string
    offers?: Array<{
      type: string
      value: string
      destination?: string
    }>
  }
  metrics: {
    sent: number
    delivered: number
    opened: number
    clicked: number
    bounced: number
    unsubscribed: number
    openRate: number
    clickRate: number
    deliveryRate: number
    bounceRate: number
    unsubscribeRate: number
    revenue?: number
    conversions?: number
  }
  createdAt: string
  updatedAt: string
  sentAt?: string
}

export interface EmailStats {
  totalCampaigns: number
  activeCampaigns: number
  totalSubscribers: number
  avgOpenRate: number
  avgClickRate: number
  totalRevenue: number
  deliveredToday: number
  scheduledCampaigns: number
}

export interface Segment {
  id: string
  name: string
  description: string
  subscribers: number
  criteria: Array<{
    field: string
    operator: string
    value: string
  }>
  lastUpdated: string
}

export interface CreateCampaignRequest {
  name: string
  subject: string
  previewText: string
  type: EmailCampaign['type']
  segmentId: string
  templateId: string
  scheduledAt?: string
  destinations: string[]
  callToAction: string
}

interface EmailMarketingServiceConfig {
  baseUrl: string
  timeout: number
}

class EmailMarketingService {
  private config: EmailMarketingServiceConfig
  private emailProviderConnected: boolean = false
  private emailProvider: string | null = null
  private lastConnectionCheck: Date | null = null
  private connectionError: string | null = null

  constructor(config?: Partial<EmailMarketingServiceConfig>) {
    this.config = {
      baseUrl: process.env.NEXT_PUBLIC_EMAIL_API_URL || 'http://localhost:8085',
      timeout: 30000,
      ...config
    }
  }

  /**
   * Check service and email provider connections
   */
  async checkConnections(): Promise<{
    service: boolean
    emailProvider: boolean
    provider?: string
    errors: string[]
  }> {
    const errors: string[] = []
    let serviceConnected = false
    
    try {
      const response = await this.apiRequest('/health')
      serviceConnected = true
      
      // Check email provider connection
      const connectionStatus = await this.apiRequest<{
        provider: string | null
        connected: boolean
        subscribers: number
      }>('/connections/status')
      
      this.emailProviderConnected = connectionStatus.connected
      this.emailProvider = connectionStatus.provider
      
      if (!this.emailProviderConnected) {
        errors.push('Email service provider not connected')
      }
      
    } catch (error) {
      errors.push('Email marketing service not available')
    }

    this.lastConnectionCheck = new Date()
    this.connectionError = errors.length > 0 ? errors.join(', ') : null

    return {
      service: serviceConnected,
      emailProvider: this.emailProviderConnected,
      provider: this.emailProvider || undefined,
      errors
    }
  }

  /**
   * Get connection status without making requests
   */
  getConnectionStatus() {
    return {
      service: true,
      emailProvider: this.emailProviderConnected,
      provider: this.emailProvider,
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
      
      throw new Error(`Email Marketing API request failed: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data
  }

  /**
   * Get email marketing statistics
   */
  async getEmailStats(): Promise<EmailStats> {
    try {
      if (!this.emailProviderConnected) {
        throw new Error('No email service provider connected')
      }

      return await this.apiRequest<EmailStats>('/stats')
    } catch (error) {
      console.error('Failed to fetch email stats:', error)
      throw new Error('Email statistics not available - please connect an email service provider')
    }
  }

  /**
   * Get all campaigns
   */
  async getCampaigns(filters: {
    type?: string
    status?: string
    search?: string
    sortBy?: string
    page?: number
    limit?: number
  } = {}): Promise<{ campaigns: EmailCampaign[]; total: number; hasMore: boolean }> {
    try {
      if (!this.emailProviderConnected) {
        throw new Error('No email service provider connected')
      }

      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.set(key, value.toString())
        }
      })

      return await this.apiRequest<{ campaigns: EmailCampaign[]; total: number; hasMore: boolean }>(
        `/campaigns?${params}`
      )
    } catch (error) {
      console.error('Failed to fetch email campaigns:', error)
      throw new Error('Email campaigns not available - connect an email service provider')
    }
  }

  /**
   * Get campaign by ID
   */
  async getCampaign(id: string): Promise<EmailCampaign> {
    try {
      return await this.apiRequest<EmailCampaign>(`/campaigns/${id}`)
    } catch (error) {
      console.error(`Failed to fetch campaign ${id}:`, error)
      throw new Error('Campaign data not available')
    }
  }

  /**
   * Create new campaign
   */
  async createCampaign(campaign: CreateCampaignRequest): Promise<EmailCampaign> {
    try {
      if (!this.emailProviderConnected) {
        throw new Error('No email service provider connected')
      }

      return await this.apiRequest<EmailCampaign>('/campaigns', {
        method: 'POST',
        body: JSON.stringify(campaign)
      })
    } catch (error) {
      console.error('Failed to create campaign:', error)
      throw new Error('Unable to create email campaign - check email service connection')
    }
  }

  /**
   * Update campaign
   */
  async updateCampaign(id: string, updates: Partial<EmailCampaign>): Promise<EmailCampaign> {
    try {
      return await this.apiRequest<EmailCampaign>(`/campaigns/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      })
    } catch (error) {
      console.error(`Failed to update campaign ${id}:`, error)
      throw new Error('Unable to update campaign')
    }
  }

  /**
   * Send campaign
   */
  async sendCampaign(id: string): Promise<{ success: boolean; jobId?: string }> {
    try {
      return await this.apiRequest<{ success: boolean; jobId?: string }>(`/campaigns/${id}/send`, {
        method: 'POST'
      })
    } catch (error) {
      console.error(`Failed to send campaign ${id}:`, error)
      throw new Error('Unable to send campaign')
    }
  }

  /**
   * Get audience segments
   */
  async getSegments(): Promise<Segment[]> {
    try {
      if (!this.emailProviderConnected) {
        throw new Error('No email service provider connected')
      }

      return await this.apiRequest<Segment[]>('/segments')
    } catch (error) {
      console.error('Failed to fetch segments:', error)
      throw new Error('Audience segments not available - connect an email service provider')
    }
  }

  /**
   * Create new segment
   */
  async createSegment(segment: Omit<Segment, 'id' | 'subscribers' | 'lastUpdated'>): Promise<Segment> {
    try {
      return await this.apiRequest<Segment>('/segments', {
        method: 'POST',
        body: JSON.stringify(segment)
      })
    } catch (error) {
      console.error('Failed to create segment:', error)
      throw new Error('Unable to create segment')
    }
  }

  /**
   * Update segment
   */
  async updateSegment(id: string, updates: Partial<Segment>): Promise<Segment> {
    try {
      return await this.apiRequest<Segment>(`/segments/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      })
    } catch (error) {
      console.error(`Failed to update segment ${id}:`, error)
      throw new Error('Unable to update segment')
    }
  }

  /**
   * Delete segment
   */
  async deleteSegment(id: string): Promise<boolean> {
    try {
      await this.apiRequest(`/segments/${id}`, {
        method: 'DELETE'
      })
      return true
    } catch (error) {
      console.error(`Failed to delete segment ${id}:`, error)
      throw new Error('Unable to delete segment')
    }
  }

  /**
   * Connect email service provider
   */
  async connectEmailProvider(provider: 'mailchimp' | 'sendgrid' | 'postmark', credentials: any): Promise<boolean> {
    try {
      const result = await this.apiRequest<{ success: boolean }>('/connections/email-provider', {
        method: 'POST',
        body: JSON.stringify({ provider, credentials })
      })
      
      if (result.success) {
        this.emailProviderConnected = true
        this.emailProvider = provider
      }
      
      return result.success
    } catch (error) {
      console.error('Failed to connect email provider:', error)
      throw new Error(`${provider} connection failed`)
    }
  }

  /**
   * Get available email templates
   */
  async getTemplates(): Promise<Array<{
    id: string
    name: string
    type: string
    thumbnail?: string
    lastUpdated: string
  }>> {
    try {
      return await this.apiRequest('/templates')
    } catch (error) {
      console.error('Failed to fetch templates:', error)
      throw new Error('Email templates not available')
    }
  }

  /**
   * Export email data
   */
  async exportEmailData(type: 'campaigns' | 'subscribers' | 'segments', filters: any = {}): Promise<Blob> {
    try {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.set(key, value.toString())
        }
      })

      const response = await fetch(`${this.config.baseUrl}/export/${type}?${params}`, {
        headers: {
          'Authorization': `Bearer ${adminAuthService.getToken()}`
        }
      })

      if (!response.ok) {
        throw new Error('Export failed')
      }

      return await response.blob()
    } catch (error) {
      console.error(`Failed to export ${type}:`, error)
      throw new Error('Email data export not available')
    }
  }
}

// Singleton instance
export const emailMarketingService = new EmailMarketingService()
export default emailMarketingService