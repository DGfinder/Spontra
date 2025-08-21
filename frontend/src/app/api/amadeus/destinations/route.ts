import { NextRequest, NextResponse } from 'next/server'
import { themeDestinationService } from '@/services/themeDestinationService'
import { amadeusService } from '@/services/amadeusService'
import { validateApiRequest, destinationSearchApiSchema } from '@/lib/validations'

// Ensure this runs in a Node.js runtime so server env vars are available
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  console.log(`🚀 [${requestId}] Destinations API called`)
  
  try {
    const body = await req.json()
    console.log(`📥 [${requestId}] Request body:`, JSON.stringify(body, null, 2))
    
    // Validate and sanitize request body
    const validation = validateApiRequest(destinationSearchApiSchema, body)
    if (!validation.success) {
      console.log(`❌ [${requestId}] Invalid destination search parameters:`, validation.errors)
      return NextResponse.json({ 
        ok: false, 
        error: 'Invalid destination search parameters',
        details: validation.errors,
        requestId
      }, { status: 400 })
    }

    const { origin, maxFlightTime, theme, departureDate, priceRange, countries, nonStop } = validation.data
    
    console.log(`📝 [${requestId}] Validated parameters:`, { origin, maxFlightTime, theme, departureDate, priceRange, countries, nonStop })
    console.log(`🌍 [${requestId}] Environment check:`, {
      nodeEnv: process.env.NODE_ENV,
      amadeusClientId: !!process.env.AMADEUS_CLIENT_ID,
      amadeusClientSecret: !!process.env.AMADEUS_CLIENT_SECRET,
      backendEnabled: process.env.NEXT_PUBLIC_BACKEND_ENABLED,
      debugLogging: process.env.NEXT_PUBLIC_DEBUG_LOGGING
    })

    // Check if backend service is available and enabled
    const backendEnabled = process.env.NEXT_PUBLIC_BACKEND_ENABLED === 'true'
    console.log(`🔍 [${requestId}] Backend enabled:`, backendEnabled)
    
    let isBackendHealthy = false
    
    if (backendEnabled) {
      console.log(`🔍 [${requestId}] Checking backend service health...`)
      try {
        isBackendHealthy = await themeDestinationService.healthCheck()
        console.log(`💚 [${requestId}] Backend health check result:`, isBackendHealthy)
      } catch (healthError) {
        const errorMessage = healthError instanceof Error ? healthError.message : String(healthError)
        console.log(`❌ [${requestId}] Backend health check failed:`, errorMessage)
        isBackendHealthy = false
      }
    } else {
      console.log(`⏭️ [${requestId}] Backend service disabled, skipping health check`)
    }
    
    if (isBackendHealthy) {
      console.log(`🎯 [${requestId}] Using enhanced backend theme destination service`)
      
      try {
        const response = await themeDestinationService.getDestinationsByTheme({
          origin,
          theme,
          maxFlightTime,
          priceRange,
          countries,
          maxResults: 20
        })

        console.log(`✅ [${requestId}] Backend API call successful, recommendations count:`, response.destinations.length)
        return NextResponse.json({ 
          ok: true, 
          data: response.destinations,
          metadata: response.searchMetadata,
          countrySummary: response.countrySummary,
          totalResults: response.totalResults,
          source: 'backend',
          requestId
        })
      } catch (backendError) {
        const errorMessage = backendError instanceof Error ? backendError.message : String(backendError)
        console.warn(`⚠️ [${requestId}] Backend service failed, falling back to legacy service:`, errorMessage)
        // Continue to fallback below
      }
    } else {
      console.log(`🔄 [${requestId}] Backend service unavailable, using legacy Amadeus service`)
    }

    // Fallback to legacy Amadeus service with theme city logic
    console.log(`🔄 [${requestId}] Using legacy amadeusService with theme-based filtering`)
    
    try {
      console.log(`📡 [${requestId}] Calling amadeusService.exploreDestinations with:`, {
        origin,
        maxFlightTime,
        theme,
        departureDate,
        nonStop,
        viewBy: 'PRICE'
      })
      
      const recommendations = await amadeusService.exploreDestinations({
        origin,
        maxFlightTime,
        theme,
        departureDate,
        nonStop,
        viewBy: 'PRICE' // Use PRICE view for cached pricing sorted by cost
      })

      console.log(`✅ [${requestId}] Legacy API call successful, recommendations count:`, recommendations?.length || 0)
      return NextResponse.json({ 
        ok: true, 
        data: recommendations,
        source: 'legacy',
        requestId
      })
    } catch (legacyError) {
      const error = legacyError instanceof Error ? legacyError : new Error(String(legacyError))
      console.error(`💥 [${requestId}] Legacy Amadeus service failed:`, {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
      throw error // Re-throw to be handled by outer catch block
    }
  } catch (e: unknown) {
    const error = e as Error
    console.error(`💥 [${requestId || 'unknown'}] Destinations API fatal error:`, {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
      cause: (error as any)?.cause,
      timestamp: new Date().toISOString()
    })
    
    // Check for specific Amadeus API errors
    if (error?.message?.includes('Amadeus API Error')) {
      console.error(`🔴 [${requestId}] Amadeus API specific error detected`)
      return NextResponse.json(
        { 
          ok: false, 
          error: 'Unable to search destinations at this time. Please try a different airport or check back later.',
          fallback: true,
          requestId,
          errorType: 'amadeus_api_error'
        },
        { status: 503 }
      )
    }
    
    // Check for authentication/credentials errors
    if (error?.message?.includes('credentials') || error?.message?.includes('authentication') || error?.message?.includes('Token request failed')) {
      console.error(`🔴 [${requestId}] Authentication error detected`)
      return NextResponse.json(
        { 
          ok: false, 
          error: 'Travel search service configuration error. Please contact support.',
          fallback: true,
          requestId,
          errorType: 'authentication_error'
        },
        { status: 503 }
      )
    }
    
    // Check for network/timeout errors
    if (error?.message?.includes('timeout') || error?.message?.includes('network') || error?.message?.includes('ECONNREFUSED')) {
      console.error(`🔴 [${requestId}] Network/timeout error detected`)
      return NextResponse.json(
        { 
          ok: false, 
          error: 'Search service is temporarily unavailable. Please try again in a moment.',
          fallback: true,
          requestId,
          errorType: 'network_error'
        },
        { status: 503 }
      )
    }
    
    // Generic error
    console.error(`🔴 [${requestId}] Generic error - returning 500`)
    return NextResponse.json(
      { 
        ok: false, 
        error: 'An unexpected error occurred while searching destinations. Please try again.',
        fallback: true,
        requestId,
        errorType: 'generic_error',
        errorMessage: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    )
  }
}
