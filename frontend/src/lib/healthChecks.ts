/**
 * External Dependency Health Monitoring
 * Circuit breakers and health checks for critical external services
 */

import { captureException, captureMessage } from '@sentry/nextjs'
import { trackError } from './monitoring'
import { env, isProduction } from '../config/environment'

export interface HealthCheckResult {
  service: string
  healthy: boolean
  responseTime: number
  lastCheck: Date
  consecutiveFailures: number
  error?: string
  metadata?: Record<string, any>
}

export interface CircuitBreakerState {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN'
  failureCount: number
  lastFailureTime?: Date
  nextAttemptTime?: Date
}

class CircuitBreaker {
  private state: CircuitBreakerState = {
    state: 'CLOSED',
    failureCount: 0
  }
  
  private readonly failureThreshold: number
  private readonly recoveryTimeout: number
  private readonly timeout: number

  constructor(
    private serviceName: string,
    failureThreshold = 5,
    recoveryTimeout = 60000, // 1 minute
    timeout = 10000 // 10 seconds
  ) {
    this.failureThreshold = failureThreshold
    this.recoveryTimeout = recoveryTimeout
    this.timeout = timeout
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state.state === 'OPEN') {
      if (this.shouldAttemptReset()) {
        this.state.state = 'HALF_OPEN'
      } else {
        throw new Error(`Circuit breaker OPEN for ${this.serviceName}`)
      }
    }

    try {
      const result = await Promise.race([
        operation(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Operation timeout')), this.timeout)
        )
      ])

      this.onSuccess()
      return result

    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  private onSuccess(): void {
    this.state.failureCount = 0
    this.state.state = 'CLOSED'
    this.state.lastFailureTime = undefined
    this.state.nextAttemptTime = undefined
  }

  private onFailure(): void {
    this.state.failureCount++
    this.state.lastFailureTime = new Date()

    if (this.state.failureCount >= this.failureThreshold) {
      this.state.state = 'OPEN'
      this.state.nextAttemptTime = new Date(Date.now() + this.recoveryTimeout)
      
      console.warn(`🔴 Circuit breaker OPEN for ${this.serviceName}`)
      
      trackError(new Error("Monitoring error"), {
        errorType: 'external_service',
        errorCode: 'circuit_breaker_open',
        endpoint: this.serviceName,
        severity: 'high'
      })
    }
  }

  private shouldAttemptReset(): boolean {
    return this.state.nextAttemptTime && Date.now() >= this.state.nextAttemptTime.getTime()
  }

  getState(): CircuitBreakerState {
    return { ...this.state }
  }
}

class HealthCheckManager {
  private circuitBreakers = new Map<string, CircuitBreaker>()
  private healthResults = new Map<string, HealthCheckResult>()
  private checkIntervals = new Map<string, NodeJS.Timeout>()

  constructor() {
    // Initialize circuit breakers for critical services
    this.circuitBreakers.set('amadeus', new CircuitBreaker('amadeus', 3, 120000, 15000))
    this.circuitBreakers.set('database', new CircuitBreaker('database', 2, 30000, 5000))
    this.circuitBreakers.set('cache', new CircuitBreaker('cache', 5, 60000, 3000))
    this.circuitBreakers.set('email', new CircuitBreaker('email', 3, 300000, 10000))
    this.circuitBreakers.set('sentry', new CircuitBreaker('sentry', 10, 600000, 5000))
  }

  /**
   * Start continuous health monitoring
   */
  startMonitoring(): void {
    if (typeof window !== 'undefined') {
      console.log('🏥 Starting health check monitoring...')
      
      // Check critical services every 30 seconds
      this.scheduleHealthCheck('database', () => this.checkDatabase(), 30000)
      this.scheduleHealthCheck('cache', () => this.checkCache(), 45000)
      
      // Check external services every 2 minutes
      this.scheduleHealthCheck('amadeus', () => this.checkAmadeus(), 120000)
      this.scheduleHealthCheck('email', () => this.checkEmail(), 180000)
      this.scheduleHealthCheck('sentry', () => this.checkSentry(), 300000)
    }
  }

  /**
   * Stop all health monitoring
   */
  stopMonitoring(): void {
    for (const interval of this.checkIntervals.values()) {
      clearInterval(interval)
    }
    this.checkIntervals.clear()
  }

  /**
   * Get circuit breaker for service
   */
  getCircuitBreaker(service: string): CircuitBreaker | undefined {
    return this.circuitBreakers.get(service)
  }

