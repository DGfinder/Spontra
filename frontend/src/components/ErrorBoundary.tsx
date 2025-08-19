'use client'

import { Component, ReactNode, ErrorInfo } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: (error: Error, errorInfo: ErrorInfo, resetError: () => void) => ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo })
    
    // Call the onError callback if provided
    this.props.onError?.(error, errorInfo)
    
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error Boundary caught an error:', error, errorInfo)
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback && this.state.error && this.state.errorInfo) {
        return this.props.fallback(this.state.error, this.state.errorInfo, this.resetError)
      }

      return (
        <DefaultErrorFallback 
          error={this.state.error} 
          errorInfo={this.state.errorInfo}
          resetError={this.resetError}
        />
      )
    }

    return this.props.children
  }
}

interface DefaultErrorFallbackProps {
  error?: Error
  errorInfo?: ErrorInfo
  resetError: () => void
}

function DefaultErrorFallback({ error, errorInfo, resetError }: DefaultErrorFallbackProps) {
  const isProduction = process.env.NODE_ENV === 'production'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 text-center">
        {/* Error Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
        </div>

        {/* Error Message */}
        <h1 className="text-2xl font-bold mb-4">
          Something went wrong
        </h1>
        
        <p className="text-white/70 mb-6 leading-relaxed">
          We're sorry, but something unexpected happened. Please try refreshing the page or go back to the home page.
        </p>

        {/* Error Details (Development only) */}
        {!isProduction && error && (
          <details className="text-left mb-6 bg-black/20 rounded-lg p-4">
            <summary className="cursor-pointer text-sm font-medium text-red-400 mb-2">
              Error Details (Development)
            </summary>
            <div className="text-xs text-white/60 space-y-2">
              <div>
                <strong>Error:</strong> {error.message}
              </div>
              {error.stack && (
                <div>
                  <strong>Stack:</strong>
                  <pre className="mt-1 whitespace-pre-wrap break-all">
                    {error.stack}
                  </pre>
                </div>
              )}
              {errorInfo?.componentStack && (
                <div>
                  <strong>Component Stack:</strong>
                  <pre className="mt-1 whitespace-pre-wrap break-all">
                    {errorInfo.componentStack}
                  </pre>
                </div>
              )}
            </div>
          </details>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={resetError}
            className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-300 hover:to-orange-400 text-black font-semibold py-3 px-6 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
          
          <button
            onClick={() => window.location.href = '/'}
            className="w-full bg-white/10 hover:bg-white/20 text-white font-medium py-3 px-6 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2 border border-white/20"
          >
            <Home className="w-4 h-4" />
            <span>Go Home</span>
          </button>
        </div>

        {/* Support Information */}
        <div className="mt-6 pt-6 border-t border-white/10">
          <p className="text-xs text-white/50">
            If this problem persists, please contact our support team.
          </p>
        </div>
      </div>
    </div>
  )
}

// Hook to use error boundary programmatically
export function useErrorHandler() {
  return (error: Error, errorInfo?: ErrorInfo) => {
    // In React 18+, you can throw errors to trigger error boundaries
    throw error
  }
}

// Higher-order component wrapper
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WithErrorBoundaryComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  )

  WithErrorBoundaryComponent.displayName = `withErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`
  
  return WithErrorBoundaryComponent
}

// Specialized error boundaries for different sections
export function SearchFormErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary 
      onError={(error, errorInfo) => {
        console.error('Search form error:', error)
        // Report search form specific errors
      }}
      fallback={(error, errorInfo, resetError) => (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <AlertTriangle className="w-8 h-8 mx-auto text-red-500 mb-2" />
          <p className="text-red-700 mb-2">Search form is temporarily unavailable</p>
          <button 
            onClick={resetError}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  )
}

export function FlightResultsErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary 
      onError={(error, errorInfo) => {
        console.error('Flight results error:', error)
        // Report flight results specific errors
      }}
      fallback={(error, errorInfo, resetError) => (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <AlertTriangle className="w-8 h-8 mx-auto text-yellow-500 mb-2" />
          <h3 className="text-yellow-800 font-semibold mb-2">Unable to display flight results</h3>
          <p className="text-yellow-700 mb-4">There was an issue loading flight information.</p>
          <div className="space-x-2">
            <button 
              onClick={resetError}
              className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
            >
              Retry Search
            </button>
            <button 
              onClick={() => window.location.href = '/'}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Start Over
            </button>
          </div>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  )
}

export function BookingFlowErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary 
      onError={(error, errorInfo) => {
        console.error('Booking flow error:', error)
        // Critical: report booking errors immediately
      }}
      fallback={(error, errorInfo, resetError) => (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center max-w-md mx-auto">
          <AlertTriangle className="w-12 h-12 mx-auto text-red-500 mb-4" />
          <h3 className="text-red-800 font-bold text-lg mb-2">Booking Error</h3>
          <p className="text-red-700 mb-4">
            There was an issue with the booking process. <strong>Your booking has not been completed.</strong>
          </p>
          <p className="text-sm text-red-600 mb-4">
            Please try again or contact support if the problem persists.
          </p>
          <div className="space-y-2">
            <button 
              onClick={resetError}
              className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Try Booking Again
            </button>
            <button 
              onClick={() => window.history.back()}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Go Back
            </button>
          </div>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  )
}