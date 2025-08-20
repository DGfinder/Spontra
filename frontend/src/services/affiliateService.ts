import { v4 as uuidv4 } from 'uuid'

export interface AffiliatePartner {
  id: string
  name: string
  type: 'airline' | 'ota' | 'aggregator'
  baseUrl: string
  affiliateId: string
  commissionRate: number // percentage (e.g., 3.5 for 3.5%)
  commissionType: 'percentage' | 'fixed' | 'tiered'
  cookieDuration: number // days
  trackingParams: {
    partnerId: string
    clickId: string
    subId?: string
    source?: string
  }
  conversionTracking: {
    hasPostback: boolean
    postbackUrl?: string
    hasPixel: boolean
    pixelUrl?: string
  }
  minimumCommission?: number
  maximumCommission?: number
  active: boolean
}

export interface ClickEvent {
  id: string
  sessionId: string
  userId?: string
  timestamp: string
  flightId: string
  partnerId: string
  bookingValue: number
  currency: string
  origin: string
  destination: string
  departureDate: string
  passengers: number
  cabinClass: string
  deviceType: 'desktop' | 'mobile' | 'tablet'
  userAgent: string
  referrer: string
  utm: {
    source?: string
    medium?: string
    campaign?: string
    term?: string
    content?: string
  }
}

export interface ConversionEvent {
  clickId: string
  bookingReference: string
  bookingValue: number
  currency: string
  commissionValue: number
  bookingDate: string
  passengerDetails?: {
    adults: number
    children: number
    infants: number
  }
  flightDetails: {
    origin: string
    destination: string
    departureDate: string
    returnDate?: string
    airline: string
    cabinClass: string
  }
  status: 'pending' | 'confirmed' | 'cancelled' | 'disputed'
}

// Affiliate partner configurations
export const AFFILIATE_PARTNERS: Record<string, AffiliatePartner> = {
  'expedia': {
    id: 'expedia',
    name: 'Expedia',
    type: 'ota',
    baseUrl: 'https://www.expedia.com',
    affiliateId: 'SPONTRA_2024', // This would be your actual Expedia affiliate ID
    commissionRate: 4.2,
    commissionType: 'percentage',
    cookieDuration: 30,
    trackingParams: {
      partnerId: 'EAPN',
      clickId: 'clickid',
      subId: 'subid',
      source: 'spontra'
    },
    conversionTracking: {
      hasPostback: true,
      postbackUrl: 'https://api.spontra.com/webhooks/expedia/conversion',
      hasPixel: true,
      pixelUrl: 'https://ad.doubleclick.net/ddm/trackconv/src=...'
    },
    minimumCommission: 5.00,
    maximumCommission: 500.00,
    active: true
  },
  'booking': {
    id: 'booking',
    name: 'Booking.com',
    type: 'ota',
    baseUrl: 'https://www.booking.com',
    affiliateId: 'SPONTRA_BOOKING_2024',
    commissionRate: 3.8,
    commissionType: 'percentage',
    cookieDuration: 30,
    trackingParams: {
      partnerId: 'aid',
      clickId: 'click_id',
      subId: 'sub_id'
    },
    conversionTracking: {
      hasPostback: true,
      postbackUrl: 'https://api.spontra.com/webhooks/booking/conversion',
      hasPixel: false
    },
    minimumCommission: 3.00,
    maximumCommission: 300.00,
    active: true
  },
  'kayak': {
    id: 'kayak',
    name: 'Kayak',
    type: 'aggregator',
    baseUrl: 'https://www.kayak.com',
    affiliateId: 'SPONTRA_KAYAK_2024',
    commissionRate: 2.1,
    commissionType: 'percentage',
    cookieDuration: 7,
    trackingParams: {
      partnerId: 'partner',
      clickId: 'clickid',
      source: 'spontra'
    },
    conversionTracking: {
      hasPostback: false,
      hasPixel: true,
      pixelUrl: 'https://www.googleadservices.com/pagead/conversion/...'
    },
    minimumCommission: 2.00,
    maximumCommission: 150.00,
    active: true
  },
  'skyscanner': {
    id: 'skyscanner',
    name: 'Skyscanner',
    type: 'aggregator',
    baseUrl: 'https://www.skyscanner.com',
    affiliateId: 'SPONTRA_SKY_2024',
    commissionRate: 1.8,
    commissionType: 'percentage',
    cookieDuration: 7,
    trackingParams: {
      partnerId: 'partnerId',
      clickId: 'clickRef',
      subId: 'subId'
    },
    conversionTracking: {
      hasPostback: true,
      postbackUrl: 'https://api.spontra.com/webhooks/skyscanner/conversion',
      hasPixel: false
    },
    minimumCommission: 1.50,
    maximumCommission: 100.00,
    active: true
  },
  // Airline direct partnerships (typically lower commission but better customer experience)
  'lufthansa': {
    id: 'lufthansa',
    name: 'Lufthansa',
    type: 'airline',
    baseUrl: 'https://www.lufthansa.com',
    affiliateId: 'SPONTRA_LH_2024',
    commissionRate: 1.2,
    commissionType: 'percentage',
    cookieDuration: 14,
    trackingParams: {
      partnerId: 'partner_id',
      clickId: 'click_id',
      source: 'spontra'
    },
    conversionTracking: {
      hasPostback: false,
      hasPixel: true
    },
    minimumCommission: 5.00,
    maximumCommission: 200.00,
    active: true
  },
  'airfrance': {
    id: 'airfrance',
    name: 'Air France',
    type: 'airline',
    baseUrl: 'https://www.airfrance.com',
    affiliateId: 'SPONTRA_AF_2024',
    commissionRate: 1.5,
    commissionType: 'percentage',
    cookieDuration: 14,
    trackingParams: {
      partnerId: 'partner',
      clickId: 'clickid'
    },
    conversionTracking: {
      hasPostback: true,
      postbackUrl: 'https://api.spontra.com/webhooks/airfrance/conversion',
      hasPixel: false
    },
    minimumCommission: 5.00,
    maximumCommission: 250.00,
    active: true
  }
}

