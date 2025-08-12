'use client'

import { useState, useEffect } from 'react'
import { Database, Zap, RefreshCw } from 'lucide-react'
import { useCacheStatus, useDestinationCache } from '@/hooks/useDestinationCache'

interface CacheIndicatorProps {
  isVisible?: boolean
  className?: string
}

export function CacheIndicator({ isVisible = true, className = '' }: CacheIndicatorProps) {
  const { hasCache, cacheSize } = useCacheStatus()
  const { cacheStats, clearCache } = useDestinationCache()
  const [showDetails, setShowDetails] = useState(false)

  if (!isVisible || !hasCache) {
    return null
  }

  return (
    <div className={`relative ${className}`}>
      {/* Cache Status Badge */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="flex items-center space-x-2 px-3 py-1.5 bg-green-900/30 border border-green-500/30 rounded-full text-green-400 hover:bg-green-900/40 transition-colors text-sm"
        title="Search results cached for faster loading"
      >
        <Zap size={14} />
        <span>Cached Results</span>
        <Database size={12} className="opacity-70" />
      </button>

      {/* Cache Details Popup */}
      {showDetails && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-black/90 backdrop-blur-sm border border-white/20 rounded-lg p-4 text-white z-50">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-green-400">Cache Status</h4>
            <button
              onClick={() => setShowDetails(false)}
              className="text-white/40 hover:text-white/60"
            >
              ×
            </button>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-white/70">Memory entries:</span>
              <span className="text-green-400">{cacheStats.memoryEntries}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-white/70">Storage entries:</span>
              <span className="text-green-400">{cacheStats.localStorageEntries}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-white/70">Cache size:</span>
              <span className="text-green-400">{cacheSize} KB</span>
            </div>

            <div className="border-t border-white/20 pt-2 mt-3">
              <p className="text-white/50 text-xs mb-2">
                💡 Cached results load instantly and refresh every 24 hours to match Amadeus data updates.
              </p>
              
              <button
                onClick={() => {
                  clearCache()
                  setShowDetails(false)
                }}
                className="flex items-center space-x-1 text-red-400 hover:text-red-300 text-xs"
              >
                <RefreshCw size={12} />
                <span>Clear Cache</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Compact version for header/summary areas
export function CacheIndicatorCompact({ className = '' }: { className?: string }) {
  const { hasCache } = useCacheStatus()

  if (!hasCache) {
    return null
  }

  return (
    <div className={`flex items-center space-x-1 text-green-400 ${className}`}>
      <Zap size={12} />
      <span className="text-xs">Cached</span>
    </div>
  )
}