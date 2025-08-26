import { NextRequest, NextResponse } from 'next/server'
import { 
  PointOfInterest, 
  CreatePOIRequest, 
  POIFilterOptions, 
  POIListResponse,
  POIApiResponse,
  DEFAULT_POI_CATEGORIES,
  ThemeType
} from '@/types/pois'

// Mock POI data - in production this would come from database
const mockPOIs: PointOfInterest[] = [
  {
    id: '1',
    destinationId: 'BCN',
    name: 'Sagrada Família',
    description: 'Antoni Gaudí\'s unfinished masterpiece, a basilica that combines Gothic and Art Nouveau forms.',
    shortDescription: 'Gaudí\'s iconic basilica',
    coordinates: { lat: 41.4036, lng: 2.1744 },
    address: 'C/ de Mallorca, 401, 08013 Barcelona, Spain',
    website: 'https://sagradafamilia.org',
    theme: 'discover',
    categoryId: 'historical_sites',
    tags: ['architecture', 'unesco', 'gaudi', 'basilica'],
    images: [
      {
        id: '1',
        url: '/images/pois/sagrada-familia-1.jpg',
        alt: 'Sagrada Família exterior',
        caption: 'The iconic facade of Sagrada Família',
        isMain: true,
        sortOrder: 1,
        uploadedAt: '2024-01-01T00:00:00Z'
      }
    ],
    featuredImage: '/images/pois/sagrada-familia-1.jpg',
    rating: 4.6,
    reviewCount: 127543,
    popularityScore: 95,
    priceLevel: 'moderate',
    priceRange: { min: 20, max: 40, currency: 'EUR' },
    duration: { min: 90, max: 180, unit: 'minutes' },
    openingHours: [
      { dayOfWeek: 'monday', isOpen: true, openTime: '09:00', closeTime: '18:00' },
      { dayOfWeek: 'tuesday', isOpen: true, openTime: '09:00', closeTime: '18:00' },
      { dayOfWeek: 'wednesday', isOpen: true, openTime: '09:00', closeTime: '18:00' },
      { dayOfWeek: 'thursday', isOpen: true, openTime: '09:00', closeTime: '18:00' },
      { dayOfWeek: 'friday', isOpen: true, openTime: '09:00', closeTime: '18:00' },
      { dayOfWeek: 'saturday', isOpen: true, openTime: '09:00', closeTime: '18:00' },
      { dayOfWeek: 'sunday', isOpen: true, openTime: '09:00', closeTime: '14:00' }
    ],
    seasonality: ['spring', 'summer', 'autumn', 'winter'],
    accessibility: {
      wheelchairAccessible: true,
      visuallyImpairedFriendly: false,
      hearingImpairedFriendly: false,
      mobilityAssistanceAvailable: true
    },
    isIndoor: true,
    isOutdoor: false,
    requiresBooking: true,
    bookingUrl: 'https://sagradafamilia.org/tickets',
    status: 'active',
    isPromoted: true,
    isFeatured: true,
    sortOrder: 1,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-20T00:00:00Z',
    createdBy: 'admin',
    lastModifiedBy: 'admin',
    analytics: {
      totalViews: 45320,
      uniqueViews: 32140,
      clickThroughRate: 12.5,
      timeSpentViewing: 145,
      bookingsGenerated: 3240,
      revenueGenerated: 97200,
      conversionRate: 7.2,
      shareCount: 890,
      saveCount: 1240,
      averageRating: 4.6,
      totalReviews: 127543,
      ratingDistribution: { 1: 850, 2: 1200, 3: 5400, 4: 25000, 5: 95093 },
      monthlyViews: [],
      seasonalTrends: [],
      peakTimes: [],
      rankInCategory: 1,
      rankInTheme: 1,
      rankInDestination: 1,
      mostCommonVisitorAge: '25-35',
      mostCommonVisitorType: 'tourist',
      averageGroupSize: 3.2,
      trendingScore: 8.5,
      qualityScore: 9.2,
      contentCompleteness: 95,
      lastAnalyzedAt: '2024-01-20T00:00:00Z'
    }
  },
  {
    id: '2',
    destinationId: 'BCN',
    name: 'Park Güell',
    description: 'A public park designed by Antoni Gaudí, featuring colorful mosaics and unique architectural elements.',
    shortDescription: 'Gaudí\'s whimsical park',
    coordinates: { lat: 41.4145, lng: 2.1527 },
    address: 'Carrer d\'Olot, s/n, 08024 Barcelona, Spain',
    website: 'https://parkguell.barcelona',
    theme: 'discover',
    categoryId: 'historical_sites',
    tags: ['gaudi', 'park', 'mosaics', 'architecture'],
    images: [],
    rating: 4.4,
    reviewCount: 89324,
    popularityScore: 88,
    priceLevel: 'budget',
    priceRange: { min: 7, max: 10, currency: 'EUR' },
    duration: { min: 120, max: 240, unit: 'minutes' },
    openingHours: [
      { dayOfWeek: 'monday', isOpen: true, openTime: '08:00', closeTime: '18:00' },
      { dayOfWeek: 'tuesday', isOpen: true, openTime: '08:00', closeTime: '18:00' },
      { dayOfWeek: 'wednesday', isOpen: true, openTime: '08:00', closeTime: '18:00' },
      { dayOfWeek: 'thursday', isOpen: true, openTime: '08:00', closeTime: '18:00' },
      { dayOfWeek: 'friday', isOpen: true, openTime: '08:00', closeTime: '18:00' },
      { dayOfWeek: 'saturday', isOpen: true, openTime: '08:00', closeTime: '18:00' },
      { dayOfWeek: 'sunday', isOpen: true, openTime: '08:00', closeTime: '18:00' }
    ],
    seasonality: ['spring', 'summer', 'autumn'],
    accessibility: {
      wheelchairAccessible: false,
      visuallyImpairedFriendly: false,
      hearingImpairedFriendly: true,
      mobilityAssistanceAvailable: false,
      notes: 'Some steep areas not accessible for wheelchairs'
    },
    isIndoor: false,
    isOutdoor: true,
    requiresBooking: true,
    bookingUrl: 'https://parkguell.barcelona/tickets',
    status: 'active',
    isPromoted: false,
    isFeatured: true,
    sortOrder: 2,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-18T00:00:00Z',
    createdBy: 'admin',
    lastModifiedBy: 'admin',
    analytics: {
      totalViews: 38920,
      uniqueViews: 28140,
      clickThroughRate: 10.8,
      timeSpentViewing: 125,
      bookingsGenerated: 2180,
      revenueGenerated: 19620,
      conversionRate: 5.6,
      shareCount: 720,
      saveCount: 980,
      averageRating: 4.4,
      totalReviews: 89324,
      ratingDistribution: { 1: 1200, 2: 2100, 3: 8900, 4: 32000, 5: 45124 },
      monthlyViews: [],
      seasonalTrends: [],
      peakTimes: [],
      rankInCategory: 2,
      rankInTheme: 3,
      rankInDestination: 2,
      mostCommonVisitorAge: '20-40',
      mostCommonVisitorType: 'tourist',
      averageGroupSize: 2.8,
      trendingScore: 7.8,
      qualityScore: 8.6,
      contentCompleteness: 88,
      lastAnalyzedAt: '2024-01-18T00:00:00Z'
    }
  }
]

