import { NextRequest, NextResponse } from 'next/server'
import { validateApiRequest, clickEventApiSchema } from '@/lib/validations'
import { ClickEvent } from '@/services/affiliateService'
import { cacheGet, cacheSet } from '@/lib/cacheServer'
import { trackAnalyticsOperation, addCorrelationIds, getTraceContext, metrics, safeSetAttributes, type Span } from '@/lib/telemetry'
import { sentryHelpers } from '@/lib/sentry'

export const runtime = 'nodejs'

const STORE_KEY = 'analytics:clicks'
const MAX_EVENTS = 10000

async function readEvents(): Promise<ClickEvent[]> {
  try {
    const raw = await cacheGet(STORE_KEY)
    return raw ? (JSON.parse(raw) as ClickEvent[]) : []
  } catch {
    return []
  }
}

async function writeEvents(events: ClickEvent[]): Promise<void> {
  const trimmed = events.slice(-MAX_EVENTS)
  await cacheSet(STORE_KEY, JSON.stringify(trimmed), { ttlSeconds: 604800 }).catch(() => {})
}

export async function POST(req: NextRequest) {
  return trackAnalyticsOperation(
    'click',
    async (span: Span) => {
      try {
        const body = await req.json()
        const validation = validateApiRequest(clickEventApiSchema, body)
        
        if (!validation.success) {
          safeSetAttributes(span, {
            'error.type': 'validation',
            'error.validation_issues': validation.errors?.length || 0
          })
          
          metrics.recordCounter('clicks.validation_errors', 1, {
            endpoint: 'POST /api/analytics/click'
          })
          
          return NextResponse.json({ 
            success: false, 
            error: 'Invalid click event data', 
            details: validation.errors 
          }, { status: 400 })
        }

        const clickEvent = validation.data

        // Add analytics parameters to span
        safeSetAttributes(span, {
          'analytics.click_id': clickEvent.id,
          'analytics.partner_id': clickEvent.partnerId,
          'analytics.flight_id': clickEvent.flightId,
          'analytics.booking_value': clickEvent.bookingValue,
          'analytics.device_type': clickEvent.deviceType
        })

        // Generate correlation IDs
        const requestId = req.headers.get('x-request-id') || crypto.randomUUID()
        addCorrelationIds(span, { requestId })

        // Add request metadata to span
        const userAgent = req.headers.get('user-agent')
        const ipAddress = req.headers.get('x-forwarded-for') ||
                         req.headers.get('x-real-ip') ||
                         'unknown'

        safeSetAttributes(span, {
          'http.user_agent': userAgent,
          'http.client_ip': ipAddress
        })

        console.log('Click tracking event received:', {
          clickId: clickEvent.id,
          partnerId: clickEvent.partnerId,
          flightId: clickEvent.flightId,
          bookingValue: clickEvent.bookingValue,
          timestamp: clickEvent.timestamp,
          traceId: getTraceContext().traceId
        })

        const completeClickEvent: ClickEvent = {
          ...clickEvent,
          timestamp: clickEvent.timestamp || new Date().toISOString()
        }

        // Track cache operations with telemetry
        const current = await sentryHelpers.monitorDatabaseOperation(
          'read',
          'click_events_cache',
          () => readEvents()
        )
        
        current.push(completeClickEvent)
        
        await sentryHelpers.monitorDatabaseOperation(
          'write',
          'click_events_cache',
          () => writeEvents(current)
        )

        // Record custom metrics
        metrics.recordCounter('clicks.total', 1, {
          partner: clickEvent.partnerId,
          device_type: clickEvent.deviceType
        })

        metrics.recordHistogram('clicks.booking_value', clickEvent.bookingValue, {
          partner: clickEvent.partnerId,
          currency: 'USD' // Assuming USD, could be made dynamic
        })

        // Track partner-specific metrics
        metrics.recordCounter(`clicks.by_partner.${clickEvent.partnerId}`, 1)

        // Add success attributes to span
        safeSetAttributes(span, {
          'analytics.click_recorded': true,
          'analytics.cache_updated': true
        })

        // Add trace context to response
        const traceContext = getTraceContext()
        const response = NextResponse.json({ 
          success: true, 
          clickId: clickEvent.id, 
          message: 'Click event tracked successfully',
          timestamp: completeClickEvent.timestamp
        })

        // Add trace headers
        if (traceContext.traceId) {
          response.headers.set('x-trace-id', traceContext.traceId)
        }
        if (traceContext.spanId) {
          response.headers.set('x-span-id', traceContext.spanId)
        }

        return response

      } catch (error) {
        // Error handling with telemetry
        span.recordException(error as Error)
        
        // Log error with trace context
        const traceContext = getTraceContext()
        sentryHelpers.captureError(error as Error, 'error', {
          trace: traceContext,
          endpoint: 'POST /api/analytics/click'
        })

        safeSetAttributes(span, {
          'error.type': 'internal',
          'error.message': (error as Error).message
        })

        // Record general error metric
        metrics.recordCounter('clicks.errors', 1, {
          error_type: 'internal'
        })

        console.error('Click tracking error:', error, 'traceId:', traceContext.traceId)
        
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to track click event',
          requestId: req.headers.get('x-request-id')
        }, { status: 500 })
      }
    },
    {
      // Initial analytics parameters (will be updated from validated data)
      provider: undefined,
      amount: undefined
    }
  )
}

