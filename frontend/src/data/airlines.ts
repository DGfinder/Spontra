export interface AirlineInfo {
  iataCode: string
  icaoCode?: string
  name: string
  shortName?: string
  alliance?: 'star-alliance' | 'skyteam' | 'oneworld'
  country: string
  logoUrl?: string
  brandColor?: string
  website?: string
  onTimePerformance?: number // percentage
  rating?: number // out of 5
}

export interface FlightAmenities {
  wifi: boolean
  entertainment: boolean
  meals: 'none' | 'snacks' | 'meals' | 'premium'
  power: boolean
  baggage: {
    carryOn: string
    checked: string
  }
  seatPitch?: string
}

export const AIRLINE_DATA: Record<string, AirlineInfo> = {
  // Major European Airlines
  'LH': {
    iataCode: 'LH',
    icaoCode: 'DLH',
    name: 'Lufthansa',
    shortName: 'Lufthansa',
    alliance: 'star-alliance',
    country: 'Germany',
    logoUrl: 'https://logos-world.net/wp-content/uploads/2020/03/Lufthansa-Logo.png',
    brandColor: '#05164D',
    website: 'https://www.lufthansa.com',
    onTimePerformance: 82,
    rating: 4.1
  },
  'AF': {
    iataCode: 'AF',
    icaoCode: 'AFR',
    name: 'Air France',
    shortName: 'Air France',
    alliance: 'skyteam',
    country: 'France',
    logoUrl: 'https://1000logos.net/wp-content/uploads/2020/04/Air-France-Logo.png',
    brandColor: '#002157',
    website: 'https://www.airfrance.com',
    onTimePerformance: 78,
    rating: 4.0
  },
  'BA': {
    iataCode: 'BA',
    icaoCode: 'BAW',
    name: 'British Airways',
    shortName: 'British Airways',
    alliance: 'oneworld',
    country: 'United Kingdom',
    logoUrl: 'https://logos-world.net/wp-content/uploads/2020/03/British-Airways-Logo.png',
    brandColor: '#1E3A8A',
    website: 'https://www.britishairways.com',
    onTimePerformance: 80,
    rating: 3.9
  },
  'KL': {
    iataCode: 'KL',
    icaoCode: 'KLM',
    name: 'KLM Royal Dutch Airlines',
    shortName: 'KLM',
    alliance: 'skyteam',
    country: 'Netherlands',
    logoUrl: 'https://logoeps.com/wp-content/uploads/2013/03/klm-vector-logo.png',
    brandColor: '#006FB8',
    website: 'https://www.klm.com',
    onTimePerformance: 85,
    rating: 4.2
  },
  'IB': {
    iataCode: 'IB',
    icaoCode: 'IBE',
    name: 'Iberia',
    shortName: 'Iberia',
    alliance: 'oneworld',
    country: 'Spain',
    logoUrl: 'https://logos-world.net/wp-content/uploads/2020/03/Iberia-Logo.png',
    brandColor: '#E30613',
    website: 'https://www.iberia.com',
    onTimePerformance: 79,
    rating: 3.8
  },
  'AZ': {
    iataCode: 'AZ',
    icaoCode: 'ITY',
    name: 'ITA Airways',
    shortName: 'ITA Airways',
    country: 'Italy',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/ITA_Airways_logo.svg/1200px-ITA_Airways_logo.svg.png',
    brandColor: '#005AA7',
    website: 'https://www.itaspa.com',
    onTimePerformance: 76,
    rating: 3.7
  },
  'TP': {
    iataCode: 'TP',
    icaoCode: 'TAP',
    name: 'TAP Air Portugal',
    shortName: 'TAP Portugal',
    alliance: 'star-alliance',
    country: 'Portugal',
    logoUrl: 'https://logos-world.net/wp-content/uploads/2020/03/TAP-Air-Portugal-Logo.png',
    brandColor: '#C8102E',
    website: 'https://www.flytap.com',
    onTimePerformance: 77,
    rating: 3.6
  },
  
  // Low-cost carriers
  'FR': {
    iataCode: 'FR',
    icaoCode: 'RYR',
    name: 'Ryanair',
    shortName: 'Ryanair',
    country: 'Ireland',
    logoUrl: 'https://logos-world.net/wp-content/uploads/2020/03/Ryanair-Logo.png',
    brandColor: '#073590',
    website: 'https://www.ryanair.com',
    onTimePerformance: 88,
    rating: 3.2
  },
  'U2': {
    iataCode: 'U2',
    icaoCode: 'EZY',
    name: 'easyJet',
    shortName: 'easyJet',
    country: 'United Kingdom',
    logoUrl: 'https://logos-world.net/wp-content/uploads/2020/03/EasyJet-Logo.png',
    brandColor: '#FF6900',
    website: 'https://www.easyjet.com',
    onTimePerformance: 84,
    rating: 3.5
  },
  'VY': {
    iataCode: 'VY',
    icaoCode: 'VLG',
    name: 'Vueling',
    shortName: 'Vueling',
    country: 'Spain',
    logoUrl: 'https://logos-world.net/wp-content/uploads/2020/03/Vueling-Logo.png',
    brandColor: '#FFD100',
    website: 'https://www.vueling.com',
    onTimePerformance: 81,
    rating: 3.4
  },
  'W6': {
    iataCode: 'W6',
    icaoCode: 'WZZ',
    name: 'Wizz Air',
    shortName: 'Wizz Air',
    country: 'Hungary',
    logoUrl: 'https://logos-world.net/wp-content/uploads/2020/03/Wizz-Air-Logo.png',
    brandColor: '#D50487',
    website: 'https://wizzair.com',
    onTimePerformance: 83,
    rating: 3.3
  },

  // Other major airlines
  'EK': {
    iataCode: 'EK',
    icaoCode: 'UAE',
    name: 'Emirates',
    shortName: 'Emirates',
    country: 'United Arab Emirates',
    logoUrl: 'https://logos-world.net/wp-content/uploads/2020/03/Emirates-Logo.png',
    brandColor: '#C8102E',
    website: 'https://www.emirates.com',
    onTimePerformance: 86,
    rating: 4.5
  },
  'QR': {
    iataCode: 'QR',
    icaoCode: 'QTR',
    name: 'Qatar Airways',
    shortName: 'Qatar Airways',
    alliance: 'oneworld',
    country: 'Qatar',
    logoUrl: 'https://logos-world.net/wp-content/uploads/2020/03/Qatar-Airways-Logo.png',
    brandColor: '#5D1A5B',
    website: 'https://www.qatarairways.com',
    onTimePerformance: 89,
    rating: 4.6
  },
  'TK': {
    iataCode: 'TK',
    icaoCode: 'THY',
    name: 'Turkish Airlines',
    shortName: 'Turkish Airlines',
    alliance: 'star-alliance',
    country: 'Turkey',
    logoUrl: 'https://logos-world.net/wp-content/uploads/2020/03/Turkish-Airlines-Logo.png',
    brandColor: '#C8102E',
    website: 'https://www.turkishairlines.com',
    onTimePerformance: 84,
    rating: 4.3
  }
}

