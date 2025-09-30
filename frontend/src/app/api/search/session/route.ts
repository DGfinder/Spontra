import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { z } from 'zod'
import { trackSearchOperation, addCorrelationIds, getTraceContext, safeSetAttributes, type Span } from '@/lib/telemetry'
import { sentryHelpers } from '@/lib/sentry'

export const runtime = 'nodejs'

const searchSessionSchema = z.object({
  origin: z.string().min(3).max(3).regex(/^[A-Z]{3}$/),
  destination: z.string().min(3).max(3).regex(/^[A-Z]{3}$/),
  departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  returnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  passengers: z.number().min(1).max(9),
  preferences: z.object({
    activities: z.array(z.string()).optional(),
    budgetLevel: z.enum(['budget', 'mid_range', 'luxury', 'any']).optional(),
    maxFlightDuration: z.number().min(1).max(24).optional()
  }).optional()
})

export async function POST(request: NextRequest) {
  return trackSearchOperation(
    'session_create',
    async (span: Span) => {
      try {
        // Parse and validate request body
        const body = await request.json()
        const validatedData = searchSessionSchema.parse(body)

        // Add search parameters to span
        safeSetAttributes(span, {
          'search.origin': validatedData.origin,
          'search.destination': validatedData.destination,
          'search.departure_date': validatedData.departureDate,
          'search.return_date': validatedData.returnDate,
          'search.passengers': validatedData.passengers,
          'search.budget_level': validatedData.preferences?.budgetLevel,
          'search.max_duration': validatedData.preferences?.maxFlightDuration
        })

        // Generate correlation IDs
        const requestId = request.headers.get('x-request-id') || crypto.randomUUID()
        const sessionId = crypto.randomUUID()
        
        addCorrelationIds(span, {
          requestId,
          sessionId
        })

        // Create session in database with telemetry
        const session = await sentryHelpers.monitorDatabaseOperation(
          'create',
          'search_sessions',
          async () => {
            return prisma.searchSession.create({
              data: {
                id: sessionId,
                origin_airport: validatedData.origin,
                destination_airport: validatedData.destination,
                departure_date: new Date(validatedData.departureDate),
                return_date: validatedData.returnDate ? new Date(validatedData.returnDate) : null,
                passengers: validatedData.passengers,
                preferences: validatedData.preferences ? JSON.stringify(validatedData.preferences) : null,
                status: 'active',
                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
                created_at: new Date(),
                updated_at: new Date()
              }
            })
          }
        )

        // Add session details to span
        safeSetAttributes(span, {
          'search.session_created': true,
          'search.session_expires_at': session.expires_at?.toISOString()
        })

        // Add trace context to response headers for client-side correlation
        const traceContext = getTraceContext()
        const response = NextResponse.json({
          success: true,
          sessionId: session.id,
          expiresAt: session.expires_at?.toISOString(),
          message: 'Search session created successfully'
        })

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
        
        if (error instanceof z.ZodError) {
          safeSetAttributes(span, {
            'error.type': 'validation',
            'error.validation_issues': error.issues.length
          })
          
          return NextResponse.json({
            success: false,
            error: 'Validation failed',
            code: 'VALIDATION_ERROR',
            details: error.issues,
            timestamp: new Date().toISOString()
          }, { status: 400 })
        }

        // Log error with trace context
        const traceContext = getTraceContext()
        sentryHelpers.captureError(error as Error, 'error', {
          trace: traceContext,
          endpoint: 'POST /api/search/session',
          requestBody: body
        })

        safeSetAttributes(span, {
          'error.type': 'internal',
          'error.message': (error as Error).message
        })

        return NextResponse.json({
          success: false,
          error: 'Failed to create search session',
          code: 'INTERNAL_ERROR',
          timestamp: new Date().toISOString(),
          requestId: request.headers.get('x-request-id')
        }, { status: 500 })
      }
    },
    {
      sessionId: crypto.randomUUID(), // Will be replaced with actual ID
      origin: undefined, // Will be set from validated data
      destination: undefined, // Will be set from validated data
      passengers: undefined // Will be set from validated data
    }
  )
}