// Helper function to validate admin authentication
async function validateAdminAuth(request: NextRequest): Promise<boolean> {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return false
  }

  const token = authHeader.substring(7)
  // For demo purposes, just check if token exists
  // In production, validate JWT token properly
  return Boolean(token && token.length >= 10)
}

// Helper function to apply filters to POI list
function applyFilters(pois: PointOfInterest[], filters: POIFilterOptions): PointOfInterest[] {
  let filtered = [...pois]

  if (filters.theme) {
    filtered = filtered.filter(poi => poi.theme === filters.theme)
  }

  if (filters.categoryId) {
    filtered = filtered.filter(poi => poi.categoryId === filters.categoryId)
  }

  if (filters.status) {
    filtered = filtered.filter(poi => poi.status === filters.status)
  }

  if (filters.priceLevel) {
    filtered = filtered.filter(poi => poi.priceLevel === filters.priceLevel)
  }

  if (filters.isPromoted !== undefined) {
    filtered = filtered.filter(poi => poi.isPromoted === filters.isPromoted)
  }

  if (filters.isFeatured !== undefined) {
    filtered = filtered.filter(poi => poi.isFeatured === filters.isFeatured)
  }

  if (filters.rating) {
    filtered = filtered.filter(poi => 
      poi.rating >= filters.rating!.min && poi.rating <= filters.rating!.max
    )
  }

  if (filters.searchQuery) {
    const query = filters.searchQuery.toLowerCase()
    filtered = filtered.filter(poi =>
      poi.name.toLowerCase().includes(query) ||
      poi.description.toLowerCase().includes(query) ||
      poi.tags.some(tag => tag.toLowerCase().includes(query))
    )
  }

  // Apply sorting
  if (filters.sortBy) {
    filtered.sort((a, b) => {
      let aValue: any, bValue: any
      
      switch (filters.sortBy) {
        case 'name':
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case 'rating':
          aValue = a.rating
          bValue = b.rating
          break
        case 'popularity':
          aValue = a.popularityScore
          bValue = b.popularityScore
          break
        case 'created_at':
          aValue = new Date(a.createdAt)
          bValue = new Date(b.createdAt)
          break
        case 'updated_at':
          aValue = new Date(a.updatedAt)
          bValue = new Date(b.updatedAt)
          break
        default:
          return 0
      }

      if (aValue < bValue) return filters.sortOrder === 'desc' ? 1 : -1
      if (aValue > bValue) return filters.sortOrder === 'desc' ? -1 : 1
      return 0
    })
  }

  return filtered
}