export async function GET(req: NextRequest) {
  return trackAnalyticsOperation(
    'metrics',
    async (span: Span) => {
      try {
        const url = new URL(req.url)
        const partnerId = url.searchParams.get('partner')
        const timeframe = url.searchParams.get('timeframe') || '24h'

        // Add query parameters to span
        safeSetAttributes(span, {
          'analytics.query.partner_id': partnerId,
          'analytics.query.timeframe': timeframe
        })

        // Generate correlation IDs
        const requestId = req.headers.get('x-request-id') || crypto.randomUUID()
        addCorrelationIds(span, { requestId })

        const now = new Date()
        const timeWindow = getTimeWindow(timeframe)
        const since = new Date(now.getTime() - timeWindow)

        // Track cache read operation with telemetry
        const allEvents = await sentryHelpers.monitorDatabaseOperation(
          'read',
          'click_events_cache',
          () => readEvents()
        )

        let filteredEvents = allEvents.filter(e => new Date(e.timestamp) >= since)
        if (partnerId) {
          filteredEvents = filteredEvents.filter(e => e.partnerId === partnerId)
        }

        // Add metrics to span
        safeSetAttributes(span, {
          'analytics.events.total': allEvents.length,
          'analytics.events.filtered': filteredEvents.length,
          'analytics.time_window_ms': timeWindow
        })

        const calculatedMetrics = calculateMetrics(filteredEvents)

        // Add calculated metrics to span
        safeSetAttributes(span, {
          'analytics.metrics.total_clicks': calculatedMetrics.totalClicks,
          'analytics.metrics.total_value': calculatedMetrics.totalValue,
          'analytics.metrics.average_value': calculatedMetrics.averageValue,
          'analytics.metrics.top_partner': calculatedMetrics.topPartner
        })

        // Record query performance metric
        metrics.recordHistogram('analytics.query_duration', 100, { // Placeholder duration
          timeframe,
          partner: partnerId || 'all'
        })

        // Record query counter
        metrics.recordCounter('analytics.queries', 1, {
          timeframe,
          partner: partnerId || 'all'
        })

        // Add trace context to response
        const traceContext = getTraceContext()
        const response = NextResponse.json({ 
          success: true, 
          timeframe, 
          partnerId, 
          metrics: calculatedMetrics, 
          eventCount: filteredEvents.length,
          generatedAt: new Date().toISOString()
        })

        // Add trace headers
        if (traceContext.traceId) {
          response.headers.set('x-trace-id', traceContext.traceId)
        }
        if (traceContext.spanId) {
          response.headers.set('x-span-id', traceContext.spanId)
        }

        return response

      } catch (error) {
        // Error handling with telemetry
        span.recordException(error as Error)
        
        // Log error with trace context
        const traceContext = getTraceContext()
        sentryHelpers.captureError(error as Error, 'error', {
          trace: traceContext,
          endpoint: 'GET /api/analytics/click'
        })

        safeSetAttributes(span, {
          'error.type': 'internal',
          'error.message': (error as Error).message
        })

        // Record error metric
        metrics.recordCounter('analytics.query_errors', 1, {
          error_type: 'internal'
        })

        console.error('Analytics fetch error:', error, 'traceId:', traceContext.traceId)
        
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to fetch analytics',
          requestId: req.headers.get('x-request-id')
        }, { status: 500 })
      }
    }
  )
}

function getTimeWindow(timeframe: string): number {
  const windows: Record<string, number> = {
    '1h': 3600000,
    '24h': 86400000,
    '7d': 604800000,
    '30d': 2592000000
  }
  return windows[timeframe] || windows['24h']
}

function calculateMetrics(events: ClickEvent[]) {
  const totalClicks = events.length
  const totalValue = events.reduce((sum, e) => sum + e.bookingValue, 0)
  const averageValue = totalClicks > 0 ? totalValue / totalClicks : 0

  const partnerStats = events.reduce((acc, e) => {
    if (!acc[e.partnerId]) acc[e.partnerId] = { clicks: 0, totalValue: 0, averageValue: 0 }
    acc[e.partnerId].clicks += 1
    acc[e.partnerId].totalValue += e.bookingValue
    return acc
  }, {} as Record<string, { clicks: number; totalValue: number; averageValue: number }>)

  Object.keys(partnerStats).forEach(p => {
    partnerStats[p].averageValue = partnerStats[p].totalValue / partnerStats[p].clicks
  })

  const deviceStats = events.reduce((acc, e) => {
    acc[e.deviceType] = (acc[e.deviceType] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const topPartner = Object.keys(partnerStats).sort((a, b) => partnerStats[b].clicks - partnerStats[a].clicks)[0]

  return {
    totalClicks,
    totalValue: Math.round(totalValue * 100) / 100,
    averageValue: Math.round(averageValue * 100) / 100,
    partnerStats,
    deviceStats,
    topPartner
  }
}

