/**
 * Circuit Breaker Implementation for External API Resilience
 * Prevents cascading failures and provides graceful degradation
 */

import { trackExternalAPI, addCorrelationIds, metrics } from '@/lib/telemetry'
import { sentryHelpers } from '@/lib/sentry'

export enum CircuitState {
  CLOSED = 'CLOSED',     // Normal operation
  OPEN = 'OPEN',         // Blocking requests
  HALF_OPEN = 'HALF_OPEN' // Testing if service recovered
}

export interface CircuitBreakerConfig {
  failureThreshold: number      // Number of failures before opening circuit
  successThreshold: number      // Number of successes needed to close from half-open
  timeout: number              // Request timeout in milliseconds
  resetTimeout: number         // Time before moving from open to half-open
  monitoringPeriod: number     // Time window for failure tracking
  fallbackEnabled: boolean     // Whether to use fallback responses
}

export interface CircuitBreakerStats {
  state: CircuitState
  failureCount: number
  successCount: number
  totalRequests: number
  lastFailureTime?: Date
  lastSuccessTime?: Date
  resetTime?: Date
  uptime: number
}

export interface CallResult<T> {
  success: boolean
  data?: T
  error?: Error
  fromFallback: boolean
  executionTime: number
  circuitState: CircuitState
}

