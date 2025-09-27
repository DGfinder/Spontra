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