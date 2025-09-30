import { NextRequest, NextResponse } from 'next/server'
import { circuitBreakerRegistry, CircuitState } from '@/lib/circuitBreaker'
import { trackAdminOperation, addCorrelationIds, getTraceContext, safeSetAttributes } from '@/lib/telemetry'
import { sentryHelpers } from '@/lib/sentry'
import { z } from 'zod'

export const runtime = 'nodejs'

const circuitBreakerActionSchema = z.object({
  action: z.enum(['reset', 'trip', 'status']),
  service: z.string().optional(),
  reason: z.string().optional()
})

export async function GET(request: NextRequest): Promise<Response> {
  return trackAdminOperation(
    'circuit_breaker_status',
    async (span) => {
      try {
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

        // Add admin context to span
        safeSetAttributes(span, {
          'admin.user_id': adminUserId,
          'admin.role': adminRole,
          'admin.operation': 'circuit_breaker_status'
        })

        // Generate correlation IDs
        const requestId = request.headers.get('x-request-id') || crypto.randomUUID()
        addCorrelationIds(span, { 
          requestId,
          adminId: adminUserId
        })

        // Get all circuit breaker statistics
        const allStats = circuitBreakerRegistry.getAllStats()
        const unhealthyBreakers = circuitBreakerRegistry.getUnhealthyBreakers()

        // Calculate overall system health
        const totalBreakers = Object.keys(allStats).length
        const healthyBreakers = totalBreakers - unhealthyBreakers.length
        const overallHealth = totalBreakers > 0 ? (healthyBreakers / totalBreakers) * 100 : 100

        // Categorize breakers by state
        const breakersByState = {
          [CircuitState.CLOSED]: [] as string[],
          [CircuitState.OPEN]: [] as string[],
          [CircuitState.HALF_OPEN]: [] as string[]
        }

        Object.entries(allStats).forEach(([service, stats]) => {
          breakersByState[stats.state].push(service)
        })

        // Calculate service health metrics
        const serviceMetrics = Object.entries(allStats).map(([service, stats]) => ({
          service,
          state: stats.state,
          uptime: stats.uptime,
          totalRequests: stats.totalRequests,
          failureCount: stats.failureCount,
          successCount: stats.successCount,
          lastFailureTime: stats.lastFailureTime?.toISOString(),
          lastSuccessTime: stats.lastSuccessTime?.toISOString(),
          resetTime: stats.resetTime?.toISOString(),
          healthStatus: getHealthStatus(stats),
          isHealthy: stats.state === CircuitState.CLOSED && stats.uptime >= 95
        }))

        // Add metrics to span
        safeSetAttributes(span, {
          'circuit_breaker.total_services': totalBreakers,
          'circuit_breaker.healthy_services': healthyBreakers,
          'circuit_breaker.overall_health': overallHealth,
          'circuit_breaker.open_circuits': breakersByState[CircuitState.OPEN].length,
          'circuit_breaker.half_open_circuits': breakersByState[CircuitState.HALF_OPEN].length
        })

        const response = {
          success: true,
          summary: {
            totalServices: totalBreakers,
            healthyServices: healthyBreakers,
            unhealthyServices: unhealthyBreakers.length,
            overallHealth: Math.round(overallHealth * 100) / 100,
            status: overallHealth >= 95 ? 'healthy' : overallHealth >= 80 ? 'degraded' : 'unhealthy'
          },
          circuitBreakers: {
            byState: breakersByState,
            details: serviceMetrics
          },
          unhealthyBreakers: unhealthyBreakers.map(({ service, stats }) => ({
            service,
            state: stats.state,
            uptime: stats.uptime,
            failureCount: stats.failureCount,
            lastFailureTime: stats.lastFailureTime?.toISOString(),
            issue: getIssueDescription(stats)
          })),
          recommendations: generateRecommendations(serviceMetrics),
          generatedAt: new Date().toISOString()
        }

        // Add cache headers
        const nextResponse = NextResponse.json(response)
        nextResponse.headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=120')
        
        // Add trace context
        const traceContext = getTraceContext()
        if (traceContext.traceId) {
          nextResponse.headers.set('x-trace-id', traceContext.traceId)
        }

        return nextResponse

      } catch (error) {
        // Error handling with telemetry
        span.recordException(error as Error)
        
        const traceContext = getTraceContext()
        sentryHelpers.captureError(error as Error, 'error', {
          trace: traceContext,
          endpoint: 'GET /api/admin/system/circuit-breakers'
        })

        return NextResponse.json({
          success: false,
          error: 'Failed to retrieve circuit breaker status',
          code: 'INTERNAL_ERROR',
          timestamp: new Date().toISOString()
        }, { status: 500 })
      }
    },
    {
      adminId: request.headers.get('x-admin-user-id') || undefined,
      adminEmail: request.headers.get('x-admin-user-email') || undefined,
      resource: 'circuit_breakers',
      action: 'read'
    }
  )
}

