import { useEffect, useCallback } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

/**
 * Hook for tracking analytics events - DISABLED (Non-MVP)
 */
export function useAnalytics() {
  const trackEvent = useCallback((name: string, properties?: Record<string, any>) => {
    // Analytics disabled for MVP
  }, [])

  const trackSearch = useCallback((
    type: 'initiated' | 'completed' | 'failed',
    searchParams: any
  ) => {
    // Analytics disabled for MVP
  }, [])

  const trackBooking = useCallback((
    stage: 'started' | 'completed' | 'failed' | 'abandoned',
    bookingData: any
  ) => {
    // Analytics disabled for MVP
  }, [])

  const trackAuth = useCallback((
    action: 'registered' | 'logged_in' | 'logged_out',
    userData?: any
  ) => {
    // Analytics disabled for MVP
  }, [])

  const trackError = useCallback((
    error: Error,
    context?: any
  ) => {
    // Analytics disabled for MVP
  }, [])

  const trackFeature = useCallback((
    featureName: string,
    action: string,
    properties?: Record<string, any>
  ) => {
    // Analytics disabled for MVP
  }, [])

  return {
    trackEvent,
    trackSearch,
    trackBooking,
    trackAuth,
    trackError,
    trackFeature,
  }
}

/**
 * Hook for automatic page view tracking - DISABLED (Non-MVP)
 */
export function usePageTracking() {
  // Analytics disabled for MVP
}

/**
 * Hook for tracking performance metrics - DISABLED (Non-MVP)
 */
export function usePerformanceTracking() {
  // Analytics disabled for MVP
}

/**
 * Hook for tracking user interactions - DISABLED (Non-MVP)
 */
export function useInteractionTracking() {
  const trackClick = useCallback((
    element: string,
    properties?: Record<string, any>
  ) => {
    // Analytics disabled for MVP
  }, [])

  const trackFormSubmit = useCallback((
    formName: string,
    properties?: Record<string, any>
  ) => {
    // Analytics disabled for MVP
  }, [])

  const trackExternalLink = useCallback((
    url: string,
    context?: string
  ) => {
    // Analytics disabled for MVP
  }, [])

  return {
    trackClick,
    trackFormSubmit,
    trackExternalLink,
  }
}

/**
 * Hook for tracking errors in components - DISABLED (Non-MVP)
 */
export function useErrorTracking() {
  const trackComponentError = useCallback((
    error: Error,
    component: string,
    action?: string
  ) => {
    // Analytics disabled for MVP
  }, [])

  const trackAPIError = useCallback((
    error: Error,
    endpoint: string,
    method?: string
  ) => {
    // Analytics disabled for MVP
  }, [])

  return {
    trackComponentError,
    trackAPIError,
  }
}
