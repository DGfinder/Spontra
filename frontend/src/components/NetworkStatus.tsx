'use client'

import { useState, useEffect } from 'react'
import { Wifi, WifiOff, AlertCircle, CheckCircle } from 'lucide-react'

interface NetworkStatusProps {
  onRetry?: () => void
  className?: string
}

export function NetworkStatus({ onRetry, className = '' }: NetworkStatusProps) {
  const [isOnline, setIsOnline] = useState(true)
  const [connectionQuality, setConnectionQuality] = useState<'good' | 'poor' | 'offline'>('good')

  useEffect(() => {
    // Initial state
    setIsOnline(navigator.onLine)

    // Test connection quality
    const testConnection = async () => {
      if (!navigator.onLine) {
        setConnectionQuality('offline')
        return
      }

      try {
        const start = Date.now()
        const response = await fetch('/api/health', {
          method: 'HEAD',
          cache: 'no-cache'
        })
        const duration = Date.now() - start

        if (response.ok) {
          setConnectionQuality(duration > 3000 ? 'poor' : 'good')
        } else {
          setConnectionQuality('poor')
        }
      } catch {
        setConnectionQuality('poor')
      }
    }

    // Event listeners
    const handleOnline = () => {
      setIsOnline(true)
      testConnection()
    }

    const handleOffline = () => {
      setIsOnline(false)
      setConnectionQuality('offline')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Test initial connection
    testConnection()

    // Periodic connection testing
    const interval = setInterval(testConnection, 30000) // Test every 30s

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(interval)
    }
  }, [])

  if (connectionQuality === 'good') {
    return null // Don't show anything when connection is good
  }

  const getStatusConfig = () => {
    switch (connectionQuality) {
      case 'offline':
        return {
          icon: WifiOff,
          title: 'No internet connection',
          message: 'Please check your connection and try again.',
          color: 'red',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-400/30',
          textColor: 'text-red-300'
        }
      case 'poor':
        return {
          icon: AlertCircle,
          title: 'Connection issues',
          message: 'Slow or unstable connection detected.',
          color: 'yellow',
          bgColor: 'bg-yellow-500/10',
          borderColor: 'border-yellow-400/30',
          textColor: 'text-yellow-300'
        }
      default:
        return {
          icon: CheckCircle,
          title: 'Connection restored',
          message: 'Your connection is working normally.',
          color: 'green',
          bgColor: 'bg-green-500/10',
          borderColor: 'border-green-400/30',
          textColor: 'text-green-300'
        }
    }
  }

  const config = getStatusConfig()
  const Icon = config.icon

  return (
    <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 ${className}`}>
      <div className={`${config.bgColor} ${config.borderColor} border rounded-lg p-4 backdrop-blur-sm shadow-lg max-w-sm mx-auto`}>
        <div className="flex items-center space-x-3">
          <Icon className={`w-5 h-5 ${config.textColor}`} />
          <div className="flex-1">
            <h4 className={`font-medium ${config.textColor} text-sm`}>
              {config.title}
            </h4>
            <p className="text-white/70 text-xs mt-1">
              {config.message}
            </p>
          </div>
          {onRetry && (connectionQuality === 'poor' || connectionQuality === 'offline') && (
            <button
              onClick={onRetry}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                connectionQuality === 'offline' 
                  ? 'bg-red-500 hover:bg-red-400 text-white' 
                  : 'bg-yellow-500 hover:bg-yellow-400 text-white'
              }`}
            >
              Retry
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// Hook for network status
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [connectionQuality, setConnectionQuality] = useState<'good' | 'poor' | 'offline'>('good')

  useEffect(() => {
    const updateNetworkStatus = () => {
      setIsOnline(navigator.onLine)
    }

    window.addEventListener('online', updateNetworkStatus)
    window.addEventListener('offline', updateNetworkStatus)

    return () => {
      window.removeEventListener('online', updateNetworkStatus)
      window.removeEventListener('offline', updateNetworkStatus)
    }
  }, [])

  return { isOnline, connectionQuality }
}