export async function POST(request: NextRequest): Promise<Response> {
  return trackAdminOperation(
    'circuit_breaker_action',
    async (span) => {
      try {
        // Check admin authentication (require admin role for modifications)
        const adminUserId = request.headers.get('x-admin-user-id')
        const adminRole = request.headers.get('x-admin-user-role')
        
        if (!adminUserId || adminRole !== 'admin') {
          safeSetAttributes(span, {
            'error.type': 'authorization',
            'auth.admin_user_id': adminUserId,
            'auth.admin_role': adminRole
          })

          return NextResponse.json({
            success: false,
            error: 'Admin privileges required for circuit breaker operations',
            code: 'FORBIDDEN'
          }, { status: 403 })
        }

        // Parse and validate request body
        const body = await request.json()
        const validatedData = circuitBreakerActionSchema.parse(body)

        // Add operation details to span
        safeSetAttributes(span, {
          'admin.user_id': adminUserId,
          'admin.role': adminRole,
          'admin.operation': 'circuit_breaker_action',
          'circuit_breaker.action': validatedData.action,
          'circuit_breaker.service': validatedData.service
        })

        // Generate correlation IDs
        const requestId = request.headers.get('x-request-id') || crypto.randomUUID()
        addCorrelationIds(span, { 
          requestId,
          adminId: adminUserId
        })

        let result: any = {}

        switch (validatedData.action) {
          case 'reset':
            if (validatedData.service) {
              // Reset specific service
              const breaker = circuitBreakerRegistry.getBreaker(validatedData.service)
              breaker.reset()
              
              result = {
                message: `Circuit breaker reset for service: ${validatedData.service}`,
                service: validatedData.service,
                newState: breaker.getStats().state
              }
              
              // Log admin action
              sentryHelpers.captureMessage(
                `Circuit breaker reset by admin`,
                'info',
                {
                  admin: { userId: adminUserId },
                  service: validatedData.service,
                  reason: validatedData.reason
                }
              )
            } else {
              // Reset all circuit breakers
              circuitBreakerRegistry.resetAll()
              
              result = {
                message: 'All circuit breakers reset',
                affectedServices: Object.keys(circuitBreakerRegistry.getAllStats())
              }
              
              // Log admin action
              sentryHelpers.captureMessage(
                `All circuit breakers reset by admin`,
                'warning',
                {
                  admin: { userId: adminUserId },
                  reason: validatedData.reason
                }
              )
            }
            break

          case 'trip':
            if (!validatedData.service) {
              return NextResponse.json({
                success: false,
                error: 'Service name required for trip action',
                code: 'VALIDATION_ERROR'
              }, { status: 400 })
            }
            
            const breaker = circuitBreakerRegistry.getBreaker(validatedData.service)
            breaker.trip(validatedData.reason || 'Manual trip by admin')
            
            result = {
              message: `Circuit breaker tripped for service: ${validatedData.service}`,
              service: validatedData.service,
              reason: validatedData.reason,
              newState: breaker.getStats().state
            }
            
            // Log admin action
            sentryHelpers.captureMessage(
              `Circuit breaker manually tripped by admin`,
              'warning',
              {
                admin: { userId: adminUserId },
                service: validatedData.service,
                reason: validatedData.reason
              }
            )
            break

          case 'status':
            // Get detailed status for specific service
            if (!validatedData.service) {
              return NextResponse.json({
                success: false,
                error: 'Service name required for status action',
                code: 'VALIDATION_ERROR'
              }, { status: 400 })
            }
            
            const stats = circuitBreakerRegistry.getBreaker(validatedData.service).getStats()
            
            result = {
              service: validatedData.service,
              stats,
              healthStatus: getHealthStatus(stats),
              recommendations: getServiceRecommendations(validatedData.service, stats)
            }
            break
        }

        // Add result metrics to span
        safeSetAttributes(span, {
          'circuit_breaker.action_successful': true,
          'circuit_breaker.affected_services': result.affectedServices?.length || 1
        })

        return NextResponse.json({
          success: true,
          action: validatedData.action,
          result,
          timestamp: new Date().toISOString(),
          performedBy: adminUserId
        })

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
            error: 'Invalid request parameters',
            code: 'VALIDATION_ERROR',
            details: error.issues,
            timestamp: new Date().toISOString()
          }, { status: 400 })
        }

        const traceContext = getTraceContext()
        sentryHelpers.captureError(error as Error, 'error', {
          trace: traceContext,
          endpoint: 'POST /api/admin/system/circuit-breakers'
        })

        return NextResponse.json({
          success: false,
          error: 'Failed to perform circuit breaker action',
          code: 'INTERNAL_ERROR',
          timestamp: new Date().toISOString()
        }, { status: 500 })
      }
    },
    {
      adminId: request.headers.get('x-admin-user-id') || undefined,
      adminEmail: request.headers.get('x-admin-user-email') || undefined,
      resource: 'circuit_breakers',
      action: 'modify'
    }
  )
}

