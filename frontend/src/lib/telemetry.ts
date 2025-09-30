import { context, propagation, trace, SpanKind, SpanStatusCode } from "@opentelemetry/api"

export interface SpanAttributes {
  [key: string]: string | number | boolean | undefined
}

const tracer = trace.getTracer("spontra-frontend")

export function initializeTelemetry(): { shutdown(): Promise<void> } | null {
  // Return a mock SDK object with shutdown method to satisfy type requirements
  // TODO: Implement proper OpenTelemetry SDK initialization when needed
  return {
    async shutdown() {
      console.log('Mock telemetry SDK shutdown called')
      return Promise.resolve()
    }
  }
}

export function createSpan(
  name: string,
  attributes: SpanAttributes = {},
  options: { kind?: SpanKind; parent?: ReturnType<typeof context.active> } = {}
) {
  return tracer.startSpan(
    name,
    {
      kind: options.kind ?? SpanKind.INTERNAL,
      attributes: sanitizeAttributes(attributes),
    },
    options.parent ?? context.active()
  )
}

export async function withSpan<T>(
  name: string,
  fn: (span: ReturnType<typeof createSpan>) => Promise<T> | T,
  attributes: SpanAttributes = {},
  options: { kind?: SpanKind } = {}
): Promise<T> {
  const span = createSpan(name, attributes, options)

  try {
    const result = await context.with(trace.setSpan(context.active(), span), () => fn(span))
    span.setStatus({ code: SpanStatusCode.OK })
    return result
  } catch (error) {
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error instanceof Error ? error.message : "Unknown error",
    })
    span.recordException(error as Error)
    throw error
  } finally {
    span.end()
  }
}

export async function trackSearchOperation<T>(
  operationType: string,
  fn: (span: ReturnType<typeof createSpan>) => Promise<T> | T,
  searchParams: SpanAttributes = {}
) {
  return withSpan(
    `search.${operationType}`,
    fn,
    {
      "search.type": operationType,
      ...prefixAttributes("search", searchParams),
    },
    { kind: SpanKind.SERVER }
  )
}

export async function trackAnalyticsOperation<T>(
  operationType: string,
  fn: (span: ReturnType<typeof createSpan>) => Promise<T> | T,
  analyticsParams: SpanAttributes = {}
) {
  return withSpan(
    `analytics.${operationType}`,
    fn,
    {
      "analytics.type": operationType,
      ...prefixAttributes("analytics", analyticsParams),
    },
    { kind: SpanKind.SERVER }
  )
}

export async function trackExternalAPI<T>(
  service: string,
  fn: (span: ReturnType<typeof createSpan>) => Promise<T> | T,
  attributes: SpanAttributes = {}
) {
  return withSpan(
    `external.${service}`,
    fn,
    {
      "external.service": service,
      ...prefixAttributes("external", attributes),
    },
    { kind: SpanKind.CLIENT }
  )
}

export async function trackDatabaseOperation<T>(
  operation: string,
  fn: (span: ReturnType<typeof createSpan>) => Promise<T> | T,
  attributes: SpanAttributes = {}
) {
  return withSpan(
    `db.${operation}`,
    fn,
    {
      "db.operation": operation,
      ...prefixAttributes("db", attributes),
    },
    { kind: SpanKind.CLIENT }
  )
}

export async function trackAdminOperation<T>(
  operation: string,
  fn: (span: ReturnType<typeof createSpan>) => Promise<T> | T,
  adminParams: SpanAttributes = {}
) {
  return withSpan(
    `admin.${operation}`,
    fn,
    {
      "admin.operation": operation,
      ...prefixAttributes("admin", adminParams),
    },
    { kind: SpanKind.SERVER }
  )
}

export function addCorrelationIds(
  span: ReturnType<typeof createSpan>,
  ids: Record<string, string | undefined>
) {
  Object.entries(ids).forEach(([key, value]) => {
    if (value) {
      span.setAttribute(`correlation.${key}`, value)
    }
  })
}

export function getTraceContext() {
  const activeSpan = trace.getActiveSpan()
  if (!activeSpan) return {}

  const { traceId, spanId, traceFlags } = activeSpan.spanContext()
  return { traceId, spanId, traceFlags }
}

export function createBaggage(items: Record<string, string>) {
  let current = context.active()
  let baggage = propagation.getBaggage(current) ?? propagation.createBaggage()

  Object.entries(items).forEach(([key, value]) => {
    baggage = baggage.setEntry(key, { value })
  })

  return propagation.setBaggage(current, baggage)
}

export function telemetryMiddleware(handler: any) {
  return async (req: any, res: any) => {
    const route = req.url?.split("?")[0] ?? "unknown"
    return withSpan(
      `${req.method} ${route}`,
      async span => {
        safeSetAttributes(span, {
          "http.method": req.method,
          "http.url": req.url,
          "http.route": route,
          "http.user_agent": req.headers?.["user-agent"],
        })

        addCorrelationIds(span, {
          requestId: req.headers?.["x-request-id"],
          sessionId: req.headers?.["x-session-id"] ?? req.cookies?.session_id,
          userId: req.headers?.["x-user-id"],
        })

        try {
          const result = await handler(req, res)
          span.setAttribute("http.status_code", res?.statusCode ?? 200)
          return result
        } catch (error) {
          span.setAttribute("http.status_code", 500)
          throw error
        }
      },
      {},
      { kind: SpanKind.SERVER }
    )
  }
}

export const metrics = {
  recordCounter(_name: string, _value = 1, _attributes: Record<string, string> = {}) {
    // no-op placeholder
  },
  recordHistogram(_name: string, _value: number, _attributes: Record<string, string> = {}) {
    // no-op placeholder
  },
  recordGauge(_name: string, _value: number, _attributes: Record<string, string> = {}) {
    // no-op placeholder
  },
}

export function sanitizeAttributes(attributes: SpanAttributes) {
  const result: Record<string, string | number | boolean> = {}
  Object.entries(attributes).forEach(([key, value]) => {
    if (value === undefined || value === null) return
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      result[key] = value
    } else {
      result[key] = String(value)
    }
  })
  return result
}

function prefixAttributes(prefix: string, attributes: SpanAttributes) {
  const result: SpanAttributes = {}
  Object.entries(attributes).forEach(([key, value]) => {
    if (value !== undefined) {
      result[`${prefix}.${key}`] = value
    }
  })
  return result
}

/**
 * Safe wrapper for span.setAttributes() that filters out null/undefined values
 * Use this instead of calling span.setAttributes() directly to avoid TypeScript errors
 */
export function safeSetAttributes(
  span: ReturnType<typeof createSpan>,
  attributes: Record<string, string | number | boolean | null | undefined>
) {
  const sanitized = sanitizeAttributes(attributes)
  if (Object.keys(sanitized).length > 0) {
    span.setAttributes(sanitized)
  }
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
  metrics,
}
