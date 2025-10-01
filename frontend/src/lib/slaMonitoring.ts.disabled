/**
 * SLA Monitoring and Alerting System
 * Tracks service level agreements and triggers alerts when thresholds are breached
 */

import { metrics, trackExternalAPI } from '@/lib/telemetry'
import { logger } from '@/lib/logger'
import { sentryHelpers } from '@/lib/sentry'
import { circuitBreakerRegistry } from '@/lib/circuitBreaker'

export interface SLATarget {
  name: string
  description: string
  threshold: number
  unit: 'percentage' | 'milliseconds' | 'count'
  period: 'minute' | 'hour' | 'day' | 'week' | 'month'
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export interface SLAMetric {
  name: string
  value: number
  timestamp: Date
  target: SLATarget
  status: 'healthy' | 'warning' | 'critical'
  metadata?: Record<string, any>
}

export interface SLAAlert {
  id: string
  slaName: string
  metric: SLAMetric
  message: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  timestamp: Date
  acknowledged: boolean
  resolvedAt?: Date
}

// Default SLA targets for the platform
const DEFAULT_SLA_TARGETS: Record<string, SLATarget> = {
  'api_availability': {
    name: 'API Availability',
    description: 'Percentage of successful API responses',
    threshold: 99.9,
    unit: 'percentage',
    period: 'hour',
    severity: 'critical'
  },
  'api_response_time': {
    name: 'API Response Time',
    description: 'Average API response time',
    threshold: 500,
    unit: 'milliseconds',
    period: 'minute',
    severity: 'high'
  },
  'search_success_rate': {
    name: 'Flight Search Success Rate',
    description: 'Percentage of successful flight searches',
    threshold: 95.0,
    unit: 'percentage',
    period: 'hour',
    severity: 'high'
  },
  'amadeus_availability': {
    name: 'Amadeus API Availability',
    description: 'Amadeus API uptime percentage',
    threshold: 98.0,
    unit: 'percentage',
    period: 'hour',
    severity: 'medium'
  },
  'conversion_rate': {
    name: 'Click-to-Booking Conversion Rate',
    description: 'Percentage of clicks that result in bookings',
    threshold: 2.0,
    unit: 'percentage',
    period: 'day',
    severity: 'medium'
  },
  'error_rate': {
    name: 'Application Error Rate',
    description: 'Percentage of requests resulting in errors',
    threshold: 1.0,
    unit: 'percentage',
    period: 'hour',
    severity: 'high'
  },
  'database_response_time': {
    name: 'Database Query Response Time',
    description: 'Average database query execution time',
    threshold: 100,
    unit: 'milliseconds',
    period: 'minute',
    severity: 'medium'
  },
  'cache_hit_rate': {
    name: 'Cache Hit Rate',
    description: 'Percentage of requests served from cache',
    threshold: 80.0,
    unit: 'percentage',
    period: 'hour',
    severity: 'low'
  }
}

class SLAMonitoringService {
  private alerts: Map<string, SLAAlert> = new Map()
  private metrics: Map<string, SLAMetric[]> = new Map()
  private alertingEnabled: boolean = true
  
  constructor() {
    // Initialize metrics storage for each SLA target
    for (const target of Object.values(DEFAULT_SLA_TARGETS)) {
      this.metrics.set(target.name, [])
    }
    
    // Start periodic monitoring
    this.startPeriodicMonitoring()
  }

  /**
   * Record a metric value for SLA monitoring
   */
  recordMetric(
    slaName: string,
    value: number,
    metadata?: Record<string, any>
  ): void {
    const target = DEFAULT_SLA_TARGETS[slaName]
    if (!target) {
      logger.warn(`Unknown SLA target: ${slaName}`)
      return
    }

    const metric: SLAMetric = {
      name: slaName,
      value,
      timestamp: new Date(),
      target,
      status: this.evaluateMetricStatus(value, target),
      metadata
    }

    // Store metric
    const metricHistory = this.metrics.get(target.name) || []
    metricHistory.push(metric)
    
    // Keep only recent metrics (last 24 hours)
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const recentMetrics = metricHistory.filter(m => m.timestamp > cutoff)
    this.metrics.set(target.name, recentMetrics)

    // Check for SLA violations
    this.checkSLAViolation(metric)

    // Record metric in telemetry
    metrics.recordGauge(`sla.${slaName}`, value, {
      target_threshold: target.threshold.toString(),
      status: metric.status,
      period: target.period
    })

    logger.debug(`Recorded SLA metric: ${slaName} = ${value}`, {
      component: 'sla_monitoring',
      metadata: { metric, target }
    })
  }