// Helper functions (would normally be in a separate utility file)
function getHealthStatus(stats: any): string {
  if (stats.state === CircuitState.OPEN) return 'unhealthy'
  if (stats.state === CircuitState.HALF_OPEN) return 'recovering'
  if (stats.uptime < 95) return 'degraded'
  return 'healthy'
}

function getIssueDescription(stats: any): string {
  if (stats.state === CircuitState.OPEN) {
    return `Circuit is open due to ${stats.failureCount} failures. Service is not accepting requests.`
  }
  if (stats.state === CircuitState.HALF_OPEN) {
    return 'Circuit is in half-open state, testing service recovery.'
  }
  if (stats.uptime < 95) {
    return `Service uptime is ${stats.uptime.toFixed(1)}%, indicating reliability issues.`
  }
  return 'No issues detected'
}

function generateRecommendations(serviceMetrics: any[]): string[] {
  const recommendations: string[] = []
  
  const openCircuits = serviceMetrics.filter(s => s.state === CircuitState.OPEN)
  const degradedServices = serviceMetrics.filter(s => s.uptime < 95 && s.state === CircuitState.CLOSED)
  
  if (openCircuits.length > 0) {
    recommendations.push(`${openCircuits.length} service(s) have open circuits. Check external service status and consider fallback implementations.`)
  }
  
  if (degradedServices.length > 0) {
    recommendations.push(`${degradedServices.length} service(s) have degraded performance. Monitor for patterns and consider adjusting circuit breaker thresholds.`)
  }
  
  const highFailureServices = serviceMetrics.filter(s => s.failureCount > 10)
  if (highFailureServices.length > 0) {
    recommendations.push(`Services with high failure counts detected: ${highFailureServices.map(s => s.service).join(', ')}. Investigate root cause.`)
  }
  
  if (recommendations.length === 0) {
    recommendations.push('All services are operating normally. Continue monitoring.')
  }
  
  return recommendations
}

function getServiceRecommendations(service: string, stats: any): string[] {
  const recommendations: string[] = []
  
  if (stats.state === CircuitState.OPEN) {
    recommendations.push('Service is currently blocked. Check external service status.')
    recommendations.push('Consider implementing or improving fallback mechanisms.')
    recommendations.push('Monitor external service recovery and reset circuit when appropriate.')
  }
  
  if (stats.failureCount > 5) {
    recommendations.push('High failure count detected. Investigate error patterns.')
    recommendations.push('Consider adjusting timeout or retry configurations.')
  }
  
  if (stats.uptime < 90) {
    recommendations.push('Low uptime indicates reliability issues.')
    recommendations.push('Review circuit breaker thresholds and external service SLA.')
  }
  
  return recommendations
}