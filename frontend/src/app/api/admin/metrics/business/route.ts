import { NextRequest, NextResponse } from 'next/server'
import { businessMetricsService } from '@/lib/businessMetrics'
import { trackAnalyticsOperation, addCorrelationIds, getTraceContext, safeSetAttributes, type Span } from '@/lib/telemetry'
import { sentryHelpers } from '@/lib/sentry'
import { z } from 'zod'

export const runtime = 'nodejs'

const metricsQuerySchema = z.object({
  period: z.enum(['1h', '24h', '7d', '30d']).default('24h'),
  provider: z.string().optional(),
  route: z.string().optional(),
  country: z.string().optional(),
  metrics: z.array(z.enum([
    'conversion',
    'provider',
    'route', 
    'revenue',
    'performance'
  ])).default(['conversion', 'provider', 'route', 'revenue'])
})

export async function GET(request: NextRequest): Promise<Response> {
  return trackAnalyticsOperation(
    'business_metrics',
    async (span: Span) => {
      try {
        // Validate query parameters
        const { searchParams } = new URL(request.url)
        const queryData = {
          period: searchParams.get('period') || '24h',
          provider: searchParams.get('provider') || undefined,
          route: searchParams.get('route') || undefined,
          country: searchParams.get('country') || undefined,
          metrics: searchParams.get('metrics')?.split(',') || ['conversion', 'provider', 'route', 'revenue']
        }

        const validatedQuery = metricsQuerySchema.parse(queryData)

        // Add query parameters to span
        safeSetAttributes(span, {
          'analytics.business.period': validatedQuery.period,
          'analytics.business.provider': validatedQuery.provider,
          'analytics.business.route': validatedQuery.route,
          'analytics.business.country': validatedQuery.country,
          'analytics.business.metrics_requested': validatedQuery.metrics.join(',')
        })

        // Generate correlation IDs
        const requestId = request.headers.get('x-request-id') || crypto.randomUUID()
        addCorrelationIds(span, { requestId })

        // Check admin authentication
        const adminUserId = request.headers.get('x-admin-user-id')
        const adminRole = request.headers.get('x-admin-user-role')
        
        if (!adminUserId || !['admin', 'moderator'].includes(adminRole || '')) {
          safeSetAttributes(span, {
            'error.type': 'authentication',
            'auth.admin_user_id': adminUserId,
            'auth.admin_role': adminRole
          })

          return NextResponse.json({
            success: false,
            error: 'Admin authentication required',
            code: 'AUTHENTICATION_REQUIRED'
          }, { status: 401 })
        }

        safeSetAttributes(span, {
          'auth.admin_user_id': adminUserId,
          'auth.admin_role': adminRole
        })

        // Prepare response object
        const response: any = {
          success: true,
          period: validatedQuery.period,
          filters: {
            provider: validatedQuery.provider,
            route: validatedQuery.route,
            country: validatedQuery.country
          },
          generatedAt: new Date().toISOString()
        }

        // Fetch requested metrics in parallel for better performance
        const metricPromises: Promise<any>[] = []

        if (validatedQuery.metrics.includes('conversion')) {
          metricPromises.push(
            businessMetricsService.getConversionMetrics(
              validatedQuery.period,
              {
                provider: validatedQuery.provider,
                route: validatedQuery.route,
                country: validatedQuery.country
              }
            ).then(data => ({ conversion: data }))
          )
        }

        if (validatedQuery.metrics.includes('provider')) {
          metricPromises.push(
            businessMetricsService.getProviderMetrics(validatedQuery.period)
              .then(data => ({ provider: data }))
          )
        }

        if (validatedQuery.metrics.includes('route')) {
          metricPromises.push(
            businessMetricsService.getRouteMetrics(validatedQuery.period, 20)
              .then(data => ({ route: data }))
          )
        }

        if (validatedQuery.metrics.includes('revenue')) {
          metricPromises.push(
            businessMetricsService.getRevenueBreakdown(validatedQuery.period)
              .then(data => ({ revenue: data }))
          )
        }

        if (validatedQuery.metrics.includes('performance')) {
          metricPromises.push(
            businessMetricsService.getPerformanceMetrics(validatedQuery.period)
              .then(data => ({ performance: data }))
          )
        }

        // Wait for all metrics to complete
        const startTime = Date.now()
        const metricResults = await Promise.all(metricPromises)
        const queryDuration = Date.now() - startTime

        // Merge results into response
        metricResults.forEach(result => {
          Object.assign(response, result)
        })

        // Add performance metrics to span
        safeSetAttributes(span, {
          'analytics.business.query_duration_ms': queryDuration,
          'analytics.business.metrics_count': metricResults.length,
          'analytics.business.total_revenue': response.revenue?.totalRevenue || 0,
          'analytics.business.conversion_rate': response.conversion?.conversionRate || 0,
          'analytics.business.average_epc': response.conversion?.averageEPC || 0
        })

        // Calculate summary metrics for quick overview
        if (response.conversion && response.provider) {
          const summary = {
            overview: {
              totalClicks: response.conversion.totalClicks,
              totalConversions: response.conversion.totalConversions,
              totalRevenue: response.conversion.totalRevenue,
              conversionRate: response.conversion.conversionRate,
              averageEPC: response.conversion.averageEPC
            },
            topPerformers: {
              bestProvider: response.provider
                .sort((a: any, b: any) => b.epc - a.epc)[0]?.provider || null,
              bestRoute: response.route ? 
                response.route.sort((a: any, b: any) => b.conversionRate - a.conversionRate)[0]?.route || null 
                : null,
              highestRevenue: response.provider
                .sort((a: any, b: any) => b.revenue - a.revenue)[0]?.provider || null
            },
            trends: {
              providersGrowing: response.provider.filter((p: any) => p.trend === 'up').length,
              providersDecline: response.provider.filter((p: any) => p.trend === 'down').length,
              routesGrowing: response.route ? 
                response.route.filter((r: any) => r.trend === 'up').length : 0,
              routesDecline: response.route ? 
                response.route.filter((r: any) => r.trend === 'down').length : 0
            }
          }
          
          response.summary = summary
        }

        // Add cache headers for performance
        const nextResponse = NextResponse.json(response)
        
        // Cache for 5 minutes for frequently accessed metrics
        nextResponse.headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600')
        
        // Add trace context
        const traceContext = getTraceContext()
        if (traceContext.traceId) {
          nextResponse.headers.set('x-trace-id', traceContext.traceId)
        }
        if (traceContext.spanId) {
          nextResponse.headers.set('x-span-id', traceContext.spanId)
        }

        return nextResponse

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
            error: 'Invalid query parameters',
            code: 'VALIDATION_ERROR',
            details: error.issues,
            timestamp: new Date().toISOString()
          }, { status: 400 })
        }

        // Log error with trace context
        const traceContext = getTraceContext()
        sentryHelpers.captureError(error as Error, 'error', {
          trace: traceContext,
          endpoint: 'GET /api/admin/metrics/business'
        })

        safeSetAttributes(span, {
          'error.type': 'internal',
          'error.message': (error as Error).message
        })

        return NextResponse.json({
          success: false,
          error: 'Failed to fetch business metrics',
          code: 'INTERNAL_ERROR',
          timestamp: new Date().toISOString(),
          requestId: request.headers.get('x-request-id')
        }, { status: 500 })
      }
    },
    {
      // Initial analytics parameters
      provider: undefined,
      amount: undefined
    }
  )
}

