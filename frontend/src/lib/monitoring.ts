/**
 * Critical Business Metrics Monitoring
 * Tracks key performance indicators and business-critical events
 */

import { captureException, captureMessage, addBreadcrumb } from '@sentry/nextjs'
import { track } from '@vercel/analytics'
import { env, isProduction } from '../config/environment'

// Business metric types
export interface BusinessMetric {
  name: string
  value: number
  unit: string
  tags?: Record<string, string>
  timestamp?: Date
}

export interface SearchMetrics {
  searchId: string
  origin: string
  destination?: string
  theme?: string
  flightDuration?: number
  resultCount: number
  responseTime: number
  success: boolean
  error?: string
}

export interface BookingMetrics {
  bookingId: string
  contentId?: string
  userId?: string
  conversionSource: 'search' | 'content' | 'recommendation'
  bookingValue: number
  currency: string
  flightDetails: {
    origin: string
    destination: string
    departureDate: string
    returnDate?: string
  }
}

export interface ErrorMetrics {
  errorType: 'api' | 'database' | 'external_service' | 'user_action'
  errorCode?: string
  endpoint?: string
  userId?: string
  userAgent?: string
  severity: 'low' | 'medium' | 'high' | 'critical'
}

class BusinessMetricsCollector {
  private metricsBuffer: BusinessMetric[] = []
  private readonly BUFFER_SIZE = 100
  private readonly FLUSH_INTERVAL = 30000 // 30 seconds

  constructor() {
    if (typeof window !== 'undefined') {
      // Auto-flush metrics periodically
      setInterval(() => {
        this.flushMetrics()
      }, this.FLUSH_INTERVAL)
      
      // Flush on page unload
      window.addEventListener('beforeunload', () => {
        this.flushMetrics()
      })
    }
  }

  /**
   * Track search performance and conversion funnel
   */
  trackSearchMetrics(metrics: SearchMetrics): void {
    const { searchId, origin, destination, theme, resultCount, responseTime, success, error } = metrics

    // Core search metrics
    this.addMetric({
      name: 'search_request',
      value: 1,
      unit: 'count',
      tags: {
        origin,
        destination: destination || 'unknown',
        theme: theme || 'none',
        success: success.toString()
      }
    })

    // Search performance metrics
    this.addMetric({
      name: 'search_response_time',
      value: responseTime,
      unit: 'ms',
      tags: { origin, success: success.toString() }
    })

    this.addMetric({
      name: 'search_result_count',
      value: resultCount,
      unit: 'count',
      tags: { origin, theme: theme || 'none' }
    })

    // Error tracking
    if (!success && error) {
      this.trackError({
        errorType: 'api',
        errorCode: 'search_failed',
        endpoint: '/api/search',
        severity: 'high'
      })

      captureException(new Error(`Search failed: ${error}`), {
        tags: { searchId, origin, destination },
        extra: { responseTime, resultCount }
      })
    }

    // Vercel Analytics
    track('search_performed', {
      origin,
      destination,
      theme,
      result_count: resultCount,
      response_time: responseTime,
      success
    })

    // Add breadcrumb for debugging
    addBreadcrumb({
      message: 'Search performed',
      category: 'search',
      data: { searchId, origin, destination, resultCount, responseTime },
      level: success ? 'info' : 'error'
    })
  }

  /**
   * Track booking conversions and revenue
   */
  trackBookingMetrics(metrics: BookingMetrics): void {
    const { bookingId, contentId, userId, conversionSource, bookingValue, currency, flightDetails } = metrics

    // Revenue metrics
    this.addMetric({
      name: 'booking_revenue',
      value: bookingValue,
      unit: currency.toLowerCase(),
      tags: {
        source: conversionSource,
        origin: flightDetails.origin,
        destination: flightDetails.destination
      }
    })

    // Conversion metrics
    this.addMetric({
      name: 'booking_conversion',
      value: 1,
      unit: 'count',
      tags: {
        source: conversionSource,
        has_content: contentId ? 'true' : 'false',
        user_type: userId ? 'registered' : 'anonymous'
      }
    })

    // Flight booking patterns
    const tripDuration = flightDetails.returnDate 
      ? Math.ceil((new Date(flightDetails.returnDate).getTime() - new Date(flightDetails.departureDate).getTime()) / (1000 * 60 * 60 * 24))
      : 0

    this.addMetric({
      name: 'trip_duration',
      value: tripDuration,
      unit: 'days',
      tags: {
        origin: flightDetails.origin,
        destination: flightDetails.destination,
        trip_type: tripDuration > 0 ? 'round_trip' : 'one_way'
      }
    })

    // Critical success event
    captureMessage('Booking completed', {
      level: 'info',
      tags: { bookingId, conversionSource },
      extra: { bookingValue, currency, flightDetails }
    })

    // Vercel Analytics
    track('booking_completed', {
      booking_id: bookingId,
      content_id: contentId,
      conversion_source: conversionSource,
      booking_value: bookingValue,
      currency,
      origin: flightDetails.origin,
      destination: flightDetails.destination
    })
  }

