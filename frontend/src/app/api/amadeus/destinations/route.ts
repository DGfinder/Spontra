import { NextRequest, NextResponse } from 'next/server'
import { apiClient } from '@/services/apiClient'
import type { DestinationRecommendation, ActivityType } from '@/services/apiClient'
import { amadeusService } from '@/services/amadeusService'
import { validateApiRequest, destinationSearchApiSchema } from '@/lib/validations'
import { cacheGet, cacheSet } from '@/lib/cacheServer'

export const runtime = 'nodejs'

type FallbackDestinationSeed = {
  code: string
  city: string
  country: string
  countryCode: string
  durationMinutes: number
  priceRange: string
  currency: string
  timezone: string
  language: string
  climate: string
  averageTemp: string
  budgetLevel: 'budget' | 'mid-range' | 'luxury'
  activityFocus: ActivityType[]
}

const FALLBACK_DESTINATIONS: Record<string, FallbackDestinationSeed[]> = {
  LHR: [
    {
      code: 'BCN',
      city: 'Barcelona',
      country: 'Spain',
      countryCode: 'ES',
      durationMinutes: 140,
      priceRange: 'EUR 160-240',
      currency: 'EUR',
      timezone: 'Europe/Madrid',
      language: 'Spanish',
      climate: 'Mediterranean',
      averageTemp: '18-28C',
      budgetLevel: 'mid-range',
      activityFocus: ['nightlife', 'restaurants']
    },
    {
      code: 'KEF',
      city: 'Reykjavik',
      country: 'Iceland',
      countryCode: 'IS',
      durationMinutes: 185,
      priceRange: 'EUR 220-320',
      currency: 'EUR',
      timezone: 'Atlantic/Reykjavik',
      language: 'Icelandic',
      climate: 'Subpolar Oceanic',
      averageTemp: '5-12C',
      budgetLevel: 'mid-range',
      activityFocus: ['nature', 'adventure']
    },
    {
      code: 'RAK',
      city: 'Marrakesh',
      country: 'Morocco',
      countryCode: 'MA',
      durationMinutes: 195,
      priceRange: 'EUR 180-260',
      currency: 'EUR',
      timezone: 'Africa/Casablanca',
      language: 'Arabic',
      climate: 'Semi-Arid',
      averageTemp: '20-32C',
      budgetLevel: 'budget',
      activityFocus: ['culture', 'activities']
    }
  ],
  JFK: [
    {
      code: 'SJU',
      city: 'San Juan',
      country: 'Puerto Rico',
      countryCode: 'PR',
      durationMinutes: 216,
      priceRange: 'USD 210-290',
      currency: 'USD',
      timezone: 'America/Puerto_Rico',
      language: 'Spanish',
      climate: 'Tropical',
      averageTemp: '24-30C',
      budgetLevel: 'mid-range',
      activityFocus: ['relaxation', 'food_tours']
    },
    {
      code: 'YVR',
      city: 'Vancouver',
      country: 'Canada',
      countryCode: 'CA',
      durationMinutes: 366,
      priceRange: 'USD 320-410',
      currency: 'USD',
      timezone: 'America/Vancouver',
      language: 'English',
      climate: 'Marine West Coast',
      averageTemp: '6-20C',
      budgetLevel: 'mid-range',
      activityFocus: ['adventure', 'nature']
    },
    {
      code: 'CUN',
      city: 'Cancun',
      country: 'Mexico',
      countryCode: 'MX',
      durationMinutes: 240,
      priceRange: 'USD 230-320',
      currency: 'USD',
      timezone: 'America/Cancun',
      language: 'Spanish',
      climate: 'Tropical',
      averageTemp: '23-31C',
      budgetLevel: 'mid-range',
      activityFocus: ['relaxation', 'nightlife']
    }
  ],
  CDG: [
    {
      code: 'LIS',
      city: 'Lisbon',
      country: 'Portugal',
      countryCode: 'PT',
      durationMinutes: 150,
      priceRange: 'EUR 150-230',
      currency: 'EUR',
      timezone: 'Europe/Lisbon',
      language: 'Portuguese',
      climate: 'Mediterranean',
      averageTemp: '16-27C',
      budgetLevel: 'mid-range',
      activityFocus: ['culture', 'food_tours']
    },
    {
      code: 'ATH',
      city: 'Athens',
      country: 'Greece',
      countryCode: 'GR',
      durationMinutes: 195,
      priceRange: 'EUR 210-320',
      currency: 'EUR',
      timezone: 'Europe/Athens',
      language: 'Greek',
      climate: 'Mediterranean',
      averageTemp: '18-32C',
      budgetLevel: 'mid-range',
      activityFocus: ['culture', 'sightseeing']
    },
    {
      code: 'KEF',
      city: 'Reykjavik',
      country: 'Iceland',
      countryCode: 'IS',
      durationMinutes: 210,
      priceRange: 'EUR 240-340',
      currency: 'EUR',
      timezone: 'Atlantic/Reykjavik',
      language: 'Icelandic',
      climate: 'Subpolar Oceanic',
      averageTemp: '5-12C',
      budgetLevel: 'mid-range',
      activityFocus: ['nature', 'adventure']
    }
  ],
  SYD: [
    {
      code: 'MEL',
      city: 'Melbourne',
      country: 'Australia',
      countryCode: 'AU',
      durationMinutes: 95,
      priceRange: 'AUD 180-260',
      currency: 'AUD',
      timezone: 'Australia/Melbourne',
      language: 'English',
      climate: 'Oceanic',
      averageTemp: '10-22C',
      budgetLevel: 'mid-range',
      activityFocus: ['culture', 'activities']
    },
    {
      code: 'AKL',
      city: 'Auckland',
      country: 'New Zealand',
      countryCode: 'NZ',
      durationMinutes: 180,
      priceRange: 'AUD 260-360',
      currency: 'AUD',
      timezone: 'Pacific/Auckland',
      language: 'English',
      climate: 'Subtropical',
      averageTemp: '12-24C',
      budgetLevel: 'mid-range',
      activityFocus: ['adventure', 'nature']
    },
    {
      code: 'NAN',
      city: 'Nadi',
      country: 'Fiji',
      countryCode: 'FJ',
      durationMinutes: 240,
      priceRange: 'AUD 320-420',
      currency: 'AUD',
      timezone: 'Pacific/Fiji',
      language: 'English',
      climate: 'Tropical',
      averageTemp: '23-31C',
      budgetLevel: 'mid-range',
      activityFocus: ['relaxation', 'nature']
    }
  ],
  DEFAULT: [
    {
      code: 'BCN',
      city: 'Barcelona',
      country: 'Spain',
      countryCode: 'ES',
      durationMinutes: 140,
      priceRange: 'EUR 160-240',
      currency: 'EUR',
      timezone: 'Europe/Madrid',
      language: 'Spanish',
      climate: 'Mediterranean',
      averageTemp: '18-28C',
      budgetLevel: 'mid-range',
      activityFocus: ['activities']
    },
    {
      code: 'LIS',
      city: 'Lisbon',
      country: 'Portugal',
      countryCode: 'PT',
      durationMinutes: 150,
      priceRange: 'EUR 150-230',
      currency: 'EUR',
      timezone: 'Europe/Lisbon',
      language: 'Portuguese',
      climate: 'Mediterranean',
      averageTemp: '16-27C',
      budgetLevel: 'mid-range',
      activityFocus: ['culture']
    },
    {
      code: 'SJU',
      city: 'San Juan',
      country: 'Puerto Rico',
      countryCode: 'PR',
      durationMinutes: 216,
      priceRange: 'USD 210-290',
      currency: 'USD',
      timezone: 'America/Puerto_Rico',
      language: 'Spanish',
      climate: 'Tropical',
      averageTemp: '24-30C',
      budgetLevel: 'mid-range',
      activityFocus: ['relaxation']
    }
  ]
}

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

