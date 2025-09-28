/**
 * OpenTelemetry Distributed Tracing Implementation
 * Provides comprehensive observability across the Spontra platform
 */

import { trace, context, SpanStatusCode, SpanKind } from '@opentelemetry/api'
import { NodeSDK } from '@opentelemetry/sdk-node'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import { Resource } from '@opentelemetry/resources'
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions'
import { JaegerExporter } from '@opentelemetry/exporter-jaeger'
import { ConsoleSpanExporter, BatchSpanProcessor } from '@opentelemetry/sdk-trace-node'
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics'
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus'

// Environment configuration
const isProduction = process.env.NODE_ENV === 'production'
const serviceName = process.env.OTEL_SERVICE_NAME || 'spontra-frontend'
const serviceVersion = process.env.OTEL_SERVICE_VERSION || '1.0.0'
const jaegerEndpoint = process.env.JAEGER_ENDPOINT || 'http://localhost:14268/api/traces'
const environment = process.env.ENVIRONMENT || 'development'

// Custom span attributes
export interface SpanAttributes {
  userId?: string
  sessionId?: string
  requestId?: string
  userAgent?: string
  ipAddress?: string
  route?: string
  method?: string
  statusCode?: number
  provider?: string
  offerId?: string
  destination?: string
  amount?: number
  currency?: string
  [key: string]: string | number | boolean | undefined
}

// Initialize OpenTelemetry SDK
let sdkInitialized = false

export function initializeTelemetry(): NodeSDK | null {
  if (sdkInitialized || typeof window !== 'undefined') {
    return null // Don't initialize in browser or if already initialized
  }

  try {
    const sdk = new NodeSDK({
      resource: new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
        [SemanticResourceAttributes.SERVICE_VERSION]: serviceVersion,
        [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: environment,
        [SemanticResourceAttributes.SERVICE_NAMESPACE]: 'spontra',
        'service.instance.id': `${serviceName}-${process.pid}`,
        'service.component': 'frontend-api'
      }),

      // Auto-instrumentation for common libraries
      instrumentations: [
        getNodeAutoInstrumentations({
          // Disable noisy instrumentations in development
          '@opentelemetry/instrumentation-dns': { enabled: isProduction },
          '@opentelemetry/instrumentation-fs': { enabled: false },
          '@opentelemetry/instrumentation-net': { enabled: isProduction },
          // Enable important instrumentations
          '@opentelemetry/instrumentation-http': { enabled: true },
          '@opentelemetry/instrumentation-express': { enabled: true },
          '@opentelemetry/instrumentation-prisma': { enabled: true },
          '@opentelemetry/instrumentation-pg': { enabled: true },
          '@opentelemetry/instrumentation-redis': { enabled: true }
        })
      ],

      // Configure span exporters
      spanProcessor: new BatchSpanProcessor(
        isProduction
          ? new JaegerExporter({
              endpoint: jaegerEndpoint,
              headers: {
                'Authorization': process.env.JAEGER_AUTH_TOKEN || ''
              }
            })
          : new ConsoleSpanExporter()
      ),

      // Configure metrics
      metricReader: new PeriodicExportingMetricReader({
        exporter: new PrometheusExporter({
          port: parseInt(process.env.PROMETHEUS_PORT || '9090'),
          endpoint: '/metrics'
        }),
        exportIntervalMillis: 30000 // Export every 30 seconds
      }),

      // Additional configuration
      autoDetectResources: true
    })

    sdk.start()
    sdkInitialized = true

    console.log('🔍 OpenTelemetry initialized successfully')
    return sdk

  } catch (error) {
    console.error('❌ Failed to initialize OpenTelemetry:', error)
    return null
  }
}

// Tracer instance
const tracer = trace.getTracer(serviceName, serviceVersion)

/**
 * Create a new span with automatic error handling and attribute setting
 */
export function createSpan(
  name: string, 
  attributes: SpanAttributes = {}, 
  options: { kind?: SpanKind; parent?: any } = {}
) {
  const span = tracer.startSpan(name, {
    kind: options.kind || SpanKind.INTERNAL,
    attributes: cleanAttributes(attributes)
  }, options.parent || context.active())

  return span
}

/**
 * Execute a function within a span context
 */