// Helper function to calculate analytics
function calculateListAnalytics(pois: PointOfInterest[]) {
  const totalPOIs = pois.length
  const activeCount = pois.filter(poi => poi.status === 'active').length
  const avgRating = pois.reduce((sum, poi) => sum + poi.rating, 0) / totalPOIs || 0
  const totalViews = pois.reduce((sum, poi) => sum + (poi.analytics?.totalViews || 0), 0)
  const totalBookings = pois.reduce((sum, poi) => sum + (poi.analytics?.bookingsGenerated || 0), 0)
  const totalRevenue = pois.reduce((sum, poi) => sum + (poi.analytics?.revenueGenerated || 0), 0)

  const themeDistribution: Record<ThemeType, number> = {
    vibe: pois.filter(poi => poi.theme === 'vibe').length,
    adventure: pois.filter(poi => poi.theme === 'adventure').length,
    discover: pois.filter(poi => poi.theme === 'discover').length,
    indulge: pois.filter(poi => poi.theme === 'indulge').length,
    nature: pois.filter(poi => poi.theme === 'nature').length
  }

  const categoryDistribution: Record<string, number> = {}
  pois.forEach(poi => {
    categoryDistribution[poi.categoryId] = (categoryDistribution[poi.categoryId] || 0) + 1
  })

  return {
    totalPOIs,
    activeCount,
    averageRating: Number(avgRating.toFixed(1)),
    totalViews,
    totalBookings,
    totalRevenue,
    themeDistribution,
    categoryDistribution
  }
}