  /**
   * Execute operation with circuit breaker protection
   */
  async executeWithCircuitBreaker<T>(service: string, operation: () => Promise<T>): Promise<T> {
    const breaker = this.circuitBreakers.get(service)
    if (!breaker) {
      return operation()
    }
    return breaker.execute(operation)
  }

  /**
   * Check database health
   */
  private async checkDatabase(): Promise<HealthCheckResult> {
    const startTime = Date.now()
    const service = 'database'

    try {
      // Simple database connectivity check
      const response = await fetch('/api/health/database', {
        method: 'GET',
        cache: 'no-cache'
      })

      const responseTime = Date.now() - startTime
      const healthy = response.ok

      const result: HealthCheckResult = {
        service,
        healthy,
        responseTime,
        lastCheck: new Date(),
        consecutiveFailures: healthy ? 0 : (this.healthResults.get(service)?.consecutiveFailures || 0) + 1
      }

      if (!healthy) {
        const errorText = await response.text()
        result.error = `HTTP ${response.status}: ${errorText}`
      }

      this.updateHealthResult(service, result)
      return result

    } catch (error) {
      const responseTime = Date.now() - startTime
      const result: HealthCheckResult = {
        service,
        healthy: false,
        responseTime,
        lastCheck: new Date(),
        consecutiveFailures: (this.healthResults.get(service)?.consecutiveFailures || 0) + 1,
        error: error instanceof Error ? error.message : 'Unknown error'
      }

      this.updateHealthResult(service, result)
      return result
    }
  }

  /**
   * Check cache health (Vercel KV)
   */
  private async checkCache(): Promise<HealthCheckResult> {
    const startTime = Date.now()
    const service = 'cache'

    try {
      const response = await fetch('/api/health/cache', {
        method: 'GET',
        cache: 'no-cache'
      })

      const responseTime = Date.now() - startTime
      const healthy = response.ok

      const result: HealthCheckResult = {
        service,
        healthy,
        responseTime,
        lastCheck: new Date(),
        consecutiveFailures: healthy ? 0 : (this.healthResults.get(service)?.consecutiveFailures || 0) + 1
      }

      if (!healthy) {
        result.error = `Cache health check failed: HTTP ${response.status}`
      }

      this.updateHealthResult(service, result)
      return result

    } catch (error) {
      const responseTime = Date.now() - startTime
      const result: HealthCheckResult = {
        service,
        healthy: false,
        responseTime,
        lastCheck: new Date(),
        consecutiveFailures: (this.healthResults.get(service)?.consecutiveFailures || 0) + 1,
        error: error instanceof Error ? error.message : 'Cache connection failed'
      }

      this.updateHealthResult(service, result)
      return result
    }
  }

  /**
   * Check Amadeus API health
   */
  private async checkAmadeus(): Promise<HealthCheckResult> {
    const startTime = Date.now()
    const service = 'amadeus'

    try {
      // Use a lightweight Amadeus endpoint for health check
      const response = await fetch('/api/amadeus/locations?keyword=NYC&subType=AIRPORT', {
        method: 'GET',
        cache: 'no-cache'
      })

      const responseTime = Date.now() - startTime
      const healthy = response.ok

      const result: HealthCheckResult = {
        service,
        healthy,
        responseTime,
        lastCheck: new Date(),
        consecutiveFailures: healthy ? 0 : (this.healthResults.get(service)?.consecutiveFailures || 0) + 1,
        metadata: {
          status: response.status,
          amadeus_environment: env.AMADEUS_ENVIRONMENT
        }
      }

      if (!healthy) {
        result.error = `Amadeus API error: HTTP ${response.status}`
      }

      this.updateHealthResult(service, result)
      return result

    } catch (error) {
      const responseTime = Date.now() - startTime
      const result: HealthCheckResult = {
        service,
        healthy: false,
        responseTime,
        lastCheck: new Date(),
        consecutiveFailures: (this.healthResults.get(service)?.consecutiveFailures || 0) + 1,
        error: error instanceof Error ? error.message : 'Amadeus API unreachable'
      }

      this.updateHealthResult(service, result)
      return result
    }
  }

