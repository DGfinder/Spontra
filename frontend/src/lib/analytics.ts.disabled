import { track } from '@vercel/analytics'

// Analytics event types
export interface AnalyticsEvent {
  name: string
  properties?: Record<string, string | number | boolean>
}

// Predefined event names for consistency
export const ANALYTICS_EVENTS = {
  // Search events
  SEARCH_INITIATED: 'search_initiated',
  SEARCH_COMPLETED: 'search_completed',
  SEARCH_FAILED: 'search_failed',
  SEARCH_FILTERS_APPLIED: 'search_filters_applied',
  
  // Flight events
  FLIGHT_SELECTED: 'flight_selected',
  FLIGHT_DETAILS_VIEWED: 'flight_details_viewed',
  PRICE_ALERT_CREATED: 'price_alert_created',
  
  // Booking events
  BOOKING_STARTED: 'booking_started',
  BOOKING_COMPLETED: 'booking_completed',
  BOOKING_FAILED: 'booking_failed',
  BOOKING_ABANDONED: 'booking_abandoned',
  
  // User events
  USER_REGISTERED: 'user_registered',
  USER_LOGGED_IN: 'user_logged_in',
  USER_LOGGED_OUT: 'user_logged_out',
  PROFILE_UPDATED: 'profile_updated',
  
  // Destination events
  DESTINATION_VIEWED: 'destination_viewed',
  DESTINATION_SHARED: 'destination_shared',
  DESTINATION_SAVED: 'destination_saved',
  
  // Navigation events
  PAGE_VIEWED: 'page_viewed',
  EXTERNAL_LINK_CLICKED: 'external_link_clicked',
  
  // Error events
  ERROR_OCCURRED: 'error_occurred',
  API_ERROR: 'api_error',
  
  // Performance events
  LOAD_TIME_RECORDED: 'load_time_recorded',
  CLS_RECORDED: 'cls_recorded',
  
  // Feature usage
  FEATURE_USED: 'feature_used',
  EXPERIMENT_VIEWED: 'experiment_viewed',
} as const

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS]

// Analytics helper class
export class Analytics {
  private static isEnabled(): boolean {
    return process.env.NODE_ENV === 'production' || 
           process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true'
  }

  private static isValidEvent(name: string): boolean {
    return Object.values(ANALYTICS_EVENTS).includes(name as AnalyticsEventName)
  }

  /**
   * Track a custom event
   */
  static trackEvent(name: AnalyticsEventName | string, properties?: Record<string, any>) {
    if (!this.isEnabled()) {
      console.log('Analytics disabled - would track:', name, properties)
      return
    }

    // Validate event name
    if (!this.isValidEvent(name)) {
      console.warn(`Unknown analytics event: ${name}`)
    }

    // Clean properties to ensure they're serializable
    const cleanProperties = this.cleanProperties(properties)

    try {
      track(name, cleanProperties)
    } catch (error) {
      console.error('Analytics tracking error:', error)
    }
  }

  /**
   * Track search events
   */
  static trackSearch(
    type: 'initiated' | 'completed' | 'failed',
    searchParams: {
      origin?: string
      destination?: string
      passengers?: number
      tripType?: string
      resultsCount?: number
      error?: string
    }
  ) {
    const eventMap = {
      initiated: ANALYTICS_EVENTS.SEARCH_INITIATED,
      completed: ANALYTICS_EVENTS.SEARCH_COMPLETED,
      failed: ANALYTICS_EVENTS.SEARCH_FAILED,
    }

    this.trackEvent(eventMap[type], {
      origin: searchParams.origin,
      destination: searchParams.destination,
      passengers: searchParams.passengers,
      tripType: searchParams.tripType,
      resultsCount: searchParams.resultsCount,
      error: searchParams.error,
    })
  }

  /**
   * Track booking funnel events
   */
  static trackBooking(
    stage: 'started' | 'completed' | 'failed' | 'abandoned',
    bookingData: {
      flightId?: string
      price?: number
      currency?: string
      passengers?: number
      error?: string
      step?: string
    }
  ) {
    const eventMap = {
      started: ANALYTICS_EVENTS.BOOKING_STARTED,
      completed: ANALYTICS_EVENTS.BOOKING_COMPLETED,
      failed: ANALYTICS_EVENTS.BOOKING_FAILED,
      abandoned: ANALYTICS_EVENTS.BOOKING_ABANDONED,
    }

    this.trackEvent(eventMap[stage], {
      flightId: bookingData.flightId,
      price: bookingData.price,
      currency: bookingData.currency,
      passengers: bookingData.passengers,
      error: bookingData.error,
      step: bookingData.step,
    })
  }

  /**
   * Track user authentication events
   */
  static trackAuth(
    action: 'registered' | 'logged_in' | 'logged_out',
    userData?: {
      userId?: string
      method?: string
      provider?: string
    }
  ) {
    const eventMap = {
      registered: ANALYTICS_EVENTS.USER_REGISTERED,
      logged_in: ANALYTICS_EVENTS.USER_LOGGED_IN,
      logged_out: ANALYTICS_EVENTS.USER_LOGGED_OUT,
    }

    this.trackEvent(eventMap[action], {
      method: userData?.method,
      provider: userData?.provider,
      // Don't track sensitive user data
    })
  }

  /**
   * Track page views
   */
  static trackPageView(
    page: string,
    properties?: {
      referrer?: string
      searchParams?: Record<string, string>
      loadTime?: number
    }
  ) {
    this.trackEvent(ANALYTICS_EVENTS.PAGE_VIEWED, {
      page,
      referrer: properties?.referrer,
      loadTime: properties?.loadTime,
      ...properties?.searchParams,
    })
  }

  /**
   * Track errors
   */
  static trackError(
    error: Error,
    context?: {
      component?: string
      action?: string
      userId?: string
    }
  ) {
    this.trackEvent(ANALYTICS_EVENTS.ERROR_OCCURRED, {
      errorName: error.name,
      errorMessage: error.message,
      component: context?.component,
      action: context?.action,
      // Don't track sensitive user data in error events
    })
  }

  /**
   * Track performance metrics
   */
  static trackPerformance(
    metric: 'load_time' | 'cls',
    value: number,
    context?: {
      page?: string
      component?: string
    }
  ) {
    const eventMap = {
      load_time: ANALYTICS_EVENTS.LOAD_TIME_RECORDED,
      cls: ANALYTICS_EVENTS.CLS_RECORDED,
    }

    this.trackEvent(eventMap[metric], {
      value,
      page: context?.page,
      component: context?.component,
    })
  }

  /**
   * Track feature usage
   */
  static trackFeature(
    featureName: string,
    action: string,
    properties?: Record<string, any>
  ) {
    this.trackEvent(ANALYTICS_EVENTS.FEATURE_USED, {
      feature: featureName,
      action,
      ...this.cleanProperties(properties),
    })
  }

  /**
   * Clean properties to ensure they're safe for analytics
   */
  private static cleanProperties(properties?: Record<string, any>): Record<string, string | number | boolean> | undefined {
    if (!properties) return undefined

    const cleaned: Record<string, string | number | boolean> = {}
    
    for (const [key, value] of Object.entries(properties)) {
      // Skip null, undefined, or complex objects
      if (value == null || typeof value === 'object') continue
      
      // Convert to safe types
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        cleaned[key] = value
      } else {
        cleaned[key] = String(value)
      }
    }

    return Object.keys(cleaned).length > 0 ? cleaned : undefined
  }
}

// Export analytics instance for easier usage
export const analytics = Analytics
export default Analytics