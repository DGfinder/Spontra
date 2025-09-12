import { NextRequest, NextResponse } from 'next/server'
import { apiClient } from '@/services/apiClient'
import { amadeusService } from '@/services/amadeusService'
import { amadeusClient } from '@/lib/amadeusSimple'
import { validateApiRequest, destinationSearchApiSchema } from '@/lib/validations'
import { cacheGet, cacheSet } from '@/lib/cacheServer'

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

    const { origin, minFlightTime, maxFlightTime, theme, departureDate, priceRange, countries, nonStop } = validation.data
    // Cache key
    const cacheKey = `destinations:${origin}:${departureDate || 'any'}:${theme || 'general'}:${minFlightTime ?? ''}:${maxFlightTime ?? ''}:${nonStop ? '1' : '0'}:${process.env.NEXT_PUBLIC_BACKEND_ENABLED === 'true' ? 'be' : 'am'}`
    try {
      const cached = await cacheGet(cacheKey)
      if (cached) {
        return NextResponse.json(JSON.parse(cached), { headers: { 'X-Cache': 'HIT' } })
      }
    } catch {}
    
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
        isBackendHealthy = await apiClient
          .healthCheck()
          .then(() => true)
          .catch(() => false)
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
        const response = await apiClient.exploreDestinations({
          origin_airport_code: origin,
          preferred_activities: [theme],
          min_flight_duration_hours: Math.max(0, Number(minFlightTime ?? 0)),
          max_flight_duration_hours: Math.min(24, Number(maxFlightTime ?? 12)),
          budget_level: priceRange || 'any',
          max_results: 20,
          include_visa_required: true
        })

        console.log(`✅ [${requestId}] Backend API call successful, recommendations count:`, response.destinations.length)
        return NextResponse.json({ 
          ok: true, 
          data: response.recommended_destinations,
          totalResults: response.total_results,
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
      
      let recommendations = await amadeusService.exploreDestinations({
        origin,
        minFlightTime,
        maxFlightTime,
        theme,
        departureDate,
        nonStop,
        viewBy: 'PRICE' // Use PRICE view for cached pricing sorted by cost
      })

      // Post-process to compute realistic duration estimates and apply min/max filter
      try {
        const originLoc = await amadeusClient.getLocationByIataCode(origin)
        const oLat = originLoc?.geoCode?.latitude
        const oLon = originLoc?.geoCode?.longitude
        const toRad = (d: number) => (d * Math.PI) / 180
        const R = 6371
        const estMinutes = (dKm: number) => Math.max(30, Math.round(((dKm / 830) + 0.5) * 60))
        if (oLat != null && oLon != null) {
          const updated = [] as typeof recommendations
          for (const rec of recommendations) {
            const destCode = rec?.destination?.airport_code
            if (!destCode) continue
            const destLoc = await amadeusClient.getLocationByIataCode(destCode)
            const dLat = destLoc?.geoCode?.latitude
            const dLon = destLoc?.geoCode?.longitude
            if (dLat != null && dLon != null) {
              const dLatR = toRad(dLat - oLat)
              const dLonR = toRad(dLon - oLon)
              const a = Math.sin(dLatR / 2) ** 2 + Math.cos(toRad(oLat)) * Math.cos(toRad(dLat)) * Math.sin(dLonR / 2) ** 2
              const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
              const distKm = R * c
              const minutes = estMinutes(distKm)
              rec.flight_route.total_duration_minutes = minutes
              rec.flight_route.estimated_duration_hours = Math.floor(minutes / 60)
              rec.flight_route.estimated_duration_minutes = minutes % 60
              const hours = minutes / 60
              if ((minFlightTime != null && hours < minFlightTime) || (maxFlightTime != null && hours > maxFlightTime)) {
                continue
              }
            }
            updated.push(rec)
          }
          recommendations = updated
        }
      } catch (postErr) {
        console.warn(`[${requestId}] Duration post-processing failed:`, postErr)
      }

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


import { NextRequest, NextResponse } from 'next/server'
import { apiClient } from '@/services/apiClient'
import { amadeusService } from '@/services/amadeusService'
import { validateApiRequest, destinationSearchApiSchema } from '@/lib/validations'
import { cacheGet, cacheSet } from '@/lib/cacheServer'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

  try {
    const body = await req.json()
    const validation = validateApiRequest(destinationSearchApiSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { ok: false, error: 'Invalid destination search parameters', details: validation.errors, requestId },
        { status: 400 }
      )
    }

    const { origin, minFlightTime, maxFlightTime, theme, departureDate, priceRange, nonStop } = validation.data

    const cacheKey = `destinations:${origin}:${departureDate || 'any'}:${theme || 'general'}:${minFlightTime ?? ''}:${maxFlightTime ?? ''}:${nonStop ? '1' : '0'}:${process.env.NEXT_PUBLIC_BACKEND_ENABLED === 'true' ? 'be' : 'am'}`
    const cached = await cacheGet(cacheKey).catch(() => null)
    if (cached) {
      return NextResponse.json(JSON.parse(cached), { headers: { 'X-Cache': 'HIT' } })
    }

    const backendEnabled = process.env.NEXT_PUBLIC_BACKEND_ENABLED === 'true'
    let isBackendHealthy = false
    if (backendEnabled) {
      isBackendHealthy = await apiClient.healthCheck().then(() => true).catch(() => false)
    }

    if (isBackendHealthy) {
      try {
        const response = await apiClient.exploreDestinations({
          origin_airport_code: origin,
          preferred_activities: [theme],
          min_flight_duration_hours: Math.max(0, Number(minFlightTime ?? 0)),
          max_flight_duration_hours: Math.min(24, Number(maxFlightTime ?? 12)),
          budget_level: priceRange || 'any',
          max_results: 20,
          include_visa_required: true
        })
        const payload = {
          ok: true,
          data: response.recommended_destinations,
          totalResults: response.total_results,
          source: 'backend',
          requestId
        }
        const settingsRaw = await cacheGet('admin:settings:general').catch(() => null)
        const ttl = (() => { try { return Math.max(30, Math.min(3600, (settingsRaw && JSON.parse(settingsRaw).features?.destinationCacheTTLSeconds) || 120)) } catch { return 120 } })()
        await cacheSet(cacheKey, JSON.stringify(payload), { ttlSeconds: ttl }).catch(() => {})
        return NextResponse.json(payload, { headers: { 'X-Cache': 'MISS' } })
      } catch {
        // fall back to Amadeus path
      }
    }

    // Amadeus legacy path with enrichment
    let recommendations = await amadeusService.exploreDestinations({
      origin,
      minFlightTime,
      maxFlightTime,
      theme,
      departureDate,
      nonStop,
      viewBy: 'PRICE'
    })

    // Enrich durations using reference service
    try {
      const url = new URL(`${req.nextUrl.origin}/api/admin/reference/flight-times`)
      url.searchParams.set('mode', 'origin')
      url.searchParams.set('origin', origin)
      url.searchParams.set('limit', '500')
      const refRes = await fetch(url.toString(), { cache: 'no-store' })
      if (refRes.ok) {
        const refJson = await refRes.json()
        const list = refJson?.data?.data || refJson?.data || []
        const byDest = new Map<string, number>()
        for (const item of list) {
          const code = item?.destination || item?.destination_airport || item?.destination_code
          const minutes = item?.duration_minutes || item?.minutes || item?.duration
          if (code && Number.isFinite(Number(minutes))) byDest.set(String(code), Number(minutes))
        }
        const filtered: typeof recommendations = []
        for (const rec of recommendations) {
          const code = rec?.destination?.airport_code
          if (!code) continue
          const minutes = byDest.get(code)
          if (Number.isFinite(minutes)) {
            rec.flight_route.total_duration_minutes = minutes as number
            rec.flight_route.estimated_duration_hours = Math.floor((minutes as number) / 60)
            rec.flight_route.estimated_duration_minutes = (minutes as number) % 60
          }
          const hours = rec.flight_route.total_duration_minutes / 60
          if ((minFlightTime != null && hours < minFlightTime) || (maxFlightTime != null && hours > maxFlightTime)) {
            continue
          }
          filtered.push(rec)
        }
        recommendations = filtered
      }
    } catch {}

    const payload = { ok: true, data: recommendations, source: 'legacy', requestId }
    const settingsRaw = await cacheGet('admin:settings:general').catch(() => null)
    const ttl = (() => { try { return Math.max(30, Math.min(3600, (settingsRaw && JSON.parse(settingsRaw).features?.destinationCacheTTLSeconds) || 120)) } catch { return 120 } })()
    await cacheSet(cacheKey, JSON.stringify(payload), { ttlSeconds: ttl }).catch(() => {})
    return NextResponse.json(payload, { headers: { 'X-Cache': 'MISS' } })
  } catch (e: any) {
    const message = e?.message || 'Internal error'
    return NextResponse.json(
      { ok: false, error: 'An unexpected error occurred while searching destinations. Please try again.', requestId, errorMessage: process.env.NODE_ENV === 'development' ? message : undefined },
      { status: 500 }
    )
  }
}
