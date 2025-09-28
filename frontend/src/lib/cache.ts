import { kv } from '@vercel/kv'

export interface CacheOptions {
  ex?: number // Expiration in seconds
  px?: number // Expiration in milliseconds
  nx?: boolean // Only set if key doesn't exist
  xx?: boolean // Only set if key exists
}

class VercelKVCache {
  private prefix: string

  constructor(prefix: string = 'spontra') {
    this.prefix = prefix
  }

  private getKey(key: string): string {
    return `${this.prefix}:${key}`
  }

  async set(key: string, value: any, options?: CacheOptions): Promise<boolean> {
    try {
      const cacheKey = this.getKey(key)
      const serializedValue = JSON.stringify(value)
      
      if (options?.ex) {
        await kv.set(cacheKey, serializedValue, { ex: options.ex })
      } else if (options?.px) {
        await kv.set(cacheKey, serializedValue, { px: options.px })
      } else {
        await kv.set(cacheKey, serializedValue)
      }
      
      return true
    } catch (error) {
      console.error('Cache set error:', error)
      return false
    }
  }

  async get<T = any>(key: string): Promise<T | null> {
    try {
      const cacheKey = this.getKey(key)
      const value = await kv.get<string>(cacheKey)
      
      if (value === null) return null
      
      return JSON.parse(value) as T
    } catch (error) {
      console.error('Cache get error:', error)
      return null
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      const cacheKey = this.getKey(key)
      await kv.del(cacheKey)
      return true
    } catch (error) {
      console.error('Cache delete error:', error)
      return false
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const cacheKey = this.getKey(key)
      const result = await kv.exists(cacheKey)
      return result === 1
    } catch (error) {
      console.error('Cache exists error:', error)
      return false
    }
  }

  async ttl(key: string): Promise<number | null> {
    try {
      const cacheKey = this.getKey(key)
      return await kv.ttl(cacheKey)
    } catch (error) {
      console.error('Cache TTL error:', error)
      return null
    }
  }

  async mget<T = any>(keys: string[]): Promise<(T | null)[]> {
    try {
      const cacheKeys = keys.map(key => this.getKey(key))
      const values = await kv.mget<string[]>(...cacheKeys)
      
      return values.map(value => {
        if (value === null) return null
        try {
          return JSON.parse(value) as T
        } catch {
          return null
        }
      })
    } catch (error) {
      console.error('Cache mget error:', error)
      return keys.map(() => null)
    }
  }

  async mset(keyValuePairs: Record<string, any>, options?: CacheOptions): Promise<boolean> {
    try {
      const pipeline = kv.pipeline()
      
      for (const [key, value] of Object.entries(keyValuePairs)) {
        const cacheKey = this.getKey(key)
        const serializedValue = JSON.stringify(value)
        
        if (options?.ex) {
          pipeline.set(cacheKey, serializedValue, { ex: options.ex })
        } else {
          pipeline.set(cacheKey, serializedValue)
        }
      }
      
      await pipeline.exec()
      return true
    } catch (error) {
      console.error('Cache mset error:', error)
      return false
    }
  }

  async increment(key: string, by: number = 1): Promise<number | null> {
    try {
      const cacheKey = this.getKey(key)
      return await kv.incrby(cacheKey, by)
    } catch (error) {
      console.error('Cache increment error:', error)
      return null
    }
  }

  async clear(pattern?: string): Promise<boolean> {
    try {
      if (pattern) {
        const keys = await kv.keys(`${this.prefix}:${pattern}`)
        if (keys.length > 0) {
          await kv.del(...keys)
        }
      } else {
        const keys = await kv.keys(`${this.prefix}:*`)
        if (keys.length > 0) {
          await kv.del(...keys)
        }
      }
      return true
    } catch (error) {
      console.error('Cache clear error:', error)
      return false
    }
  }
}

// Session-specific cache
export class SessionCache extends VercelKVCache {
  constructor() {
    super('session')
  }

