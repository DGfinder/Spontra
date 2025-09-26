import { NextRequest, NextResponse } from 'next/server'
import { getAirportHubInfo, calculateHubScore, getContextualSuggestions } from '@/lib/airlineHubs'

// Dynamic import for pg to handle build-time issues
const PgClient = (() => {
  try {
    return require('pg').Client
  } catch {
    return class MockClient {
      constructor() {}
      async connect() {}
      async query() { return { rows: [] } }
      async end() {}
    }
  }
})()

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

interface Airport {
  code: string
  icao_code?: string
  name: string
  city: string
  country: string
  latitude?: number
  longitude?: number
  timezone?: string
  type: 'AIRPORT' | 'CITY'
  importance_score: number
  search_score: number
  hub_info?: {
    airlines: Array<{
      code: string
      name: string
      alliance?: string
      hubType: 'primary' | 'secondary' | 'focus'
      routes: number
    }>
    isHub: boolean
    hubScore: number
  }
}

interface CityGroup {
  city: string
  country: string
  airports: Airport[]
  primary_code?: string
}

// Major city codes that group multiple airports
const CITY_CODES: Record<string, { city: string; country: string; airports: string[] }> = {
  'NYC': { city: 'New York', country: 'United States', airports: ['JFK', 'LGA', 'EWR'] },
  'LON': { city: 'London', country: 'United Kingdom', airports: ['LHR', 'LGW', 'STN', 'LTN'] },
  'PAR': { city: 'Paris', country: 'France', airports: ['CDG', 'ORY', 'BVA'] },
  'BER': { city: 'Berlin', country: 'Germany', airports: ['BER', 'SXF'] },
  'MIL': { city: 'Milan', country: 'Italy', airports: ['MXP', 'LIN', 'BGY'] },
  'ROM': { city: 'Rome', country: 'Italy', airports: ['FCO', 'CIA'] },
  'TOK': { city: 'Tokyo', country: 'Japan', airports: ['NRT', 'HND'] },
  'OSA': { city: 'Osaka', country: 'Japan', airports: ['KIX', 'ITM'] },
  'CHI': { city: 'Chicago', country: 'United States', airports: ['ORD', 'MDW'] },
  'WAS': { city: 'Washington DC', country: 'United States', airports: ['IAD', 'DCA', 'BWI'] },
  'BAY': { city: 'San Francisco Bay Area', country: 'United States', airports: ['SFO', 'OAK', 'SJC'] },
  'SAO': { city: 'São Paulo', country: 'Brazil', airports: ['GRU', 'CGH', 'VCP'] },
  'BUE': { city: 'Buenos Aires', country: 'Argentina', airports: ['EZE', 'AEP'] },
  'STO': { city: 'Stockholm', country: 'Sweden', airports: ['ARN', 'BMA', 'NYO'] },
  'MOW': { city: 'Moscow', country: 'Russia', airports: ['SVO', 'DME', 'VKO'] }
}

// Airport importance based on passenger volume, hub status, and route connectivity
const AIRPORT_IMPORTANCE: Record<string, number> = {
  // Major international hubs (score: 100-90)
  'LHR': 100, 'CDG': 98, 'FRA': 96, 'AMS': 94, 'MAD': 92, 'FCO': 90,
  'JFK': 98, 'LAX': 96, 'ORD': 94, 'ATL': 92, 'DFW': 90, 'SFO': 88,
  'NRT': 96, 'HND': 94, 'ICN': 92, 'SIN': 90, 'HKG': 88, 'BKK': 86,
  'DXB': 98, 'DOH': 94, 'AUH': 90, 'CAI': 85,
  'SYD': 92, 'MEL': 88, 'PER': 84,
  
  // Secondary international airports (score: 89-70)  
  'LGW': 85, 'STN': 80, 'LTN': 75, 'ORY': 85, 'BVA': 75,
  'EWR': 88, 'LGA': 85, 'MDW': 80, 'BWI': 78, 'DCA': 82,
  'MUC': 88, 'DUS': 82, 'TXL': 85, 'BER': 88, // TXL legacy mapping
  'BCN': 88, 'VIE': 84, 'ZUR': 86, 'CPH': 84, 'ARN': 82,
  'YYZ': 88, 'YVR': 84, 'YUL': 82,
  'GIG': 86, 'GRU': 88, 'SCL': 84, 'LIM': 82,
  
  // Regional hubs (score: 69-50)
  'MXP': 78, 'LIN': 72, 'BGY': 68, 'CIA': 75,
  'BRU': 78, 'DUB': 76, 'OSL': 74, 'HEL': 72,
  'WAW': 76, 'PRG': 74, 'BUD': 72, 'OTP': 70,
  'IST': 85, 'SAW': 75, 'ESB': 70,
  'KUL': 82, 'CGK': 80, 'MNL': 78, 'TPE': 84,
}

