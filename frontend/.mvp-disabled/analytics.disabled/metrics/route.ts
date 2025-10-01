/**
 * Business Metrics Collection API
 * Receives and processes business metrics from the frontend
 */

import { NextRequest, NextResponse } from 'next/server'
import { captureException } from '@sentry/nextjs'
import { isProduction } from '@/config/environment'

export const runtime = 'nodejs'

interface BusinessMetric {
  name: string
  value: number
  unit: string
  tags?: Record<string, string>
  timestamp?: Date
}

interface MetricsPayload {
  metrics: BusinessMetric[]
}

// In-memory metrics aggregation (replace with proper time-series DB in production)
const metricsStore = new Map<string, BusinessMetric[]>()

export async function POST(request: NextRequest) {
  try {
    const body: MetricsPayload = await request.json()
    
    if (!body.metrics || !Array.isArray(body.metrics)) {
      return NextResponse.json(
        { error: 'Invalid metrics payload' },
        { status: 400 }
      )
    }

    // Process and store metrics
    const processedMetrics = body.metrics.map(metric => ({
      ...metric,
      timestamp: metric.timestamp ? new Date(metric.timestamp) : new Date()
    }))

    // Store metrics by name for aggregation
    for (const metric of processedMetrics) {
      const key = `${metric.name}:${JSON.stringify(metric.tags || {})}`
      
      if (!metricsStore.has(key)) {
        metricsStore.set(key, [])
      }
      
      metricsStore.get(key)!.push(metric)
    }

    // Critical alerts
    await processCriticalAlerts(processedMetrics)

    // Log metrics in development
    if (!isProduction) {
      console.log('📊 Received business metrics:', processedMetrics)
    }

    return NextResponse.json({
      success: true,
      processed: processedMetrics.length
    })

  } catch (error) {
    console.error('Metrics processing error:', error)
    
    captureException(error, {
      tags: { component: 'metrics_api' },
      extra: { request_url: request.url }
    })

    return NextResponse.json(
      { error: 'Failed to process metrics' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const metricName = searchParams.get('metric')
    const since = searchParams.get('since')
    const limit = parseInt(searchParams.get('limit') || '100')

    // Filter metrics
    let filteredMetrics: BusinessMetric[] = []
    
    if (metricName) {
      // Get specific metric
      for (const [key, metrics] of metricsStore.entries()) {
        if (key.startsWith(`${metricName}:`)) {
          filteredMetrics.push(...metrics)
        }
      }
    } else {
      // Get all metrics
      for (const metrics of metricsStore.values()) {
        filteredMetrics.push(...metrics)
      }
    }

    // Apply time filter
    if (since) {
      const sinceDate = new Date(since)
      filteredMetrics = filteredMetrics.filter(m => 
        m.timestamp && m.timestamp >= sinceDate
      )
    }

    // Sort by timestamp and limit
    filteredMetrics.sort((a, b) => 
      (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0)
    )
    
    if (limit > 0) {
      filteredMetrics = filteredMetrics.slice(0, limit)
    }

    // Aggregate metrics for response
    const aggregated = aggregateMetrics(filteredMetrics)

    return NextResponse.json({
      metrics: filteredMetrics.slice(0, 50), // Sample of raw metrics
      aggregated,
      total: filteredMetrics.length
    })

  } catch (error) {
    console.error('Metrics retrieval error:', error)
    
    return NextResponse.json(
      { error: 'Failed to retrieve metrics' },
      { status: 500 }
    )
  }
}

/**
 * Process critical business alerts
 */
async function processCriticalAlerts(metrics: BusinessMetric[]): Promise<void> {
  for (const metric of metrics) {
    // High error rate alert
    if (metric.name === 'error_count' && metric.tags?.severity === 'critical') {
      console.warn('🚨 CRITICAL ERROR DETECTED:', {
        type: metric.tags.type,
        code: metric.tags.code,
        endpoint: metric.tags.endpoint
      })
      
      // In production, send to alerting system (Slack, PagerDuty, etc.)
      if (isProduction) {
        await sendCriticalAlert('critical_error', {
          error_type: metric.tags.type,
          error_code: metric.tags.code,
          endpoint: metric.tags.endpoint,
          timestamp: metric.timestamp
        })
      }
    }

    // API performance degradation
    if (metric.name === 'api_response_time' && metric.value > 10000) {
      console.warn('⚠️ API PERFORMANCE DEGRADED:', {
        endpoint: metric.tags?.endpoint,
        response_time: metric.value,
        status: metric.tags?.status_code
      })
    }

    // Zero search results (potential issue)
    if (metric.name === 'search_result_count' && metric.value === 0) {
      console.warn('⚠️ SEARCH RETURNING NO RESULTS:', {
        origin: metric.tags?.origin,
        destination: metric.tags?.destination,
        theme: metric.tags?.theme
      })
    }

    // Revenue tracking
    if (metric.name === 'booking_revenue') {
      console.log('💰 REVENUE EVENT:', {
        value: metric.value,
        currency: metric.unit,
        source: metric.tags?.source,
        route: `${metric.tags?.origin} → ${metric.tags?.destination}`
      })
    }
  }
}

/**
 * Send critical alert to external systems
 */
async function sendCriticalAlert(alertType: string, data: any): Promise<void> {
  // Implement integration with alerting systems (Slack, PagerDuty, etc.)
  // This is a placeholder for production alerting
  
  try {
    const alertPayload = {
      alert_type: alertType,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      data
    }

    // Example: Send to Slack webhook
    if (process.env.SLACK_WEBHOOK_URL) {
      await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `🚨 Critical Alert: ${alertType}`,
          attachments: [{
            color: 'danger',
            fields: Object.entries(data).map(([key, value]) => ({
              title: key,
              value: String(value),
              short: true
            }))
          }]
        })
      })
    }

    console.log('📢 Critical alert sent:', alertPayload)
    
  } catch (error) {
    console.error('Failed to send critical alert:', error)
    captureException(error, {
      tags: { component: 'critical_alerts' },
      extra: { alert_type: alertType, data }
    })
  }
}

/**
 * Aggregate metrics for dashboard display
 */
function aggregateMetrics(metrics: BusinessMetric[]): Record<string, any> {
  const aggregated: Record<string, any> = {}
  
  // Group by metric name
  const grouped = metrics.reduce((acc, metric) => {
    if (!acc[metric.name]) {
      acc[metric.name] = []
    }
    acc[metric.name].push(metric)
    return acc
  }, {} as Record<string, BusinessMetric[]>)

  // Calculate aggregations
  for (const [name, metricList] of Object.entries(grouped)) {
    const values = metricList.map(m => m.value)
    
    aggregated[name] = {
      count: values.length,
      sum: values.reduce((a, b) => a + b, 0),
      avg: values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0,
      min: Math.min(...values),
      max: Math.max(...values),
      latest: metricList.sort((a, b) => 
        (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0)
      )[0]
    }
  }

  return aggregated
}