function buildFallbackRecommendations(options: {
  origin: string
  theme?: string
  minFlightTime?: number | null
  maxFlightTime?: number | null
}): DestinationRecommendation[] {
  const { origin, theme, minFlightTime, maxFlightTime } = options
  const normalizedOrigin = (origin || '').toUpperCase()
  const seeds = [
    ...(FALLBACK_DESTINATIONS[normalizedOrigin] || []),
    ...FALLBACK_DESTINATIONS.DEFAULT
  ]

  const seen = new Set<string>()
  const filteredSeeds: FallbackDestinationSeed[] = []

  for (const seed of seeds) {
    if (seen.has(seed.code)) continue
    const hours = seed.durationMinutes / 60
    if (minFlightTime != null && hours < minFlightTime) continue
    if (maxFlightTime != null && hours > maxFlightTime) continue
    filteredSeeds.push(seed)
    seen.add(seed.code)
    if (filteredSeeds.length >= 6) break
  }

  const finalSeeds = filteredSeeds.length ? filteredSeeds : FALLBACK_DESTINATIONS.DEFAULT.slice(0, 6)
  const themeLabel = theme?.trim().length ? theme.trim() : 'curated escapes'

  return finalSeeds.map((seed, index) => {
    const timestamp = new Date().toISOString()
    const activityMatches = mapThemeToActivityMatches(theme, seed.activityFocus)
    const activitySet = seed.activityFocus.length ? seed.activityFocus : activityMatches
    const activities = activitySet.map((activity, idx) => ({
      type: activity,
      score: Math.max(60, 78 - idx * 4),
      description: `Notable ${activity.replace('_', ' ')} experiences in ${seed.city}.`,
      popular_spots: [],
      average_price: seed.budgetLevel === 'luxury' ? 'High' : seed.budgetLevel === 'mid-range' ? 'Moderate' : 'Accessible',
      recommended_days: activity === 'relaxation' ? 3 : 2
    }))

    const totalMinutes = seed.durationMinutes
    const friendlyActivities = activityMatches.map((value) => value.replace('_', ' ')).join(', ')

    return {
      destination: {
        id: seed.code,
        airport_code: seed.code,
        city_name: seed.city,
        country_name: seed.country,
        country_code: seed.countryCode,
        description: `A ${themeLabel} break in ${seed.city} with plenty to explore.`,
        image_url: '',
        activities,
        popularity_score: Math.max(65, 88 - index * 5),
        climate_info: {
          average_temperature: seed.averageTemp,
          rainy_months: [],
          sunny_months: [],
          climate_type: seed.climate
        },
        best_time_to_visit: ['Apr', 'May', 'Sep', 'Oct'],
        budget: {
          level: seed.budgetLevel,
          daily_budget_range: seed.priceRange,
          currency: seed.currency
        },
        timezone: seed.timezone,
        language: [seed.language],
        currency: seed.currency,
        visa_required: false,
        created_at: timestamp,
        updated_at: timestamp
      },
      flight_route: {
        id: `${normalizedOrigin || origin}-${seed.code}`,
        origin_airport_code: normalizedOrigin || origin,
        destination_airport_code: seed.code,
        estimated_duration_hours: Math.floor(totalMinutes / 60),
        estimated_duration_minutes: totalMinutes % 60,
        total_duration_minutes: totalMinutes,
        created_at: timestamp,
        updated_at: timestamp
      },
      match_score: Math.min(95, 90 - index * 4),
      activity_matches: activityMatches,
      reason_for_recommendation: friendlyActivities.length ? `Great for ${friendlyActivities}` : 'Balanced getaway picks',
      estimated_flight_price: seed.priceRange
    }
  })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validation = validateApiRequest(destinationSearchApiSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { ok: false, error: 'Invalid destination search parameters', details: validation.errors },
        { status: 400 }
      )
    }

    const { origin, minFlightTime, maxFlightTime, theme, departureDate, priceRange, nonStop } = validation.data
    const cacheKey = `destinations:${origin}:${departureDate || 'any'}:${theme || 'general'}:${minFlightTime ?? ''}:${maxFlightTime ?? ''}:${nonStop ? '1' : '0'}:${process.env.NEXT_PUBLIC_BACKEND_ENABLED === 'true' ? 'be' : 'am'}`

    const cached = await cacheGet(cacheKey).catch(() => null)
    if (cached) {
      return NextResponse.json(JSON.parse(cached), { headers: { 'X-Cache': 'HIT' } })
    }

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
          budget_level: (priceRange as any) || 'any',
          max_results: 20,
          include_visa_required: true
        })
        const payload = {
          ok: true,
          data: response.recommended_destinations,
          totalResults: response.total_results,
          source: 'backend',
          requestId: `req_${Date.now()}`
        }
        await cacheSet(cacheKey, JSON.stringify(payload), { ttlSeconds: ttl }).catch(() => {})
        return NextResponse.json(payload, { headers: { 'X-Cache': 'MISS' } })
      } catch (error) {
        console.warn('Backend destination exploration failed, falling back to Amadeus/local flow', error)
      }
    }

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
      recommendations = buildFallbackRecommendations({
        origin,
        theme,
        minFlightTime: minFlightTime ?? null,
        maxFlightTime: maxFlightTime ?? null
      })
      source = 'fallback'
    }

    if (source === 'amadeus' && recommendations.length > 0) {
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
            if (code && Number.isFinite(Number(minutes))) {
              byDest.set(String(code), Number(minutes))
            }
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
            if ((minFlightTime != null && hours < minFlightTime) || (maxFlightTime != null && hours > maxFlightTime)) continue
            filtered.push(rec)
          }
          recommendations = filtered
        }
      } catch (error) {
        console.warn('Destination enrichment lookup failed', error)
      }
    }

    if (recommendations.length === 0) {
      recommendations = buildFallbackRecommendations({
        origin,
        theme,
        minFlightTime: minFlightTime ?? null,
        maxFlightTime: maxFlightTime ?? null
      })
      source = 'fallback'
    }

    const payload = {
      ok: true,
      data: recommendations,
      totalResults: recommendations.length,
      source,
      requestId: `req_${Date.now()}`
    }
    await cacheSet(cacheKey, JSON.stringify(payload), { ttlSeconds: ttl }).catch(() => {})
    return NextResponse.json(payload, { headers: { 'X-Cache': 'MISS' } })
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: 'An unexpected error occurred while searching destinations. Please try again.' },
      { status: 500 }
    )
  }
}

