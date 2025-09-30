/**
 * Retry Policy Implementation with Exponential Backoff
 * Provides intelligent retry mechanisms for external API calls and database operations
 */

import { trackExternalAPI, addCorrelationIds, metrics, type Span } from '@/lib/telemetry'
import { sentryHelpers } from '@/lib/sentry'

export interface RetryConfig {
  maxAttempts: number          // Maximum number of retry attempts
  baseDelayMs: number         // Base delay for exponential backoff
  maxDelayMs: number          // Maximum delay between retries
  backoffMultiplier: number   // Multiplier for exponential backoff
  jitterFactor: number        // Random jitter factor (0-1)
  retryableErrors: string[]   // Error types/codes that should trigger retries
  nonRetryableErrors: string[] // Error types/codes that should not trigger retries
  timeoutMs?: number          // Overall timeout for all retry attempts
}

export interface RetryResult<T> {
  success: boolean
  data?: T
  error?: Error
  attempts: number
  totalDuration: number
  finalDelay?: number
  retriedErrors: Array<{
    attempt: number
    error: Error
    delay: number
  }>
}

export interface RetryContext {
  operationName: string
  correlationId?: string
  metadata?: Record<string, any>
  onRetry?: (attempt: number, error: Error, delay: number) => void
  shouldRetry?: (error: Error, attempt: number) => boolean
}

// Default retry configurations for different operation types
const DEFAULT_RETRY_CONFIGS: Record<string, RetryConfig> = {
  'external_api': {
    maxAttempts: 3,
    baseDelayMs: 1000,        // 1 second
    maxDelayMs: 10000,        // 10 seconds
    backoffMultiplier: 2,
    jitterFactor: 0.1,
    retryableErrors: [
      'ECONNRESET',
      'ECONNREFUSED', 
      'ETIMEDOUT',
      'ENOTFOUND',
      'EAI_AGAIN',
      'NETWORK_ERROR',
      'TIMEOUT_ERROR',
      'HTTP_429',    // Rate limited
      'HTTP_502',    // Bad Gateway
      'HTTP_503',    // Service Unavailable
      'HTTP_504'     // Gateway Timeout
    ],
    nonRetryableErrors: [
      'HTTP_400',    // Bad Request
      'HTTP_401',    // Unauthorized
      'HTTP_403',    // Forbidden
      'HTTP_404',    // Not Found
      'HTTP_422',    // Unprocessable Entity
      'VALIDATION_ERROR',
      'AUTHENTICATION_ERROR'
    ],
    timeoutMs: 30000          // 30 seconds total
  },
  
  'database': {
    maxAttempts: 5,
    baseDelayMs: 500,         // 500ms
    maxDelayMs: 5000,         // 5 seconds
    backoffMultiplier: 1.5,
    jitterFactor: 0.2,
    retryableErrors: [
      'ECONNRESET',
      'ECONNREFUSED',
      'CONNECTION_LOST',
      'DEADLOCK_DETECTED',
      'LOCK_TIMEOUT',
      'SERIALIZATION_FAILURE'
    ],
    nonRetryableErrors: [
      'CONSTRAINT_VIOLATION',
      'SYNTAX_ERROR',
      'PERMISSION_DENIED',
      'INVALID_CATALOG_NAME'
    ],
    timeoutMs: 15000          // 15 seconds total
  },
  
  'file_operation': {
    maxAttempts: 4,
    baseDelayMs: 250,         // 250ms
    maxDelayMs: 2000,         // 2 seconds
    backoffMultiplier: 2,
    jitterFactor: 0.15,
    retryableErrors: [
      'EBUSY',
      'EMFILE',
      'ENFILE',
      'EAGAIN',
      'EACCES'
    ],
    nonRetryableErrors: [
      'ENOENT',
      'EISDIR',
      'ENOTDIR',
      'EPERM'
    ],
    timeoutMs: 10000          // 10 seconds total
  },
  
  'payment_processor': {
    maxAttempts: 2,           // Conservative for financial operations
    baseDelayMs: 2000,        // 2 seconds
    maxDelayMs: 8000,         // 8 seconds
    backoffMultiplier: 2,
    jitterFactor: 0.05,       // Low jitter for financial operations
    retryableErrors: [
      'NETWORK_ERROR',
      'TIMEOUT_ERROR',
      'TEMPORARY_UNAVAILABLE'
    ],
    nonRetryableErrors: [
      'INSUFFICIENT_FUNDS',
      'INVALID_CARD',
      'DECLINED',
      'FRAUD_DETECTED',
      'DUPLICATE_TRANSACTION'
    ],
    timeoutMs: 20000          // 20 seconds total
  },
  
  'email_service': {
    maxAttempts: 4,
    baseDelayMs: 1500,        // 1.5 seconds
    maxDelayMs: 12000,        // 12 seconds
    backoffMultiplier: 2,
    jitterFactor: 0.2,
    retryableErrors: [
      'RATE_LIMITED',
      'TEMPORARY_FAILURE',
      'NETWORK_ERROR',
      'HTTP_429',
      'HTTP_502',
      'HTTP_503'
    ],
    nonRetryableErrors: [
      'INVALID_EMAIL',
      'BLOCKED_DOMAIN',
      'QUOTA_EXCEEDED',
      'AUTHENTICATION_FAILED'
    ],
    timeoutMs: 25000          // 25 seconds total
  }
}