// GET /api/admin/destinations/[id]/pois - List POIs for destination
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate admin authentication
    if (!(await validateAdminAuth(request))) {
      return NextResponse.json<POIApiResponse<null>>(
        { success: false, error: { message: 'Unauthorized', code: 'AUTH_REQUIRED' } },
        { status: 401 }
      )
    }

    const destinationId = params.id
    const { searchParams } = new URL(request.url)

    // Parse query parameters for filtering
    const filters: POIFilterOptions = {
      theme: searchParams.get('theme') as ThemeType || undefined,
      categoryId: searchParams.get('categoryId') || undefined,
      status: searchParams.get('status') as any || undefined,
      priceLevel: searchParams.get('priceLevel') as any || undefined,
      isPromoted: searchParams.get('isPromoted') ? searchParams.get('isPromoted') === 'true' : undefined,
      isFeatured: searchParams.get('isFeatured') ? searchParams.get('isFeatured') === 'true' : undefined,
      searchQuery: searchParams.get('searchQuery') || undefined,
      sortBy: searchParams.get('sortBy') as any || 'popularity',
      sortOrder: searchParams.get('sortOrder') as any || 'desc',
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0
    }

    if (filters.rating) {
      const ratingMin = searchParams.get('ratingMin')
      const ratingMax = searchParams.get('ratingMax')
      if (ratingMin || ratingMax) {
        filters.rating = {
          min: ratingMin ? parseFloat(ratingMin) : 0,
          max: ratingMax ? parseFloat(ratingMax) : 5
        }
      }
    }

    // Filter POIs by destination
    let destinationPOIs = mockPOIs.filter(poi => poi.destinationId === destinationId)

    // Apply filters
    const filteredPOIs = applyFilters(destinationPOIs, filters)

    // Apply pagination
    const offset = filters.offset || 0
    const limit = filters.limit
    const paginatedPOIs = limit ? filteredPOIs.slice(offset, offset + limit) : filteredPOIs

    // Get all categories for this destination's themes
    const usedThemes = new Set(destinationPOIs.map(poi => poi.theme))
    const categories = Object.values(DEFAULT_POI_CATEGORIES)
      .flat()
      .filter(cat => usedThemes.has(cat.theme))

    // Calculate analytics
    const analytics = calculateListAnalytics(destinationPOIs)

    const response: POIListResponse = {
      pois: paginatedPOIs,
      total: destinationPOIs.length,
      filtered: filteredPOIs.length,
      categories,
      analytics
    }

    return NextResponse.json<POIApiResponse<POIListResponse>>(
      {
        success: true,
        data: response,
        pagination: limit ? {
          total: filteredPOIs.length,
          page: Math.floor(offset / limit) + 1,
          limit,
          hasMore: offset + limit < filteredPOIs.length
        } : undefined,
        metadata: {
          timestamp: new Date().toISOString(),
          version: '1.0',
          source: 'mock'
        }
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('POI list API error:', error)
    return NextResponse.json<POIApiResponse<null>>(
      {
        success: false,
        error: {
          message: 'Failed to fetch POIs',
          code: 'FETCH_ERROR',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      },
      { status: 500 }
    )
  }
}

// POST /api/admin/destinations/[id]/pois - Create new POI
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate admin authentication
    if (!(await validateAdminAuth(request))) {
      return NextResponse.json<POIApiResponse<null>>(
        { success: false, error: { message: 'Unauthorized', code: 'AUTH_REQUIRED' } },
        { status: 401 }
      )
    }

    const destinationId = params.id
    const createRequest: CreatePOIRequest = await request.json()

    // Validate required fields
    if (!createRequest.name || !createRequest.description || !createRequest.coordinates) {
      return NextResponse.json<POIApiResponse<null>>(
        {
          success: false,
          error: {
            message: 'Missing required fields',
            code: 'VALIDATION_ERROR',
            details: 'name, description, and coordinates are required'
          }
        },
        { status: 400 }
      )
    }

    // Generate new POI
    const newPOI: PointOfInterest = {
      id: `poi_${Date.now()}`,
      destinationId,
      name: createRequest.name,
      description: createRequest.description,
      shortDescription: createRequest.shortDescription,
      coordinates: createRequest.coordinates,
      theme: createRequest.theme,
      categoryId: createRequest.categoryId,
      tags: createRequest.tags || [],
      images: [],
      rating: 0,
      reviewCount: 0,
      popularityScore: 0,
      priceLevel: createRequest.priceLevel || 'moderate',
      openingHours: [],
      seasonality: [],
      accessibility: {
        wheelchairAccessible: false,
        visuallyImpairedFriendly: false,
        hearingImpairedFriendly: false,
        mobilityAssistanceAvailable: false
      },
      isIndoor: createRequest.isIndoor || false,
      isOutdoor: createRequest.isOutdoor || true,
      requiresBooking: false,
      status: createRequest.status || 'draft',
      isPromoted: false,
      isFeatured: false,
      sortOrder: mockPOIs.length + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'admin',
      lastModifiedBy: 'admin'
    }

    // In production, this would save to database
    mockPOIs.push(newPOI)

    return NextResponse.json<POIApiResponse<PointOfInterest>>(
      {
        success: true,
        data: newPOI,
        metadata: {
          timestamp: new Date().toISOString(),
          version: '1.0',
          source: 'mock'
        }
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('POI creation API error:', error)
    return NextResponse.json<POIApiResponse<null>>(
      {
        success: false,
        error: {
          message: 'Failed to create POI',
          code: 'CREATION_ERROR',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      },
      { status: 500 }
    )
  }
}