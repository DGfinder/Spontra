/**
 * City Code Normalizer - Multi-Airport City Mapping
 * 
 * Handles LON/NYC/OSA/TYO/MIL etc. to reduce dupes and increase CTR
 * Critical for proper destination aggregation in search results
 */

export interface CityMapping {
  cityCode: string;
  cityName: string;
  country: string;
  airports: AirportInfo[];
  primaryAirport: string; // Usually the largest/most popular
  region: string;
  timezone: string;
}

export interface AirportInfo {
  iata: string;
  name: string;
  isPrimary: boolean;
  domesticHub?: boolean;
  internationalHub?: boolean;
  lowCostHub?: boolean;
}

/**
 * Multi-airport city mappings for major global cities
 * Reduces search result duplication and improves user experience
 */
export const MULTI_AIRPORT_CITIES: Record<string, CityMapping> = {
  // London - Multiple airports
  LON: {
    cityCode: 'LON',
    cityName: 'London',
    country: 'GB',
    region: 'Europe',
    timezone: 'Europe/London',
    primaryAirport: 'LHR',
    airports: [
      { iata: 'LHR', name: 'Heathrow', isPrimary: true, internationalHub: true },
      { iata: 'LGW', name: 'Gatwick', isPrimary: false, internationalHub: true },
      { iata: 'STN', name: 'Stansted', isPrimary: false, lowCostHub: true },
      { iata: 'LTN', name: 'Luton', isPrimary: false, lowCostHub: true },
      { iata: 'LCY', name: 'City Airport', isPrimary: false, domesticHub: true },
      { iata: 'SEN', name: 'Southend', isPrimary: false, lowCostHub: true }
    ]
  },

  // New York - Tri-state area
  NYC: {
    cityCode: 'NYC',
    cityName: 'New York',
    country: 'US',
    region: 'North America',
    timezone: 'America/New_York',
    primaryAirport: 'JFK',
    airports: [
      { iata: 'JFK', name: 'John F. Kennedy', isPrimary: true, internationalHub: true },
      { iata: 'LGA', name: 'LaGuardia', isPrimary: false, domesticHub: true },
      { iata: 'EWR', name: 'Newark', isPrimary: false, internationalHub: true }
    ]
  },

  // Tokyo - Multiple airports
  TYO: {
    cityCode: 'TYO',
    cityName: 'Tokyo',
    country: 'JP',
    region: 'Asia',
    timezone: 'Asia/Tokyo',
    primaryAirport: 'NRT',
    airports: [
      { iata: 'NRT', name: 'Narita', isPrimary: true, internationalHub: true },
      { iata: 'HND', name: 'Haneda', isPrimary: false, domesticHub: true, internationalHub: true }
    ]
  },

  // Osaka - Kansai region
  OSA: {
    cityCode: 'OSA',
    cityName: 'Osaka',
    country: 'JP',
    region: 'Asia',
    timezone: 'Asia/Tokyo',
    primaryAirport: 'KIX',
    airports: [
      { iata: 'KIX', name: 'Kansai International', isPrimary: true, internationalHub: true },
      { iata: 'ITM', name: 'Itami', isPrimary: false, domesticHub: true }
    ]
  },

  // Milan - Northern Italy
  MIL: {
    cityCode: 'MIL',
    cityName: 'Milan',
    country: 'IT',
    region: 'Europe',
    timezone: 'Europe/Rome',
    primaryAirport: 'MXP',
    airports: [
      { iata: 'MXP', name: 'Malpensa', isPrimary: true, internationalHub: true },
      { iata: 'LIN', name: 'Linate', isPrimary: false, domesticHub: true },
      { iata: 'BGY', name: 'Bergamo Orio al Serio', isPrimary: false, lowCostHub: true }
    ]
  },

  // Paris - Multiple airports
  PAR: {
    cityCode: 'PAR',
    cityName: 'Paris',
    country: 'FR',
    region: 'Europe',
    timezone: 'Europe/Paris',
    primaryAirport: 'CDG',
    airports: [
      { iata: 'CDG', name: 'Charles de Gaulle', isPrimary: true, internationalHub: true },
      { iata: 'ORY', name: 'Orly', isPrimary: false, internationalHub: true },
      { iata: 'BVA', name: 'Beauvais', isPrimary: false, lowCostHub: true }
    ]
  },

  // Berlin - Unified after Brandenburg opening
  BER: {
    cityCode: 'BER',
    cityName: 'Berlin',
    country: 'DE',
    region: 'Europe',
    timezone: 'Europe/Berlin',
    primaryAirport: 'BER',
    airports: [
      { iata: 'BER', name: 'Brandenburg', isPrimary: true, internationalHub: true }
      // TXL (Tegel) and SXF (Schönefeld) closed, now all traffic via BER
    ]
  },

  // Chicago - Major US hub
  CHI: {
    cityCode: 'CHI',
    cityName: 'Chicago',
    country: 'US',
    region: 'North America',
    timezone: 'America/Chicago',
    primaryAirport: 'ORD',
    airports: [
      { iata: 'ORD', name: "O'Hare", isPrimary: true, internationalHub: true },
      { iata: 'MDW', name: 'Midway', isPrimary: false, domesticHub: true, lowCostHub: true }
    ]
  },

  // Washington DC - Capital region
  WAS: {
    cityCode: 'WAS',
    cityName: 'Washington DC',
    country: 'US',
    region: 'North America', 
    timezone: 'America/New_York',
    primaryAirport: 'DCA',
    airports: [
      { iata: 'DCA', name: 'Ronald Reagan National', isPrimary: true, domesticHub: true },
      { iata: 'IAD', name: 'Dulles International', isPrimary: false, internationalHub: true },
      { iata: 'BWI', name: 'Baltimore/Washington', isPrimary: false, lowCostHub: true }
    ]
  },

  // São Paulo - Brazil's largest city
  SAO: {
    cityCode: 'SAO',
    cityName: 'São Paulo',
    country: 'BR',
    region: 'South America',
    timezone: 'America/Sao_Paulo',
    primaryAirport: 'GRU',
    airports: [
      { iata: 'GRU', name: 'Guarulhos', isPrimary: true, internationalHub: true },
      { iata: 'CGH', name: 'Congonhas', isPrimary: false, domesticHub: true },
      { iata: 'VCP', name: 'Viracopos', isPrimary: false, lowCostHub: true }
    ]
  },

  // Buenos Aires - Argentina
  BUE: {
    cityCode: 'BUE',
    cityName: 'Buenos Aires',
    country: 'AR',
    region: 'South America',
    timezone: 'America/Argentina/Buenos_Aires',
    primaryAirport: 'EZE',
    airports: [
      { iata: 'EZE', name: 'Ezeiza', isPrimary: true, internationalHub: true },
      { iata: 'AEP', name: 'Jorge Newbery', isPrimary: false, domesticHub: true }
    ]
  }
};

