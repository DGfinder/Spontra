/**
 * Retry Logic with Exponential Backoff
 * Handles transient API failures gracefully
 */

export interface RetryOptions {
  maxRetries?: number
  initialDelay?: number // milliseconds
  maxDelay?: number // milliseconds
  backoffMultiplier?: number
  retryableStatuses?: number[] // HTTP status codes that should trigger retry
  onRetry?: (attempt: number, error: Error) => void
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 200,
  maxDelay: 5000,
  backoffMultiplier: 2.5,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
  onRetry: () => {}
}

/**
 * Check if error is retryable
 */
function isRetryableError(error: any, retryableStatuses: number[]): boolean {
  // Network errors (no response)
  if (!error.response) {
    return true
  }

  // HTTP status codes that indicate transient failures
  const status = error.response.status
  return retryableStatuses.includes(status)
}

/**
 * Calculate delay for next retry using exponential backoff with jitter
 */
function calculateDelay(
  attempt: number,
  initialDelay: number,
  maxDelay: number,
  multiplier: number
): number {
  const baseDelay = Math.min(initialDelay * Math.pow(multiplier, attempt), maxDelay)

  // Add jitter (random variation ±25%) to prevent thundering herd
  const jitter = baseDelay * 0.25 * (Math.random() * 2 - 1)
  return Math.round(baseDelay + jitter)
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Retry a function with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  let lastError: Error

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error: any) {
      lastError = error

      // Don't retry if error is not retryable
      if (!isRetryableError(error, opts.retryableStatuses)) {
        throw error
      }

      // Don't retry if max attempts reached
      if (attempt >= opts.maxRetries) {
        throw error
      }

      // Calculate delay and wait
      const delay = calculateDelay(
        attempt,
        opts.initialDelay,
        opts.maxDelay,
        opts.backoffMultiplier
      )

      console.log(
        `[Retry] Attempt ${attempt + 1}/${opts.maxRetries + 1} failed. Retrying in ${delay}ms...`,
        error.message || error
      )

      opts.onRetry(attempt + 1, error)

      await sleep(delay)
    }
  }

  // This should never be reached due to throw in loop, but TypeScript needs it
  throw lastError!
}

/**
 * Retry specifically for Axios requests with rate limit handling
 */
export async function withRetryAxios<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  return withRetry(fn, {
    ...options,
    retryableStatuses: [
      ...(options.retryableStatuses || DEFAULT_OPTIONS.retryableStatuses),
      429 // Always retry rate limits for Axios
    ],
    onRetry: (attempt, error: any) => {
      // Check if error has Retry-After header
      if (error.response?.headers?.['retry-after']) {
        const retryAfter = parseInt(error.response.headers['retry-after'], 10)
        if (!isNaN(retryAfter)) {
          console.log(`[Retry] Rate limited. Retry-After: ${retryAfter}s`)
        }
      }

      options.onRetry?.(attempt, error)
    }
  })
}

/**
 * Circuit breaker state (advanced)
 * Prevents cascading failures by "opening" after too many failures
 */
class CircuitBreaker {
  private failures = 0
  private lastFailureTime = 0
  private state: 'closed' | 'open' | 'half-open' = 'closed'

  constructor(
    private failureThreshold = 5,
    private resetTimeout = 60000 // 1 minute
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // If circuit is open, check if we should try again
    if (this.state === 'open') {
      const now = Date.now()
      if (now - this.lastFailureTime >= this.resetTimeout) {
        this.state = 'half-open'
        this.failures = 0
      } else {
        throw new Error('Circuit breaker is OPEN - too many recent failures')
      }
    }

    try {
      const result = await fn()

      // Success - reset circuit if it was half-open
      if (this.state === 'half-open') {
        this.state = 'closed'
        this.failures = 0
      }

      return result
    } catch (error) {
      this.failures++
      this.lastFailureTime = Date.now()

      // Open circuit if threshold reached
      if (this.failures >= this.failureThreshold) {
        this.state = 'open'
        console.error(
          `[Circuit Breaker] OPENED after ${this.failures} failures. Will retry in ${this.resetTimeout}ms`
        )
      }

      throw error
    }
  }

  getState() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime
    }
  }

  reset() {
    this.state = 'closed'
    this.failures = 0
    this.lastFailureTime = 0
  }
}

// Global circuit breaker for Travelpayouts API
export const travelpayoutsCircuitBreaker = new CircuitBreaker(5, 60000)
