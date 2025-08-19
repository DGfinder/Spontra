export interface BookingProvider {
  id: string
  name: string
  type: 'airline' | 'ota' | 'aggregator'
  website: string
  logoUrl?: string
  trustScore: number // 1-5
  bookingFee?: number
  features: string[]
  hasAffiliateProgram?: boolean
  affiliateCommissionRate?: number
}

export interface BookingOption {
  provider: BookingProvider
  price: number
  currency: string
  url: string
  availability: 'high' | 'low' | 'last-few'
  benefits?: string[]
  affiliateUrl?: string
  clickId?: string
  estimatedCommission?: number
  commissionRate?: number
}

// Major booking providers
export const BOOKING_PROVIDERS: Record<string, BookingProvider> = {
  // Airlines Direct
  'lufthansa': {
    id: 'lufthansa',
    name: 'Lufthansa',
    type: 'airline',
    website: 'https://www.lufthansa.com',
    logoUrl: 'https://logos-world.net/wp-content/uploads/2020/03/Lufthansa-Logo.png',
    trustScore: 5,
    bookingFee: 0,
    features: ['Miles & More points', 'Free changes (same fare)', 'Direct customer service'],
    hasAffiliateProgram: true,
    affiliateCommissionRate: 1.2
  },
  'airfrance': {
    id: 'airfrance',
    name: 'Air France',
    type: 'airline',
    website: 'https://www.airfrance.com',
    logoUrl: 'https://1000logos.net/wp-content/uploads/2020/04/Air-France-Logo.png',
    trustScore: 5,
    bookingFee: 0,
    features: ['Flying Blue miles', 'Free seat selection', 'Direct booking benefits'],
    hasAffiliateProgram: true,
    affiliateCommissionRate: 1.5
  },
  'klm': {
    id: 'klm',
    name: 'KLM',
    type: 'airline',
    website: 'https://www.klm.com',
    logoUrl: 'https://logoeps.com/wp-content/uploads/2013/03/klm-vector-logo.png',
    trustScore: 5,
    bookingFee: 0,
    features: ['Flying Blue miles', 'Free changes', 'Priority customer service'],
    hasAffiliateProgram: true,
    affiliateCommissionRate: 1.5
  },
  'britishairways': {
    id: 'britishairways',
    name: 'British Airways',
    type: 'airline',
    website: 'https://www.britishairways.com',
    logoUrl: 'https://logos-world.net/wp-content/uploads/2020/03/British-Airways-Logo.png',
    trustScore: 5,
    bookingFee: 0,
    features: ['Avios points', 'Executive Club benefits', 'Direct customer service'],
    hasAffiliateProgram: true,
    affiliateCommissionRate: 1.3
  },

  // Online Travel Agencies
  'expedia': {
    id: 'expedia',
    name: 'Expedia',
    type: 'ota',
    website: 'https://www.expedia.com',
    logoUrl: 'https://logos-world.net/wp-content/uploads/2020/04/Expedia-Logo.png',
    trustScore: 4,
    bookingFee: 0,
    features: ['Package deals', 'Rewards program', '24/7 customer service'],
    hasAffiliateProgram: true,
    affiliateCommissionRate: 4.2
  },
  'booking': {
    id: 'booking',
    name: 'Booking.com',
    type: 'ota',
    website: 'https://www.booking.com',
    logoUrl: 'https://logos-world.net/wp-content/uploads/2020/04/Booking-com-Logo.png',
    trustScore: 4,
    bookingFee: 0,
    features: ['Genius program', 'Free cancellation options', 'Best price guarantee'],
    hasAffiliateProgram: true,
    affiliateCommissionRate: 3.8
  },
  'kayak': {
    id: 'kayak',
    name: 'Kayak',
    type: 'aggregator',
    website: 'https://www.kayak.com',
    logoUrl: 'https://logos-world.net/wp-content/uploads/2020/04/Kayak-Logo.png',
    trustScore: 4,
    bookingFee: 0,
    features: ['Price comparison', 'Price alerts', 'Trip planning tools'],
    hasAffiliateProgram: true,
    affiliateCommissionRate: 2.1
  },
  'skyscanner': {
    id: 'skyscanner',
    name: 'Skyscanner',
    type: 'aggregator',
    website: 'https://www.skyscanner.com',
    logoUrl: 'https://logos-world.net/wp-content/uploads/2020/04/Skyscanner-Logo.png',
    trustScore: 4,
    bookingFee: 0,
    features: ['Price comparison', 'Flexible dates', 'Mobile app'],
    hasAffiliateProgram: true,
    affiliateCommissionRate: 1.8
  },
  'momondo': {
    id: 'momondo',
    name: 'Momondo',
    type: 'aggregator',
    website: 'https://www.momondo.com',
    logoUrl: 'https://logos-world.net/wp-content/uploads/2020/04/Momondo-Logo.png',
    trustScore: 4,
    bookingFee: 0,
    features: ['Price insights', 'Trip inspiration', 'Flexible search'],
    hasAffiliateProgram: true,
    affiliateCommissionRate: 2.3
  }
}