/**
 * Normalize airport code to city code if applicable
 */
export function normalizeToCity(airportCode: string): {
  cityCode: string;
  cityName: string;
  normalizedFrom?: string;
  isMultiAirport: boolean;
} {
  // First check if the input is already a city code
  const directCityMatch = MULTI_AIRPORT_CITIES[airportCode.toUpperCase()];
  if (directCityMatch) {
    return {
      cityCode: directCityMatch.cityCode,
      cityName: directCityMatch.cityName,
      isMultiAirport: true
    };
  }

  // Check if this airport belongs to a multi-airport city
  for (const [cityCode, cityData] of Object.entries(MULTI_AIRPORT_CITIES)) {
    const airportMatch = cityData.airports.find(
      airport => airport.iata.toUpperCase() === airportCode.toUpperCase()
    );
    
    if (airportMatch) {
      return {
        cityCode: cityData.cityCode,
        cityName: cityData.cityName,
        normalizedFrom: airportCode.toUpperCase(),
        isMultiAirport: true
      };
    }
  }

  // Not a multi-airport city, return as-is
  return {
    cityCode: airportCode.toUpperCase(),
    cityName: airportCode.toUpperCase(), // Will need airport name lookup
    isMultiAirport: false
  };
}

/**
 * Get all airports for a city code
 */
export function getAirportsForCity(cityCode: string): AirportInfo[] {
  const cityData = MULTI_AIRPORT_CITIES[cityCode.toUpperCase()];
  return cityData ? cityData.airports : [];
}

/**
 * Get primary airport for a city
 */
export function getPrimaryAirport(cityCode: string): string | null {
  const cityData = MULTI_AIRPORT_CITIES[cityCode.toUpperCase()];
  return cityData ? cityData.primaryAirport : null;
}

/**
 * Check if two airport/city codes represent the same destination
 */
export function isSameDestination(code1: string, code2: string): boolean {
  const normalized1 = normalizeToCity(code1);
  const normalized2 = normalizeToCity(code2);
  return normalized1.cityCode === normalized2.cityCode;
}

/**
 * Generate user-friendly destination display name
 */
