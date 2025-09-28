/**
 * Edge Runtime Compatible Cache Client
 * Uses Vercel KV for Edge runtime routes where Node.js modules aren't available
 */

import { kv } from '@vercel/kv'

export interface CacheOptions {
  ttlSeconds?: number
  keyPrefix?: string
}

/**
 * Edge-compatible cache using Vercel KV
 * Fallback to in-memory for development when KV isn't available
 */
class EdgeCache {
  private memoryCache = new Map<string, { value: any; expires: number }>()
  private keyPrefix: string

  constructor(keyPrefix = 'spontra') {
    this.keyPrefix = keyPrefix
  }

  private getKey(key: string): string {
    return `${this.keyPrefix}:${key}`
  }

  private isExpired(expires: number): boolean {
    return Date.now() > expires
  }

  async get<T = any>(key: string): Promise<T | null> {
    const cacheKey = this.getKey(key)

    try {
      // Try Vercel KV first
      if (process.env.KV_URL) {
        const result = await kv.get<T>(cacheKey)
        return result
      }
    } catch (error) {
      console.warn('KV cache miss, falling back to memory:', error)
    }

    // Fallback to memory cache
    const memoryItem = this.memoryCache.get(cacheKey)
    if (memoryItem && !this.isExpired(memoryItem.expires)) {
      return memoryItem.value as T
    }

    // Clean up expired memory cache
    if (memoryItem && this.isExpired(memoryItem.expires)) {
      this.memoryCache.delete(cacheKey)
    }

    return null
  }

  async set<T = any>(
    key: string, 
    value: T, 
    options: CacheOptions = {}
  ): Promise<void> {
    const cacheKey = this.getKey(key)
    const ttlSeconds = options.ttlSeconds || 300 // 5 minutes default

    try {
      // Try Vercel KV first
      if (process.env.KV_URL) {
        await kv.set(cacheKey, value, { ex: ttlSeconds })
        return
      }
    } catch (error) {
      console.warn('KV cache set failed, falling back to memory:', error)
    }

    // Fallback to memory cache
    const expires = Date.now() + (ttlSeconds * 1000)
    this.memoryCache.set(cacheKey, { value, expires })

    // Clean up old memory cache entries periodically
    if (this.memoryCache.size > 100) {
      this.cleanupMemoryCache()
    }
  }

  async delete(key: string): Promise<void> {
    const cacheKey = this.getKey(key)

    try {
      if (process.env.KV_URL) {
        await kv.del(cacheKey)
      }
    } catch (error) {
      console.warn('KV cache delete failed:', error)
    }

    // Also remove from memory cache
    this.memoryCache.delete(cacheKey)
  }

  async exists(key: string): Promise<boolean> {
    const cacheKey = this.getKey(key)

    try {
      if (process.env.KV_URL) {
        const exists = await kv.exists(cacheKey)
        return exists === 1
      }
    } catch (error) {
      console.warn('KV cache exists check failed:', error)
    }

    // Check memory cache
    const memoryItem = this.memoryCache.get(cacheKey)
    return memoryItem ? !this.isExpired(memoryItem.expires) : false
  }

  private cleanupMemoryCache(): void {
    const now = Date.now()
    for (const [key, item] of this.memoryCache.entries()) {
      if (this.isExpired(item.expires)) {
        this.memoryCache.delete(key)
      }
    }
  }

  // Utility method for performance metrics
  async getStats(): Promise<{
    provider: 'kv' | 'memory'
    memorySize: number
    uptime: string
  }> {
    return {
      provider: process.env.KV_URL ? 'kv' : 'memory',
      memorySize: this.memoryCache.size,
      uptime: process.uptime?.() ? `${Math.floor(process.uptime() / 60)}min` : 'unknown'
    }
  }
}

// Singleton instance for Edge runtime
const edgeCache = new EdgeCache('spontra-edge')

// Convenience functions matching cacheServer API
export async function cacheGet<T = any>(key: string): Promise<T | null> {
  return edgeCache.get<T>(key)
}

export async function cacheSet<T = any>(
  key: string, 
  value: T, 
  options: CacheOptions = {}
): Promise<void> {
  return edgeCache.set(key, value, options)
}

export async function cacheDelete(key: string): Promise<void> {
  return edgeCache.delete(key)
}

export async function cacheExists(key: string): Promise<boolean> {
  return edgeCache.exists(key)
}

export async function getCacheStats() {
  return edgeCache.getStats()
}

export { edgeCache as cache }
export default edgeCache