  async createSession(userId: string, sessionToken: string, expiresAt: Date): Promise<boolean> {
    const sessionData = {
      userId,
      sessionToken,
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString()
    }

    const expirationSeconds = Math.floor((expiresAt.getTime() - Date.now()) / 1000)
    return await this.set(`token:${sessionToken}`, sessionData, { ex: expirationSeconds })
  }

  async getSession(sessionToken: string): Promise<any | null> {
    return await this.get(`token:${sessionToken}`)
  }

  async deleteSession(sessionToken: string): Promise<boolean> {
    return await this.del(`token:${sessionToken}`)
  }

  async deleteUserSessions(userId: string): Promise<boolean> {
    return await this.clear(`token:*:${userId}`)
  }
}

// Application cache
export class AppCache extends VercelKVCache {
  constructor() {
    super('app')
  }

  async cacheUserProfile(userId: string, profile: any, ttl: number = 3600): Promise<boolean> {
    return await this.set(`profile:${userId}`, profile, { ex: ttl })
  }

  async getUserProfile(userId: string): Promise<any | null> {
    return await this.get(`profile:${userId}`)
  }

  async invalidateUserProfile(userId: string): Promise<boolean> {
    return await this.del(`profile:${userId}`)
  }

  async cacheApiResponse(endpoint: string, params: any, response: any, ttl: number = 300): Promise<boolean> {
    const cacheKey = `api:${endpoint}:${JSON.stringify(params)}`
    return await this.set(cacheKey, response, { ex: ttl })
  }

  async getCachedApiResponse(endpoint: string, params: any): Promise<any | null> {
    const cacheKey = `api:${endpoint}:${JSON.stringify(params)}`
    return await this.get(cacheKey)
  }
}

// Export instances
export const sessionCache = new SessionCache()
export const appCache = new AppCache()
export const cache = new VercelKVCache()

// Browser-side caching utilities
export class BrowserCache {
  private static instance: BrowserCache
  private memoryCache = new Map<string, { data: any; expiry: number }>()
  private readonly maxMemoryItems = 100

  static getInstance(): BrowserCache {
    if (!BrowserCache.instance) {
      BrowserCache.instance = new BrowserCache()
    }
    return BrowserCache.instance
  }

  /**
   * Set item in memory cache with TTL
   */
  setMemory(key: string, data: any, ttlMs: number = 300000): void {
    // Clean up expired items if cache is getting large
    if (this.memoryCache.size >= this.maxMemoryItems) {
      this.cleanupExpired()
    }

    this.memoryCache.set(key, {
      data,
      expiry: Date.now() + ttlMs,
    })
  }

  /**
   * Get item from memory cache
   */
  getMemory<T = any>(key: string): T | null {
    const item = this.memoryCache.get(key)
    if (!item || item.expiry < Date.now()) {
      this.memoryCache.delete(key)
      return null
    }
    return item.data
  }

  /**
   * Set item in localStorage with expiry
   */
  setLocal(key: string, data: any, ttlMs: number = 86400000): boolean {
    if (typeof window === 'undefined') return false

    try {
      const item = {
        data,
        expiry: Date.now() + ttlMs,
      }
      localStorage.setItem(`spontra:${key}`, JSON.stringify(item))
      return true
    } catch (error) {
      console.warn('Failed to set localStorage item:', error)
      return false
    }
  }

  /**
   * Get item from localStorage
   */
  getLocal<T = any>(key: string): T | null {
    if (typeof window === 'undefined') return null

    try {
      const stored = localStorage.getItem(`spontra:${key}`)
      if (!stored) return null

      const item = JSON.parse(stored)
      if (item.expiry < Date.now()) {
        localStorage.removeItem(`spontra:${key}`)
        return null
      }

      return item.data
    } catch (error) {
      console.warn('Failed to get localStorage item:', error)
      return null
    }
  }