export function getDestinationDisplayName(code: string): string {
  const normalized = normalizeToCity(code);
  
  if (normalized.isMultiAirport) {
    const cityData = MULTI_AIRPORT_CITIES[normalized.cityCode];
    if (normalized.normalizedFrom) {
      const airport = cityData.airports.find(a => a.iata === normalized.normalizedFrom);
      return `${normalized.cityName} (${airport?.name || normalized.normalizedFrom})`;
    } else {
      return `${normalized.cityName} (All Airports)`;
    }
  }
  
  return normalized.cityName;
}

/**
 * Filter and deduplicate search results by city
 */
export function deduplicateByCity<T extends { destination: string }>(
  results: T[],
  preferPrimary: boolean = true
): T[] {
  const cityGroups = new Map<string, T[]>();
  
  // Group results by normalized city code
  for (const result of results) {
    const normalized = normalizeToCity(result.destination);
    const cityKey = normalized.cityCode;
    
    if (!cityGroups.has(cityKey)) {
      cityGroups.set(cityKey, []);
    }
    cityGroups.get(cityKey)!.push(result);
  }
  
  // For each city, pick the best representative
  const deduplicated: T[] = [];
  
  for (const [cityCode, cityResults] of cityGroups) {
    if (cityResults.length === 1) {
      deduplicated.push(cityResults[0]);
      continue;
    }
    
    // Multiple results for this city - pick the best one
    let selected = cityResults[0];
    
    if (preferPrimary) {
      const primaryAirport = getPrimaryAirport(cityCode);
      const primaryResult = cityResults.find(r => r.destination === primaryAirport);
      if (primaryResult) {
        selected = primaryResult;
      }
    }
    
    // Update the selected result to show city instead of specific airport
    deduplicated.push({
      ...selected,
      destination: cityCode
    } as T);
  }
  
  return deduplicated;
}

/**
 * Expand city code to include all airports for search
 */
export function expandCityToAirports(cityCode: string): string[] {
  const cityData = MULTI_AIRPORT_CITIES[cityCode.toUpperCase()];
  if (cityData) {
    return cityData.airports.map(airport => airport.iata);
  }
  
  // Not a city code, return as single airport
  return [cityCode.toUpperCase()];
}

/**
 * Get search hints for autocomplete
 */
export function getCitySearchHints(query: string): Array<{
  code: string;
  display: string;
  type: 'city' | 'airport';
  country: string;
}> {
  const hints = [];
  const lowerQuery = query.toLowerCase();
  
  // Search through city codes and names
  for (const [cityCode, cityData] of Object.entries(MULTI_AIRPORT_CITIES)) {
    if (
      cityCode.toLowerCase().includes(lowerQuery) ||
      cityData.cityName.toLowerCase().includes(lowerQuery)
    ) {
      hints.push({
        code: cityCode,
        display: `${cityData.cityName} (${cityCode}) - All Airports`,
        type: 'city' as const,
        country: cityData.country
      });
      
      // Also add individual airports for this city
      for (const airport of cityData.airports) {
        if (airport.iata.toLowerCase().includes(lowerQuery) ||
            airport.name.toLowerCase().includes(lowerQuery)) {
          hints.push({
            code: airport.iata,
            display: `${cityData.cityName} ${airport.name} (${airport.iata})`,
            type: 'airport' as const,
            country: cityData.country
          });
        }
      }
    }
  }
  
  return hints;
}

/**
 * Validate and suggest corrections for user input
 */
export function validateAndSuggest(input: string): {
  isValid: boolean;
  suggestion?: string;
  reason?: string;
} {
  const upper = input.toUpperCase();
  
  // Check if it's a known city or airport
  if (MULTI_AIRPORT_CITIES[upper]) {
    return { isValid: true };
  }
  
  // Check if it's an airport within a multi-airport city
  for (const cityData of Object.values(MULTI_AIRPORT_CITIES)) {
    if (cityData.airports.some(a => a.iata === upper)) {
      return { 
        isValid: true,
        suggestion: cityData.cityCode,
        reason: `Did you mean ${cityData.cityName} (all airports)?`
      };
    }
  }
  
  // Check for common typos or close matches
  const suggestions = Object.keys(MULTI_AIRPORT_CITIES).filter(code =>
    levenshteinDistance(upper, code) <= 1
  );
  
  if (suggestions.length > 0) {
    const cityData = MULTI_AIRPORT_CITIES[suggestions[0]];
    return {
      isValid: false,
      suggestion: suggestions[0],
      reason: `Did you mean ${cityData.cityName} (${suggestions[0]})?`
    };
  }
  
  return { isValid: false };
}

// Helper function for fuzzy matching
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}