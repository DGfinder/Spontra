import { 
  PointOfInterest,
  CreatePOIRequest,
  UpdatePOIRequest,
  POIFilterOptions,
  POIListResponse,
  POIApiResponse,
  BulkPOIOperation,
  BulkPOIResult,
  POICategory,
  DEFAULT_POI_CATEGORIES,
  ThemeType
} from '@/types/pois'
import { adminAuthService } from './adminAuthService'

interface POIServiceConfig {
  baseUrl: string
  timeout: number
}

class POIService {
  private config: POIServiceConfig

  constructor(config?: Partial<POIServiceConfig>) {
    const localBase = (typeof window !== 'undefined') 
      ? `${window.location.origin}/api/admin`
      : (process.env.NEXT_PUBLIC_ADMIN_API_URL || 'http://localhost:3000/api/admin')

    this.config = {
      baseUrl: localBase,
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
  ): Promise<POIApiResponse<T>> {
    const token = adminAuthService.getToken()
    
    if (!token) {
      throw new Error('No authentication token available')
    }

    const url = `${this.config.baseUrl}${endpoint}`
    console.log(`POI API Request: ${options.method || 'GET'} ${url}`)

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options.headers,
        },
        signal: AbortSignal.timeout(this.config.timeout)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`POI API Error for ${url}:`, error)
      
      if (error instanceof Error) {
        if (error.name === 'AbortError' || error.name === 'TimeoutError') {
          throw new Error('Request timeout - please try again')
        }
        throw error
      }
      
