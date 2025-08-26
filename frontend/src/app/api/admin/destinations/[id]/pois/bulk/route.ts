import { NextRequest, NextResponse } from 'next/server'
import { 
  PointOfInterest,
  BulkPOIOperation,
  BulkPOIResult,
  POIApiResponse,
  POIStatus,
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
    images: [],
    rating: 4.6,
    reviewCount: 127543,
    popularityScore: 95,
    priceLevel: 'moderate',
    priceRange: { min: 20, max: 40, currency: 'EUR' },
    duration: { min: 90, max: 180, unit: 'minutes' },
    openingHours: [],
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
    lastModifiedBy: 'admin'
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
    openingHours: [],
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
    lastModifiedBy: 'admin'
  },
  {
    id: '3',
    destinationId: 'BCN',
    name: 'Barceloneta Beach',
    description: 'The most popular beach in Barcelona, perfect for swimming, sunbathing, and beachfront dining.',
    shortDescription: 'Barcelona\'s main beach',
    coordinates: { lat: 41.3755, lng: 2.1901 },
    address: 'Platja de la Barceloneta, 08003 Barcelona, Spain',
    theme: 'nature',
    categoryId: 'beaches',
    tags: ['beach', 'swimming', 'sunbathing', 'seafood'],
    images: [],
    rating: 4.2,
    reviewCount: 45680,
    popularityScore: 85,
    priceLevel: 'free',
    duration: { min: 120, max: 480, unit: 'minutes' },
    openingHours: [],
    seasonality: ['spring', 'summer', 'autumn'],
    accessibility: {
      wheelchairAccessible: true,
      visuallyImpairedFriendly: false,
      hearingImpairedFriendly: true,
      mobilityAssistanceAvailable: true,
      notes: 'Wheelchair accessible boardwalk and beach access'
    },
    isIndoor: false,
    isOutdoor: true,
    requiresBooking: false,
    status: 'active',
    isPromoted: false,
    isFeatured: false,
    sortOrder: 3,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
    createdBy: 'admin',
    lastModifiedBy: 'admin'
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

// Helper function to find POIs by IDs in a destination
function findPOIsInDestination(destinationId: string, poiIds: string[]): PointOfInterest[] {
  return mockPOIs.filter(poi => 
    poi.destinationId === destinationId && poiIds.includes(poi.id)
  )
}

// Helper function to update multiple POIs
function updateMultiplePOIs(poiIds: string[], updates: Partial<PointOfInterest>): string[] {
  const updatedIds: string[] = []
  const currentTime = new Date().toISOString()

  poiIds.forEach(poiId => {
    const poiIndex = mockPOIs.findIndex(poi => poi.id === poiId)
    if (poiIndex !== -1) {
      mockPOIs[poiIndex] = {
        ...mockPOIs[poiIndex],
        ...updates,
        updatedAt: currentTime,
        lastModifiedBy: 'admin'
      }
      updatedIds.push(poiId)
    }
  })

  return updatedIds
}

// Helper function to delete multiple POIs
function deleteMultiplePOIs(poiIds: string[]): string[] {
  const deletedIds: string[] = []

  poiIds.forEach(poiId => {
    const poiIndex = mockPOIs.findIndex(poi => poi.id === poiId)
    if (poiIndex !== -1) {
      mockPOIs.splice(poiIndex, 1)
      deletedIds.push(poiId)
    }
  })

  return deletedIds
}

// Helper function to validate bulk operation data
function validateBulkOperation(operation: BulkPOIOperation): { isValid: boolean; error?: string } {
  if (!operation.type || !operation.poiIds || !Array.isArray(operation.poiIds)) {
    return { isValid: false, error: 'Missing or invalid operation type or POI IDs' }
  }

  if (operation.poiIds.length === 0) {
    return { isValid: false, error: 'No POI IDs provided' }
  }

  if (operation.poiIds.length > 100) {
    return { isValid: false, error: 'Maximum 100 POIs can be processed in a single bulk operation' }
  }

  // Validate operation-specific data
  switch (operation.type) {
    case 'update_status':
      if (!operation.data?.status) {
        return { isValid: false, error: 'Status is required for update_status operation' }
      }
      const validStatuses: POIStatus[] = ['active', 'inactive', 'draft', 'pending_review']
      if (!validStatuses.includes(operation.data.status)) {
        return { isValid: false, error: 'Invalid status value' }
      }
      break

    case 'update_theme':
      if (!operation.data?.theme) {
        return { isValid: false, error: 'Theme is required for update_theme operation' }
      }
      const validThemes: ThemeType[] = ['vibe', 'adventure', 'discover', 'indulge', 'nature']
      if (!validThemes.includes(operation.data.theme)) {
        return { isValid: false, error: 'Invalid theme value' }
      }
      break

    case 'update_category':
      if (!operation.data?.categoryId) {
        return { isValid: false, error: 'Category ID is required for update_category operation' }
      }
      break

    case 'delete':
      // No additional validation needed for delete operation
      break

    default:
      return { isValid: false, error: 'Invalid operation type' }
  }

  return { isValid: true }
}

// POST /api/admin/destinations/[id]/pois/bulk - Perform bulk operations on POIs
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
    const operation: BulkPOIOperation = await request.json()

    // Validate bulk operation
    const validation = validateBulkOperation(operation)
    if (!validation.isValid) {
      return NextResponse.json<POIApiResponse<null>>(
        {
          success: false,
          error: {
            message: 'Invalid bulk operation',
            code: 'VALIDATION_ERROR',
            details: validation.error
          }
        },
        { status: 400 }
      )
    }

    // Find existing POIs in destination
    const existingPOIs = findPOIsInDestination(destinationId, operation.poiIds)
    const existingPOIIds = existingPOIs.map(poi => poi.id)
    const notFoundIds = operation.poiIds.filter(id => !existingPOIIds.includes(id))

    let successful: string[] = []
    let failed: Array<{ poiId: string; error: string }> = []

    // Add not found POIs to failed list
    notFoundIds.forEach(id => {
      failed.push({ poiId: id, error: 'POI not found' })
    })

    // Process the bulk operation
    try {
      switch (operation.type) {
        case 'update_status':
          if (operation.data?.status) {
            successful = updateMultiplePOIs(existingPOIIds, { status: operation.data.status })
          }
          break

        case 'update_theme':
          if (operation.data?.theme && operation.data?.categoryId) {
            successful = updateMultiplePOIs(existingPOIIds, { 
              theme: operation.data.theme,
              categoryId: operation.data.categoryId
            })
          } else if (operation.data?.theme) {
            successful = updateMultiplePOIs(existingPOIIds, { theme: operation.data.theme })
          }
          break

        case 'update_category':
          if (operation.data?.categoryId) {
            successful = updateMultiplePOIs(existingPOIIds, { categoryId: operation.data.categoryId })
          }
          break

        case 'delete':
          successful = deleteMultiplePOIs(existingPOIIds)
          break

        default:
          throw new Error('Invalid operation type')
      }

      // Handle any POIs that couldn't be processed
      const processedIds = [...successful, ...failed.map(f => f.poiId)]
      const unprocessedIds = operation.poiIds.filter(id => !processedIds.includes(id))
      unprocessedIds.forEach(id => {
        failed.push({ poiId: id, error: 'Failed to process POI' })
      })

    } catch (error) {
      // If operation fails completely, mark all existing POIs as failed
      existingPOIIds.forEach(id => {
        failed.push({ 
          poiId: id, 
          error: error instanceof Error ? error.message : 'Unknown processing error' 
        })
      })
    }

    const result: BulkPOIResult = {
      successful,
      failed,
      totalProcessed: operation.poiIds.length
    }

    const statusCode = failed.length === 0 ? 200 : (successful.length === 0 ? 400 : 207) // 207 = Multi-Status

    return NextResponse.json<POIApiResponse<BulkPOIResult>>(
      {
        success: failed.length < operation.poiIds.length, // Success if at least one POI was processed
        data: result,
        metadata: {
          timestamp: new Date().toISOString(),
          version: '1.0',
          source: 'mock'
        }
      },
      { status: statusCode }
    )

  } catch (error) {
    console.error('POI bulk operation API error:', error)
    return NextResponse.json<POIApiResponse<null>>(
      {
        success: false,
        error: {
          message: 'Failed to perform bulk operation',
          code: 'BULK_OPERATION_ERROR',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      },
      { status: 500 }
    )
  }
}