// Calculate Levenshtein distance for fuzzy matching
function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length

  const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null))

  for (let i = 0; i <= a.length; i++) matrix[0][i] = i
  for (let j = 0; j <= b.length; j++) matrix[j][0] = j

  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      if (a[i - 1] === b[j - 1]) {
        matrix[j][i] = matrix[j - 1][i - 1]
      } else {
        matrix[j][i] = Math.min(
          matrix[j - 1][i - 1] + 1, // substitution
          matrix[j][i - 1] + 1,     // insertion
          matrix[j - 1][i] + 1      // deletion
        )
      }
    }
  }

  return matrix[b.length][a.length]
}

// Normalize text for searching
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Calculate search relevance score
function calculateSearchScore(query: string, airport: Airport): number {
  const normalizedQuery = normalize(query)
  const queryWords = normalizedQuery.split(' ')
  
  let score = 0
  const importance = AIRPORT_IMPORTANCE[airport.code] || 50

  // Exact code match gets highest score
  if (normalize(airport.code) === normalizedQuery) {
    score += 1000
  } else if (normalize(airport.code).startsWith(normalizedQuery)) {
    score += 800
  } else if (normalize(airport.code).includes(normalizedQuery)) {
    score += 600
  }

  // ICAO code matching
  if (airport.icao_code && normalize(airport.icao_code).includes(normalizedQuery)) {
    score += 400
  }

  // Name matching with fuzzy search
  const normalizedName = normalize(airport.name)
  if (normalizedName === normalizedQuery) {
    score += 900
  } else if (normalizedName.includes(normalizedQuery)) {
    score += 700
    // Bonus for word boundaries
    queryWords.forEach(word => {
      if (normalizedName.split(' ').some(nameWord => nameWord.startsWith(word))) {
        score += 100
      }
    })
  } else {
    // Fuzzy matching for names
    const distance = levenshteinDistance(normalizedQuery, normalizedName.substring(0, normalizedQuery.length))
    if (distance <= 2 && normalizedQuery.length > 3) {
      score += Math.max(0, 300 - (distance * 50))
    }
  }

  // City matching
  const normalizedCity = normalize(airport.city)
  if (normalizedCity === normalizedQuery) {
    score += 800
  } else if (normalizedCity.includes(normalizedQuery)) {
    score += 500
    queryWords.forEach(word => {
      if (normalizedCity.split(' ').some(cityWord => cityWord.startsWith(word))) {
        score += 50
      }
    })
  } else {
    // Fuzzy matching for cities
    const distance = levenshteinDistance(normalizedQuery, normalizedCity.substring(0, normalizedQuery.length))
    if (distance <= 2 && normalizedQuery.length > 3) {
      score += Math.max(0, 200 - (distance * 40))
    }
  }

  // Country matching (lower priority)
  if (normalize(airport.country).includes(normalizedQuery)) {
    score += 100
  }

  // Apply importance weighting (20% of total score)
  score += importance * 2
  
  // Hub bonus (additional 5-15% boost for airline hubs)
  const hubScore = calculateHubScore(airport.code)
  if (hubScore > 0) {
    score += hubScore * 0.5 // Hub bonus
  }

  return score
}