export const FLIGHT_AMENITIES: Record<string, FlightAmenities> = {
  // Full service carriers
  'LH': {
    wifi: true,
    entertainment: true,
    meals: 'meals',
    power: true,
    baggage: { carryOn: '8kg', checked: '23kg included' },
    seatPitch: '30-32"'
  },
  'AF': {
    wifi: true,
    entertainment: true,
    meals: 'meals',
    power: true,
    baggage: { carryOn: '12kg', checked: '23kg included' },
    seatPitch: '30-31"'
  },
  'BA': {
    wifi: true,
    entertainment: true,
    meals: 'meals',
    power: true,
    baggage: { carryOn: '10kg', checked: '23kg included' },
    seatPitch: '29-31"'
  },
  'KL': {
    wifi: true,
    entertainment: true,
    meals: 'meals',
    power: true,
    baggage: { carryOn: '10kg', checked: '23kg included' },
    seatPitch: '30-32"'
  },
  'IB': {
    wifi: true,
    entertainment: true,
    meals: 'meals',
    power: true,
    baggage: { carryOn: '10kg', checked: '23kg included' },
    seatPitch: '30-31"'
  },
  'AZ': {
    wifi: true,
    entertainment: true,
    meals: 'meals',
    power: true,
    baggage: { carryOn: '8kg', checked: '23kg included' },
    seatPitch: '30-31"'
  },
  'TP': {
    wifi: true,
    entertainment: true,
    meals: 'meals',
    power: true,
    baggage: { carryOn: '8kg', checked: '23kg included' },
    seatPitch: '30-31"'
  },

  // Low-cost carriers
  'FR': {
    wifi: false,
    entertainment: false,
    meals: 'none',
    power: false,
    baggage: { carryOn: '10kg (fee)', checked: 'From €20' },
    seatPitch: '30"'
  },
  'U2': {
    wifi: true,
    entertainment: false,
    meals: 'snacks',
    power: false,
    baggage: { carryOn: 'Small bag free', checked: 'From €30' },
    seatPitch: '29"'
  },
  'VY': {
    wifi: true,
    entertainment: false,
    meals: 'snacks',
    power: false,
    baggage: { carryOn: 'Small bag free', checked: 'From €25' },
    seatPitch: '29-30"'
  },
  'W6': {
    wifi: true,
    entertainment: false,
    meals: 'snacks',
    power: false,
    baggage: { carryOn: 'Small bag free', checked: 'From €20' },
    seatPitch: '30"'
  },

  // Premium carriers
  'EK': {
    wifi: true,
    entertainment: true,
    meals: 'premium',
    power: true,
    baggage: { carryOn: '7kg', checked: '30kg included' },
    seatPitch: '32-34"'
  },
  'QR': {
    wifi: true,
    entertainment: true,
    meals: 'premium',
    power: true,
    baggage: { carryOn: '7kg', checked: '30kg included' },
    seatPitch: '31-34"'
  },
  'TK': {
    wifi: true,
    entertainment: true,
    meals: 'meals',
    power: true,
    baggage: { carryOn: '8kg', checked: '23kg included' },
    seatPitch: '30-33"'
  }
}

