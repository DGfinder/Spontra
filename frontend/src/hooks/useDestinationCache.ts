import { useCallback, useEffect, useState } from 'react'
import { destinationCache } from '@/lib/cacheClient'

// Hook for managing destination cache operations
export function useDestinationCache() {
  const [cacheStats, setCacheStats] = useState(() => destinationCache.getStats())

  // Refresh cache stats
  const refreshStats = useCallback(() => {
    setCacheStats(destinationCache.getStats())
  }, [])

  // Clear all cached destinations
  const clearCache = useCallback(() => {
    destinationCache.clear()
    refreshStats()
    console.log('🗑️ Destination cache cleared by user')
  }, [refreshStats])

  // Cleanup expired entries
  const cleanupExpired = useCallback(() => {
    destinationCache.cleanup()
    refreshStats()
  }, [refreshStats])

  // Force refresh - clears cache for a specific search
  const invalidateSearch = useCallback((searchParams: {
    origin: string
    maxFlightTime?: number
    theme: string
    departureDate?: string
    viewBy?: string
  }) => {
    const key = destinationCache.generateKey({
      origin: searchParams.origin,
      maxFlightTime: searchParams.maxFlightTime,
      theme: searchParams.theme,
      date: searchParams.departureDate?.split('T')[0],
      viewBy: searchParams.viewBy
    })
    
    destinationCache.delete(key)
    refreshStats()
    console.log('🔄 Invalidated cache for search:', searchParams)
  }, [refreshStats])

  // Auto-refresh stats when cache operations happen
  useEffect(() => {
    const interval = setInterval(refreshStats, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [refreshStats])

  return {
    cacheStats,
    clearCache,
    cleanupExpired,
    invalidateSearch,
    refreshStats
  }
}

// Helper hook for cache status indicators
export function useCacheStatus() {
  const [hasCache, setHasCache] = useState(false)
  const [cacheSize, setCacheSize] = useState(0)

  const updateStatus = useCallback(() => {
    const stats = destinationCache.getStats()
    setHasCache(stats.memoryEntries > 0 || stats.localStorageEntries > 0)
    setCacheSize(stats.totalSizeKB || 0)
  }, [])

  useEffect(() => {
    updateStatus()
    const interval = setInterval(updateStatus, 10000) // Update every 10 seconds
    return () => clearInterval(interval)
  }, [updateStatus])

  return {
    hasCache,
    cacheSize: Math.round(cacheSize * 100) / 100,
    updateStatus
  }
}