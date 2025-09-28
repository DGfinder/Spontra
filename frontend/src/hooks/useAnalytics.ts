import { useEffect, useCallback } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { Analytics, AnalyticsEventName } from '@/lib/analytics'

/**
 * Hook for tracking analytics events
 */
export function useAnalytics() {
  const trackEvent = useCallback((name: AnalyticsEventName | string, properties?: Record<string, any>) => {
    Analytics.trackEvent(name, properties)
  }, [])

  const trackSearch = useCallback((
    type: 'initiated' | 'completed' | 'failed',
    searchParams: Parameters<typeof Analytics.trackSearch>[1]
  ) => {
    Analytics.trackSearch(type, searchParams)
  }, [])

  const trackBooking = useCallback((
    stage: 'started' | 'completed' | 'failed' | 'abandoned',
    bookingData: Parameters<typeof Analytics.trackBooking>[1]
  ) => {
    Analytics.trackBooking(stage, bookingData)
  }, [])

  const trackAuth = useCallback((
    action: 'registered' | 'logged_in' | 'logged_out',
    userData?: Parameters<typeof Analytics.trackAuth>[1]
  ) => {
    Analytics.trackAuth(action, userData)
  }, [])

  const trackError = useCallback((
    error: Error,
    context?: Parameters<typeof Analytics.trackError>[1]
  ) => {
    Analytics.trackError(error, context)
  }, [])

  const trackFeature = useCallback((
    featureName: string,
    action: string,
    properties?: Record<string, any>
  ) => {
    Analytics.trackFeature(featureName, action, properties)
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
 * Hook for automatic page view tracking
 */
export function usePageTracking() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    const startTime = performance.now()

    // Track page view
    Analytics.trackPageView(pathname, {
      referrer: document.referrer,
      searchParams: Object.fromEntries(searchParams.entries()),
    })

    // Track load time when page is fully loaded
    const handleLoad = () => {
      const loadTime = performance.now() - startTime
      Analytics.trackPerformance('load_time', loadTime, { page: pathname })
    }

    if (document.readyState === 'complete') {
      handleLoad()
    } else {
      window.addEventListener('load', handleLoad)
      return () => window.removeEventListener('load', handleLoad)
    }
  }, [pathname, searchParams])
}

/**
 * Hook for tracking performance metrics
 */
export function usePerformanceTracking() {
  useEffect(() => {
    // Track Core Web Vitals
    if ('web-vital' in window) {
      return
    }

    // CLS (Cumulative Layout Shift)
    let clsValue = 0
    let clsEntries: PerformanceEntry[] = []

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
          clsValue += (entry as any).value
          clsEntries.push(entry)
        }
      }
    })

    try {
      observer.observe({ type: 'layout-shift', buffered: true })
    } catch {
      // Layout shift API not supported
    }

    // Report CLS when page becomes hidden
    const reportCLS = () => {
      if (clsValue > 0) {
        Analytics.trackPerformance('cls', clsValue, { page: window.location.pathname })
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        reportCLS()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('beforeunload', reportCLS)

    return () => {
      observer.disconnect()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', reportCLS)
    }
  }, [])
}

/**
 * Hook for tracking user interactions
 */
export function useInteractionTracking() {
  const { trackEvent } = useAnalytics()

  const trackClick = useCallback((
    element: string,
    properties?: Record<string, any>
  ) => {
    trackEvent('element_clicked', {
      element,
      ...properties,
    })
  }, [trackEvent])

  const trackFormSubmit = useCallback((
    formName: string,
    properties?: Record<string, any>
  ) => {
    trackEvent('form_submitted', {
      form: formName,
      ...properties,
    })
  }, [trackEvent])

  const trackExternalLink = useCallback((
    url: string,
    context?: string
  ) => {
    trackEvent('external_link_clicked', {
      url,
      context,
    })
  }, [trackEvent])

  return {
    trackClick,
    trackFormSubmit,
    trackExternalLink,
  }
}

/**
 * Hook for tracking errors in components
 */
export function useErrorTracking() {
  const { trackError } = useAnalytics()

  const trackComponentError = useCallback((
    error: Error,
    component: string,
    action?: string
  ) => {
    trackError(error, { component, action })
  }, [trackError])

  const trackAPIError = useCallback((
    error: Error,
    endpoint: string,
    method?: string
  ) => {
    trackError(error, { component: 'api', action: `${method} ${endpoint}` })
  }, [trackError])

  return {
    trackComponentError,
    trackAPIError,
  }
}