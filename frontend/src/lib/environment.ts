// Environment detection and configuration
export const isProduction = process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_APP_ENV === 'production'
export const isDevelopment = !isProduction

// Mock data control - only allow in development
export const enableMockFallbacks = isDevelopment && process.env.NEXT_PUBLIC_ENABLE_MOCK_FALLBACKS !== 'false'

// Error handling configuration
export const showDetailedErrors = isDevelopment

// API configuration
export const apiConfig = {
  retryAttempts: 3,
  retryDelayMs: 1000,
  timeoutMs: 30000,
} as const

export enum ErrorType {
  NETWORK_ERROR = 'network_error',
  API_ERROR = 'api_error',
  VALIDATION_ERROR = 'validation_error',
  RATE_LIMIT_ERROR = 'rate_limit_error',
  SERVICE_UNAVAILABLE = 'service_unavailable',
  TIMEOUT_ERROR = 'timeout_error'
}

export interface APIError {
  type: ErrorType
  message: string
  userMessage: string
  retryable: boolean
  code?: string
}

// Production-safe error messages
export const getErrorMessage = (error: unknown, context: string): APIError => {
  const defaultError: APIError = {
    type: ErrorType.API_ERROR,
    message: `${context} failed`,
    userMessage: `We're having trouble with ${context.toLowerCase()} right now. Please try again in a moment.`,
    retryable: true
  }

  if (typeof error === 'string') {
    if (error.includes('network') || error.includes('fetch')) {
      return {
        type: ErrorType.NETWORK_ERROR,
        message: error,
        userMessage: "Please check your internet connection and try again.",
        retryable: true
      }
    }
    if (error.includes('rate limit') || error.includes('429')) {
      return {
        type: ErrorType.RATE_LIMIT_ERROR,
        message: error,
        userMessage: "Too many requests. Please wait a moment and try again.",
        retryable: true
      }
    }
    if (error.includes('timeout')) {
      return {
        type: ErrorType.TIMEOUT_ERROR,
        message: error,
        userMessage: "The request is taking longer than expected. Please try again.",
        retryable: true
      }
    }
  }

  if (error instanceof Error) {
    if (error.message.includes('400') || error.message.includes('validation')) {
      return {
        type: ErrorType.VALIDATION_ERROR,
        message: error.message,
        userMessage: "Please check your search criteria and try again.",
        retryable: false
      }
    }
    if (error.message.includes('500') || error.message.includes('503')) {
      return {
        type: ErrorType.SERVICE_UNAVAILABLE,
        message: error.message,
        userMessage: "This service is temporarily unavailable. Please try again later.",
        retryable: true
      }
    }
  }

  return defaultError
}