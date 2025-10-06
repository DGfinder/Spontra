/**
 * Cookie Consent Management
 * GDPR/CCPA compliant cookie handling
 */

export type CookieConsent = {
  necessary: boolean      // Always true (required for site function)
  analytics: boolean      // Google Analytics, tracking
  marketing: boolean      // Affiliate tracking, ads
  preferences: boolean    // User preferences, saved settings
}

const COOKIE_CONSENT_KEY = 'spontra_cookie_consent'
const COOKIE_CONSENT_VERSION = '1.0'

/**
 * Get current cookie consent from localStorage
 */
export function getCookieConsent(): CookieConsent | null {
  if (typeof window === 'undefined') return null

  try {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY)
    if (!stored) return null

    const parsed = JSON.parse(stored)

    // Check version match
    if (parsed.version !== COOKIE_CONSENT_VERSION) {
      return null
    }

    return parsed.consent
  } catch (error) {
    console.error('[Cookies] Error reading consent:', error)
    return null
  }
}

/**
 * Save cookie consent to localStorage
 */
export function saveCookieConsent(consent: CookieConsent): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(
      COOKIE_CONSENT_KEY,
      JSON.stringify({
        version: COOKIE_CONSENT_VERSION,
        consent,
        timestamp: new Date().toISOString()
      })
    )

    // Trigger event for other components to react
    window.dispatchEvent(new CustomEvent('cookieConsentChange', { detail: consent }))
  } catch (error) {
    console.error('[Cookies] Error saving consent:', error)
  }
}

/**
 * Check if user has given consent for a specific category
 */
export function hasConsent(category: keyof CookieConsent): boolean {
  const consent = getCookieConsent()

  // If no consent given yet, default deny (except necessary)
  if (!consent) {
    return category === 'necessary'
  }

  return consent[category]
}

/**
 * Clear cookie consent (for testing or user request)
 */
export function clearCookieConsent(): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.removeItem(COOKIE_CONSENT_KEY)
    window.dispatchEvent(new CustomEvent('cookieConsentChange', { detail: null }))
  } catch (error) {
    console.error('[Cookies] Error clearing consent:', error)
  }
}

/**
 * Get default consent (all denied except necessary)
 */
export function getDefaultConsent(): CookieConsent {
  return {
    necessary: true,
    analytics: false,
    marketing: false,
    preferences: false
  }
}

/**
 * Get all-accepted consent
 */
export function getAcceptAllConsent(): CookieConsent {
  return {
    necessary: true,
    analytics: true,
    marketing: true,
    preferences: true
  }
}

/**
 * Initialize analytics based on consent
 */
export function initializeAnalytics(): void {
  if (!hasConsent('analytics')) {
    console.log('[Analytics] Analytics disabled - no consent')
    return
  }

  // Initialize Google Analytics 4
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('consent', 'update', {
      'analytics_storage': 'granted',
      'ad_storage': hasConsent('marketing') ? 'granted' : 'denied'
    })
  }

  console.log('[Analytics] Analytics enabled')
}

/**
 * Initialize marketing tracking based on consent
 */
export function initializeMarketing(): void {
  if (!hasConsent('marketing')) {
    console.log('[Marketing] Marketing cookies disabled - no consent')
    return
  }

  // Enable affiliate tracking, etc.
  console.log('[Marketing] Marketing cookies enabled')
}

// Type augmentation for gtag
declare global {
  interface Window {
    gtag?: (...args: any[]) => void
    dataLayer?: any[]
  }
}