class AffiliateService {
  private sessionId: string
  private clickEvents: ClickEvent[] = []

  constructor() {
    this.sessionId = this.getOrCreateSessionId()
  }

  private getOrCreateSessionId(): string {
    if (typeof window !== 'undefined') {
      let sessionId = sessionStorage.getItem('spontra_session_id')
      if (!sessionId) {
        sessionId = uuidv4()
        sessionStorage.setItem('spontra_session_id', sessionId)
      }
      return sessionId || uuidv4()
    }
    return uuidv4()
  }

  // Generate affiliate tracking URL
  buildAffiliateUrl(
    partnerId: string,
    bookingValue: number,
    flightDetails: {
      flightId: string
      origin: string
      destination: string
      departureDate: string
      passengers: number
      cabinClass: string
    }
  ): { url: string; clickId: string } {
    const partner = AFFILIATE_PARTNERS[partnerId]
    if (!partner || !partner.active) {
      throw new Error(`Partner ${partnerId} not found or inactive`)
    }

    const clickId = uuidv4()
    const url = new URL(partner.baseUrl)

    // Add affiliate tracking parameters
    url.searchParams.set(partner.trackingParams.partnerId, partner.affiliateId)
    url.searchParams.set(partner.trackingParams.clickId, clickId)
    
    if (partner.trackingParams.subId) {
      url.searchParams.set(partner.trackingParams.subId, flightDetails.flightId)
    }
    
    if (partner.trackingParams.source) {
      url.searchParams.set(partner.trackingParams.source, 'spontra')
    }

    // Add flight-specific parameters for better tracking
    url.searchParams.set('origin', flightDetails.origin)
    url.searchParams.set('destination', flightDetails.destination)
    url.searchParams.set('departure_date', flightDetails.departureDate)
    url.searchParams.set('passengers', flightDetails.passengers.toString())
    url.searchParams.set('cabin_class', flightDetails.cabinClass)

    // Add UTM parameters for better attribution
    url.searchParams.set('utm_source', 'spontra')
    url.searchParams.set('utm_medium', 'affiliate')
    url.searchParams.set('utm_campaign', 'flight_booking')
    url.searchParams.set('utm_content', partnerId)

    return { url: url.toString(), clickId }
  }