  /**
   * Evaluate if a metric value meets SLA requirements
   */
  private evaluateMetricStatus(value: number, target: SLATarget): 'healthy' | 'warning' | 'critical' {
    const warningThreshold = target.unit === 'percentage' ? 
      target.threshold - 2 : target.threshold * 1.2

    if (target.unit === 'percentage' || target.name.includes('rate')) {
      // For percentages and rates, lower values are worse
      if (value < warningThreshold) return 'critical'
      if (value < target.threshold) return 'warning'
      return 'healthy'
    } else {
      // For response times and counts, higher values are worse
      if (value > target.threshold) return 'critical'
      if (value > warningThreshold) return 'warning'
      return 'healthy'
    }
  }

  /**
   * Check for SLA violations and trigger alerts
   */
  private checkSLAViolation(metric: SLAMetric): void {
    if (metric.status === 'healthy') {
      // Resolve any existing alerts for this SLA
      this.resolveAlert(metric.name)
      return
    }

    // Check if we already have an active alert for this SLA
    const existingAlert = this.alerts.get(metric.name)
    if (existingAlert && !existingAlert.acknowledged) {
      // Update existing alert with latest metric
      existingAlert.metric = metric
      return
    }

    // Create new alert
    const alert: SLAAlert = {
      id: crypto.randomUUID(),
      slaName: metric.name,
      metric,
      message: this.generateAlertMessage(metric),
      severity: metric.target.severity,
      timestamp: new Date(),
      acknowledged: false
    }

    this.alerts.set(metric.name, alert)
    this.triggerAlert(alert)
  }

  /**
   * Generate a human-readable alert message
   */
  private generateAlertMessage(metric: SLAMetric): string {
    const target = metric.target
    const status = metric.status === 'critical' ? 'CRITICAL' : 'WARNING'
    
    if (target.unit === 'percentage') {
      return `${status}: ${target.description} is ${metric.value.toFixed(2)}%, below threshold of ${target.threshold}%`
    } else if (target.unit === 'milliseconds') {
      return `${status}: ${target.description} is ${metric.value.toFixed(0)}ms, above threshold of ${target.threshold}ms`
    } else {
      return `${status}: ${target.description} is ${metric.value}, threshold is ${target.threshold}`
    }
  }

  /**
   * Trigger an alert through various channels
   */
  private triggerAlert(alert: SLAAlert): void {
    if (!this.alertingEnabled) return

    logger.error(`SLA Alert: ${alert.message}`, {
      component: 'sla_monitoring',
      operation: 'alert_triggered',
      metadata: { alert },
      tags: ['sla-alert', alert.severity]
    })

    // Send to Sentry
    sentryHelpers.captureMessage(
      `SLA Violation: ${alert.slaName}`,
      alert.severity === 'critical' ? 'fatal' : 'error',
      {
        sla: {
          name: alert.slaName,
          value: alert.metric.value,
          threshold: alert.metric.target.threshold,
          status: alert.metric.status
        },
        alert
      }
    )

    // Record alert metric
    metrics.recordCounter('sla.alerts_triggered', 1, {
      sla_name: alert.slaName,
      severity: alert.severity,
      status: alert.metric.status
    })

    // Send to external alerting systems (Slack, PagerDuty, etc.)
    this.sendExternalAlert(alert).catch(error => {
      logger.error('Failed to send external alert', {
        component: 'sla_monitoring',
        metadata: { error: error.message, alert }
      })
    })

    logger.info(`SLA alert triggered: ${alert.slaName}`, {
      component: 'sla_monitoring',
      metadata: { alertId: alert.id, severity: alert.severity }
    })
  }

