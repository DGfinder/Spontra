import React from 'react'
import * as Sentry from '@sentry/nextjs'

// Error severity levels
export type ErrorSeverity = 'error' | 'warning' | 'info' | 'debug'

// Custom error types for better categorization
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public endpoint?: string
  ) {
    super(message)
    this.name = 'APIError'
  }
}

export class DatabaseError extends Error {
  constructor(
    message: string,
    public operation?: string,
    public table?: string
  ) {
    super(message)
    this.name = 'DatabaseError'
  }
}

export class AuthenticationError extends Error {
  constructor(message: string, public userId?: string) {
    super(message)
    this.name = 'AuthenticationError'
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public value?: any
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}

// Sentry helper functions
export const sentryHelpers = {
  /**
   * Log an error to Sentry with additional context
   */
  captureError(
    error: Error,
    severity: ErrorSeverity = 'error',
    context?: Record<string, any>
  ) {
    Sentry.withScope((scope) => {
      scope.setLevel(severity)
      
      if (context) {
        Object.entries(context).forEach(([key, value]) => {
          scope.setContext(key, value)
        })
      }
      
      // Add error classification
      if (error instanceof APIError) {
        scope.setTag('error_type', 'api')
        scope.setContext('api', {
          statusCode: error.statusCode,
          endpoint: error.endpoint
        })
      } else if (error instanceof DatabaseError) {
        scope.setTag('error_type', 'database')
        scope.setContext('database', {
          operation: error.operation,
          table: error.table
        })
      } else if (error instanceof AuthenticationError) {
        scope.setTag('error_type', 'auth')
        scope.setContext('auth', {
          userId: error.userId
        })
      } else if (error instanceof ValidationError) {
        scope.setTag('error_type', 'validation')
        scope.setContext('validation', {
          field: error.field,
          value: error.value
        })
      }
      
      Sentry.captureException(error)
    })
  },

  /**
   * Log a message to Sentry
   */
  captureMessage(
    message: string,
    severity: ErrorSeverity = 'info',
    context?: Record<string, any>
  ) {
    Sentry.withScope((scope) => {
      scope.setLevel(severity)
      
      if (context) {
        Object.entries(context).forEach(([key, value]) => {
          scope.setContext(key, value)
        })
      }
      
      Sentry.captureMessage(message)
    })
  },

  /**
   * Set user context for subsequent events
   */
  setUser(user: {
    id?: string
    email?: string
    username?: string
    [key: string]: any
  }) {
    Sentry.setUser(user)
  },

  /**
   * Clear user context
   */
  clearUser() {
    Sentry.setUser(null)
  },

  /**
   * Add breadcrumb for debugging
   */
  addBreadcrumb(
    message: string,
    category: string = 'default',
    level: ErrorSeverity = 'info',
    data?: Record<string, any>
  ) {
    Sentry.addBreadcrumb({
      message,
      category,
      level,
      data,
      timestamp: Date.now() / 1000,
    })
  },

  /**
   * Start a transaction for performance monitoring
   * Note: startTransaction is deprecated in Sentry 8.x, use startSpan instead
   */
  startTransaction(name: string, operation?: string) {
    return Sentry.startSpan({
      name,
      op: operation || 'function',
    }, (span) => span)
  },

  /**
   * Capture performance metrics
   */
  captureMetric(
    name: string,
    value: number,
    unit: string = 'none',
    tags?: Record<string, string>
  ) {
    Sentry.metrics.increment(name, value, {
      unit,
      tags,
    })
  },

  /**
   * Handle API route errors consistently
   */
  handleAPIError(
    error: unknown,
    endpoint: string,
    method: string,
    userId?: string
  ) {
    let sentryError: Error
    
    if (error instanceof Error) {
      sentryError = new APIError(error.message, 500, endpoint)
    } else {
      sentryError = new APIError('Unknown API error', 500, endpoint)
    }
    
    this.captureError(sentryError, 'error', {
      api: {
        endpoint,
        method,
        userId,
        timestamp: new Date().toISOString(),
      },
    })
    
    return sentryError
  },

  /**
   * Monitor database operations
   */
  monitorDatabaseOperation<T>(
    operation: string,
    table: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const transaction = this.startTransaction(`db.${operation}`, 'db')
    transaction.setTag('db.table', table)
    
    return fn()
      .catch((error) => {
        const dbError = new DatabaseError(
          error.message || 'Database operation failed',
          operation,
          table
        )
        
        this.captureError(dbError, 'error', {
          database: {
            operation,
            table,
            error: error.message,
          },
        })
        
        throw dbError
      })
      .finally(() => {
        transaction.finish()
      })
  },
}

// Global error boundary helper for React components
export function withSentryErrorBoundary<T extends React.ComponentType<any>>(
  Component: T,
  options?: {
    fallback?: React.ComponentType<any>
    showDialog?: boolean
  }
): T {
  const fallbackComponent = options?.fallback || React.createElement('div', null, 'Something went wrong')
  
  return Sentry.withErrorBoundary(Component, {
    fallback: fallbackComponent as React.ComponentType<Sentry.ErrorBoundaryFallbackProps>,
    showDialog: options?.showDialog || false,
  }) as T
}

// Initialize Sentry configuration check
export function checkSentryConfig(): {
  configured: boolean
  environment: string
  message: string
} {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN
  const environment = process.env.NODE_ENV || 'development'
  
  if (!dsn) {
    return {
      configured: false,
      environment,
      message: 'Sentry DSN not configured'
    }
  }
  
  return {
    configured: true,
    environment,
    message: 'Sentry is properly configured'
  }
}

export default sentryHelpers