  /**
   * Track errors with business impact classification
   */
  trackError(metrics: ErrorMetrics): void {
    const { errorType, errorCode, endpoint, userId, userAgent, severity } = metrics

    // Error count metrics
    this.addMetric({
      name: 'error_count',
      value: 1,
      unit: 'count',
      tags: {
        type: errorType,
        code: errorCode || 'unknown',
        endpoint: endpoint || 'unknown',
        severity
      }
    })

    // Critical errors need immediate attention
    if (severity === 'critical') {
      this.addMetric({
        name: 'critical_error',
        value: 1,
        unit: 'count',
        tags: {
          type: errorType,
          code: errorCode || 'unknown'
        }
      })
    }

    // User impact tracking
    if (userId) {
      this.addMetric({
        name: 'user_affected_by_error',
        value: 1,
        unit: 'count',
        tags: {
          error_type: errorType,
          severity
        }
      })
    }

    // Vercel Analytics
    track('error_occurred', {
      error_type: errorType,
      error_code: errorCode,
      endpoint,
      severity,
      has_user: !!userId
    })
  }

  /**
   * Track user engagement metrics
   */
  trackEngagement(action: string, details: Record<string, any> = {}): void {
    this.addMetric({
      name: 'user_engagement',
      value: 1,
      unit: 'count',
      tags: {
        action,
        ...Object.fromEntries(
          Object.entries(details).map(([k, v]) => [k, String(v)])
        )
      }
    })

    track('user_engagement', {
      action,
      ...details
    })
  }

  /**
   * Track API performance and external service health
   */
  trackAPIMetrics(endpoint: string, responseTime: number, statusCode: number, success: boolean): void {
    this.addMetric({
      name: 'api_response_time',
      value: responseTime,
      unit: 'ms',
      tags: {
        endpoint,
        status_code: statusCode.toString(),
        success: success.toString()
      }
    })

    this.addMetric({
      name: 'api_request',
      value: 1,
      unit: 'count',
      tags: {
        endpoint,
        status_code: statusCode.toString()
      }
    })

    // Alert on high response times
    if (responseTime > 5000) {
      this.trackError({
        errorType: 'api',
        errorCode: 'slow_response',
        endpoint,
        severity: 'medium'
      })
    }

    // Alert on error rates
    if (!success) {
      this.trackError({
        errorType: 'api',
        errorCode: `http_${statusCode}`,
        endpoint,
        severity: statusCode >= 500 ? 'high' : 'medium'
      })
    }
  }

  /**
   * Add metric to buffer
   */
  private addMetric(metric: BusinessMetric): void {
    metric.timestamp = new Date()
    this.metricsBuffer.push(metric)

    // Auto-flush if buffer is full
    if (this.metricsBuffer.length >= this.BUFFER_SIZE) {
      this.flushMetrics()
    }
  }

  /**
   * Flush metrics to monitoring systems
   */
  private async flushMetrics(): Promise<void> {
    if (this.metricsBuffer.length === 0) return

    const metrics = [...this.metricsBuffer]
    this.metricsBuffer = []

    try {
      // Send to internal analytics endpoint
      if (isProduction) {
        await fetch('/api/analytics/metrics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ metrics })
        })
      }

      // Log in development
      if (!isProduction) {
        console.log('📊 Business Metrics:', metrics)
      }

    } catch (error) {
      console.error('Failed to flush metrics:', error)
      
      // Re-add failed metrics to buffer for retry
      this.metricsBuffer.unshift(...metrics)
      
      // Capture to Sentry
      captureException(error, {
        tags: { component: 'metrics_collector' },
        extra: { failed_metrics_count: metrics.length }
      })
    }
  }

  /**
   * Get current metrics buffer status
   */
  getStatus(): { bufferSize: number; bufferLimit: number } {
    return {
      bufferSize: this.metricsBuffer.length,
      bufferLimit: this.BUFFER_SIZE
    }
  }
}

// Singleton instance
export const businessMetrics = new BusinessMetricsCollector()

// High-level tracking functions
export const trackSearch = (metrics: SearchMetrics) => businessMetrics.trackSearchMetrics(metrics)
export const trackBooking = (metrics: BookingMetrics) => businessMetrics.trackBookingMetrics(metrics)
export const trackError = (metrics: ErrorMetrics) => businessMetrics.trackError(metrics)
export const trackEngagement = (action: string, details?: Record<string, any>) => 
  businessMetrics.trackEngagement(action, details)
export const trackAPI = (endpoint: string, responseTime: number, statusCode: number, success: boolean) =>
  businessMetrics.trackAPIMetrics(endpoint, responseTime, statusCode, success)

// Performance measurement helper
export function measureAPICall<T>(
  endpoint: string,
  apiCall: () => Promise<T>
): Promise<T> {
  const startTime = Date.now()
  
  return apiCall()
    .then(result => {
      const responseTime = Date.now() - startTime
      trackAPI(endpoint, responseTime, 200, true)
      return result
    })
    .catch(error => {
      const responseTime = Date.now() - startTime
      const statusCode = error.status || error.statusCode || 500
      trackAPI(endpoint, responseTime, statusCode, false)
      throw error
    })
}

export default businessMetrics