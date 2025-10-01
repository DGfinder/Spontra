/**
 * Monitoring Stub - MVP Build
 * 
 * Simple stub implementations to satisfy imports without dependencies
 */

export interface ErrorMetrics {
  errorType: 'api' | 'database' | 'external_service' | 'user_action'
  errorCode?: string
  endpoint?: string
  userId?: string
  message?: string
  severity?: 'low' | 'medium' | 'high' | 'critical'
}

// Simple stub function for error tracking
export function trackError(error: Error, context?: ErrorMetrics): void {
  // In MVP, just log to console
  console.error('Error tracked:', error.message, context)
}

// Simple stub function for metrics
export function trackMetric(name: string, value: number, tags?: Record<string, string>): void {
  // In MVP, just log to console  
  console.log('Metric tracked:', name, value, tags)
}

// Simple stub function for custom events
export function trackEvent(event: string, properties?: Record<string, any>): void {
  // In MVP, just log to console
  console.log('Event tracked:', event, properties)
}