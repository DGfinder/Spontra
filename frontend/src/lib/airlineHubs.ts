/**
 * Airline Hub Information and Route Network Data
 * 
 * This module provides airline alliance information, hub airports,
 * and route connectivity data for enhanced airport search suggestions.
 */

export interface AirlineHub {
  airline: string
  airlineName: string
  iataCode: string
  icaoCode?: string
  hubType: 'primary' | 'secondary' | 'focus'
  alliance?: 'Star Alliance' | 'OneWorld' | 'SkyTeam' | 'Low Cost'
  routes: number // Approximate route count
  passengers: number // Annual passenger volume (millions)
}

export interface RouteConnection {
  from: string
  to: string
  airlines: string[]
  frequency: 'high' | 'medium' | 'low' // Daily flights
  seasonal?: boolean
}

// Major airline hubs by alliance and importance
export const AIRLINE_HUBS: AirlineHub[] = [
  // Star Alliance Hubs
  { airline: 'LH', airlineName: 'Lufthansa', iataCode: 'FRA', icaoCode: 'EDDF', hubType: 'primary', alliance: 'Star Alliance', routes: 280, passengers: 70 },
  { airline: 'LH', airlineName: 'Lufthansa', iataCode: 'MUC', icaoCode: 'EDDM', hubType: 'primary', alliance: 'Star Alliance', routes: 230, passengers: 48 },
  { airline: 'UA', airlineName: 'United Airlines', iataCode: 'ORD', icaoCode: 'KORD', hubType: 'primary', alliance: 'Star Alliance', routes: 340, passengers: 85 },
  { airline: 'UA', airlineName: 'United Airlines', iataCode: 'SFO', icaoCode: 'KSFO', hubType: 'primary', alliance: 'Star Alliance', routes: 280, passengers: 58 },
  { airline: 'UA', airlineName: 'United Airlines', iataCode: 'EWR', icaoCode: 'KEWR', hubType: 'primary', alliance: 'Star Alliance', routes: 260, passengers: 46 },
  { airline: 'AC', airlineName: 'Air Canada', iataCode: 'YYZ', icaoCode: 'CYYZ', hubType: 'primary', alliance: 'Star Alliance', routes: 180, passengers: 47 },
  { airline: 'SQ', airlineName: 'Singapore Airlines', iataCode: 'SIN', icaoCode: 'WSSS', hubType: 'primary', alliance: 'Star Alliance', routes: 140, passengers: 66 },
  { airline: 'NH', airlineName: 'ANA', iataCode: 'NRT', icaoCode: 'RJTT', hubType: 'primary', alliance: 'Star Alliance', routes: 120, passengers: 40 },
  { airline: 'NH', airlineName: 'ANA', iataCode: 'HND', icaoCode: 'RJTT', hubType: 'primary', alliance: 'Star Alliance', routes: 110, passengers: 87 },

  // OneWorld Hubs
  { airline: 'BA', airlineName: 'British Airways', iataCode: 'LHR', icaoCode: 'EGLL', hubType: 'primary', alliance: 'OneWorld', routes: 180, passengers: 81 },
  { airline: 'AA', airlineName: 'American Airlines', iataCode: 'DFW', icaoCode: 'KDFW', hubType: 'primary', alliance: 'OneWorld', routes: 230, passengers: 75 },
  { airline: 'AA', airlineName: 'American Airlines', iataCode: 'CLT', icaoCode: 'KCLT', hubType: 'primary', alliance: 'OneWorld', routes: 180, passengers: 50 },
  { airline: 'AA', airlineName: 'American Airlines', iataCode: 'MIA', icaoCode: 'KMIA', hubType: 'secondary', alliance: 'OneWorld', routes: 140, passengers: 46 },
  { airline: 'QR', airlineName: 'Qatar Airways', iataCode: 'DOH', icaoCode: 'OTHH', hubType: 'primary', alliance: 'OneWorld', routes: 160, passengers: 38 },
  { airline: 'CX', airlineName: 'Cathay Pacific', iataCode: 'HKG', icaoCode: 'VHHH', hubType: 'primary', alliance: 'OneWorld', routes: 90, passengers: 75 },

  // SkyTeam Hubs  
  { airline: 'AF', airlineName: 'Air France', iataCode: 'CDG', icaoCode: 'LFPG', hubType: 'primary', alliance: 'SkyTeam', routes: 320, passengers: 72 },
  { airline: 'KL', airlineName: 'KLM', iataCode: 'AMS', icaoCode: 'EHAM', hubType: 'primary', alliance: 'SkyTeam', routes: 320, passengers: 71 },
  { airline: 'DL', airlineName: 'Delta Air Lines', iataCode: 'ATL', icaoCode: 'KATL', hubType: 'primary', alliance: 'SkyTeam', routes: 320, passengers: 110 },
  { airline: 'DL', airlineName: 'Delta Air Lines', iataCode: 'MSP', icaoCode: 'KMSP', hubType: 'secondary', alliance: 'SkyTeam', routes: 150, passengers: 38 },
  { airline: 'DL', airlineName: 'Delta Air Lines', iataCode: 'DTW', icaoCode: 'KDTW', hubType: 'secondary', alliance: 'SkyTeam', routes: 140, passengers: 35 },

  // Middle Eastern Carriers
  { airline: 'EK', airlineName: 'Emirates', iataCode: 'DXB', icaoCode: 'OMDB', hubType: 'primary', alliance: undefined, routes: 160, passengers: 89 },
  { airline: 'EY', airlineName: 'Etihad Airways', iataCode: 'AUH', icaoCode: 'OMAA', hubType: 'primary', alliance: undefined, routes: 80, passengers: 21 },
  
  // Low Cost Carrier Hubs
  { airline: 'FR', airlineName: 'Ryanair', iataCode: 'STN', icaoCode: 'EGSS', hubType: 'primary', alliance: 'Low Cost', routes: 180, passengers: 28 },
  { airline: 'U2', airlineName: 'easyJet', iataCode: 'LGW', icaoCode: 'EGKK', hubType: 'primary', alliance: 'Low Cost', routes: 150, passengers: 46 },
  { airline: 'WN', airlineName: 'Southwest Airlines', iataCode: 'LAS', icaoCode: 'KLAS', hubType: 'focus', alliance: 'Low Cost', routes: 120, passengers: 51 },
]

