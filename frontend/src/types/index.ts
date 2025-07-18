// User types
export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  dateOfBirth?: string
  phone?: string
  isVerified: boolean
  createdAt: string
  updatedAt: string
}

export interface UserPreferences {
  preferredCurrency: string
  preferredLanguage: string
  defaultDepartureAirport?: string
  newsletterSubscribed: boolean
  priceAlertsEnabled: boolean
}

// Flight types
export interface Airport {
  iataCode: string
  icaoCode?: string
  name: string
  city: string
  country: string
  latitude?: number
  longitude?: number
  timezone?: string
}

export interface Airline {
  iataCode: string
  icaoCode?: string
  name: string
  country?: string
}

export interface Flight {
  id: string
  airline: Airline
  flightNumber: string
  origin: Airport
  destination: Airport
  departureTime: string
  arrivalTime: string
  duration: number // minutes
  price: Money
  currency: string
  availableSeats: number
  aircraftType?: string
}

export interface FlightOffer {
  id: string
  outboundFlight: Flight
  returnFlight?: Flight
  totalPrice: Money
  currency: string
  provider: string
  bookingUrl: string
  validUntil: string
}

// Search types
export interface FlightSearchParams {
  origin: string
  destination: string
  departureDate: string
  returnDate?: string
  passengers: number
  cabinClass?: 'economy' | 'premium_economy' | 'business' | 'first'
  tripType: 'roundtrip' | 'oneway'
}

export interface SearchResult {
  id: string
  searchParams: FlightSearchParams
  offers: FlightOffer[]
  totalResults: number
  searchedAt: string
  expiresAt: string
}

// Pricing types
export interface Money {
  amount: number
  currency: string
}

export interface PriceAlert {
  id: string
  userId: string
  origin: string
  destination: string
  departureDate: string
  returnDate?: string
  maxPrice: Money
  isActive: boolean
  createdAt: string
}

export interface PriceHistory {
  date: string
  price: Money
  provider: string
}

// API Response types
export interface ApiResponse<T> {
  data: T
  success: boolean
  message?: string
  error?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Form types
export interface LoginForm {
  email: string
  password: string
}

export interface RegisterForm {
  email: string
  password: string
  confirmPassword: string
  firstName: string
  lastName: string
}

export interface SearchForm {
  origin: string
  destination: string
  departureDate: string
  returnDate?: string
  passengers: number
  tripType: 'roundtrip' | 'oneway'
}