// GET /api/admin/destinations/[id]/pois/bulk?operation=validate - Validate bulk operation without executing
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
    const operation = searchParams.get('operation')

    if (operation !== 'validate') {
      return NextResponse.json<POIApiResponse<null>>(
        {
          success: false,
          error: {
            message: 'Invalid operation',
            code: 'INVALID_OPERATION',
            details: 'Only validate operation is supported for GET requests'
          }
        },
        { status: 400 }
      )
    }

    // Get POI IDs from query parameters
    const poiIdsParam = searchParams.get('poiIds')
    if (!poiIdsParam) {
      return NextResponse.json<POIApiResponse<null>>(
        {
          success: false,
          error: {
            message: 'Missing POI IDs',
            code: 'VALIDATION_ERROR',
            details: 'poiIds parameter is required'
          }
        },
        { status: 400 }
      )
    }

    const poiIds = poiIdsParam.split(',').map(id => id.trim()).filter(id => id.length > 0)
    
    if (poiIds.length === 0) {
      return NextResponse.json<POIApiResponse<null>>(
        {
          success: false,
          error: {
            message: 'No valid POI IDs provided',
            code: 'VALIDATION_ERROR',
            details: 'At least one valid POI ID is required'
          }
        },
        { status: 400 }
      )
    }

    // Find existing POIs
    const existingPOIs = findPOIsInDestination(destinationId, poiIds)
    const existingPOIIds = existingPOIs.map(poi => poi.id)
    const notFoundIds = poiIds.filter(id => !existingPOIIds.includes(id))

    const validationResult = {
      total: poiIds.length,
      found: existingPOIIds.length,
      notFound: notFoundIds.length,
      foundIds: existingPOIIds,
      notFoundIds,
      canProceed: existingPOIIds.length > 0,
      warnings: notFoundIds.length > 0 ? [`${notFoundIds.length} POI(s) not found and will be skipped`] : []
    }

    return NextResponse.json<POIApiResponse<typeof validationResult>>(
      {
        success: true,
        data: validationResult,
        metadata: {
          timestamp: new Date().toISOString(),
          version: '1.0',
          source: 'mock'
        }
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('POI bulk validation API error:', error)
    return NextResponse.json<POIApiResponse<null>>(
      {
        success: false,
        error: {
          message: 'Failed to validate bulk operation',
          code: 'VALIDATION_ERROR',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      },
      { status: 500 }
    )
  }
}