  /**
   * Set item in sessionStorage
   */
  setSession(key: string, data: any): boolean {
    if (typeof window === 'undefined') return false

    try {
      sessionStorage.setItem(`spontra:${key}`, JSON.stringify(data))
      return true
    } catch (error) {
      console.warn('Failed to set sessionStorage item:', error)
      return false
    }
  }

  /**
   * Get item from sessionStorage
   */
  getSession<T = any>(key: string): T | null {
    if (typeof window === 'undefined') return null

    try {
      const stored = sessionStorage.getItem(`spontra:${key}`)
      return stored ? JSON.parse(stored) : null
    } catch (error) {
      console.warn('Failed to get sessionStorage item:', error)
      return null
    }
  }

  /**
   * Remove item from all caches
   */
  remove(key: string): void {
    this.memoryCache.delete(key)
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`spontra:${key}`)
      sessionStorage.removeItem(`spontra:${key}`)
    }
  }

  /**
   * Clear all caches
   */
  clear(): void {
    this.memoryCache.clear()
    
    if (typeof window !== 'undefined') {
      // Clear only our namespaced items
      const keys = Object.keys(localStorage).filter(key => key.startsWith('spontra:'))
      keys.forEach(key => localStorage.removeItem(key))
      
      const sessionKeys = Object.keys(sessionStorage).filter(key => key.startsWith('spontra:'))
      sessionKeys.forEach(key => sessionStorage.removeItem(key))
    }
  }

  /**
   * Clean up expired memory cache items
   */
  private cleanupExpired(): void {
    const now = Date.now()
    for (const [key, item] of this.memoryCache.entries()) {
      if (item.expiry < now) {
        this.memoryCache.delete(key)
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const memoryItems = this.memoryCache.size
    const memoryExpired = Array.from(this.memoryCache.values())
      .filter(item => item.expiry < Date.now()).length

    let localStorageItems = 0
    let sessionStorageItems = 0

    if (typeof window !== 'undefined') {
      localStorageItems = Object.keys(localStorage)
        .filter(key => key.startsWith('spontra:')).length
      sessionStorageItems = Object.keys(sessionStorage)
        .filter(key => key.startsWith('spontra:')).length
    }

    return {
      memory: { total: memoryItems, expired: memoryExpired },
      localStorage: localStorageItems,
      sessionStorage: sessionStorageItems,
    }
  }
}

// HTTP Response cache using Cache API
export class HTTPCache {
  private cacheName = 'spontra-http-cache'

  /**
   * Cache HTTP response
   */
  async setResponse(url: string, response: Response, ttlMs: number = 300000): Promise<boolean> {
    if (!('caches' in window)) return false

    try {
      const cache = await caches.open(this.cacheName)
      const responseWithExpiry = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: {
          ...Object.fromEntries(response.headers.entries()),
          'Cache-Expiry': (Date.now() + ttlMs).toString(),
        },
      })
      
      await cache.put(url, responseWithExpiry)
      return true
    } catch (error) {
      console.warn('Failed to cache HTTP response:', error)
      return false
    }
  }

  /**
   * Get cached HTTP response
   */
  async getResponse(url: string): Promise<Response | null> {
    if (!('caches' in window)) return null

    try {
      const cache = await caches.open(this.cacheName)
      const response = await cache.match(url)
      
      if (!response) return null

      const expiry = response.headers.get('Cache-Expiry')
      if (expiry && parseInt(expiry) < Date.now()) {
        await cache.delete(url)
        return null
      }

      return response
    } catch (error) {
      console.warn('Failed to get cached HTTP response:', error)
      return null
    }
  }

  /**
   * Clear HTTP cache
   */
  async clear(): Promise<boolean> {
    if (!('caches' in window)) return false

    try {
      await caches.delete(this.cacheName)
      return true
    } catch (error) {
      console.warn('Failed to clear HTTP cache:', error)
      return false
    }
  }
}

