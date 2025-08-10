import { 
  BusinessMetrics, 
  ModerationQueue, 
  CreatorDashboard, 
  PayoutRequest, 
  SystemHealth, 
  AdminDestination, 
  SupportTicket,
  AdminApiResponse,
  PaginatedResponse
} from '@/types/admin'
import { adminAuthService } from './adminAuthService'

interface AdminServiceConfig {
  baseUrl: string
  timeout: number
}

class AdminService {
  private config: AdminServiceConfig

  constructor(config?: Partial<AdminServiceConfig>) {
    this.config = {
      baseUrl: process.env.NEXT_PUBLIC_ADMIN_API_URL || 'http://localhost:8082',
      timeout: 30000,
      ...config
    }
  }

  /**
   * Make authenticated API request
   */
  private async apiRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<AdminApiResponse<T>> {
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
      
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  }

  // ============================================================================
  // BUSINESS METRICS & ANALYTICS
  // ============================================================================

  /**
   * Get overall business metrics
   */
  async getBusinessMetrics(period: '24h' | '7d' | '30d' | '90d' = '7d'): Promise<BusinessMetrics> {
    try {
      const response = await this.apiRequest<BusinessMetrics>(`/metrics/business?period=${period}`)
      return response.data!
    } catch (error) {
      console.error('Failed to fetch business metrics:', error)
      // Return mock data for development
      return this.getMockBusinessMetrics()
    }
  }

  /**
   * Get revenue analytics
   */
  async getRevenueAnalytics(period: string = '30d'): Promise<any> {
    const response = await this.apiRequest(`/analytics/revenue?period=${period}`)
    return response.data
  }

  /**
   * Get user analytics
   */
  async getUserAnalytics(period: string = '30d'): Promise<any> {
    const response = await this.apiRequest(`/analytics/users?period=${period}`)
    return response.data
  }

  // ============================================================================
  // CONTENT MODERATION
  // ============================================================================