// Default configurations for different service types
const DEFAULT_CONFIGS: Record<string, CircuitBreakerConfig> = {
  'amadeus': {
    failureThreshold: 5,
    successThreshold: 3,
    timeout: 10000,        // 10 seconds
    resetTimeout: 60000,   // 1 minute
    monitoringPeriod: 300000, // 5 minutes
    fallbackEnabled: true
  },
  'airline_api': {
    failureThreshold: 3,
    successThreshold: 2,
    timeout: 8000,         // 8 seconds
    resetTimeout: 45000,   // 45 seconds
    monitoringPeriod: 180000, // 3 minutes
    fallbackEnabled: true
  },
  'affiliate_network': {
    failureThreshold: 10,
    successThreshold: 5,
    timeout: 5000,         // 5 seconds
    resetTimeout: 30000,   // 30 seconds
    monitoringPeriod: 120000, // 2 minutes
    fallbackEnabled: true
  },
  'payment_processor': {
    failureThreshold: 2,
    successThreshold: 1,
    timeout: 15000,        // 15 seconds
    resetTimeout: 120000,  // 2 minutes
    monitoringPeriod: 600000, // 10 minutes
    fallbackEnabled: false // No fallback for payments
  },
  'email_service': {
    failureThreshold: 8,
    successThreshold: 4,
    timeout: 6000,         // 6 seconds
    resetTimeout: 90000,   // 1.5 minutes
    monitoringPeriod: 300000, // 5 minutes
    fallbackEnabled: true
  }
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED
  private failureCount: number = 0
  private successCount: number = 0
  private totalRequests: number = 0
  private lastFailureTime?: Date
  private lastSuccessTime?: Date
  private resetTimer?: NodeJS.Timeout
  private failureWindow: Date[] = []

  constructor(
    private serviceName: string,
    private config: CircuitBreakerConfig = DEFAULT_CONFIGS['amadeus']
  ) {
    // Override with service-specific config if available
    if (DEFAULT_CONFIGS[serviceName]) {
      this.config = { ...DEFAULT_CONFIGS[serviceName], ...config }
    }
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(
    operation: () => Promise<T>,
    fallback?: () => Promise<T> | T,
    context: {
      operationName?: string
      correlationId?: string
      metadata?: Record<string, any>
    } = {}
  ): Promise<CallResult<T>> {
    return trackExternalAPI(
      this.serviceName,
      context.operationName || 'api_call',
      async (span) => {
        const startTime = Date.now()
        this.totalRequests++

        // Add circuit breaker context to span
        span.setAttributes({
          'circuit_breaker.service': this.serviceName,
          'circuit_breaker.state': this.state,
          'circuit_breaker.failure_count': this.failureCount,
          'circuit_breaker.total_requests': this.totalRequests
        })

        // Add correlation ID if provided
        if (context.correlationId) {
          addCorrelationIds(span, { requestId: context.correlationId })
        }

        // Check if circuit is open
        if (this.state === CircuitState.OPEN) {
          span.setAttributes({
            'circuit_breaker.blocked': true,
            'circuit_breaker.reason': 'circuit_open'
          })

          // Record circuit open metric
          metrics.recordCounter('circuit_breaker.calls_blocked', 1, {
            service: this.serviceName
          })

          if (this.config.fallbackEnabled && fallback) {
            try {
              const fallbackResult = await fallback()
              return {
                success: true,
                data: fallbackResult,
                fromFallback: true,
                executionTime: Date.now() - startTime,
                circuitState: this.state
              }
            } catch (fallbackError) {
              span.recordException(fallbackError as Error)
              throw new Error(`Circuit breaker open for ${this.serviceName} and fallback failed`)
            }
          } else {
            throw new Error(`Circuit breaker open for ${this.serviceName}`)
          }
        }

        // Execute the operation with timeout
        try {
          const result = await this.executeWithTimeout(operation, this.config.timeout)
          
          // Record success
          this.onSuccess()
          
          span.setAttributes({
            'circuit_breaker.success': true,
            'circuit_breaker.execution_time_ms': Date.now() - startTime
          })

          // Record success metrics
          metrics.recordCounter('circuit_breaker.calls_success', 1, {
            service: this.serviceName,
            state: this.state
          })

          metrics.recordHistogram('circuit_breaker.execution_time', Date.now() - startTime, {
            service: this.serviceName,
            success: 'true'
          })

          return {
            success: true,
            data: result,
            fromFallback: false,
            executionTime: Date.now() - startTime,
            circuitState: this.state
          }

        } catch (error) {
          // Record failure
          this.onFailure()
          
          span.recordException(error as Error)
          span.setAttributes({
            'circuit_breaker.failure': true,
            'circuit_breaker.error_type': (error as Error).name,
            'circuit_breaker.execution_time_ms': Date.now() - startTime
          })

          // Record failure metrics
          metrics.recordCounter('circuit_breaker.calls_failure', 1, {
            service: this.serviceName,
            state: this.state,
            error_type: (error as Error).name
          })

          metrics.recordHistogram('circuit_breaker.execution_time', Date.now() - startTime, {
            service: this.serviceName,
            success: 'false'
          })

          // Try fallback if available and enabled
          if (this.config.fallbackEnabled && fallback) {
            try {
              const fallbackResult = await fallback()
              
              span.setAttributes({
                'circuit_breaker.fallback_used': true,
                'circuit_breaker.fallback_success': true
              })

              return {
                success: true,
                data: fallbackResult,
                fromFallback: true,
                executionTime: Date.now() - startTime,
                circuitState: this.state
              }
            } catch (fallbackError) {
              span.recordException(fallbackError as Error)
              span.setAttributes({
                'circuit_breaker.fallback_used': true,
                'circuit_breaker.fallback_success': false
              })
            }
          }

          // Log error with Sentry
          sentryHelpers.captureError(error as Error, 'error', {
            circuitBreaker: {
              service: this.serviceName,
              state: this.state,
              failureCount: this.failureCount
            },
            operation: context.operationName,
            metadata: context.metadata
          })

          return {
            success: false,
            error: error as Error,
            fromFallback: false,
            executionTime: Date.now() - startTime,
            circuitState: this.state
          }
        }
      },
      {
        endpoint: context.operationName,
        method: 'POST' // Default, can be overridden
      }
    )
  }

  /**
   * Execute operation with timeout
   */
  private async executeWithTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeoutMs}ms`))
      }, timeoutMs)

      operation()
        .then(result => {
          clearTimeout(timeoutId)
          resolve(result)
        })
        .catch(error => {
          clearTimeout(timeoutId)
          reject(error)
        })
    })
  }

  /**
   * Handle successful operation
   */
  private onSuccess(): void {
    this.lastSuccessTime = new Date()
    
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++
      
      if (this.successCount >= this.config.successThreshold) {
        this.state = CircuitState.CLOSED
        this.failureCount = 0
        this.successCount = 0
        this.clearResetTimer()
        
        console.log(`Circuit breaker for ${this.serviceName} closed after recovery`)
        
        // Record state change metric
        metrics.recordCounter('circuit_breaker.state_change', 1, {
          service: this.serviceName,
          from: 'half_open',
          to: 'closed'
        })
      }
    } else if (this.state === CircuitState.CLOSED) {
      // Clean up old failures outside monitoring window
      this.cleanupFailureWindow()
    }
  }

  /**
   * Handle failed operation
   */
  private onFailure(): void {
    this.lastFailureTime = new Date()
    this.failureWindow.push(this.lastFailureTime)
    
    if (this.state === CircuitState.HALF_OPEN) {
      // Go back to open on any failure in half-open state
      this.state = CircuitState.OPEN
      this.failureCount++
      this.successCount = 0
      this.scheduleReset()
      
      console.log(`Circuit breaker for ${this.serviceName} reopened after half-open failure`)
      
      // Record state change metric
      metrics.recordCounter('circuit_breaker.state_change', 1, {
        service: this.serviceName,
        from: 'half_open',
        to: 'open'
      })
      
    } else if (this.state === CircuitState.CLOSED) {
      this.cleanupFailureWindow()
      
      if (this.failureWindow.length >= this.config.failureThreshold) {
        this.state = CircuitState.OPEN
        this.failureCount = this.failureWindow.length
        this.scheduleReset()
        
        console.log(`Circuit breaker for ${this.serviceName} opened after ${this.failureCount} failures`)
        
        // Record state change metric
        metrics.recordCounter('circuit_breaker.state_change', 1, {
          service: this.serviceName,
          from: 'closed',
          to: 'open'
        })

        // Alert on circuit open
        sentryHelpers.captureMessage(
          `Circuit breaker opened for ${this.serviceName}`,
          'warning',
          {
            circuitBreaker: {
              service: this.serviceName,
              failureCount: this.failureCount,
              threshold: this.config.failureThreshold
            }
          }
        )
      }
    }
  }

  /**
   * Clean up failures outside the monitoring window
   */
  private cleanupFailureWindow(): void {
    const cutoff = new Date(Date.now() - this.config.monitoringPeriod)
    this.failureWindow = this.failureWindow.filter(time => time > cutoff)
  }

  /**
   * Schedule reset from open to half-open
   */
  private scheduleReset(): void {
    this.clearResetTimer()
    
    this.resetTimer = setTimeout(() => {
      if (this.state === CircuitState.OPEN) {
        this.state = CircuitState.HALF_OPEN
        this.successCount = 0
        
        console.log(`Circuit breaker for ${this.serviceName} moved to half-open for testing`)
        
        // Record state change metric
        metrics.recordCounter('circuit_breaker.state_change', 1, {
          service: this.serviceName,
          from: 'open',
          to: 'half_open'
        })
      }
    }, this.config.resetTimeout)
  }

  /**
   * Clear reset timer
   */
  private clearResetTimer(): void {
    if (this.resetTimer) {
      clearTimeout(this.resetTimer)
      this.resetTimer = undefined
    }
  }

  /**
   * Get current circuit breaker statistics
   */
  getStats(): CircuitBreakerStats {
    this.cleanupFailureWindow()
    
    return {
      state: this.state,
      failureCount: this.failureWindow.length,
      successCount: this.successCount,
      totalRequests: this.totalRequests,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      resetTime: this.resetTimer ? new Date(Date.now() + this.config.resetTimeout) : undefined,
      uptime: this.calculateUptime()
    }
  }

  /**
   * Calculate service uptime percentage
   */
  private calculateUptime(): number {
    if (this.totalRequests === 0) return 100
    
    const failures = this.failureWindow.length
    const successes = this.totalRequests - failures
    
    return (successes / this.totalRequests) * 100
  }

  /**
   * Manually trip the circuit breaker
   */
  trip(reason: string = 'Manual trip'): void {
    this.state = CircuitState.OPEN
    this.failureCount++
    this.lastFailureTime = new Date()
    this.scheduleReset()
    
    console.log(`Circuit breaker for ${this.serviceName} manually tripped: ${reason}`)
    
    sentryHelpers.captureMessage(
      `Circuit breaker manually tripped for ${this.serviceName}`,
      'warning',
      { reason }
    )
  }

  /**
   * Manually reset the circuit breaker
   */
  reset(): void {
    this.state = CircuitState.CLOSED
    this.failureCount = 0
    this.successCount = 0
    this.failureWindow = []
    this.clearResetTimer()
    
    console.log(`Circuit breaker for ${this.serviceName} manually reset`)
    
    // Record manual reset metric
    metrics.recordCounter('circuit_breaker.manual_reset', 1, {
      service: this.serviceName
    })
  }
}

// Global circuit breaker registry
class CircuitBreakerRegistry {
  private breakers: Map<string, CircuitBreaker> = new Map()

  /**
   * Get or create circuit breaker for service
   */
  getBreaker(serviceName: string, config?: Partial<CircuitBreakerConfig>): CircuitBreaker {
    if (!this.breakers.has(serviceName)) {
      const defaultConfig = DEFAULT_CONFIGS[serviceName] || DEFAULT_CONFIGS['amadeus']
      const finalConfig = { ...defaultConfig, ...config }
      
      this.breakers.set(serviceName, new CircuitBreaker(serviceName, finalConfig))
    }
    
    return this.breakers.get(serviceName)!
  }

  /**
   * Get all circuit breaker statistics
   */
  getAllStats(): Record<string, CircuitBreakerStats> {
    const stats: Record<string, CircuitBreakerStats> = {}
    
    for (const [serviceName, breaker] of this.breakers) {
      stats[serviceName] = breaker.getStats()
    }
    
    return stats
  }

  /**
   * Get circuit breakers in unhealthy states
   */
  getUnhealthyBreakers(): Array<{ service: string; stats: CircuitBreakerStats }> {
    const unhealthy: Array<{ service: string; stats: CircuitBreakerStats }> = []
    
    for (const [serviceName, breaker] of this.breakers) {
      const stats = breaker.getStats()
      
      if (stats.state !== CircuitState.CLOSED || stats.uptime < 95) {
        unhealthy.push({ service: serviceName, stats })
      }
    }
    
    return unhealthy
  }

  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    for (const breaker of this.breakers.values()) {
      breaker.reset()
    }
    
    console.log('All circuit breakers reset')
  }
}

// Export singleton registry
export const circuitBreakerRegistry = new CircuitBreakerRegistry()

// Helper function to execute with circuit breaker
export async function withCircuitBreaker<T>(
  serviceName: string,
  operation: () => Promise<T>,
  fallback?: () => Promise<T> | T,
  options: {
    operationName?: string
    correlationId?: string
    metadata?: Record<string, any>
    config?: Partial<CircuitBreakerConfig>
  } = {}
): Promise<CallResult<T>> {
  const breaker = circuitBreakerRegistry.getBreaker(serviceName, options.config)
  
  return breaker.execute(operation, fallback, {
    operationName: options.operationName,
    correlationId: options.correlationId,
    metadata: options.metadata
  })
}

export default CircuitBreaker