// Popular route connections for suggestion algorithms
export const POPULAR_ROUTES: RouteConnection[] = [
  // Transatlantic
  { from: 'LHR', to: 'JFK', airlines: ['BA', 'AA', 'VS'], frequency: 'high' },
  { from: 'CDG', to: 'JFK', airlines: ['AF', 'DL'], frequency: 'high' },
  { from: 'FRA', to: 'ORD', airlines: ['LH', 'UA'], frequency: 'high' },
  { from: 'AMS', to: 'JFK', airlines: ['KL', 'DL'], frequency: 'high' },
  
  // Transpacific  
  { from: 'LAX', to: 'NRT', airlines: ['UA', 'NH', 'JL'], frequency: 'high' },
  { from: 'SFO', to: 'HND', airlines: ['UA', 'NH'], frequency: 'high' },
  { from: 'SEA', to: 'NRT', airlines: ['DL', 'NH'], frequency: 'medium' },
  
  // Middle East Connections
  { from: 'DXB', to: 'LHR', airlines: ['EK', 'BA'], frequency: 'high' },
  { from: 'DOH', to: 'LHR', airlines: ['QR', 'BA'], frequency: 'high' },
  { from: 'DXB', to: 'JFK', airlines: ['EK'], frequency: 'medium' },
  
  // European Routes
  { from: 'LHR', to: 'CDG', airlines: ['BA', 'AF'], frequency: 'high' },
  { from: 'FRA', to: 'AMS', airlines: ['LH', 'KL'], frequency: 'high' },
  { from: 'MAD', to: 'LHR', airlines: ['IB', 'BA'], frequency: 'high' },
  
  // Asian Routes
  { from: 'SIN', to: 'HKG', airlines: ['SQ', 'CX'], frequency: 'high' },
  { from: 'BKK', to: 'SIN', airlines: ['TG', 'SQ'], frequency: 'high' },
  { from: 'ICN', to: 'NRT', airlines: ['KE', 'NH'], frequency: 'high' },
]

