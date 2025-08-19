// Amadeus API response types
export interface AmadeusFlightOffer {
  id: string
  source: string
  instantTicketingRequired: boolean
  nonHomogeneous: boolean
  oneWay: boolean
  lastTicketingDate: string
  numberOfBookableSeats: number
  itineraries: AmadeusItinerary[]
  price: AmadeusPrice
  pricingOptions: AmadeusPricingOptions
  validatingAirlineCodes: string[]
  travelerPricings: AmadeusTravelerPricing[]
}

export interface AmadeusItinerary {
  duration: string
  segments: AmadeusSegment[]
}

export interface AmadeusSegment {
  departure: AmadeusEndpoint
  arrival: AmadeusEndpoint
  carrierCode: string
  number: string
  aircraft: AmadeusAircraft
  operating: AmadeusOperating
  duration: string
  id: string
  numberOfStops: number
  blacklistedInEU: boolean
}

export interface AmadeusEndpoint {
  iataCode: string
  terminal?: string
  at: string
}

export interface AmadeusAircraft {
  code: string
}

export interface AmadeusOperating {
  carrierCode: string
}

export interface AmadeusPrice {
  currency: string
  total: string
  base: string
  fees: AmadeusFee[]
  grandTotal: string
}

export interface AmadeusFee {
  amount: string
  type: string
}

export interface AmadeusPricingOptions {
  fareType: string[]
  includedCheckedBagsOnly: boolean
}

export interface AmadeusTravelerPricing {
  travelerId: string
  fareOption: string
  travelerType: string
  price: AmadeusPrice
  fareDetailsBySegment: AmadeusFareDetailsBySegment[]
}

export interface AmadeusFareDetailsBySegment {
  segmentId: string
  cabin: string
  fareBasis: string
  class: string
  includedCheckedBags: AmadeusIncludedCheckedBags
}

export interface AmadeusIncludedCheckedBags {
  weight: number
  weightUnit: string
}

// Location search types
export interface AmadeusLocation {
  type: string
  subType: string
  name: string
  detailedName: string
  id: string
  self: AmadeusSelfReference
  timeZoneOffset: string
  iataCode: string
  geoCode: AmadeusGeoCode
  address: AmadeusAddress
  analytics: AmadeusAnalytics
}

export interface AmadeusSelfReference {
  href: string
  methods: string[]
}

export interface AmadeusGeoCode {
  latitude: number
  longitude: number
}

export interface AmadeusAddress {
  cityName: string
  cityCode: string
  countryName: string
  countryCode: string
  stateCode?: string
  regionCode: string
}

export interface AmadeusAnalytics {
  travelers: AmadeusTravelers
}

export interface AmadeusTravelers {
  score: number
}

// Destination search types
export interface AmadeusDestination {
  type: string
  origin: string
  destination: string
  departureDate: string
  returnDate?: string
  price: AmadeusPrice
  links: AmadeusLinks
}

export interface AmadeusLinks {
  flightDates: string
  flightOffers: string
}

// Error response type
export interface AmadeusError {
  error: {
    errors: Array<{
      status: number
      code: number
      title: string
      detail: string
      source?: {
        parameter?: string
        pointer?: string
      }
    }>
  }
}

// API response wrapper
export interface AmadeusResponse<T> {
  meta?: {
    count: number
    links?: {
      self: string
      next?: string
      previous?: string
      last?: string
      first?: string
    }
  }
  data: T
  dictionaries?: {
    locations?: Record<string, AmadeusLocation>
    aircraft?: Record<string, { name: string }>
    currencies?: Record<string, string>
    carriers?: Record<string, string>
  }
}

// Flight search request parameters
export interface FlightSearchParams {
  origin: string
  destination: string
  departureDate: string
  returnDate?: string
  adults: number
  children?: number
  infants?: number
  travelClass?: 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST'
  nonStop?: boolean
  max?: number
}