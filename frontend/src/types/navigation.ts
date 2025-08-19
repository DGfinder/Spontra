// Navigation and selection types
export interface SelectedCity {
  id: string
  name: string
  airport_code: string
  description?: string
  estimated_price?: string
  flight_duration: number
  theme_scores?: Record<string, number>
  coordinates?: {
    lat: number
    lng: number
  }
}

export interface SelectedActivity {
  id: string
  name: string
  category: 'nightlife' | 'adventure' | 'culture' | 'food' | 'nature' | 'shopping' | 'beach' | 'learn'
  description?: string
  price?: string
  duration?: string
  rating?: number
  image_url?: string
  location?: {
    lat: number
    lng: number
  }
}

export interface SelectedFlight {
  id: string
  price: number
  currency: string
  departureTime: string
  arrivalTime: string
  duration: string
  stops: number
  airline: string
  aircraftType: string
  badge?: string
  arrivalContext: string
  bookingLink: string
  confidence: number
  fareClasses?: Array<{
    type: 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST'
    price: number
    availability: number
  }>
  priceBreakdown?: {
    baseFare: number
    taxes: number
    fees: number
  }
  affiliateUrl?: string
  clickId?: string
  estimatedCommission?: number
  commissionRate?: number
}

export type NavigationStep = 
  | 'search' 
  | 'results' 
  | 'countries' 
  | 'cities' 
  | 'activities' 
  | 'flights' 
  | 'booking'

export interface NavigationState {
  currentStep: NavigationStep
  selectedDestination: any | null // Will be properly typed once DestinationRecommendation is imported
  selectedCity: SelectedCity | null
  selectedActivity: SelectedActivity | null
  selectedFlight: SelectedFlight | null
  canGoBack: boolean
  navigationHistory: NavigationStep[]
  isNavigating: boolean
  navigationMessage: string | null
}