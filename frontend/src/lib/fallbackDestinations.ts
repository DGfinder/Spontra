import type { DestinationRecommendation } from '@/lib/searchState'

type ActivityType = 'adventure' | 'culture' | 'nightlife' | 'shopping' | 'relaxation'

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

export function buildFallbackRecommendations(options: {
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