  /**
   * Get moderation queue
   */
  async getModerationQueue(
    filters: {
      status?: string
      priority?: string
      contentType?: string
      page?: number
      limit?: number
    } = {}
  ): Promise<PaginatedResponse<ModerationQueue>> {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value.toString())
    })

    try {
      const response = await this.apiRequest<PaginatedResponse<ModerationQueue>>(
        `/moderation/queue?${params}`
      )
      return response.data!
    } catch (error) {
      console.error('Failed to fetch moderation queue:', error)
      return this.getMockModerationQueue()
    }
  }

  /**
   * Moderate content item
   */
  async moderateContent(
    contentId: string, 
    action: 'approve' | 'reject' | 'request_changes' | 'escalate',
    options: {
      reason?: string
      qualityScore?: number
      notes?: string
      feedbackToCreator?: string
    } = {}
  ): Promise<boolean> {
    const response = await this.apiRequest<{ success: boolean }>(`/moderation/moderate`, {
      method: 'POST',
      body: JSON.stringify({ contentId, action, ...options })
    })
    
    return response.data?.success || false
  }

  /**
   * Bulk moderate content
   */
  async bulkModerateContent(
    contentIds: string[], 
    action: 'approve' | 'reject',
    options: {
      reason?: string
      feedbackToCreators?: string
    } = {}
  ): Promise<{ success: number; failed: number }> {
    const response = await this.apiRequest<{ success: number; failed: number }>(
      `/moderation/bulk-moderate`, 
      {
        method: 'POST',
        body: JSON.stringify({ contentIds, action, ...options })
      }
    )
    
    return response.data || { success: 0, failed: contentIds.length }
  }

  // ============================================================================
  // CREATOR MANAGEMENT
  // ============================================================================

  /**
   * Get creator dashboard data
   */
  async getCreatorDashboard(
    filters: { 
      tier?: string
      page?: number
      limit?: number 
    } = {}
  ): Promise<PaginatedResponse<CreatorDashboard>> {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value.toString())
    })

    const response = await this.apiRequest<PaginatedResponse<CreatorDashboard>>(
      `/creators/dashboard?${params}`
    )
    return response.data!
  }

  /**
   * Get creator details
   */
  async getCreatorDetails(creatorId: string): Promise<CreatorDashboard> {
    const response = await this.apiRequest<CreatorDashboard>(`/creators/${creatorId}`)
    return response.data!
  }

  /**
   * Update creator status
   */
  async updateCreatorStatus(
    creatorId: string, 
    status: {
      isActive?: boolean
      restrictionLevel?: 'none' | 'warning' | 'limited' | 'suspended'
      reason?: string
    }
  ): Promise<boolean> {
    const response = await this.apiRequest<{ success: boolean }>(
      `/creators/${creatorId}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify(status)
      }
    )
    
    return response.data?.success || false
  }

  /**
   * Get pending payouts
   */
  async getPendingPayouts(page = 1, limit = 50): Promise<PaginatedResponse<PayoutRequest>> {
    const response = await this.apiRequest<PaginatedResponse<PayoutRequest>>(
      `/creators/payouts/pending?page=${page}&limit=${limit}`
    )
    return response.data!
  }

  /**
   * Process payout
   */
  async processPayout(
    payoutId: string, 
    action: 'approve' | 'reject',
    reason?: string
  ): Promise<boolean> {
    const response = await this.apiRequest<{ success: boolean }>(
      `/creators/payouts/${payoutId}/process`,
      {
        method: 'POST',
        body: JSON.stringify({ action, reason })
      }
    )
    
    return response.data?.success || false
  }

  // ============================================================================
  // DESTINATION MANAGEMENT
  // ============================================================================

  /**
   * Get destinations for management
   */
  async getDestinations(
    filters: { 
      country?: string
      isActive?: boolean
      page?: number
      limit?: number 
    } = {}
  ): Promise<PaginatedResponse<AdminDestination>> {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) params.set(key, value.toString())
    })

    const response = await this.apiRequest<PaginatedResponse<AdminDestination>>(
      `/destinations/admin?${params}`
    )
    return response.data!
  }

  /**
   * Update destination
   */
  async updateDestination(
    iataCode: string, 
    updates: Partial<AdminDestination>
  ): Promise<boolean> {
    const response = await this.apiRequest<{ success: boolean }>(
      `/destinations/${iataCode}`,
      {
        method: 'PATCH',
        body: JSON.stringify(updates)
      }
    )
    
    return response.data?.success || false
  }

  /**
   * Create new destination
   */
  async createDestination(destination: Omit<AdminDestination, 'metrics' | 'lastUpdated'>): Promise<boolean> {
    const response = await this.apiRequest<{ success: boolean }>(`/destinations`, {
      method: 'POST',
      body: JSON.stringify(destination)
    })
    
    return response.data?.success || false
  }

  // ============================================================================
  // SYSTEM MONITORING
  // ============================================================================

  /**
   * Get system health status
   */
  async getSystemHealth(): Promise<SystemHealth> {
    try {
      const response = await this.apiRequest<SystemHealth>(`/system/health`)
      return response.data!
    } catch (error) {
      console.error('Failed to fetch system health:', error)
      return this.getMockSystemHealth()
    }
  }

  /**
   * Get system metrics
   */
  async getSystemMetrics(timeRange: '1h' | '6h' | '24h' | '7d' = '1h'): Promise<any> {
    const response = await this.apiRequest(`/system/metrics?range=${timeRange}`)
    return response.data
  }

  // ============================================================================
  // SUPPORT MANAGEMENT  
  // ============================================================================

  /**
   * Get support tickets
   */
  async getSupportTickets(
    filters: {
      status?: string
      priority?: string
      category?: string
      assignedTo?: string
      page?: number
      limit?: number
    } = {}
  ): Promise<PaginatedResponse<SupportTicket>> {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) params.set(key, value.toString())
    })

    const response = await this.apiRequest<PaginatedResponse<SupportTicket>>(
      `/support/tickets?${params}`
    )
    return response.data!
  }

  /**
   * Update support ticket
   */
  async updateSupportTicket(
    ticketId: string,
    updates: {
      status?: string
      priority?: string
      assignedTo?: string
      response?: string
    }
  ): Promise<boolean> {
    const response = await this.apiRequest<{ success: boolean }>(
      `/support/tickets/${ticketId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(updates)
      }
    )
    
    return response.data?.success || false
  }

  // ============================================================================
  // MOCK DATA FOR DEVELOPMENT
  // ============================================================================

  private getMockBusinessMetrics(): BusinessMetrics {
    return {
      revenue: {
        total: 145230,
        growth: 12.5,
        byPeriod: [
          { period: '2024-01', amount: 32000, bookings: 145, growth: 8.2 },
          { period: '2024-02', amount: 38000, bookings: 167, growth: 18.8 },
          { period: '2024-03', amount: 42000, bookings: 189, growth: 10.5 }
        ],
        bySource: [
          { source: 'Direct Bookings', amount: 98000, percentage: 67.5 },
          { source: 'Creator Referrals', amount: 35000, percentage: 24.1 },
          { source: 'Partnerships', amount: 12230, percentage: 8.4 }
        ]
      },
      users: {
        total: 12450,
        active: 8340,
        new: 234,
        retention: 78.5,
        byTier: [
          { tier: 'Explorer', count: 8920, revenue: 45600 },
          { tier: 'Contributor', count: 2890, revenue: 67800 },
          { tier: 'Ambassador', count: 580, revenue: 28900 },
          { tier: 'Creator', count: 60, revenue: 12930 }
        ]
      },
      content: {
        totalVideos: 3420,
        pendingApproval: 47,
        approvedToday: 23,
        averageQuality: 8.4,
        topPerforming: [
          { id: '1', title: 'Barcelona Nightlife Guide', creator: 'traveler_mike', views: 15600, bookings: 89, revenue: 4450 },
          { id: '2', title: 'Rome Food Adventure', creator: 'foodie_sarah', views: 12300, bookings: 67, revenue: 3350 },
          { id: '3', title: 'Amsterdam Canals Tour', creator: 'city_explorer', views: 9800, bookings: 45, revenue: 2250 }
        ]
      },
      bookings: {
        total: 1890,
        conversionRate: 15.2,
        averageValue: 76.8,
        byDestination: [
          { destination: 'Barcelona', bookings: 345, revenue: 26550, growth: 23.1 },
          { destination: 'Amsterdam', bookings: 289, revenue: 22200, growth: 15.7 },
          { destination: 'Rome', bookings: 234, revenue: 18000, growth: 8.9 }
        ]
      }
    }
  }

  private getMockModerationQueue(): PaginatedResponse<ModerationQueue> {
    return {
      items: [],
      total: 0,
      page: 1,
      limit: 20,
      hasMore: false
    }
  }

  private getMockSystemHealth(): SystemHealth {
    return {
      overall: 'healthy',
      services: [
        {
          name: 'Frontend',
          status: 'up',
          responseTime: 45,
          uptime: 99.9,
          version: '1.0.0',
          endpoints: [
            { path: '/', method: 'GET', status: 200, responseTime: 45, lastChecked: new Date().toISOString() }
          ]
        },
        {
          name: 'Admin API',
          status: 'up',
          responseTime: 120,
          uptime: 99.5,
          version: '1.0.0',
          endpoints: [
            { path: '/health', method: 'GET', status: 200, responseTime: 120, lastChecked: new Date().toISOString() }
          ]
        }
      ],
      performance: {
        cpu: 45,
        memory: 67,
        disk: 23,
        database: {
          connections: 15,
          queryTime: 25,
          errorRate: 0.1
        },
        cache: {
          hitRate: 89,
          memoryUsage: 45
        },
        api: {
          requestsPerSecond: 120,
          averageResponseTime: 89,
          errorRate: 0.2
        }
      },
      alerts: [],
      lastUpdated: new Date().toISOString()
    }
  }
}

// Singleton instance
export const adminService = new AdminService()
export default adminService