export class RetryPolicy {
  constructor(
    private config: RetryConfig,
    private operationType: string = 'external_api'
  ) {}

  /**
   * Execute an operation with retry logic
   */
  async execute<T>(
    operation: () => Promise<T>,
    context: RetryContext
  ): Promise<RetryResult<T>> {
    return trackExternalAPI(
      this.operationType,
      async (span: Span) => {
        const startTime = Date.now()
        let lastError: Error | undefined
        const retriedErrors: Array<{ attempt: number; error: Error; delay: number }> = []
        
        // Add retry context to span
        span.setAttributes({
          'retry.operation_type': this.operationType,
          'retry.operation_name': context.operationName,
          'retry.max_attempts': this.config.maxAttempts,
          'retry.base_delay_ms': this.config.baseDelayMs,
          'retry.timeout_ms': this.config.timeoutMs || 0
        })

        // Add correlation ID if provided
        if (context.correlationId) {
          addCorrelationIds(span, { requestId: context.correlationId })
        }

        for (let attempt = 1; attempt <= this.config.maxAttempts; attempt++) {
          // Check overall timeout
          if (this.config.timeoutMs) {
            const elapsed = Date.now() - startTime
            if (elapsed >= this.config.timeoutMs) {
              span.setAttributes({
                'retry.timeout_exceeded': true,
                'retry.total_duration_ms': elapsed
              })
              
              metrics.recordCounter('retry.timeout_exceeded', 1, {
                operation_type: this.operationType,
                operation_name: context.operationName
              })
              
              throw new Error(`Retry timeout exceeded after ${elapsed}ms`)
            }
          }

          try {
            // Record attempt metrics
            metrics.recordCounter('retry.attempt', 1, {
              operation_type: this.operationType,
              operation_name: context.operationName,
              attempt: attempt.toString()
            })

            span.setAttributes({
              'retry.current_attempt': attempt,
              'retry.is_retry': attempt > 1
            })

            const result = await operation()
            
            // Success - record metrics and return
            const totalDuration = Date.now() - startTime
            
            span.setAttributes({
              'retry.success': true,
              'retry.final_attempt': attempt,
              'retry.total_duration_ms': totalDuration,
              'retry.total_retries': attempt - 1
            })

            metrics.recordCounter('retry.success', 1, {
              operation_type: this.operationType,
              operation_name: context.operationName,
              attempts: attempt.toString()
            })

            metrics.recordHistogram('retry.total_duration', totalDuration, {
              operation_type: this.operationType,
              success: 'true'
            })

            return {
              success: true,
              data: result,
              attempts: attempt,
              totalDuration,
              retriedErrors
            }

          } catch (error) {
            lastError = error as Error
            
            // Add error details to span
            span.recordException(lastError)
            span.setAttributes({
              'retry.error_type': lastError.name,
              'retry.error_message': lastError.message,
              'retry.attempt_failed': attempt
            })

            // Check if we should retry this error
            const shouldRetry = this.shouldRetryError(lastError, attempt, context.shouldRetry)
            
            if (!shouldRetry || attempt >= this.config.maxAttempts) {
              // Final failure - no more retries
              const totalDuration = Date.now() - startTime
              
              span.setAttributes({
                'retry.final_failure': true,
                'retry.final_attempt': attempt,
                'retry.total_duration_ms': totalDuration,
                'retry.should_retry': shouldRetry,
                'retry.max_attempts_reached': attempt >= this.config.maxAttempts
              })

              // Record failure metrics
              metrics.recordCounter('retry.final_failure', 1, {
                operation_type: this.operationType,
                operation_name: context.operationName,
                attempts: attempt.toString(),
                error_type: lastError.name
              })

              metrics.recordHistogram('retry.total_duration', totalDuration, {
                operation_type: this.operationType,
                success: 'false'
              })

              // Log error with context
              sentryHelpers.captureError(lastError, 'error', {
                retry: {
                  operationType: this.operationType,
                  operationName: context.operationName,
                  attempt,
                  maxAttempts: this.config.maxAttempts,
                  totalDuration,
                  shouldRetry
                },
                metadata: context.metadata
              })

              return {
                success: false,
                error: lastError,
                attempts: attempt,
                totalDuration,
                retriedErrors
              }
            }

            // Calculate delay for next retry
            const delay = this.calculateDelay(attempt)
            
            // Record retry attempt
            retriedErrors.push({
              attempt,
              error: lastError,
              delay
            })

            // Call retry callback if provided
            if (context.onRetry) {
              try {
                context.onRetry(attempt, lastError, delay)
              } catch (callbackError) {
                console.warn('Retry callback error:', callbackError)
              }
            }

            // Record retry metrics
            metrics.recordCounter('retry.retry_attempt', 1, {
              operation_type: this.operationType,
              operation_name: context.operationName,
              attempt: attempt.toString(),
              error_type: lastError.name
            })

            metrics.recordHistogram('retry.delay', delay, {
              operation_type: this.operationType,
              attempt: attempt.toString()
            })

            span.setAttributes({
              'retry.retrying': true,
              'retry.delay_ms': delay,
              'retry.next_attempt': attempt + 1
            })

            console.log(`Retrying ${context.operationName} (attempt ${attempt}/${this.config.maxAttempts}) after ${delay}ms delay. Error: ${lastError.message}`)

            // Wait before next attempt
            await this.delay(delay)
          }
        }

        // This should never be reached, but included for type safety
        throw lastError || new Error('Unexpected retry loop exit')
      },
      {
        endpoint: context.operationName,
        method: 'POST' // Default, can be overridden
      }
    )
  }