// Group airports by city for multi-airport cities
function groupAirportsByCity(airports: Airport[]): CityGroup[] {
  const cityGroups = new Map<string, Airport[]>()
  
  airports.forEach(airport => {
    const key = `${airport.city}-${airport.country}`
    if (!cityGroups.has(key)) {
      cityGroups.set(key, [])
    }
    cityGroups.get(key)!.push(airport)
  })

  return Array.from(cityGroups.entries())
    .filter(([, airports]) => airports.length > 1) // Only multi-airport cities
    .map(([key, airports]) => {
      const [city, country] = key.split('-')
      const sortedAirports = airports.sort((a, b) => b.importance_score - a.importance_score)
      
      return {
        city,
        country,
        airports: sortedAirports,
        primary_code: sortedAirports[0].code
      }
    })
    .sort((a, b) => b.airports[0].importance_score - a.airports[0].importance_score)
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const query = (searchParams.get('q') || '').trim()
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10) || 20, 50)
  const includeCityGroups = searchParams.get('groupCities') === 'true'
  const fromAirport = searchParams.get('from') || undefined

  // Initialize database connection early
  const pgUrl = process.env.SEARCH_DATABASE_URL || process.env.DATABASE_URL
  if (!pgUrl) {
    return NextResponse.json({ ok: false, error: 'Database not configured' }, { status: 503 })
  }

  const pg = new PgClient({ connectionString: pgUrl })

  if (!query || query.length < 1) {
    // Return contextual suggestions when query is empty
    const contextualSuggestions = getContextualSuggestions('', fromAirport)
    
    // Get popular airports with hub info
    const popularAirportCodes = ['LHR', 'CDG', 'FRA', 'AMS', 'JFK', 'LAX', 'ORD', 'ATL', 'DXB', 'SIN', 'NRT', 'HKG']
    const popularQuery = `
      SELECT iata_code, icao_code, name, city, country, latitude, longitude, timezone
      FROM airports 
      WHERE is_active = true AND iata_code = ANY($1)
      ORDER BY 
        CASE iata_code ${popularAirportCodes.map((code, i) => `WHEN '${code}' THEN ${i}`).join(' ')} END
      LIMIT 12
    `
    
    const { rows: popularRows } = await pg.query(popularQuery, [popularAirportCodes])
    const popularAirports = popularRows.map((r: any) => {
      const iataCode = r.iata_code?.toUpperCase() || ''
      const airport: Airport = {
        code: iataCode,
        icao_code: r.icao_code?.toUpperCase() || '',
        name: r.name || '',
        city: r.city || '',
        country: r.country || '',
        latitude: parseFloat(r.latitude) || undefined,
        longitude: parseFloat(r.longitude) || undefined,
        timezone: r.timezone || '',
        type: 'AIRPORT' as const,
        importance_score: AIRPORT_IMPORTANCE[iataCode] || 50,
        search_score: 1000
      }
      
      // Add hub info
      const hubInfo = getAirportHubInfo(iataCode)
      if (hubInfo.length > 0) {
        airport.hub_info = {
          airlines: hubInfo.map(hub => ({
            code: hub.airline,
            name: hub.airlineName,
            alliance: hub.alliance,
            hubType: hub.hubType,
            routes: hub.routes
          })),
          isHub: true,
          hubScore: calculateHubScore(iataCode)
        }
      }
      
      return airport
    })
    
    return NextResponse.json({ 
      ok: true, 
      results: popularAirports, 
      cityGroups: [], 
      totalCount: popularAirports.length,
      suggestions: contextualSuggestions,
      searchType: 'popular_airports' 
    })
  }

  try {
    await pg.connect()
    console.log(`🔍 Searching airports for: "${query}"`)

    // Check if query matches a city code
    const cityCodeMatch = CITY_CODES[query.toUpperCase()]
    if (cityCodeMatch) {
      console.log(`🏙️ City code detected: ${query.toUpperCase()}`)
      
      const placeholders = cityCodeMatch.airports.map((_, i) => `$${i + 1}`).join(', ')
      const { rows } = await pg.query(
        `SELECT iata_code, icao_code, name, city, country, latitude, longitude, timezone
         FROM airports
         WHERE is_active = true AND iata_code IN (${placeholders})
         ORDER BY 
           CASE iata_code ${cityCodeMatch.airports.map((code, i) => `WHEN $${i + 1} THEN ${i}`).join(' ')} END`,
        cityCodeMatch.airports
      )

      const cityAirports = rows.map((r: any) => {
        const iataCode = r.iata_code?.toUpperCase() || ''
        const airport: Airport = {
          code: iataCode,
          icao_code: r.icao_code?.toUpperCase() || '',
          name: r.name || '',
          city: r.city || '',
          country: r.country || '',
          latitude: parseFloat(r.latitude) || undefined,
          longitude: parseFloat(r.longitude) || undefined,
          timezone: r.timezone || '',
          type: 'AIRPORT' as const,
          importance_score: AIRPORT_IMPORTANCE[iataCode] || 50,
          search_score: 1000
        }
        
        // Add airline hub information
        const hubInfo = getAirportHubInfo(iataCode)
        if (hubInfo.length > 0) {
          airport.hub_info = {
            airlines: hubInfo.map(hub => ({
              code: hub.airline,
              name: hub.airlineName,
              alliance: hub.alliance,
              hubType: hub.hubType,
              routes: hub.routes
            })),
            isHub: true,
            hubScore: calculateHubScore(iataCode)
          }
        }
        
        return airport
      })

      return NextResponse.json({
        ok: true,
        results: cityAirports,
        cityGroups: [{ 
          city: cityCodeMatch.city, 
          country: cityCodeMatch.country, 
          airports: cityAirports,
          primary_code: cityAirports[0]?.code
        }],
        totalCount: cityAirports.length,
        searchType: 'city_code'
      })
    }

    // Full-text search with comprehensive matching
    const searchQuery = `
      SELECT iata_code, icao_code, name, city, country, latitude, longitude, timezone
      FROM airports 
      WHERE is_active = true
        AND (
          LOWER(iata_code) LIKE LOWER($1) || '%'
          OR LOWER(icao_code) LIKE LOWER($1) || '%'
          OR LOWER(name) LIKE '%' || LOWER($1) || '%'
          OR LOWER(city) LIKE '%' || LOWER($1) || '%'
          OR LOWER(country) LIKE '%' || LOWER($1) || '%'
          OR LOWER(name) % LOWER($1) -- PostgreSQL similarity operator for fuzzy matching
          OR LOWER(city) % LOWER($1)
        )
      ORDER BY 
        -- Exact matches first
        CASE 
          WHEN LOWER(iata_code) = LOWER($1) THEN 1000
          WHEN LOWER(icao_code) = LOWER($1) THEN 950
          WHEN LOWER(iata_code) LIKE LOWER($1) || '%' THEN 900
          WHEN LOWER(city) = LOWER($1) THEN 850
          WHEN LOWER(name) LIKE LOWER($1) || '%' THEN 800
          WHEN LOWER(city) LIKE LOWER($1) || '%' THEN 750
          WHEN LOWER(name) LIKE '%' || LOWER($1) || '%' THEN 600
          WHEN LOWER(city) LIKE '%' || LOWER($1) || '%' THEN 550
          WHEN LOWER(country) LIKE '%' || LOWER($1) || '%' THEN 400
          ELSE similarity(LOWER(name), LOWER($1)) * 300 + similarity(LOWER(city), LOWER($1)) * 200
        END DESC,
        -- Secondary sort by importance (major airports first)
        CASE iata_code 
          ${Object.entries(AIRPORT_IMPORTANCE).map(([code, score]) => `WHEN '${code}' THEN ${score}`).join(' ')}
          ELSE 50
        END DESC,
        name ASC
      LIMIT $2`

    const { rows } = await pg.query(searchQuery, [query, limit * 2]) // Get more results for processing
    
    // Track search analytics (non-blocking)
    if (query.length >= 3) {
      pg.query(`
        INSERT INTO search_analytics (query, result_count, search_date)
        VALUES ($1, $2, NOW())
        ON CONFLICT (query) DO UPDATE SET
          search_count = search_analytics.search_count + 1,
          last_searched = NOW(),
          result_count = $2
      `, [query.toLowerCase().trim(), rows.length]).catch(() => {
        // Silently fail analytics - don't impact search functionality
      })
    }

    const airports: Airport[] = rows.map((r: any) => {
      const iataCode = r.iata_code?.toUpperCase() || ''
      
      const airport: Airport = {
        code: iataCode,
        icao_code: r.icao_code?.toUpperCase() || '',
        name: r.name || '',
        city: r.city || '',
        country: r.country || '',
        latitude: parseFloat(r.latitude) || undefined,
        longitude: parseFloat(r.longitude) || undefined,
        timezone: r.timezone || '',
        type: 'AIRPORT' as const,
        importance_score: AIRPORT_IMPORTANCE[iataCode] || 50,
        search_score: 0
      }
      
      // Add airline hub information
      const hubInfo = getAirportHubInfo(iataCode)
      if (hubInfo.length > 0) {
        airport.hub_info = {
          airlines: hubInfo.map(hub => ({
            code: hub.airline,
            name: hub.airlineName,
            alliance: hub.alliance,
            hubType: hub.hubType,
            routes: hub.routes
          })),
          isHub: true,
          hubScore: calculateHubScore(iataCode)
        }
      }
      
      // Calculate search score (now includes hub bonus)
      airport.search_score = calculateSearchScore(query, airport)
      return airport
    }).filter((airport: Airport) => airport.search_score > 50) // Filter low relevance results
    
    // Re-sort by calculated search score
    airports.sort((a, b) => b.search_score - a.search_score)

    // Limit final results
    const limitedAirports = airports.slice(0, limit)

    // Group multi-airport cities if requested
    const cityGroups = includeCityGroups ? groupAirportsByCity(limitedAirports) : []

    console.log(`✅ Found ${limitedAirports.length} airports (${cityGroups.length} city groups)`)

    // Get contextual suggestions for partial matches
    const suggestions = getContextualSuggestions(query, fromAirport)
    
    return NextResponse.json({
      ok: true,
      results: limitedAirports,
      cityGroups,
      totalCount: limitedAirports.length,
      searchType: 'full_search',
      suggestions: limitedAirports.length < 5 ? suggestions : undefined // Only show suggestions if few results
    })

  } catch (error: any) {
    console.error('❌ Airport search error:', error)
    return NextResponse.json(
      { ok: false, error: error?.message || 'Search failed' },
      { status: 500 }
    )
  } finally {
    try { 
      await pg.end() 
    } catch {}
  }
}