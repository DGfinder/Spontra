import Redis from 'ioredis'

// Simple cross-instance cache wrapper with in-memory fallback
export interface CacheOptions {
  ttlSeconds?: number
  keyPrefix?: string
}

let redis: Redis | null = null

function getRedis(): Redis | null {
  if (redis !== null) return redis
  const url = process.env.REDIS_URL || process.env.NEXT_PUBLIC_REDIS_URL
  if (!url) return null
  try {
    redis = new Redis(url, { maxRetriesPerRequest: 3, lazyConnect: true })
    return redis
  } catch {
    return null
  }
}

class MemoryLRU<V> {
  private map = new Map<string, { v: V; at: number }>()
  constructor(private limit = 500) {}
  get(k: string) {
    const it = this.map.get(k)
    if (!it) return undefined
    this.map.delete(k)
    this.map.set(k, it)
    return it.v
  }
  set(k: string, v: V) {
    if (this.map.has(k)) this.map.delete(k)
    this.map.set(k, { v, at: Date.now() })
    if (this.map.size > this.limit) this.map.delete(this.map.keys().next().value)
  }
}

const mem = new MemoryLRU<string>(800)

export async function cacheGet(key: string): Promise<string | null> {
  const r = getRedis()
  if (r) {
    try {
      return (await r.get(key))
    } catch {
      // fall through to memory
    }
  }
  return mem.get(key) || null
}

export async function cacheSet(key: string, value: string, opts?: CacheOptions): Promise<void> {
  const ttl = opts?.ttlSeconds ?? 120
  const r = getRedis()
  if (r) {
    try {
      await r.set(key, value, 'EX', ttl)
      return
    } catch {
      // fall back
    }
  }
  mem.set(key, value)
}