  /**
   * Calculate delay for next retry attempt with exponential backoff and jitter
   */
  private calculateDelay(attempt: number): number {
    // Exponential backoff: baseDelay * (multiplier ^ (attempt - 1))
    const exponentialDelay = this.config.baseDelayMs * Math.pow(this.config.backoffMultiplier, attempt - 1)
    
    // Apply maximum delay cap
    const cappedDelay = Math.min(exponentialDelay, this.config.maxDelayMs)
    
    // Add jitter to prevent thundering herd
    const jitter = cappedDelay * this.config.jitterFactor * Math.random()
    const finalDelay = cappedDelay + jitter
    
    return Math.round(finalDelay)
  }

  /**
   * Determine if an error should trigger a retry
   */
  private shouldRetryError(
    error: Error, 
    attempt: number,
    customShouldRetry?: (error: Error, attempt: number) => boolean
  ): boolean {
    // Check custom retry logic first
    if (customShouldRetry) {
      return customShouldRetry(error, attempt)
    }

    // Check non-retryable errors first
    const errorType = this.getErrorType(error)
    if (this.config.nonRetryableErrors.includes(errorType)) {
      return false
    }

    // Check retryable errors
    if (this.config.retryableErrors.includes(errorType)) {
      return true
    }

    // Default: retry network and timeout errors
    const defaultRetryablePatterns = [
      /network/i,
      /timeout/i,
      /connection/i,
      /unavailable/i,
      /gateway/i
    ]

    return defaultRetryablePatterns.some(pattern => 
      pattern.test(error.message) || pattern.test(error.name)
    )
  }

