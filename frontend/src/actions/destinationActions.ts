'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { validateApiRequest, destinationSearchApiSchema } from '@/lib/validations'
import { cacheGet, cacheSet } from '@/lib/cacheServer'
import { apiClient } from '@/services/apiClient'
import { amadeusService } from '@/services/amadeusService'
import { telemetry } from '@/lib/serverActionsTelemetry'
import type { DestinationRecommendation, ActivityType } from '@/services/apiClient'

export interface ExploreDestinationsResult {
  success: boolean
  data?: DestinationRecommendation[]
  totalResults?: number
  source?: 'backend' | 'amadeus' | 'fallback'
  requestId?: string
  error?: string
  redirectTo?: string
}

interface FormDataInput {
  selectedTheme: string
  departureAirport: string
  destinationAirport?: string
  destinationAirportDetailed?: string
  departureDate: string
  returnDate?: string
  passengers: number
  tripType: 'one-way' | 'return'
  maxFlightTime?: number
  flightTimeRange?: [number, number]
  minFlightTime?: number
  maxFlightTimeRange?: number
  directFlightsOnly?: boolean
  cabinClass?: 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST'
}

// Helper function to map themes to activities
function mapThemeToActivityMatches(theme?: string, fallback?: ActivityType[]): ActivityType[] {
  const normalized = theme?.toLowerCase().trim()
  if (!normalized) return fallback && fallback.length ? fallback : ['activities']
  if (normalized.includes('night')) return ['nightlife']
  if (normalized.includes('party')) return ['nightlife']
  if (normalized.includes('adventure') || normalized.includes('outdoor')) return ['adventure']
  if (normalized.includes('shop')) return ['luxury_shopping']
  if (normalized.includes('relax')) return ['relaxation']
  if (normalized.includes('nature')) return ['nature']
  if (normalized.includes('culture') || normalized.includes('museum') || normalized.includes('learn')) return ['culture']
  if (normalized.includes('food') || normalized.includes('culinary')) return ['food_tours', 'restaurants']
  if (normalized.includes('sight')) return ['sightseeing']
  return fallback && fallback.length ? fallback : ['activities']
}

