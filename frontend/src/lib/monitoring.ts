/**
 * Monitoring Stub - Disabled for MVP
 *
 * This file provides empty implementations to satisfy imports
 * from admin auth/MFA routes without breaking the build.
 */

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
  message: string
  stack?: string
}

// Empty stub implementations
export function trackBusinessMetric(metric: BusinessMetric): void {
  // Disabled for MVP
}

export function trackSearchMetrics(metrics: SearchMetrics): void {
  // Disabled for MVP
}

export function trackBookingMetrics(metrics: BookingMetrics): void {
  // Disabled for MVP
}

export function trackErrorMetrics(metrics: ErrorMetrics): void {
  // Disabled for MVP
}

export function trackError(error: Error, context?: any): void {
  // Disabled for MVP
}

export function trackAPICall(endpoint: string, duration: number, success: boolean): void {
  // Disabled for MVP
}

export function trackUserAction(action: string, metadata?: Record<string, any>): void {
  // Disabled for MVP
}

export default {
  trackBusinessMetric,
  trackSearchMetrics,
  trackBookingMetrics,
  trackErrorMetrics,
  trackError,
  trackAPICall,
  trackUserAction,
}