/**
 * Get hub information for an airport
 */
export function getAirportHubInfo(iataCode: string): AirlineHub[] {
  return AIRLINE_HUBS.filter(hub => hub.iataCode === iataCode)
}

/**
 * Get all airports for a specific airline
 */
export function getAirlineHubs(airlineCode: string): AirlineHub[] {
  return AIRLINE_HUBS.filter(hub => hub.airline === airlineCode)
}

/**
 * Get airports by alliance
 */
export function getAllianceHubs(alliance: string): AirlineHub[] {
  return AIRLINE_HUBS.filter(hub => hub.alliance === alliance)
}

/**
 * Get popular destinations from an airport
 */
export function getPopularDestinations(fromIataCode: string, limit: number = 10): string[] {
  const routes = POPULAR_ROUTES
    .filter(route => route.from === fromIataCode)
    .sort((a, b) => {
      // Sort by frequency and airline count
      const freqWeight = { high: 3, medium: 2, low: 1 }
      const aScore = freqWeight[a.frequency] + a.airlines.length
      const bScore = freqWeight[b.frequency] + b.airlines.length
      return bScore - aScore
    })
    .slice(0, limit)
    .map(route => route.to)
  
  return routes
}

/**
 * Get connecting airports between two destinations
 */
export function getConnectingHubs(from: string, to: string): AirlineHub[] {
  // Find major hubs that could serve as connections
  const majorHubs = AIRLINE_HUBS
    .filter(hub => 
      hub.hubType === 'primary' && 
      hub.routes > 100 &&
      hub.iataCode !== from && 
      hub.iataCode !== to
    )
    .sort((a, b) => b.routes - a.routes)
    .slice(0, 5)
  
  return majorHubs
}

/**
 * Calculate hub score for search ranking
 */
export function calculateHubScore(iataCode: string): number {
  const hubInfo = getAirportHubInfo(iataCode)
  
  if (hubInfo.length === 0) return 0
  
  let score = 0
  hubInfo.forEach(hub => {
    // Base score from routes and passengers
    score += hub.routes * 0.5 + hub.passengers * 0.3
    
    // Hub type bonus
    switch (hub.hubType) {
      case 'primary': score += 50; break
      case 'secondary': score += 25; break  
      case 'focus': score += 15; break
    }
    
    // Alliance bonus (better connectivity)
    if (hub.alliance && hub.alliance !== 'Low Cost') {
      score += 20
    }
  })
  
  return Math.round(score)
}

/**
 * Get search suggestions based on context
 */
export function getContextualSuggestions(query: string, fromAirport?: string): {
  hubs: AirlineHub[]
  destinations: string[]
  alliance?: string
} {
  const suggestions = {
    hubs: [] as AirlineHub[],
    destinations: [] as string[],
    alliance: undefined as string | undefined
  }
  
  // If searching from a known hub, suggest same alliance airports
  if (fromAirport) {
    const fromHubInfo = getAirportHubInfo(fromAirport)
    if (fromHubInfo.length > 0) {
      const alliance = fromHubInfo[0].alliance
      if (alliance) {
        suggestions.alliance = alliance
        suggestions.hubs = getAllianceHubs(alliance).slice(0, 5)
      }
      
      suggestions.destinations = getPopularDestinations(fromAirport, 8)
    }
  }
  
  // If query matches an alliance, suggest all alliance hubs
  const queryLower = query.toLowerCase()
  if (queryLower.includes('star alliance') || queryLower.includes('star')) {
    suggestions.hubs = getAllianceHubs('Star Alliance').slice(0, 8)
    suggestions.alliance = 'Star Alliance'
  } else if (queryLower.includes('oneworld') || queryLower.includes('one world')) {
    suggestions.hubs = getAllianceHubs('OneWorld').slice(0, 8)
    suggestions.alliance = 'OneWorld'
  } else if (queryLower.includes('skyteam') || queryLower.includes('sky team')) {
    suggestions.hubs = getAllianceHubs('SkyTeam').slice(0, 8)
    suggestions.alliance = 'SkyTeam'
  }
  
  return suggestions
}