// Comprehensive caching strategy
export class CacheStrategy {
  private browserCache = BrowserCache.getInstance()
  private httpCache = new HTTPCache()

  /**
   * Multi-tier cache get (memory -> localStorage -> HTTP cache -> server)
   */
  async get<T = any>(key: string, fetcher?: () => Promise<T>): Promise<T | null> {
    // Try memory cache first (fastest)
    let data = this.browserCache.getMemory<T>(key)
    if (data !== null) return data

    // Try localStorage (persistent but slower)
    data = this.browserCache.getLocal<T>(key)
    if (data !== null) {
      // Populate memory cache for faster access
      this.browserCache.setMemory(key, data, 300000) // 5 minutes
      return data
    }

    // If we have a fetcher, try to get fresh data
    if (fetcher) {
      try {
        data = await fetcher()
        if (data !== null) {
          this.set(key, data)
        }
        return data
      } catch (error) {
        console.warn('Failed to fetch data:', error)
        return null
      }
    }

    return null
  }

  /**
   * Multi-tier cache set
   */
  set(key: string, data: any, options: {
    memoryTTL?: number
    localTTL?: number
    persistent?: boolean
  } = {}): void {
    const {
      memoryTTL = 300000, // 5 minutes
      localTTL = 86400000, // 24 hours
      persistent = true
    } = options

    // Always set in memory for fast access
    this.browserCache.setMemory(key, data, memoryTTL)

    // Set in localStorage for persistence
    if (persistent) {
      this.browserCache.setLocal(key, data, localTTL)
    }
  }

  /**
   * Cached fetch with automatic caching
   */
  async fetch<T = any>(url: string, options: RequestInit = {}, cacheOptions: {
    ttl?: number
    useHTTPCache?: boolean
    forceRefresh?: boolean
  } = {}): Promise<T | null> {
    const {
      ttl = 300000, // 5 minutes
      useHTTPCache = true,
      forceRefresh = false
    } = cacheOptions

    const cacheKey = `fetch:${url}:${JSON.stringify(options)}`

    // Check cache first unless forced refresh
    if (!forceRefresh) {
      const cached = await this.get<T>(cacheKey)
      if (cached !== null) return cached

      // Check HTTP cache if enabled
      if (useHTTPCache) {
        const httpResponse = await this.httpCache.getResponse(url)
        if (httpResponse) {
          const data = await httpResponse.json()
          this.set(cacheKey, data, { memoryTTL: ttl })
          return data
        }
      }
    }

    // Fetch fresh data
    try {
      const response = await fetch(url, options)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      // Cache the response
      this.set(cacheKey, data, { memoryTTL: ttl })
      
      if (useHTTPCache) {
        await this.httpCache.setResponse(url, response.clone(), ttl)
      }

      return data
    } catch (error) {
      console.warn('Failed to fetch:', error)
      return null
    }
  }

  /**
   * Clear all caches
   */
  async clearAll(): Promise<void> {
    this.browserCache.clear()
    await this.httpCache.clear()
  }

  /**
   * Get comprehensive cache statistics
   */
  getStats() {
    return this.browserCache.getStats()
  }
}

// Export singleton instance
export const cacheStrategy = new CacheStrategy()
export const browserCache = BrowserCache.getInstance()
export const httpCache = new HTTPCache()

// Health check for KV
export async function checkKVHealth(): Promise<{ success: boolean; message: string }> {
  try {
    const testKey = 'health-check'
    const testValue = { timestamp: Date.now() }
    
    await cache.set(testKey, testValue, { ex: 10 })
    const retrieved = await cache.get(testKey)
    await cache.del(testKey)
    
    if (retrieved && retrieved.timestamp === testValue.timestamp) {
      return { success: true, message: 'KV store is healthy' }
    } else {
      return { success: false, message: 'KV store data integrity issue' }
    }
  } catch (error) {
    return { 
      success: false, 
      message: `KV store error: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }
  }
}