import { ExclamationTriangleIcon, WifiIcon, ServerIcon } from '@heroicons/react/24/outline'
import { ErrorType } from '@/lib/environment'

interface ErrorStateProps {
  title: string
  message: string
  type?: ErrorType
  onRetry?: () => void
  retryLabel?: string
  className?: string
}

const getErrorIcon = (type?: ErrorType) => {
  switch (type) {
    case ErrorType.NETWORK_ERROR:
      return <WifiIcon className="h-12 w-12 text-red-400" />
    case ErrorType.SERVICE_UNAVAILABLE:
      return <ServerIcon className="h-12 w-12 text-red-400" />
    default:
      return <ExclamationTriangleIcon className="h-12 w-12 text-red-400" />
  }
}

const getErrorColor = (type?: ErrorType) => {
  switch (type) {
    case ErrorType.VALIDATION_ERROR:
      return 'border-yellow-200 bg-yellow-50'
    case ErrorType.NETWORK_ERROR:
      return 'border-blue-200 bg-blue-50'
    default:
      return 'border-red-200 bg-red-50'
  }
}

export function ErrorState({ 
  title, 
  message, 
  type, 
  onRetry, 
  retryLabel = "Try Again", 
  className = "" 
}: ErrorStateProps) {
  return (
    <div className={`text-center p-8 rounded-lg border-2 ${getErrorColor(type)} ${className}`}>
      <div className="flex justify-center mb-4">
        {getErrorIcon(type)}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {title}
      </h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        {message}
      </p>
      {onRetry && (
        <button 
          onClick={onRetry}
          className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold px-6 py-3 rounded-lg hover:from-yellow-300 hover:to-orange-400 transition-all duration-300 transform hover:scale-105 mx-auto"
        >
          {retryLabel}
        </button>
      )}
    </div>
  )
}

// Specific error state components for common scenarios
export function NetworkErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorState
      title="Connection Problem"
      message="Please check your internet connection and try again."
      type={ErrorType.NETWORK_ERROR}
      onRetry={onRetry}
      retryLabel="Check Connection"
    />
  )
}

export function ServiceUnavailableState({ serviceName, onRetry }: { 
  serviceName: string
  onRetry?: () => void 
}) {
  return (
    <ErrorState
      title={`${serviceName} Unavailable`}
      message={`${serviceName} is temporarily unavailable. Please try again in a few moments.`}
      type={ErrorType.SERVICE_UNAVAILABLE}
      onRetry={onRetry}
      retryLabel="Try Again"
    />
  )
}

export function ValidationErrorState({ message, onRetry }: { 
  message: string
  onRetry?: () => void 
}) {
  return (
    <ErrorState
      title="Please Check Your Input"
      message={message}
      type={ErrorType.VALIDATION_ERROR}
      onRetry={onRetry}
      retryLabel="Update Search"
    />
  )
}