  // Track outbound click
  async trackClick(
    partnerId: string,
    flightId: string,
    bookingValue: number,
    currency: string,
    flightDetails: {
      origin: string
      destination: string
      departureDate: string
      passengers: number
      cabinClass: string
    }
  ): Promise<string> {
    const clickId = uuidv4()
    
    const clickEvent: ClickEvent = {
      id: clickId,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      flightId,
      partnerId,
      bookingValue,
      currency,
      origin: flightDetails.origin,
      destination: flightDetails.destination,
      departureDate: flightDetails.departureDate,
      passengers: flightDetails.passengers,
      cabinClass: flightDetails.cabinClass,
      deviceType: this.getDeviceType(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : '',
      referrer: typeof window !== 'undefined' ? document.referrer : '',
      utm: this.getUTMParameters()
    }

    // Store locally for immediate use
    this.clickEvents.push(clickEvent)

    // Send to analytics service
    try {
      await this.sendClickEvent(clickEvent)
    } catch (error) {
      console.warn('Failed to send click event:', error)
      // Store for retry later
      this.storeOfflineEvent(clickEvent)
    }

    return clickId
  }

  // Calculate commission for a booking
  calculateCommission(partnerId: string, bookingValue: number): number {
    const partner = AFFILIATE_PARTNERS[partnerId]
    if (!partner) return 0

    let commission = 0
    
    switch (partner.commissionType) {
      case 'percentage':
        commission = (bookingValue * partner.commissionRate) / 100
        break
      case 'fixed':
        commission = partner.commissionRate
        break
      case 'tiered':
        // Implement tiered commission logic
        commission = this.calculateTieredCommission(partner, bookingValue)
        break
    }

    // Apply min/max limits
    if (partner.minimumCommission) {
      commission = Math.max(commission, partner.minimumCommission)
    }
    if (partner.maximumCommission) {
      commission = Math.min(commission, partner.maximumCommission)
    }

    return Math.round(commission * 100) / 100 // Round to 2 decimal places
  }

  private calculateTieredCommission(partner: AffiliatePartner, bookingValue: number): number {
    // Example tiered commission structure
    if (bookingValue < 100) return bookingValue * 0.01 // 1%
    if (bookingValue < 500) return bookingValue * 0.025 // 2.5%
    if (bookingValue < 1000) return bookingValue * 0.035 // 3.5%
    return bookingValue * 0.045 // 4.5%
  }

  // Get partner information
  getPartner(partnerId: string): AffiliatePartner | null {
    return AFFILIATE_PARTNERS[partnerId] || null
  }

  // Get all active partners
  getActivePartners(): AffiliatePartner[] {
    return Object.values(AFFILIATE_PARTNERS).filter(partner => partner.active)
  }

  // Get partners by type
  getPartnersByType(type: 'airline' | 'ota' | 'aggregator'): AffiliatePartner[] {
    return this.getActivePartners().filter(partner => partner.type === type)
  }

  // Rank partners by commission potential
  rankPartnersByCommission(bookingValue: number): AffiliatePartner[] {
    return this.getActivePartners()
      .map(partner => ({
        ...partner,
        estimatedCommission: this.calculateCommission(partner.id, bookingValue)
      }))
      .sort((a, b) => b.estimatedCommission - a.estimatedCommission)
  }

  private getDeviceType(): 'desktop' | 'mobile' | 'tablet' {
    if (typeof window === 'undefined') return 'desktop'
    
    const userAgent = window.navigator.userAgent
    if (/tablet|ipad|playbook|silk/i.test(userAgent)) return 'tablet'
    if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) return 'mobile'
    return 'desktop'
  }

  private getUTMParameters() {
    if (typeof window === 'undefined') return {}
    
    const params = new URLSearchParams(window.location.search)
    return {
      source: params.get('utm_source') || undefined,
      medium: params.get('utm_medium') || undefined,
      campaign: params.get('utm_campaign') || undefined,
      term: params.get('utm_term') || undefined,
      content: params.get('utm_content') || undefined
    }
  }

  private async sendClickEvent(event: ClickEvent): Promise<void> {
    // Send to your analytics API
    const response = await fetch('/api/analytics/click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event)
    })
    
    if (!response.ok) {
      throw new Error(`Failed to send click event: ${response.statusText}`)
    }
  }

  private storeOfflineEvent(event: ClickEvent): void {
    if (typeof window === 'undefined') return
    
    const offlineEvents = JSON.parse(localStorage.getItem('spontra_offline_events') || '[]')
    offlineEvents.push(event)
    localStorage.setItem('spontra_offline_events', JSON.stringify(offlineEvents))
  }

  // Process offline events when connection is restored
  async processOfflineEvents(): Promise<void> {
    if (typeof window === 'undefined') return
    
    const offlineEvents = JSON.parse(localStorage.getItem('spontra_offline_events') || '[]')
    
    for (const event of offlineEvents) {
      try {
        await this.sendClickEvent(event)
      } catch (error) {
        console.warn('Failed to process offline event:', error)
        break // Stop processing on first failure
      }
    }
    
    // Clear processed events
    localStorage.setItem('spontra_offline_events', '[]')
  }
}

// Export singleton instance
export const affiliateService = new AffiliateService()

// Types already exported above