// Generate booking options for a flight
export function generateBookingOptions(
  airlineCode: string,
  basePrice: number,
  currency: string,
  flightId: string,
  flightDetails?: {
    origin: string
    destination: string
    departureDate: string
    passengers: number
    cabinClass: string
  }
): BookingOption[] {
  const options: BookingOption[] = []
  
  // Always include airline direct booking (usually best)
  const airlineProviders = {
    'LH': 'lufthansa',
    'AF': 'airfrance',
    'KL': 'klm',
    'BA': 'britishairways'
  }
  
  const airlineProviderId = airlineProviders[airlineCode as keyof typeof airlineProviders]
  if (airlineProviderId) {
    const provider = BOOKING_PROVIDERS[airlineProviderId]
    const estimatedCommission = provider.affiliateCommissionRate ? 
      Math.round((basePrice * provider.affiliateCommissionRate / 100) * 100) / 100 : 0
    
    options.push({
      provider,
      price: basePrice,
      currency,
      url: `${provider.website}/book/flight/${flightId}`,
      availability: 'high',
      benefits: provider.features,
      estimatedCommission,
      commissionRate: provider.affiliateCommissionRate
    })
  }
  
  // Add OTA options with slight price variations
  const otaOptions = ['expedia', 'booking', 'kayak']
  otaOptions.forEach((providerId, index) => {
    const provider = BOOKING_PROVIDERS[providerId]
    const priceVariation = (Math.random() - 0.5) * 0.1 // ±5% variation
    const price = Math.round(basePrice * (1 + priceVariation))
    const estimatedCommission = provider.affiliateCommissionRate ? 
      Math.round((price * provider.affiliateCommissionRate / 100) * 100) / 100 : 0
    
    options.push({
      provider,
      price,
      currency,
      url: `${provider.website}/flights/book/${flightId}`,
      availability: index === 0 ? 'high' : 'high',
      benefits: provider.features,
      estimatedCommission,
      commissionRate: provider.affiliateCommissionRate
    })
  })
  
  // Sort by price (cheapest first)
  return options.sort((a, b) => a.price - b.price)
}

// Get best booking recommendation
export function getBestBookingOption(options: BookingOption[]): BookingOption {
  // Prefer airline direct if price difference is less than €20
  const cheapest = options[0]
  const airlineDirect = options.find(option => option.provider.type === 'airline')
  
  if (airlineDirect && airlineDirect.price - cheapest.price <= 20) {
    return airlineDirect
  }
  
  return cheapest
}

// Price comparison helper
export function comparePrices(options: BookingOption[]): {
  cheapest: BookingOption
  savings: number
  airlineDirect: BookingOption | null
} {
  const sorted = options.sort((a, b) => a.price - b.price)
  const cheapest = sorted[0]
  const mostExpensive = sorted[sorted.length - 1]
  const airlineDirect = options.find(option => option.provider.type === 'airline') || null
  
  return {
    cheapest,
    savings: mostExpensive.price - cheapest.price,
    airlineDirect
  }
}