export async function withSpan<T>(
  name: string,
  fn: (span: any) => Promise<T> | T,
  attributes: SpanAttributes = {},
  options: { kind?: SpanKind } = {}
): Promise<T> {
  const span = createSpan(name, attributes, options)
  
  try {
    const result = await context.with(trace.setSpan(context.active(), span), () => fn(span))
    
    span.setStatus({ code: SpanStatusCode.OK })
    return result
    
  } catch (error) {
    span.recordException(error as Error)
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error instanceof Error ? error.message : 'Unknown error'
    })
    throw error
    
  } finally {
    span.end()
  }
}

/**
 * Track a search operation
 */
export async function trackSearchOperation<T>(
  operationType: 'session_create' | 'flight_search' | 'airport_search',
  fn: (span: any) => Promise<T> | T,
  searchParams: {
    sessionId?: string
    origin?: string
    destination?: string
    passengers?: number
    provider?: string
    query?: string
  } = {}
): Promise<T> {
  return withSpan(
    `search.${operationType}`,
    fn,
    {
      'search.type': operationType,
      'search.session_id': searchParams.sessionId,
      'search.origin': searchParams.origin,
      'search.destination': searchParams.destination,
      'search.passengers': searchParams.passengers,
      'search.provider': searchParams.provider,
      'search.query': searchParams.query
    },
    { kind: SpanKind.SERVER }
  )
}

/**
 * Track analytics operations
 */
export async function trackAnalyticsOperation<T>(
  operationType: 'click' | 'conversion' | 'metrics',
  fn: (span: any) => Promise<T> | T,
  analyticsParams: {
    clickId?: string
    offerId?: string
    provider?: string
    amount?: number
    currency?: string
    destination?: string
    userId?: string
  } = {}
): Promise<T> {
  return withSpan(
    `analytics.${operationType}`,
    fn,
    {
      'analytics.type': operationType,
      'analytics.click_id': analyticsParams.clickId,
      'analytics.offer_id': analyticsParams.offerId,
      'analytics.provider': analyticsParams.provider,
      'analytics.amount': analyticsParams.amount,
      'analytics.currency': analyticsParams.currency,
      'analytics.destination': analyticsParams.destination,
      'analytics.user_id': analyticsParams.userId
    },
    { kind: SpanKind.SERVER }
  )
}

/**
 * Track external API calls
 */
export async function trackExternalAPI<T>(
  provider: string,
  operation: string,
  fn: (span: any) => Promise<T> | T,
  apiParams: {
    endpoint?: string
    method?: string
    requestSize?: number
    responseSize?: number
  } = {}
): Promise<T> {
  return withSpan(
    `external.${provider}.${operation}`,
    fn,
    {
      'external.provider': provider,
      'external.operation': operation,
      'external.endpoint': apiParams.endpoint,
      'external.method': apiParams.method,
      'external.request_size': apiParams.requestSize,
      'external.response_size': apiParams.responseSize
    },
    { kind: SpanKind.CLIENT }
  )
}

/**
 * Track database operations
 */
export async function trackDatabaseOperation<T>(
  operation: string,
  table: string,
  fn: (span: any) => Promise<T> | T,
  dbParams: {
    query?: string
    rowCount?: number
    duration?: number
  } = {}
): Promise<T> {
  return withSpan(
    `db.${operation}`,
    fn,
    {
      'db.operation': operation,
      'db.table': table,
      'db.query': dbParams.query,
      'db.row_count': dbParams.rowCount,
      'db.duration': dbParams.duration
    },
    { kind: SpanKind.CLIENT }
  )
}

/**
 * Track admin operations
 */
export async function trackAdminOperation<T>(
  operation: string,
  fn: (span: any) => Promise<T> | T,
  adminParams: {
    adminId?: string
    adminEmail?: string
    resource?: string
    action?: string
    ipAddress?: string
  } = {}
): Promise<T> {
  return withSpan(
    `admin.${operation}`,
    fn,
    {
      'admin.operation': operation,
      'admin.user_id': adminParams.adminId,
      'admin.user_email': adminParams.adminEmail,
      'admin.resource': adminParams.resource,
      'admin.action': adminParams.action,
      'admin.ip_address': adminParams.ipAddress
    },
    { kind: SpanKind.SERVER }
  )
}

/**
 * Add correlation IDs to span
 */