      throw new Error('Unknown API error occurred')
    }
  }

  /**
   * Get all POIs for a destination with optional filtering
   */
  async listPOIs(
    destinationId: string, 
    filters?: POIFilterOptions
  ): Promise<POIListResponse> {
    const queryParams = new URLSearchParams()

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (key === 'rating' && typeof value === 'object') {
            queryParams.append('ratingMin', value.min.toString())
            queryParams.append('ratingMax', value.max.toString())
          } else {
            queryParams.append(key, value.toString())
          }
        }
      })
    }

    const endpoint = `/destinations/${destinationId}/pois${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    const response = await this.apiRequest<POIListResponse>(endpoint)

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch POIs')
    }

    return response.data
  }

  /**
   * Get a specific POI by ID
   */
  async getPOI(destinationId: string, poiId: string): Promise<PointOfInterest> {
    const response = await this.apiRequest<PointOfInterest>(`/destinations/${destinationId}/pois/${poiId}`)

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch POI')
    }

    return response.data
  }

  /**
   * Create a new POI
   */
  async createPOI(destinationId: string, createRequest: CreatePOIRequest): Promise<PointOfInterest> {
    const response = await this.apiRequest<PointOfInterest>(`/destinations/${destinationId}/pois`, {
      method: 'POST',
      body: JSON.stringify(createRequest)
    })

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to create POI')
    }

    return response.data
  }

  /**
   * Update an existing POI (full update)
   */
  async updatePOI(
    destinationId: string, 
    poiId: string, 
    updateRequest: UpdatePOIRequest
  ): Promise<PointOfInterest> {
    const response = await this.apiRequest<PointOfInterest>(`/destinations/${destinationId}/pois/${poiId}`, {
      method: 'PUT',
      body: JSON.stringify(updateRequest)
    })

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update POI')
    }

    return response.data
  }

  /**
   * Partially update a POI
   */
  async patchPOI(
    destinationId: string, 
    poiId: string, 
    partialUpdate: Partial<PointOfInterest>
  ): Promise<PointOfInterest> {
    const response = await this.apiRequest<PointOfInterest>(`/destinations/${destinationId}/pois/${poiId}`, {
      method: 'PATCH',
      body: JSON.stringify(partialUpdate)
    })

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to patch POI')
    }

    return response.data
  }

  /**
   * Delete a POI (soft delete by default)
   */
  async deletePOI(destinationId: string, poiId: string, hardDelete: boolean = false): Promise<boolean> {
    const endpoint = `/destinations/${destinationId}/pois/${poiId}${hardDelete ? '' : '?soft=true'}`
    const response = await this.apiRequest<{ deleted: boolean; id: string } | PointOfInterest>(endpoint, {
      method: 'DELETE'
    })

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to delete POI')
    }

    return true
  }

  /**
   * Perform bulk operations on multiple POIs
   */
  async bulkOperation(destinationId: string, operation: BulkPOIOperation): Promise<BulkPOIResult> {
    const response = await this.apiRequest<BulkPOIResult>(`/destinations/${destinationId}/pois/bulk`, {
      method: 'POST',
      body: JSON.stringify(operation)
    })

    if (!response.data) {
      throw new Error(response.error?.message || 'Failed to perform bulk operation')
    }

    return response.data
  }

  /**
   * Validate bulk operation without executing
   */
  async validateBulkOperation(
    destinationId: string, 
    poiIds: string[]
  ): Promise<{
    total: number
    found: number
    notFound: number
    foundIds: string[]
    notFoundIds: string[]
    canProceed: boolean
    warnings: string[]
  }> {
    const queryParams = new URLSearchParams({
      operation: 'validate',
      poiIds: poiIds.join(',')
    })

    const response = await this.apiRequest<{
      total: number
      found: number
      notFound: number
      foundIds: string[]
      notFoundIds: string[]
      canProceed: boolean
      warnings: string[]
    }>(`/destinations/${destinationId}/pois/bulk?${queryParams.toString()}`)

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to validate bulk operation')
    }

    return response.data
  }

  /**
   * Get available POI categories for themes
   */
  getCategoriesForTheme(theme: ThemeType): POICategory[] {
    return DEFAULT_POI_CATEGORIES[theme] || []
  }

  /**
   * Get all available POI categories
   */
  getAllCategories(): POICategory[] {
    return Object.values(DEFAULT_POI_CATEGORIES).flat()
  }

  /**
   * Search POIs across multiple themes
   */
  async searchPOIs(
    destinationId: string,
    query: string,
    themes?: ThemeType[]
  ): Promise<PointOfInterest[]> {
    const filters: POIFilterOptions = {
      searchQuery: query,
      sortBy: 'popularity',
      sortOrder: 'desc'
    }

    let allResults: PointOfInterest[] = []

    if (themes && themes.length > 0) {
      // Search within specific themes
      for (const theme of themes) {
        try {
          const themeResults = await this.listPOIs(destinationId, { ...filters, theme })
          allResults.push(...themeResults.pois)
        } catch (error) {
          console.warn(`Failed to search POIs for theme ${theme}:`, error)
        }
      }
    } else {
      // Search all POIs
      try {
        const results = await this.listPOIs(destinationId, filters)
        allResults = results.pois
      } catch (error) {
        console.error('Failed to search all POIs:', error)
        throw error
      }
    }

    // Remove duplicates and sort by relevance
    const uniqueResults = Array.from(
      new Map(allResults.map(poi => [poi.id, poi])).values()
    )

    return uniqueResults.sort((a, b) => b.popularityScore - a.popularityScore)
  }

  /**
   * Get POI statistics for a destination
   */
  async getPOIStats(destinationId: string): Promise<{
    totalPOIs: number
    activeCount: number
    averageRating: number
    totalViews: number
    totalBookings: number
    totalRevenue: number
    themeDistribution: Record<ThemeType, number>
    categoryDistribution: Record<string, number>
  }> {
    try {
      const response = await this.listPOIs(destinationId, { limit: 1 })
      return response.analytics
    } catch (error) {
      console.error('Failed to get POI statistics:', error)
      throw error
    }
  }

  /**
   * Get featured POIs for a destination
   */
  async getFeaturedPOIs(destinationId: string, limit?: number): Promise<PointOfInterest[]> {
    const response = await this.listPOIs(destinationId, {
      isFeatured: true,
      sortBy: 'popularity',
      sortOrder: 'desc',
      limit
    })

    return response.pois
  }

  /**
   * Get trending POIs for a destination
   */
  async getTrendingPOIs(destinationId: string, limit?: number): Promise<PointOfInterest[]> {
    const response = await this.listPOIs(destinationId, {
      sortBy: 'popularity',
      sortOrder: 'desc',
      limit
    })

    return response.pois.filter(poi => poi.analytics && poi.analytics.trendingScore > 7)
  }

  /**
   * Toggle POI feature status
   */
  async toggleFeatured(destinationId: string, poiId: string): Promise<PointOfInterest> {
    const poi = await this.getPOI(destinationId, poiId)
    return this.patchPOI(destinationId, poiId, { isFeatured: !poi.isFeatured })
  }

  /**
   * Toggle POI promoted status
   */
  async togglePromoted(destinationId: string, poiId: string): Promise<PointOfInterest> {
    const poi = await this.getPOI(destinationId, poiId)
    return this.patchPOI(destinationId, poiId, { isPromoted: !poi.isPromoted })
  }

  /**
   * Update POI status
   */
  async updatePOIStatus(
    destinationId: string, 
    poiId: string, 
    status: 'active' | 'inactive' | 'draft' | 'pending_review'
  ): Promise<PointOfInterest> {
    return this.patchPOI(destinationId, poiId, { status })
  }

  /**
   * Bulk update POI status
   */
  async bulkUpdateStatus(
    destinationId: string, 
    poiIds: string[], 
    status: 'active' | 'inactive' | 'draft' | 'pending_review'
  ): Promise<BulkPOIResult> {
    return this.bulkOperation(destinationId, {
      type: 'update_status',
      poiIds,
      data: { status }
    })
  }

  /**
   * Bulk update POI theme
   */
  async bulkUpdateTheme(
    destinationId: string, 
    poiIds: string[], 
    theme: ThemeType,
    categoryId?: string
  ): Promise<BulkPOIResult> {
    return this.bulkOperation(destinationId, {
      type: 'update_theme',
      poiIds,
      data: { theme, categoryId }
    })
  }

  /**
   * Bulk delete POIs
   */
  async bulkDelete(destinationId: string, poiIds: string[]): Promise<BulkPOIResult> {
    return this.bulkOperation(destinationId, {
      type: 'delete',
      poiIds
    })
  }

  /**
   * Export POIs to CSV format
   */
  async exportPOIs(destinationId: string, format: 'csv' | 'json' = 'csv'): Promise<string> {
    const response = await this.listPOIs(destinationId)
    const pois = response.pois

    if (format === 'json') {
      return JSON.stringify(pois, null, 2)
    }

    // CSV export
    if (pois.length === 0) {
      return 'No POIs to export'
    }

    const headers = [
      'ID', 'Name', 'Description', 'Theme', 'Category', 'Status',
      'Rating', 'Reviews', 'Popularity', 'Price Level',
      'Latitude', 'Longitude', 'Address', 'Website',
      'Created At', 'Updated At'
    ]

    const csvRows = pois.map(poi => [
      poi.id,
      `"${poi.name.replace(/"/g, '""')}"`,
      `"${poi.description.replace(/"/g, '""')}"`,
      poi.theme,
      poi.categoryId,
      poi.status,
      poi.rating,
      poi.reviewCount,
      poi.popularityScore,
      poi.priceLevel,
      poi.coordinates.lat,
      poi.coordinates.lng,
      `"${poi.address?.replace(/"/g, '""') || ''}"`,
      `"${poi.website || ''}"`,
      poi.createdAt,
      poi.updatedAt
    ])

    return [headers.join(','), ...csvRows.map(row => row.join(','))].join('\n')
  }
}

// Create and export singleton instance
export const poiService = new POIService()

// Export the class for custom configurations if needed
export default POIService