export async function exploreDestinationsAction(
  formData: FormDataInput
): Promise<ExploreDestinationsResult> {
  return telemetry.wrapAction('exploreDestinations', async () => {
    // DIRECT SEARCH MODE: Both airports specified
    if (formData.destinationAirport && formData.departureAirport && 
        formData.destinationAirport !== formData.departureAirport) {
      
      console.log(`🛫 Direct flight search: ${formData.departureAirport} → ${formData.destinationAirport}`)
      
      const params = new URLSearchParams({
        origin: formData.departureAirport,
        destination: formData.destinationAirport,
        departureDate: formData.departureDate,
        passengers: formData.passengers.toString(),
        ...(formData.returnDate && formData.tripType === 'return' && { returnDate: formData.returnDate }),
        ...(formData.cabinClass && { cabinClass: formData.cabinClass })
      })
      
      // Return redirect instruction for direct flight search
      return {
        success: true,
        redirectTo: `/flights?${params.toString()}`
      }
    }

    // THEME-BASED EXPLORATION MODE
    console.log(`🌍 Exploring destinations within ${formData.maxFlightTime} hours from ${formData.departureAirport}`)

    // Validate request
    const minFlightTime = formData.flightTimeRange?.[0] ?? formData.minFlightTime ?? 0.5
    const maxFlightTime = formData.flightTimeRange?.[1] ?? formData.maxFlightTimeRange ?? formData.maxFlightTime ?? 8
    
    const validation = validateApiRequest(destinationSearchApiSchema, {
      origin: formData.departureAirport,
      minFlightTime,
      maxFlightTime,
      theme: formData.selectedTheme,
      departureDate: formData.departureDate,
      nonStop: !!formData.directFlightsOnly,
    })

    if (!validation.success) {
      return {
        success: false,
        error: 'Invalid destination search parameters: ' + (validation.errors || []).join(', ')
      }
    }

    const { origin, theme, departureDate, nonStop } = validation.data

    // Create cache key
    const cacheKey = `destinations:${origin}:${departureDate || 'any'}:${theme || 'general'}:${minFlightTime ?? ''}:${maxFlightTime ?? ''}:${nonStop ? '1' : '0'}:${process.env.NEXT_PUBLIC_BACKEND_ENABLED === 'true' ? 'be' : 'am'}`

    // Check cache first
    const cached = await cacheGet(cacheKey).catch(() => null)
    if (cached) {
      telemetry.trackCacheHit('exploreDestinations', true)
      const cachedData = JSON.parse(cached)
      return {
        success: true,
        data: cachedData.data,
        totalResults: cachedData.totalResults,
        source: cachedData.source,
        requestId: cachedData.requestId
      }
    }
    telemetry.trackCacheHit('exploreDestinations', false)

    // Get cache TTL settings
    const settingsRaw = await cacheGet('admin:settings:general').catch(() => null)
    const resolveTTL = () => {
      try {
        const v = settingsRaw ? JSON.parse(settingsRaw).features?.destinationCacheTTLSeconds : 120
        return Math.max(30, Math.min(3600, Number(v || 120)))
      } catch {
        return 120
      }
    }
    const ttl = resolveTTL()

    const preferredActivities = mapThemeToActivityMatches(theme)
    const backendEnabled = process.env.NEXT_PUBLIC_BACKEND_ENABLED === 'true'
    let isBackendHealthy = false

    // Try backend service first
    if (backendEnabled) {
      isBackendHealthy = await apiClient.healthCheck().then(() => true).catch(() => false)
    }

    if (isBackendHealthy) {
      try {
        const response = await apiClient.exploreDestinations({
          origin_airport_code: origin,
          preferred_activities: preferredActivities,
          min_flight_duration_hours: Math.max(0, Number(minFlightTime ?? 0)),
          max_flight_duration_hours: Math.min(24, Number(maxFlightTime ?? 12)),
          budget_level: 'any',
          max_results: 20,
          include_visa_required: true
        })

        const result = {
          success: true,
          data: response.recommended_destinations,
          totalResults: response.total_results,
          source: 'backend' as const,
          requestId: `req_${Date.now()}`
        }

        // Cache the result
        await cacheSet(cacheKey, JSON.stringify(result), { ttlSeconds: ttl }).catch(() => {})
        
        return result
      } catch (error) {
        console.warn('Backend destination exploration failed, falling back to Amadeus/local flow', error)
      }
    }

    // Try Amadeus service
    let source: 'amadeus' | 'fallback' = 'amadeus'
    let recommendations: DestinationRecommendation[]

    try {
      recommendations = await amadeusService.exploreDestinations({
        origin,
        minFlightTime,
        maxFlightTime,
        theme,
        departureDate,
        nonStop,
        viewBy: 'PRICE'
      })
    } catch (error) {
      console.error('Amadeus destination exploration failed, using local fallback dataset', error)
      
      // Use fallback recommendations (imported from the API route logic)
      const { buildFallbackRecommendations } = await import('@/lib/fallbackDestinations')
      recommendations = buildFallbackRecommendations({
        origin,
        theme,
        minFlightTime: minFlightTime ?? null,
        maxFlightTime: maxFlightTime ?? null
      })
      source = 'fallback'
    }

    // Flight time enrichment for Amadeus results
    if (source === 'amadeus' && recommendations.length > 0) {
      try {
        // This would need to be refactored to not use fetch within a Server Action
        // For now, we'll skip this enrichment step in Server Actions
        console.log('Skipping flight time enrichment in Server Action - would need refactoring')
      } catch (error) {
        console.warn('Destination enrichment lookup failed', error)
      }
    }

    // Ensure we have results
    if (recommendations.length === 0) {
      const { buildFallbackRecommendations } = await import('@/lib/fallbackDestinations')
      recommendations = buildFallbackRecommendations({
        origin,
        theme,
        minFlightTime: minFlightTime ?? null,
        maxFlightTime: maxFlightTime ?? null
      })
      source = 'fallback'
    }

    const result = {
      success: true,
      data: recommendations,
      totalResults: recommendations.length,
      source,
      requestId: `req_${Date.now()}`
    }

    // Cache the result
    await cacheSet(cacheKey, JSON.stringify(result), { ttlSeconds: ttl }).catch(() => {})

    // Revalidate the search results page
    revalidatePath('/search-results')
    
    return result

  }, {
    route: 'destinations-search'
  })
}

// Server Action for updating user preferences
export async function updateUserPreferencesAction(preferences: {
  defaultDepartureAirport?: string
  defaultPassengers?: number
  preferredThemes?: string[]
  recentAirports?: string[]
}) {
  // This would integrate with a user session/database
  // For now, we'll return success as the client will handle local storage
  return { success: true }
}

// Server Action for clearing search history
export async function clearSearchHistoryAction() {
  // This would integrate with a user session/database
  // For now, we'll return success as the client will handle local storage
  revalidatePath('/search-history')
  return { success: true }
}