export function addCorrelationIds(span: any, ids: {
  requestId?: string
  sessionId?: string
  userId?: string
  traceId?: string
}) {
  Object.entries(ids).forEach(([key, value]) => {
    if (value) {
      span.setAttribute(`correlation.${key}`, value)
    }
  })
}

/**
 * Get current trace context for logging
 */
export function getTraceContext(): {
  traceId?: string
  spanId?: string
  traceFlags?: number
} {
  const span = trace.getActiveSpan()
  if (!span) return {}

  const spanContext = span.spanContext()
  return {
    traceId: spanContext.traceId,
    spanId: spanContext.spanId,
    traceFlags: spanContext.traceFlags
  }
}

/**
 * Create a baggage context for cross-service correlation
 */
export function createBaggage(items: Record<string, string>) {
  const { propagation } = require('@opentelemetry/api')
  
  let currentContext = context.active()
  
  Object.entries(items).forEach(([key, value]) => {
    currentContext = propagation.setBaggage(currentContext, 
      propagation.getBaggage(currentContext) || propagation.createBaggage()
    )
  })
  
  return currentContext
}

/**
 * Middleware for Next.js API routes to automatically instrument requests
 */
export function telemetryMiddleware(handler: any) {
  return async (req: any, res: any) => {
    const operationName = `${req.method} ${req.url?.split('?')[0] || 'unknown'}`
    
    return withSpan(
      operationName,
      async (span) => {
        // Add request attributes
        span.setAttributes({
          'http.method': req.method,
          'http.url': req.url,
          'http.route': req.url?.split('?')[0],
          'http.user_agent': req.headers['user-agent'],
          'http.remote_addr': req.headers['x-forwarded-for'] || req.connection?.remoteAddress,
          'http.request_size': req.headers['content-length'] ? parseInt(req.headers['content-length']) : undefined
        })

        // Add correlation IDs
        addCorrelationIds(span, {
          requestId: req.headers['x-request-id'],
          sessionId: req.headers['x-session-id'] || req.cookies?.session_id,
          userId: req.headers['x-user-id']
        })

        try {
          const result = await handler(req, res)
          
          // Add response attributes
          span.setAttributes({
            'http.status_code': res.statusCode,
            'http.response_size': res.get?.('content-length') ? parseInt(res.get('content-length')) : undefined
          })
          
          return result
          
        } catch (error) {
          span.setAttributes({
            'http.status_code': 500
          })
          throw error
        }
      },
      {},
      { kind: SpanKind.SERVER }
    )
  }
}

/**
 * Clean and validate span attributes
 */
function cleanAttributes(attributes: SpanAttributes): Record<string, string | number | boolean> {
  const cleaned: Record<string, string | number | boolean> = {}
  
  Object.entries(attributes).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      // Convert to valid OpenTelemetry attribute types
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        cleaned[key] = value
      } else {
        cleaned[key] = String(value)
      }
    }
  })
  
  return cleaned
}

/**
 * Performance metrics collection
 */
export const metrics = {
  // Record custom metrics
  recordCounter(name: string, value: number = 1, attributes: Record<string, string> = {}) {
    const meter = require('@opentelemetry/api').metrics.getMeter(serviceName, serviceVersion)
    const counter = meter.createCounter(name)
    counter.add(value, attributes)
  },

  recordHistogram(name: string, value: number, attributes: Record<string, string> = {}) {
    const meter = require('@opentelemetry/api').metrics.getMeter(serviceName, serviceVersion)
    const histogram = meter.createHistogram(name)
    histogram.record(value, attributes)
  },

  recordGauge(name: string, value: number, attributes: Record<string, string> = {}) {
    const meter = require('@opentelemetry/api').metrics.getMeter(serviceName, serviceVersion)
    const gauge = meter.createUpDownCounter(name)
    gauge.add(value, attributes)
  }
}

// Initialize telemetry if in Node.js environment
if (typeof window === 'undefined' && process.env.ENABLE_TELEMETRY !== 'false') {
  initializeTelemetry()
}

export default {
  initializeTelemetry,
  createSpan,
  withSpan,
  trackSearchOperation,
  trackAnalyticsOperation,
  trackExternalAPI,
  trackDatabaseOperation,
  trackAdminOperation,
  addCorrelationIds,
  getTraceContext,
  createBaggage,
  telemetryMiddleware,
  metrics
}