// POST endpoint for real-time metric calculations (heavy operations)
export async function POST(request: NextRequest): Promise<Response> {
  return trackAnalyticsOperation(
    'business_metrics_realtime',
    async (span: Span) => {
      try {
        const body = await request.json()
        
        const requestSchema = z.object({
          operation: z.enum(['calculate_cohort', 'forecast_revenue', 'optimize_routes']),
          parameters: z.record(z.any()),
          priority: z.enum(['low', 'normal', 'high']).default('normal')
        })

        const validatedRequest = requestSchema.parse(body)

        // Add operation details to span
        safeSetAttributes(span, {
          'analytics.realtime.operation': validatedRequest.operation,
          'analytics.realtime.priority': validatedRequest.priority,
          'analytics.realtime.params_count': Object.keys(validatedRequest.parameters).length
        })

        // Check admin authentication
        const adminUserId = request.headers.get('x-admin-user-id')
        const adminRole = request.headers.get('x-admin-user-role')
        
        if (!adminUserId || adminRole !== 'admin') {
          return NextResponse.json({
            success: false,
            error: 'Admin privileges required for real-time calculations',
            code: 'FORBIDDEN'
          }, { status: 403 })
        }

        // Handle different operations
        let result: any = {}
        
        switch (validatedRequest.operation) {
          case 'calculate_cohort':
            // Placeholder for cohort analysis
            result = {
              message: 'Cohort analysis initiated',
              estimatedCompletion: new Date(Date.now() + 5 * 60 * 1000).toISOString()
            }
            break
            
          case 'forecast_revenue':
            // Placeholder for revenue forecasting
            result = {
              message: 'Revenue forecast calculation initiated',
              estimatedCompletion: new Date(Date.now() + 3 * 60 * 1000).toISOString()
            }
            break
            
          case 'optimize_routes':
            // Placeholder for route optimization
            result = {
              message: 'Route optimization analysis initiated',
              estimatedCompletion: new Date(Date.now() + 10 * 60 * 1000).toISOString()
            }
            break
        }

        safeSetAttributes(span, {
          'analytics.realtime.initiated': true,
          'analytics.realtime.estimated_duration_ms': 300000 // 5 minutes
        })

        return NextResponse.json({
          success: true,
          operation: validatedRequest.operation,
          priority: validatedRequest.priority,
          result,
          timestamp: new Date().toISOString()
        })

      } catch (error) {
        span.recordException(error as Error)
        
        const traceContext = getTraceContext()
        sentryHelpers.captureError(error as Error, 'error', {
          trace: traceContext,
          endpoint: 'POST /api/admin/metrics/business'
        })

        return NextResponse.json({
          success: false,
          error: 'Failed to initiate real-time calculation',
          code: 'INTERNAL_ERROR',
          timestamp: new Date().toISOString()
        }, { status: 500 })
      }
    }
  )
}