  /**
   * Extract error type for retry decision
   */
  private getErrorType(error: Error): string {
    // Handle HTTP errors
    if (error.message.includes('HTTP')) {
      const match = error.message.match(/HTTP[_\s](\d{3})/)
      if (match) {
        return `HTTP_${match[1]}`
      }
    }

    // Handle Node.js system errors
    const nodeErrors = ['ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND']
    if (nodeErrors.includes(error.message) || nodeErrors.includes(error.name)) {
      return error.message || error.name
    }

    // Return error name or a generic identifier
    return error.name || 'UNKNOWN_ERROR'
  }

  /**
   * Promise-based delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Factory function for creating retry policies
export function createRetryPolicy(
  operationType: keyof typeof DEFAULT_RETRY_CONFIGS = 'external_api',
  customConfig?: Partial<RetryConfig>
): RetryPolicy {
  const baseConfig = DEFAULT_RETRY_CONFIGS[operationType] || DEFAULT_RETRY_CONFIGS['external_api']
  const finalConfig = { ...baseConfig, ...customConfig }
  
  return new RetryPolicy(finalConfig, operationType)
}

// Helper function for easy retry execution
export async function withRetry<T>(
  operation: () => Promise<T>,
  context: RetryContext,
  operationType: keyof typeof DEFAULT_RETRY_CONFIGS = 'external_api',
  customConfig?: Partial<RetryConfig>
): Promise<RetryResult<T>> {
  const retryPolicy = createRetryPolicy(operationType, customConfig)
  return retryPolicy.execute(operation, context)
}

// Specialized retry functions for common operations
export async function retryExternalAPI<T>(
  operation: () => Promise<T>,
  operationName: string,
  correlationId?: string,
  customConfig?: Partial<RetryConfig>
): Promise<RetryResult<T>> {
  return withRetry(
    operation,
    { operationName, correlationId },
    'external_api',
    customConfig
  )
}

export async function retryDatabaseOperation<T>(
  operation: () => Promise<T>,
  operationName: string,
  correlationId?: string,
  customConfig?: Partial<RetryConfig>
): Promise<RetryResult<T>> {
  return withRetry(
    operation,
    { operationName, correlationId },
    'database',
    customConfig
  )
}

export async function retryPaymentOperation<T>(
  operation: () => Promise<T>,
  operationName: string,
  correlationId?: string,
  customConfig?: Partial<RetryConfig>
): Promise<RetryResult<T>> {
  return withRetry(
    operation,
    { operationName, correlationId },
    'payment_processor',
    customConfig
  )
}

export async function retryEmailOperation<T>(
  operation: () => Promise<T>,
  operationName: string,
  correlationId?: string,
  customConfig?: Partial<RetryConfig>
): Promise<RetryResult<T>> {
  return withRetry(
    operation,
    { operationName, correlationId },
    'email_service',
    customConfig
  )
}

export default RetryPolicy