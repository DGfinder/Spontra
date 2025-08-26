import { NextRequest, NextResponse } from 'next/server'
import { 
  PointOfInterest, 
  UpdatePOIRequest,
  POIApiResponse
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

// Helper function to find POI by ID and destination
function findPOI(destinationId: string, poiId: string): PointOfInterest | null {
  return mockPOIs.find(poi => poi.id === poiId && poi.destinationId === destinationId) || null
}

// Helper function to update POI in mock data
function updatePOI(poiId: string, updates: Partial<PointOfInterest>): PointOfInterest | null {
  const poiIndex = mockPOIs.findIndex(poi => poi.id === poiId)
  if (poiIndex === -1) return null

  mockPOIs[poiIndex] = {
    ...mockPOIs[poiIndex],
    ...updates,
    updatedAt: new Date().toISOString(),
    lastModifiedBy: 'admin'
  }

  return mockPOIs[poiIndex]
}

// Helper function to delete POI from mock data
function deletePOI(poiId: string): boolean {
  const poiIndex = mockPOIs.findIndex(poi => poi.id === poiId)
  if (poiIndex === -1) return false

  mockPOIs.splice(poiIndex, 1)
  return true
}

// GET /api/admin/destinations/[id]/pois/[poiId] - Get specific POI
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; poiId: string } }
) {
  try {
    // Validate admin authentication
    if (!(await validateAdminAuth(request))) {
      return NextResponse.json<POIApiResponse<null>>(
        { success: false, error: { message: 'Unauthorized', code: 'AUTH_REQUIRED' } },
        { status: 401 }
      )
    }

    const { id: destinationId, poiId } = params

    // Find POI
    const poi = findPOI(destinationId, poiId)
    if (!poi) {
      return NextResponse.json<POIApiResponse<null>>(
        {
          success: false,
          error: {
            message: 'POI not found',
            code: 'POI_NOT_FOUND',
            details: `POI with ID ${poiId} not found in destination ${destinationId}`
          }
        },
        { status: 404 }
      )
    }

    return NextResponse.json<POIApiResponse<PointOfInterest>>(
      {
        success: true,
        data: poi,
        metadata: {
          timestamp: new Date().toISOString(),
          version: '1.0',
          source: 'mock'
        }
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('POI get API error:', error)
    return NextResponse.json<POIApiResponse<null>>(
      {
        success: false,
        error: {
          message: 'Failed to fetch POI',
          code: 'FETCH_ERROR',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      },
      { status: 500 }
    )
  }
}

// PUT /api/admin/destinations/[id]/pois/[poiId] - Update specific POI
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; poiId: string } }
) {
  try {
    // Validate admin authentication
    if (!(await validateAdminAuth(request))) {
      return NextResponse.json<POIApiResponse<null>>(
        { success: false, error: { message: 'Unauthorized', code: 'AUTH_REQUIRED' } },
        { status: 401 }
      )
    }

    const { id: destinationId, poiId } = params
    const updateRequest: UpdatePOIRequest = await request.json()

    // Validate that POI exists
    const existingPOI = findPOI(destinationId, poiId)
    if (!existingPOI) {
      return NextResponse.json<POIApiResponse<null>>(
        {
          success: false,
          error: {
            message: 'POI not found',
            code: 'POI_NOT_FOUND',
            details: `POI with ID ${poiId} not found in destination ${destinationId}`
          }
        },
        { status: 404 }
      )
    }

    // Validate update request
    if (updateRequest.id && updateRequest.id !== poiId) {
      return NextResponse.json<POIApiResponse<null>>(
        {
          success: false,
          error: {
            message: 'POI ID mismatch',
            code: 'VALIDATION_ERROR',
            details: 'POI ID in request body does not match URL parameter'
          }
        },
        { status: 400 }
      )
    }

    // Apply updates
    const updatedPOI = updatePOI(poiId, updateRequest)
    if (!updatedPOI) {
      return NextResponse.json<POIApiResponse<null>>(
        {
          success: false,
          error: {
            message: 'Failed to update POI',
            code: 'UPDATE_ERROR',
            details: 'POI update operation failed'
          }
        },
        { status: 500 }
      )
    }

    return NextResponse.json<POIApiResponse<PointOfInterest>>(
      {
        success: true,
        data: updatedPOI,
        metadata: {
          timestamp: new Date().toISOString(),
          version: '1.0',
          source: 'mock'
        }
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('POI update API error:', error)
    return NextResponse.json<POIApiResponse<null>>(
      {
        success: false,
        error: {
          message: 'Failed to update POI',
          code: 'UPDATE_ERROR',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/destinations/[id]/pois/[poiId] - Partial update specific POI
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; poiId: string } }
) {
  try {
    // Validate admin authentication
    if (!(await validateAdminAuth(request))) {
      return NextResponse.json<POIApiResponse<null>>(
        { success: false, error: { message: 'Unauthorized', code: 'AUTH_REQUIRED' } },
        { status: 401 }
      )
    }

    const { id: destinationId, poiId } = params
    const partialUpdate = await request.json()

    // Validate that POI exists
    const existingPOI = findPOI(destinationId, poiId)
    if (!existingPOI) {
      return NextResponse.json<POIApiResponse<null>>(
        {
          success: false,
          error: {
            message: 'POI not found',
            code: 'POI_NOT_FOUND',
            details: `POI with ID ${poiId} not found in destination ${destinationId}`
          }
        },
        { status: 404 }
      )
    }

    // Apply partial updates
    const updatedPOI = updatePOI(poiId, partialUpdate)
    if (!updatedPOI) {
      return NextResponse.json<POIApiResponse<null>>(
        {
          success: false,
          error: {
            message: 'Failed to update POI',
            code: 'UPDATE_ERROR',
            details: 'POI partial update operation failed'
          }
        },
        { status: 500 }
      )
    }

    return NextResponse.json<POIApiResponse<PointOfInterest>>(
      {
        success: true,
        data: updatedPOI,
        metadata: {
          timestamp: new Date().toISOString(),
          version: '1.0',
          source: 'mock'
        }
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('POI partial update API error:', error)
    return NextResponse.json<POIApiResponse<null>>(
      {
        success: false,
        error: {
          message: 'Failed to update POI',
          code: 'PATCH_ERROR',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/destinations/[id]/pois/[poiId] - Delete specific POI
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; poiId: string } }
) {
  try {
    // Validate admin authentication
    if (!(await validateAdminAuth(request))) {
      return NextResponse.json<POIApiResponse<null>>(
        { success: false, error: { message: 'Unauthorized', code: 'AUTH_REQUIRED' } },
        { status: 401 }
      )
    }

    const { id: destinationId, poiId } = params

    // Validate that POI exists
    const existingPOI = findPOI(destinationId, poiId)
    if (!existingPOI) {
      return NextResponse.json<POIApiResponse<null>>(
        {
          success: false,
          error: {
            message: 'POI not found',
            code: 'POI_NOT_FOUND',
            details: `POI with ID ${poiId} not found in destination ${destinationId}`
          }
        },
        { status: 404 }
      )
    }

    // Check for soft delete parameter
    const { searchParams } = new URL(request.url)
    const softDelete = searchParams.get('soft') === 'true'

    if (softDelete) {
      // Soft delete - mark as inactive
      const updatedPOI = updatePOI(poiId, { status: 'inactive' })
      if (!updatedPOI) {
        return NextResponse.json<POIApiResponse<null>>(
          {
            success: false,
            error: {
              message: 'Failed to soft delete POI',
              code: 'SOFT_DELETE_ERROR',
              details: 'POI soft delete operation failed'
            }
          },
          { status: 500 }
        )
      }

      return NextResponse.json<POIApiResponse<PointOfInterest>>(
        {
          success: true,
          data: updatedPOI,
          metadata: {
            timestamp: new Date().toISOString(),
            version: '1.0',
            source: 'mock'
          }
        },
        { status: 200 }
      )
    } else {
      // Hard delete - remove completely
      const deleted = deletePOI(poiId)
      if (!deleted) {
        return NextResponse.json<POIApiResponse<null>>(
          {
            success: false,
            error: {
              message: 'Failed to delete POI',
              code: 'DELETE_ERROR',
              details: 'POI delete operation failed'
            }
          },
          { status: 500 }
        )
      }

      return NextResponse.json<POIApiResponse<{ deleted: boolean; id: string }>>(
        {
          success: true,
          data: { deleted: true, id: poiId },
          metadata: {
            timestamp: new Date().toISOString(),
            version: '1.0',
            source: 'mock'
          }
        },
        { status: 200 }
      )
    }

  } catch (error) {
    console.error('POI delete API error:', error)
    return NextResponse.json<POIApiResponse<null>>(
      {
        success: false,
        error: {
          message: 'Failed to delete POI',
          code: 'DELETE_ERROR',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      },
      { status: 500 }
    )
  }
}