import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { getAirportHubInfo, calculateHubScore, getContextualSuggestions } from '@/lib/airlineHubs'

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
  const startTime = Date.now()
  const { searchParams } = new URL(req.url)
  const query = (searchParams.get('q') || '').trim()
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10) || 20, 50)
  const includeCityGroups = searchParams.get('groupCities') === 'true'
  const fromAirport = searchParams.get('from') || undefined
  
  console.log(`🔍 Airport search: "${query}", limit=${limit}`)

  // Early validation - test Prisma connection
  try {
    await prisma.$queryRaw`SELECT 1`
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: 'Database not accessible'
    }, { status: 503 })
  }

  try {
    let airports: Airport[] = []

    if (!query || query.length < 1) {
      // Return popular airports when no query
      console.log('🏆 Returning popular airports')
      const popularCodes = ['LHR', 'CDG', 'FRA', 'AMS', 'JFK', 'LAX', 'ORD', 'ATL', 'DXB', 'SIN']
      
      const rows = await prisma.airport.findMany({
        where: {
          isActive: true,
          iataCode: { in: popularCodes }
        },
        select: {
          iataCode: true,
          icaoCode: true,
          name: true,
          city: true,
          country: true,
          latitude: true,
          longitude: true,
          timezone: true
        },
        orderBy: [
          // Custom ordering to match the original CASE statement
          { iataCode: 'asc' }
        ]
      })
      
      // Sort by predefined order
      const orderedRows = popularCodes
        .map(code => rows.find((row: any) => row.iataCode === code))
        .filter(Boolean)
      
      airports = orderedRows.map((row: any) => ({
        code: row.iataCode,
        icao_code: row.icaoCode || '',
        name: row.name,
        city: row.city,
        country: row.country,
        latitude: row.latitude ? parseFloat(row.latitude.toString()) : undefined,
        longitude: row.longitude ? parseFloat(row.longitude.toString()) : undefined,
        timezone: row.timezone || '',
        type: 'AIRPORT' as const,
        importance_score: 100,
        search_score: 1000
      }))

    } else {
      // Check if query matches a city code
      const cityCodeMatch = CITY_CODES[query.toUpperCase()]
      if (cityCodeMatch) {
        console.log(`🏙️ City code detected: ${query.toUpperCase()}`)
        
        const rows = await prisma.airport.findMany({
          where: {
            isActive: true,
            iataCode: { in: cityCodeMatch.airports }
          },
          select: {
            iataCode: true,
            icaoCode: true,
            name: true,
            city: true,
            country: true,
            latitude: true,
            longitude: true,
            timezone: true
          }
        })

        // Sort by predefined order from city code mapping
        const orderedRows = cityCodeMatch.airports
          .map(code => rows.find((row: any) => row.iataCode === code))
          .filter(Boolean)

        airports = orderedRows.map((row: any) => {
          const airport: Airport = {
            code: row.iataCode,
            icao_code: row.icaoCode || '',
            name: row.name,
            city: row.city,
            country: row.country,
            latitude: row.latitude ? parseFloat(row.latitude.toString()) : undefined,
            longitude: row.longitude ? parseFloat(row.longitude.toString()) : undefined,
            timezone: row.timezone || '',
            type: 'AIRPORT' as const,
            importance_score: AIRPORT_IMPORTANCE[row.iataCode] || 50,
            search_score: 1000
          }
          
          // Add hub info if available
          const hubInfo = getAirportHubInfo(row.iataCode)
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
              hubScore: calculateHubScore(row.iataCode)
            }
          }
          
          return airport
        })

        const cityGroups = [{
          city: cityCodeMatch.city,
          country: cityCodeMatch.country,
          airports: airports,
          primary_code: airports[0]?.code
        }]

        return NextResponse.json({
          ok: true,
          results: airports,
          cityGroups,
          totalCount: airports.length,
          searchType: 'city_code'
        })
      }

      // Search airports by query
      console.log(`🔍 Searching for: "${query}"`)
      
      const lowerQuery = query.toLowerCase()
      const rows = await prisma.airport.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: lowerQuery, mode: 'insensitive' } },
            { city: { contains: lowerQuery, mode: 'insensitive' } },
            { iataCode: { contains: lowerQuery, mode: 'insensitive' } },
            { country: { contains: lowerQuery, mode: 'insensitive' } }
          ]
        },
        select: {
          iataCode: true,
          icaoCode: true,
          name: true,
          city: true,
          country: true,
          latitude: true,
          longitude: true,
          timezone: true
        },
        take: limit
      })

      airports = rows.map((row: any) => {
        const airport: Airport = {
          code: row.iataCode,
          icao_code: row.icaoCode || '',
          name: row.name,
          city: row.city,
          country: row.country,
          latitude: row.latitude ? parseFloat(row.latitude.toString()) : undefined,
          longitude: row.longitude ? parseFloat(row.longitude.toString()) : undefined,
          timezone: row.timezone || '',
          type: 'AIRPORT' as const,
          importance_score: 75,
          search_score: 100
        }

        // Add hub info if available
        const hubInfo = getAirportHubInfo(row.iataCode)
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
            hubScore: calculateHubScore(row.iataCode)
          }
        }

        // Calculate search score
        airport.search_score = calculateSearchScore(query, airport)
        return airport
      })
      
      // Re-sort by calculated search score
      airports.sort((a, b) => b.search_score - a.search_score)
    }

    // Group multi-airport cities if requested
    const cityGroups = includeCityGroups ? groupAirportsByCity(airports) : []

    // Get contextual suggestions
    const suggestions = getContextualSuggestions(query, fromAirport)

    const duration = Date.now() - startTime
    console.log(`✅ Found ${airports.length} airports in ${duration}ms`)

    return NextResponse.json({
      ok: true,
      results: airports,
      cityGroups,
      totalCount: airports.length,
      searchType: query ? 'search' : 'popular',
      suggestions: airports.length < 5 ? suggestions : undefined,
      performance: { queryTimeMs: duration }
    })

  } catch (error: any) {
    console.error('❌ Airport search error:', error)
    return NextResponse.json({
      ok: false,
      error: 'Airport search failed',
      details: error.message
    }, { status: 500 })
  }
}