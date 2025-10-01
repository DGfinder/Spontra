import 'server-only'
import { kv } from '@vercel/kv'

// =============================================================================
// SERVER-SIDE CACHE (Vercel KV)
// =============================================================================
// Simplified caching using Vercel KV for MVP

export interface CacheOptions {
  ttlSeconds?: number
  keyPrefix?: string
}

// Simple in-memory fallback for development
class MemoryLRU<V> {
  private map = new Map<string, { v: V; at: number }>()
  constructor(private limit = 500) {}

  set(key: string, value: V): void {
    if (this.map.size >= this.limit) {
      const first = this.map.keys().next().value
      if (first) this.map.delete(first)
    }
    this.map.set(key, { v: value, at: Date.now() })
  }

  get(key: string): V | undefined {
    const entry = this.map.get(key)
    if (!entry) return undefined
    // Simple 5 minute expiry for memory cache
    if (Date.now() - entry.at > 5 * 60 * 1000) {
      this.map.delete(key)
      return undefined
    }
    return entry.v
  }

  delete(key: string): void {
    this.map.delete(key)
  }

  clear(): void {
    this.map.clear()
  }
}

const memoryCache = new MemoryLRU<string>(500)

export async function cacheGet(key: string, options?: CacheOptions): Promise<string | null> {
  const prefixedKey = options?.keyPrefix ? `${options.keyPrefix}:${key}` : key
  
  try {
    // Try Vercel KV first
    if (process.env.KV_URL) {
      const result = await kv.get<string>(prefixedKey)
      return result || null
    }
  } catch (error) {
    console.warn('KV cache get failed, falling back to memory:', error)
  }

  // Fallback to memory cache
  return memoryCache.get(prefixedKey) || null
}

export async function cacheSet(
  key: string,
  value: string,
  options?: CacheOptions
): Promise<void> {
  const prefixedKey = options?.keyPrefix ? `${options.keyPrefix}:${key}` : key
  const ttl = options?.ttlSeconds || 300 // 5 minutes default

  try {
    // Try Vercel KV first
    if (process.env.KV_URL) {
      await kv.setex(prefixedKey, ttl, value)
      return
    }
  } catch (error) {
    console.warn('KV cache set failed, falling back to memory:', error)
  }

  // Fallback to memory cache
  memoryCache.set(prefixedKey, value)
}

export async function cacheDel(key: string, options?: CacheOptions): Promise<void> {
  const prefixedKey = options?.keyPrefix ? `${options.keyPrefix}:${key}` : key

  try {
    // Try Vercel KV first
    if (process.env.KV_URL) {
      await kv.del(prefixedKey)
      return
    }
  } catch (error) {
    console.warn('KV cache delete failed, falling back to memory:', error)
  }

  // Fallback to memory cache
  memoryCache.delete(prefixedKey)
}

export async function cacheFlush(): Promise<void> {
  try {
    // Clear Vercel KV (Note: This clears the entire KV store)
    if (process.env.KV_URL) {
      await kv.flushall()
      return
    }
  } catch (error) {
    console.warn('KV cache flush failed, falling back to memory:', error)
  }

  // Clear memory cache
  memoryCache.clear()
}