export const ALLIANCE_INFO = {
  'star-alliance': {
    name: 'Star Alliance',
    color: '#FFD700',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Star_Alliance_Logo_2020.svg/1200px-Star_Alliance_Logo_2020.svg.png'
  },
  'skyteam': {
    name: 'SkyTeam',
    color: '#0066CC',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/SkyTeam_logo_2016.svg/1200px-SkyTeam_logo_2016.svg.png'
  },
  'oneworld': {
    name: 'oneworld',
    color: '#E60012',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Oneworld_logo.svg/1200px-Oneworld_logo.svg.png'
  }
}

// Helper functions
export function getAirlineInfo(iataCode: string): AirlineInfo | null {
  return AIRLINE_DATA[iataCode.toUpperCase()] || null
}

export function getFlightAmenities(iataCode: string): FlightAmenities | null {
  return FLIGHT_AMENITIES[iataCode.toUpperCase()] || null
}

export function getAllianceInfo(alliance: string) {
  return ALLIANCE_INFO[alliance as keyof typeof ALLIANCE_INFO] || null
}

export function getAirlineRating(iataCode: string): number {
  const airline = getAirlineInfo(iataCode)
  return airline?.rating || 3.5
}

export function getOnTimePerformance(iataCode: string): number {
  const airline = getAirlineInfo(iataCode)
  return airline?.onTimePerformance || 75
}