  /**
   * Check email service health (Resend)
   */
  private async checkEmail(): Promise<HealthCheckResult> {
    const startTime = Date.now()
    const service = 'email'

    try {
      // Check Resend API health
      const response = await fetch('https://api.resend.com/domains', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${env.RESEND_API_KEY}`
        }
      })

      const responseTime = Date.now() - startTime
      const healthy = response.ok

      const result: HealthCheckResult = {
        service,
        healthy,
        responseTime,
        lastCheck: new Date(),
        consecutiveFailures: healthy ? 0 : (this.healthResults.get(service)?.consecutiveFailures || 0) + 1
      }

      if (!healthy) {
        result.error = `Email service error: HTTP ${response.status}`
      }

      this.updateHealthResult(service, result)
      return result

    } catch (error) {
      const responseTime = Date.now() - startTime
      const result: HealthCheckResult = {
        service,
        healthy: false,
        responseTime,
        lastCheck: new Date(),
        consecutiveFailures: (this.healthResults.get(service)?.consecutiveFailures || 0) + 1,
        error: error instanceof Error ? error.message : 'Email service unreachable'
      }

      this.updateHealthResult(service, result)
      return result
    }
  }

  /**
   * Check Sentry health
   */
  private async checkSentry(): Promise<HealthCheckResult> {
    const startTime = Date.now()
    const service = 'sentry'

    try {
      // Test Sentry connectivity
      captureMessage('Health check ping', { level: 'debug' })
      
      const responseTime = Date.now() - startTime
      const result: HealthCheckResult = {
        service,
        healthy: true,
        responseTime,
        lastCheck: new Date(),
        consecutiveFailures: 0
      }

      this.updateHealthResult(service, result)
      return result

    } catch (error) {
      const responseTime = Date.now() - startTime
      const result: HealthCheckResult = {
        service,
        healthy: false,
        responseTime,
        lastCheck: new Date(),
        consecutiveFailures: (this.healthResults.get(service)?.consecutiveFailures || 0) + 1,
        error: error instanceof Error ? error.message : 'Sentry health check failed'
      }

      this.updateHealthResult(service, result)
      return result
    }
  }

  /**
   * Schedule periodic health check
   */
  private scheduleHealthCheck(
    service: string, 
    checkFunction: () => Promise<HealthCheckResult>, 
    interval: number
  ): void {
    // Run initial check
    checkFunction().catch(error => {
      console.error(`Initial health check failed for ${service}:`, error)
    })

    // Schedule periodic checks
    const intervalId = setInterval(async () => {
      try {
        await checkFunction()
      } catch (error) {
        console.error(`Health check failed for ${service}:`, error)
      }
    }, interval)

    this.checkIntervals.set(service, intervalId)
  }

  /**
   * Update health result and trigger alerts if needed
   */
  private updateHealthResult(service: string, result: HealthCheckResult): void {
    const previous = this.healthResults.get(service)
    this.healthResults.set(service, result)

    // Alert on service degradation
    if (!result.healthy) {
      console.warn(`🔴 Service unhealthy: ${service}`, {
        consecutiveFailures: result.consecutiveFailures,
        error: result.error,
        responseTime: result.responseTime
      })

      // Track error in monitoring
      trackError(new Error("Monitoring error"), {
        errorType: 'external_service',
        errorCode: 'health_check_failed',
        endpoint: service,
        severity: result.consecutiveFailures > 3 ? 'critical' : 'high'
      })

      // Send to Sentry on consecutive failures
      if (result.consecutiveFailures >= 3) {
        captureException(new Error(`Service ${service} health check failing`), {
          tags: { service, health_check: 'failed' },
          extra: result
        })
      }
    }

    // Alert on recovery
    if (result.healthy && previous && !previous.healthy) {
      console.log(`🟢 Service recovered: ${service}`)
      
      captureMessage(`Service ${service} recovered`, {
        level: 'info',
        tags: { service, health_check: 'recovered' },
        extra: result
      })
    }

    // Alert on performance degradation
    if (result.healthy && result.responseTime > 10000) {
      console.warn(`⚠️ Slow response from ${service}: ${result.responseTime}ms`)
    }
  }

  /**
   * Get all current health results
   */
  getAllHealthResults(): Map<string, HealthCheckResult> {
    return new Map(this.healthResults)
  }

  /**
   * Get health result for specific service
   */
  getHealthResult(service: string): HealthCheckResult | undefined {
    return this.healthResults.get(service)
  }

  /**
   * Get circuit breaker states
   */
  getCircuitBreakerStates(): Map<string, CircuitBreakerState> {
    const states = new Map<string, CircuitBreakerState>()
    for (const [service, breaker] of this.circuitBreakers.entries()) {
      states.set(service, breaker.getState())
    }
    return states
  }
}

// Singleton instance
export const healthCheckManager = new HealthCheckManager()

// Start monitoring in browser
if (typeof window !== 'undefined') {
  healthCheckManager.startMonitoring()
}

export default healthCheckManager