  /**
   * Send alert to external systems
   */
  private async sendExternalAlert(alert: SLAAlert): Promise<void> {
    const webhookUrl = process.env.SLA_ALERT_WEBHOOK_URL
    if (!webhookUrl) return

    const payload = {
      type: 'sla_alert',
      alert: {
        id: alert.id,
        sla: alert.slaName,
        message: alert.message,
        severity: alert.severity,
        timestamp: alert.timestamp.toISOString(),
        metric: {
          value: alert.metric.value,
          threshold: alert.metric.target.threshold,
          unit: alert.metric.target.unit
        }
      },
      service: 'spontra-frontend',
      environment: process.env.NODE_ENV
    }

    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Spontra-SLA-Monitor/1.0'
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(5000)
      })
    } catch (error) {
      throw new Error(`Webhook delivery failed: ${error}`)
    }
  }

  /**
   * Resolve an alert
   */
  private resolveAlert(slaName: string): void {
    const alert = this.alerts.get(slaName)
    if (alert && !alert.resolvedAt) {
      alert.resolvedAt = new Date()
      
      logger.info(`SLA alert resolved: ${slaName}`, {
        component: 'sla_monitoring',
        metadata: { alertId: alert.id }
      })

      metrics.recordCounter('sla.alerts_resolved', 1, {
        sla_name: slaName,
        severity: alert.severity
      })
    }
  }

  /**
   * Get current SLA status for all targets
   */
  getSLAStatus(): Record<string, any> {
    const status: Record<string, any> = {}

    for (const [targetName, target] of Object.entries(DEFAULT_SLA_TARGETS)) {
      const recentMetrics = this.metrics.get(target.name) || []
      const latestMetric = recentMetrics[recentMetrics.length - 1]
      const activeAlert = this.alerts.get(target.name)

      status[targetName] = {
        target,
        currentValue: latestMetric?.value,
        status: latestMetric?.status || 'unknown',
        lastUpdated: latestMetric?.timestamp,
        alert: activeAlert && !activeAlert.resolvedAt ? {
          id: activeAlert.id,
          message: activeAlert.message,
          severity: activeAlert.severity,
          timestamp: activeAlert.timestamp
        } : null
      }
    }

    return status
  }

  /**
   * Get SLA metrics history
   */
  getSLAHistory(slaName: string, hours: number = 24): SLAMetric[] {
    const target = DEFAULT_SLA_TARGETS[slaName]
    if (!target) return []

    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000)
    const metrics = this.metrics.get(target.name) || []
    
    return metrics.filter(m => m.timestamp > cutoff)
  }

  /**
   * Calculate SLA compliance percentage
   */
  calculateCompliance(slaName: string, hours: number = 24): number {
    const history = this.getSLAHistory(slaName, hours)
    if (history.length === 0) return 100

    const healthyMetrics = history.filter(m => m.status === 'healthy')
    return (healthyMetrics.length / history.length) * 100
  }

  /**
   * Start periodic monitoring and data collection
   */
  private startPeriodicMonitoring(): void {
    // Monitor API metrics every minute
    setInterval(() => {
      this.collectAPIMetrics()
    }, 60 * 1000)

    // Monitor circuit breaker status every 30 seconds
    setInterval(() => {
      this.collectCircuitBreakerMetrics()
    }, 30 * 1000)

    // Monitor business metrics every 5 minutes
    setInterval(() => {
      this.collectBusinessMetrics()
    }, 5 * 60 * 1000)

    logger.info('SLA monitoring started', {
      component: 'sla_monitoring',
      metadata: { targets: Object.keys(DEFAULT_SLA_TARGETS) }
    })
  }

  /**
   * Collect API performance metrics
   */
  private async collectAPIMetrics(): Promise<void> {
    try {
      // This would typically query your metrics database or monitoring system
      // For now, we'll simulate some metrics
      
      // API availability (from request logs)
      const apiAvailability = Math.random() * 5 + 95 // 95-100%
      this.recordMetric('api_availability', apiAvailability)

      // API response time (from request logs)
      const apiResponseTime = Math.random() * 300 + 200 // 200-500ms
      this.recordMetric('api_response_time', apiResponseTime)

      // Error rate (from request logs)
      const errorRate = Math.random() * 2 // 0-2%
      this.recordMetric('error_rate', errorRate)

    } catch (error) {
      logger.error('Failed to collect API metrics', {
        component: 'sla_monitoring',
        metadata: { error: error.message }
      })
    }
  }

  /**
   * Collect circuit breaker metrics
   */
  private collectCircuitBreakerMetrics(): void {
    try {
      const allStats = circuitBreakerRegistry.getAllStats()
      
      for (const [serviceName, stats] of Object.entries(allStats)) {
        if (serviceName === 'amadeus') {
          this.recordMetric('amadeus_availability', stats.uptime)
        }
      }
    } catch (error) {
      logger.error('Failed to collect circuit breaker metrics', {
        component: 'sla_monitoring',
        metadata: { error: error.message }
      })
    }
  }

  /**
   * Collect business metrics
   */
  private async collectBusinessMetrics(): Promise<void> {
    try {
      // These would typically come from your analytics database
      // For now, we'll simulate some metrics
      
      const searchSuccessRate = Math.random() * 10 + 90 // 90-100%
      this.recordMetric('search_success_rate', searchSuccessRate)

      const conversionRate = Math.random() * 3 + 1 // 1-4%
      this.recordMetric('conversion_rate', conversionRate)

      const cacheHitRate = Math.random() * 20 + 75 // 75-95%
      this.recordMetric('cache_hit_rate', cacheHitRate)

    } catch (error) {
      logger.error('Failed to collect business metrics', {
        component: 'sla_monitoring',
        metadata: { error: error.message }
      })
    }
  }

  /**
   * Enable or disable alerting
   */
  setAlertingEnabled(enabled: boolean): void {
    this.alertingEnabled = enabled
    logger.info(`SLA alerting ${enabled ? 'enabled' : 'disabled'}`, {
      component: 'sla_monitoring'
    })
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string, acknowledgedBy: string): boolean {
    for (const alert of this.alerts.values()) {
      if (alert.id === alertId) {
        alert.acknowledged = true
        
        logger.info(`SLA alert acknowledged: ${alert.slaName}`, {
          component: 'sla_monitoring',
          metadata: { alertId, acknowledgedBy }
        })

        metrics.recordCounter('sla.alerts_acknowledged', 1, {
          sla_name: alert.slaName,
          severity: alert.severity
        })

        return true
      }
    }
    return false
  }
}

// Export singleton instance
export const slaMonitoring = new SLAMonitoringService()

// Convenience functions for recording common metrics
export const recordAPIResponse = (responseTimeMs: number, statusCode: number) => {
  slaMonitoring.recordMetric('api_response_time', responseTimeMs)
  
  const isSuccess = statusCode >= 200 && statusCode < 400
  const currentHour = new Date().getHours()
  
  // Update hourly availability tracking (simplified)
  if (isSuccess) {
    slaMonitoring.recordMetric('api_availability', 100) // Success contributes to 100% availability
  } else {
    slaMonitoring.recordMetric('api_availability', 0) // Failure contributes to 0% availability
  }
}

export const recordSearchResult = (success: boolean, resultCount: number) => {
  slaMonitoring.recordMetric('search_success_rate', success ? 100 : 0, {
    resultCount
  })
}

export const recordConversion = (clickToBookingTimeMs: number) => {
  slaMonitoring.recordMetric('conversion_rate', 100, { // Successful conversion
    conversionTime: clickToBookingTimeMs
  })
}

export const recordDatabaseQuery = (queryTimeMs: number) => {
  slaMonitoring.recordMetric('database_response_time', queryTimeMs)
}

export default slaMonitoring