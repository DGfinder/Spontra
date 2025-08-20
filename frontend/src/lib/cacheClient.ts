// =============================================================================
// CLIENT-SIDE CACHE (localStorage + Memory)
// =============================================================================
// Used by frontend components for caching destination search results with TTL

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number // Time to live in milliseconds
  key: string
}

class ClientCache {
  private storage: Storage | null = null
  private memoryCache: Map<string, CacheEntry<unknown>> = new Map()

  constructor() {
    // Check if localStorage is available (client-side only)
    if (typeof window !== 'undefined' && window.localStorage) {
      this.storage = window.localStorage
    }
  }

  /**
   * Generate a cache key from search parameters
   */
  generateKey(params: Record<string, unknown>): string {
    // Create a stable key from search parameters
    const sortedParams = Object.keys(params)
      .filter(key => params[key] !== undefined && params[key] !== null)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join('|')
    
    return `destination-search:${sortedParams}`
  }

  /**
   * Set cache entry with TTL
   */
  set<T>(key: string, data: T, ttlHours: number = 24): void {
    const ttl = ttlHours * 60 * 60 * 1000 // Convert hours to milliseconds
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      key
    }

    // Store in memory cache
    this.memoryCache.set(key, entry)

    // Store in localStorage if available
    if (this.storage) {
      try {
        this.storage.setItem(`cache:${key}`, JSON.stringify(entry))
      } catch (error) {
        console.warn('Failed to store in localStorage:', error)
      }
    }

    console.log(`💾 Cached destination results: ${key} (TTL: ${ttlHours}h)`)
  }

  /**
   * Get cache entry if still valid
   */
  get<T>(key: string): T | null {
    // Check memory cache first
    let entry = this.memoryCache.get(key)

    // If not in memory, try localStorage
    if (!entry && this.storage) {
      try {
        const stored = this.storage.getItem(`cache:${key}`)
        if (stored) {
          entry = JSON.parse(stored)
          // Restore to memory cache
          if (entry) {
            this.memoryCache.set(key, entry)
          }
        }
      } catch (error) {
        console.warn('Failed to read from localStorage:', error)
      }
    }

    if (!entry) {
      return null
    }

    // Check if entry has expired
    const now = Date.now()
    const age = now - entry.timestamp
    
    if (age > entry.ttl) {
      console.log(`⏰ Cache expired for ${key} (age: ${Math.round(age / 1000 / 60)}min)`)
      this.delete(key)
      return null
    }

    const remainingHours = Math.round((entry.ttl - age) / 1000 / 60 / 60 * 10) / 10
    console.log(`✅ Cache hit for ${key} (expires in ${remainingHours}h)`)
    return entry.data as T
  }

  /**
   * Delete cache entry
   */
  delete(key: string): void {
    this.memoryCache.delete(key)
    if (this.storage) {
      this.storage.removeItem(`cache:${key}`)
    }
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.memoryCache.clear()
    if (this.storage) {
      // Clear all cache entries from localStorage
      const keys = Object.keys(this.storage).filter(k => k.startsWith('cache:'))
      keys.forEach(key => this.storage!.removeItem(key))
    }
    console.log('🧹 All cache entries cleared')
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    memoryEntries: number
    localStorageEntries: number
    totalSizeKB?: number
  } {
    let localStorageEntries = 0
    let totalSizeKB = 0

    if (this.storage) {
      const cacheKeys = Object.keys(this.storage).filter(k => k.startsWith('cache:'))
      localStorageEntries = cacheKeys.length
      
      // Calculate approximate size
      cacheKeys.forEach(key => {
        const value = this.storage!.getItem(key) || ''
        totalSizeKB += value.length / 1024
      })
    }

    return {
      memoryEntries: this.memoryCache.size,
      localStorageEntries,
      totalSizeKB: Math.round(totalSizeKB * 100) / 100
    }
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now()
    let cleanedCount = 0

    // Clean memory cache
    const memoryEntries = Array.from(this.memoryCache.entries())
    for (const [key, entry] of memoryEntries) {
      if (now - entry.timestamp > entry.ttl) {
        this.memoryCache.delete(key)
        cleanedCount++
      }
    }

    // Clean localStorage
    if (this.storage) {
      const cacheKeys = Object.keys(this.storage).filter(k => k.startsWith('cache:'))
      for (const key of cacheKeys) {
        try {
          const stored = this.storage.getItem(key)
          if (stored) {
            const entry = JSON.parse(stored)
            if (now - entry.timestamp > entry.ttl) {
              this.storage.removeItem(key)
              cleanedCount++
            }
          }
        } catch (error) {
          // Remove corrupted entries
          this.storage.removeItem(key)
          cleanedCount++
        }
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} expired cache entries`)
    }
  }
}

// Singleton instance
export const destinationCache = new ClientCache()

// Types for destination caching
export interface CachedDestinationSearch {
  results: unknown[]
  searchParams: {
    origin: string
    maxFlightTime?: number
    theme: string
    departureDate?: string
    viewBy?: string
  }
  meta: {
    searchTimestamp: string
    totalResults: number
    dataSource: string
  }
}

// Helper function to create cache key from search params
export function createDestinationCacheKey(params: {
  origin: string
  maxFlightTime?: number
  theme: string
  departureDate?: string
  viewBy?: string
}): string {
  return destinationCache.generateKey({
    origin: params.origin,
    maxFlightTime: params.maxFlightTime,
    theme: params.theme,
    // Group by date to allow some flexibility (cache for whole day)
    date: params.departureDate?.split('T')[0],
    viewBy: params.viewBy
  })
}

// Auto-cleanup on page load
if (typeof window !== 'undefined') {
  // Clean up expired entries when the page loads
  setTimeout(() => {
    destinationCache.cleanup()
  }, 1000)

  // Periodic cleanup every 10 minutes
  setInterval(() => {
    destinationCache.cleanup()
  }, 10 * 60 * 1000)
}