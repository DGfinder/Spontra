import { trace, context, SpanStatusCode } from '@opentelemetry/api'
import { cacheSet, cacheGet } from './cacheServer'

interface ServerActionMetrics {
  name: string
  duration: number
  success: boolean
  errorMessage?: string
  userAgent?: string
  route?: string
  userId?: string
  cacheHit?: boolean
  dbQueryCount?: number
  timestamp: number
}

interface ActionAggregates {
  actions: Record<string, {
    count: number
    successRate: number
    p50: number
    p75: number
    p95: number
    errorRate: number
    lastError?: string
    durations: number[]
  }>
  lastUpdated: number
}

class ServerActionsTelemetry {
  private tracer = trace.getTracer('spontra-server-actions')
  
  async wrapAction<T extends any[], R>(
    actionName: string,
    action: (...args: T) => Promise<R>,
    metadata?: {
      userId?: string
      route?: string
      userAgent?: string
    }
  ): Promise<R> {
    const startTime = Date.now()
    const span = this.tracer.startSpan(`action.${actionName}`)
    
    // Add metadata to span
    span.setAttributes({
      'action.name': actionName,
      'action.start_time': startTime,
      ...(metadata?.userId && { 'action.user_id': metadata.userId }),
      ...(metadata?.route && { 'action.route': metadata.route }),
      ...(metadata?.userAgent && { 'action.user_agent': metadata.userAgent }),
    })

    try {
      // Execute the action within the span context
      const result = await context.with(trace.setSpan(context.active(), span), () => action())
      
      const duration = Date.now() - startTime
      
      // Mark span as successful
      span.setStatus({ code: SpanStatusCode.OK })
      span.setAttributes({
        'action.duration_ms': duration,
        'action.success': true,
      })
      
      // Record metrics
      await this.recordMetrics({
        name: actionName,
        duration,
        success: true,
        timestamp: startTime,
        ...metadata
      })
      
      return result
      
    } catch (error) {
      const duration = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : String(error)
      
      // Mark span as failed
      span.setStatus({ 
        code: SpanStatusCode.ERROR, 
        message: errorMessage 
      })
      span.setAttributes({
        'action.duration_ms': duration,
        'action.success': false,
        'action.error': errorMessage,
      })
      
      // Record error metrics
      await this.recordMetrics({
        name: actionName,
        duration,
        success: false,
        errorMessage,
        timestamp: startTime,
        ...metadata
      })
      
      throw error
    } finally {
      span.end()
    }
  }

  private async recordMetrics(metrics: ServerActionMetrics) {
    try {
      // Update real-time aggregates
      await this.updateAggregates(metrics)
      
      // Send to analytics endpoint for dashboard
      if (typeof fetch !== 'undefined') {
        fetch('/api/analytics/server-actions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(metrics),
        }).catch(error => {
          console.warn('Failed to send server action metrics:', error)
        })
      }
      
    } catch (error) {
      console.warn('Failed to record server action metrics:', error)
    }
  }

  private async updateAggregates(metrics: ServerActionMetrics) {
    const cacheKey = 'server-actions:aggregates'
    
    try {
      const existingRaw = await cacheGet(cacheKey).catch(() => null)
      const existing: ActionAggregates = existingRaw ? JSON.parse(existingRaw) : {
        actions: {},
        lastUpdated: Date.now()
      }
      
      // Initialize action if not exists
      if (!existing.actions[metrics.name]) {
        existing.actions[metrics.name] = {
          count: 0,
          successRate: 100,
          p50: 0,
          p75: 0,
          p95: 0,
          errorRate: 0,
          durations: []
        }
      }
      
      const action = existing.actions[metrics.name]
      
      // Update counts
      action.count++
      
      // Update durations (keep last 100 for percentile calculation)
      action.durations.push(metrics.duration)
      if (action.durations.length > 100) {
        action.durations = action.durations.slice(-100)
      }
      
      // Recalculate percentiles
      const sorted = action.durations.slice().sort((a, b) => a - b)
      action.p50 = sorted[Math.floor(sorted.length * 0.5)] || 0
      action.p75 = sorted[Math.floor(sorted.length * 0.75)] || 0
      action.p95 = sorted[Math.floor(sorted.length * 0.95)] || 0
      
      // Update success/error rates
      if (!metrics.success) {
        action.errorRate = ((action.errorRate * (action.count - 1)) + 100) / action.count
        action.lastError = metrics.errorMessage
      } else {
        action.errorRate = (action.errorRate * (action.count - 1)) / action.count
      }
      action.successRate = 100 - action.errorRate
      
      existing.lastUpdated = Date.now()
      
      // Cache updated aggregates
      await cacheSet(cacheKey, JSON.stringify(existing), { ttlSeconds: 3600 })
      
    } catch (error) {
      console.error('Failed to update server action aggregates:', error)
    }
  }

  // Manual tracking for database queries, cache hits, etc.
  public trackCacheHit(actionName: string, hit: boolean) {
    const span = trace.getActiveSpan()
    if (span) {
      span.setAttributes({
        [`${actionName}.cache_hit`]: hit,
        [`${actionName}.cache_status`]: hit ? 'hit' : 'miss'
      })
    }
  }

  public trackDatabaseQuery(actionName: string, queryCount: number) {
    const span = trace.getActiveSpan()
    if (span) {
      span.setAttributes({
        [`${actionName}.db_query_count`]: queryCount
      })
    }
  }

  public async getMetrics(): Promise<ActionAggregates | null> {
    try {
      const cacheKey = 'server-actions:aggregates'
      const dataRaw = await cacheGet(cacheKey).catch(() => null)
      return dataRaw ? JSON.parse(dataRaw) : null
    } catch (error) {
      console.error('Failed to get server action metrics:', error)
      return null
    }
  }
}

// Singleton instance
const serverActionsTelemetry = new ServerActionsTelemetry()

// Decorator function for easy usage
export function withTelemetry<T extends any[], R>(
  actionName: string,
  metadata?: {
    userId?: string
    route?: string
    userAgent?: string
  }
) {
  return function(action: (...args: T) => Promise<R>) {
    return async (...args: T): Promise<R> => {
      return serverActionsTelemetry.wrapAction(actionName, () => action(...args), metadata)
    }
  }
}

// Manual instrumentation helpers
export const telemetry = {
  wrapAction: serverActionsTelemetry.wrapAction.bind(serverActionsTelemetry),
  trackCacheHit: serverActionsTelemetry.trackCacheHit.bind(serverActionsTelemetry),
  trackDatabaseQuery: serverActionsTelemetry.trackDatabaseQuery.bind(serverActionsTelemetry),
  getMetrics: serverActionsTelemetry.getMetrics.bind(serverActionsTelemetry),
}

// Helper to extract request metadata from headers
export function extractRequestMetadata(headers: Headers) {
  return {
    userAgent: headers.get('user-agent') || undefined,
    route: headers.get('x-pathname') || undefined,
    userId: headers.get('x-user-id') || undefined,
  }
}

export default serverActionsTelemetry