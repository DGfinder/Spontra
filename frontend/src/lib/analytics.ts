/**
 * Google Analytics 4 (GA4) Integration
 *
 * Respects cookie consent (GDPR/CCPA compliant)
 * Only tracks when analytics cookies are enabled
 */

import { hasConsent } from './cookies'

// Type declarations for gtag
declare global {
  interface Window {
    gtag?: (...args: any[]) => void
    dataLayer?: any[]
  }
}

/**
 * Check if Google Analytics is loaded and user has consented
 */
export function isAnalyticsEnabled(): boolean {
  return typeof window !== 'undefined' &&
         typeof window.gtag === 'function' &&
         hasConsent('analytics')
}

/**
 * Initialize Google Analytics 4
 * Called automatically when user consents to analytics cookies
 */
export function initializeGA4(): void {
  if (typeof window === 'undefined') return

  const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

  if (!GA_MEASUREMENT_ID) {
    console.warn('[Analytics] GA4 Measurement ID not configured (NEXT_PUBLIC_GA_MEASUREMENT_ID)')
    return
  }

  // Load GA4 script
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`
  document.head.appendChild(script)

  // Initialize dataLayer
  window.dataLayer = window.dataLayer || []
  window.gtag = function gtag() {
    window.dataLayer!.push(arguments)
  }

  window.gtag('js', new Date())

  // Configure GA4 with privacy settings
  window.gtag('config', GA_MEASUREMENT_ID, {
    anonymize_ip: true,  // Anonymize IP addresses (GDPR compliance)
    cookie_flags: 'SameSite=None;Secure',  // Secure cookies
    cookie_domain: 'auto',
    cookie_expires: 63072000,  // 2 years (GA4 default)
  })

  console.log('[Analytics] Google Analytics 4 initialized')
}

/**
 * Track page view
 *
 * @param url - Page URL (defaults to current URL)
 * @param title - Page title (defaults to document.title)
 */
export function trackPageView(url?: string, title?: string): void {
  if (!isAnalyticsEnabled()) return

  window.gtag!('event', 'page_view', {
    page_path: url || window.location.pathname,
    page_title: title || document.title,
    page_location: window.location.href
  })

  console.log('[Analytics] Page view tracked:', url || window.location.pathname)
}

/**
 * Track custom event
 *
 * @param eventName - Event name (e.g., "search", "click", "conversion")
 * @param eventParams - Event parameters
 */
export function trackEvent(eventName: string, eventParams?: Record<string, any>): void {
  if (!isAnalyticsEnabled()) return

  window.gtag!('event', eventName, eventParams)

  console.log('[Analytics] Event tracked:', eventName, eventParams)
}

/**
 * Track user search
 *
 * @param params - Search parameters
 */
export function trackSearch(params: {
  origin: string
  theme?: string
  minFlightTime?: number
  maxFlightTime?: number
  resultsCount?: number
}): void {
  trackEvent('search', {
    search_term: params.theme || 'all_themes',
    origin_airport: params.origin,
    min_flight_time: params.minFlightTime,
    max_flight_time: params.maxFlightTime,
    results_count: params.resultsCount
  })
}

/**
 * Track destination view
 *
 * @param destinationId - Destination ID
 * @param cityName - City name
 * @param countryName - Country name
 */
export function trackDestinationView(
  destinationId: string,
  cityName: string,
  countryName: string
): void {
  trackEvent('view_item', {
    item_id: destinationId,
    item_name: cityName,
    item_category: countryName,
    item_category2: 'destination'
  })
}

/**
 * Track affiliate click (conversion event)
 *
 * @param partner - Affiliate partner
 * @param destination - Destination city
 * @param origin - Origin airport
 * @param value - Estimated value (for enhanced conversions)
 */
export function trackAffiliateClick(params: {
  partner: string
  destination: string
  origin: string
  value?: number
}): void {
  trackEvent('affiliate_click', {
    partner: params.partner,
    destination: params.destination,
    origin: params.origin,
    value: params.value || 0,
    currency: 'USD'
  })

  // Also track as conversion for GA4 conversion tracking
  trackEvent('conversion', {
    conversion_type: 'affiliate_click',
    partner: params.partner,
    value: params.value || 0,
    currency: 'USD'
  })
}

/**
 * Track user signup
 *
 * @param method - Signup method (e.g., "email", "google")
 */
export function trackSignup(method: string = 'email'): void {
  trackEvent('sign_up', {
    method
  })
}

/**
 * Track user login
 *
 * @param method - Login method (e.g., "email", "google")
 */
export function trackLogin(method: string = 'email'): void {
  trackEvent('login', {
    method
  })
}

/**
 * Track favorite destination added
 *
 * @param destinationId - Destination ID
 * @param cityName - City name
 */
export function trackFavoriteAdded(destinationId: string, cityName: string): void {
  trackEvent('add_to_favorites', {
    item_id: destinationId,
    item_name: cityName
  })
}

/**
 * Track saved search
 *
 * @param origin - Origin airport
 * @param theme - Travel theme
 */
export function trackSavedSearch(origin: string, theme?: string): void {
  trackEvent('save_search', {
    origin_airport: origin,
    theme: theme || 'all_themes'
  })
}

/**
 * Track video play (destination videos)
 *
 * @param videoUrl - Video URL
 * @param destinationId - Destination ID
 */
export function trackVideoPlay(videoUrl: string, destinationId: string): void {
  trackEvent('video_play', {
    video_url: videoUrl,
    destination_id: destinationId
  })
}

/**
 * Track outbound link click
 *
 * @param url - Destination URL
 * @param label - Link label
 */
export function trackOutboundLink(url: string, label?: string): void {
  trackEvent('outbound_link_click', {
    link_url: url,
    link_label: label
  })
}

/**
 * Set user properties (for logged-in users)
 *
 * @param userId - User ID
 * @param properties - Additional user properties
 */
export function setUserProperties(userId: string, properties?: Record<string, any>): void {
  if (!isAnalyticsEnabled()) return

  window.gtag!('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID!, {
    user_id: userId,
    ...properties
  })

  console.log('[Analytics] User properties set:', userId)
}

/**
 * Clear user properties (on logout)
 */
export function clearUserProperties(): void {
  if (!isAnalyticsEnabled()) return

  window.gtag!('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID!, {
    user_id: null
  })

  console.log('[Analytics] User properties cleared')
}
