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
    
    // Log error to console for MVP
    console.error('ErrorBoundary caught error:', error, errorInfo)
    
    // Call onError prop if provided
    this.props.onError?.(error, errorInfo)
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError && this.state.error && this.state.errorInfo) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.state.errorInfo, this.resetError)
      }

      // Default error UI
      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="text-center">
              <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Something went wrong
              </h1>
              <p className="text-gray-600 mb-6">
                We apologize for the inconvenience. Please try refreshing the page or go back to the home page.
              </p>
              
              {process.env.NODE_ENV === 'development' && (
                <details className="mb-6 text-left">
                  <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                    Error Details (Development Only)
                  </summary>
                  <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-auto">
                    {this.state.error.message}
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
              
              <div className="space-y-3">
                <button
                  onClick={this.resetError}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </button>
                
                <button
                  onClick={() => window.location.href = '/'}
                  className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-md transition-colors flex items-center justify-center gap-2"
                >
                  <Home className="h-4 w-4" />
                  Go Home
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Specialized error boundaries for different app sections
export const SearchFormErrorBoundary = ({ children }: { children: React.ReactNode }) => (
  <ErrorBoundary
    fallback={(error, errorInfo, resetError) => (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-4">
        <div className="flex items-center gap-2 text-red-700 mb-2">
          <AlertTriangle className="h-5 w-5" />
          <h3 className="font-medium">Search Form Error</h3>
        </div>
        <p className="text-red-600 text-sm mb-3">
          There was an error with the search form. Please try refreshing the page.
        </p>
        <button
          onClick={resetError}
          className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded text-sm font-medium"
        >
          Try Again
        </button>
      </div>
    )}
  >
    {children}
  </ErrorBoundary>
)

export const FlightResultsErrorBoundary = ({ children }: { children: React.ReactNode }) => (
  <ErrorBoundary
    fallback={(error, errorInfo, resetError) => (
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 m-4">
        <div className="flex items-center gap-2 text-orange-700 mb-2">
          <AlertTriangle className="h-5 w-5" />
          <h3 className="font-medium">Flight Results Error</h3>
        </div>
        <p className="text-orange-600 text-sm mb-3">
          Unable to load flight results. This might be due to API issues or network problems.
        </p>
        <button
          onClick={resetError}
          className="bg-orange-100 hover:bg-orange-200 text-orange-700 px-3 py-1 rounded text-sm font-medium"
        >
          Retry Search
        </button>
      </div>
    )}
  >
    {children}
  </ErrorBoundary>
)

export const BookingFlowErrorBoundary = ({ children }: { children: React.ReactNode }) => (
  <ErrorBoundary
    fallback={(error, errorInfo, resetError) => (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 m-4">
        <div className="flex items-center gap-2 text-blue-700 mb-2">
          <AlertTriangle className="h-5 w-5" />
          <h3 className="font-medium">Booking Flow Error</h3>
        </div>
        <p className="text-blue-600 text-sm mb-3">
          There was an error in the booking process. Your search results are still available.
        </p>
        <div className="flex gap-2">
          <button
            onClick={resetError}
            className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded text-sm font-medium"
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm font-medium"
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