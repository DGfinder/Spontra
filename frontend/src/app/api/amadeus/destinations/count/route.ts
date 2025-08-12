import { NextRequest, NextResponse } from 'next/server'
import { amadeusService } from '@/services/amadeusService'
import { cacheGet, cacheSet } from '@/lib/cache-server'

export const runtime = 'nodejs'

interface CountRequestBody {
  origin: string
  minFlightTime?: number
  maxFlightTime?: number
  departureDate?: string
  nonStop?: boolean
}

// Simple in-memory cache (per server instance). Good enough to cut API calls.
// Keyed by: origin|date|nonStop|maxFlightTime (hours rounded to 0.5)
type CacheValue = { count: number; fetchedAt: number }
const CACHE_TTL_MS = 2 * 60 * 1000 // 2 minutes

class LRUCache {
  private map = new Map<string, CacheValue>()
  private maxEntries: number
  public hits = 0
  public misses = 0
  public evictions = 0

  constructor(maxEntries = 200) {
    this.maxEntries = maxEntries
  }

  get(key: string): CacheValue | undefined {
    const value = this.map.get(key)
    if (!value) {
      this.misses++
      return undefined
    }
    // Move to end (most recently used)
    this.map.delete(key)
    this.map.set(key, value)
    this.hits++
    return value
  }

  set(key: string, value: CacheValue) {
    if (this.map.has(key)) this.map.delete(key)
    this.map.set(key, value)
    if (this.map.size > this.maxEntries) {
      const oldestKey = this.map.keys().next().value as string | undefined
      if (oldestKey) {
        this.map.delete(oldestKey)
        this.evictions++
      }
    }
  }
}

const countCache = new LRUCache(300)
const pending = new Map<string, Promise<number>>() // request coalescing

function roundToHalf(n: number): number { return Math.round(n * 2) / 2 }
function makeKey(origin: string, date: string, nonStop: boolean | undefined, maxH: number): string {
  return [origin, date, nonStop ? '1' : '0', roundToHalf(maxH)].join('|')
}

async function getCachedCount(params: {
  origin: string
  maxFlightTime: number
  departureDate: string
  nonStop?: boolean
}): Promise<number> {
  const key = makeKey(params.origin, params.departureDate, params.nonStop, params.maxFlightTime)
  const now = Date.now()
  // Try process LRU first
  const hit = countCache.get(key)
  if (hit && now - hit.fetchedAt < CACHE_TTL_MS) return hit.count

  // Then shared Redis cache
  const redisVal = await cacheGet(`count:${key}`)
  if (redisVal) {
    const parsed = parseInt(redisVal, 10)
    if (!Number.isNaN(parsed)) {
      countCache.set(key, { count: parsed, fetchedAt: now })
      return parsed
    }
  }

  if (pending.has(key)) return pending.get(key)!

  const p = (async () => {
    const data = await amadeusService.searchDestinations({
      origin: params.origin,
      maxFlightTime: params.maxFlightTime,
      departureDate: params.departureDate,
      oneWay: true,
      nonStop: params.nonStop,
      viewBy: 'DESTINATION'
    } as any)
    const count = (data || []).length
    countCache.set(key, { count, fetchedAt: Date.now() })
    // Store in Redis/shared cache as string
    cacheSet(`count:${key}`, String(count), { ttlSeconds: Math.floor(CACHE_TTL_MS / 1000) })
    return count
  })()

  pending.set(key, p)
  try {
    return await p
  } finally {
    pending.delete(key)
  }
}

export async function POST(req: NextRequest) {
  try {
    const { origin, minFlightTime = 0.5, maxFlightTime = 8, departureDate, nonStop }: CountRequestBody = await req.json()

    if (!origin) {
      return NextResponse.json({ ok: false, error: 'Missing required parameter: origin' }, { status: 400 })
    }

    const date = departureDate || new Date().toISOString().slice(0, 10)

    // ETag: based on params and current TTL slot
    const slot = Math.floor(Date.now() / CACHE_TTL_MS)
    const etagKey = `${origin}|${date}|${nonStop ? '1' : '0'}|${roundToHalf(minFlightTime)}|${roundToHalf(maxFlightTime)}|${slot}`
    const etag = 'W/"' + hashString(etagKey) + '"'
    const ifNoneMatch = req.headers.get('if-none-match')
    if (ifNoneMatch && ifNoneMatch === etag) {
      // Expose basic cache stats as headers for observability
      return new NextResponse(null as any, { status: 304, headers: { ETag: etag, 'X-Cache-Hits': String(countCache.hits), 'X-Cache-Misses': String(countCache.misses), 'X-Cache-Evictions': String(countCache.evictions) } })
    }

    // 1) One call for the current max (cached)
    const count = await getCachedCount({ origin, maxFlightTime, departureDate: date, nonStop })

    // 2) Optional coarse histogram: sample up to 6 buckets across [min, max]
    const buckets: { hour: number; count: number }[] = []
    try {
      const totalSpan = Math.max(0.5, maxFlightTime - minFlightTime)
      const samples = Math.min(5, Math.max(2, Math.round(totalSpan)))
      const step = totalSpan / samples
      const seen: number[] = []
      for (let i = 1; i <= samples; i++) {
        const h = roundToHalf(minFlightTime + step * i)
        const c = await getCachedCount({ origin, maxFlightTime: h, departureDate: date, nonStop })
        seen.push(c)
        const prev = i === 1 ? 0 : seen[i - 2]
        buckets.push({ hour: h, count: Math.max(0, c - prev) })
      }
    } catch {
      // ignore histogram errors; return count only
    }

    return NextResponse.json(
      { ok: true, data: { count, histogram: buckets } },
      { headers: { ETag: etag, 'X-Cache-Hits': String(countCache.hits), 'X-Cache-Misses': String(countCache.misses), 'X-Cache-Evictions': String(countCache.evictions) } }
    )
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || 'Internal Server Error' },
      { status: 500 }
    )
  }
}

// Lightweight hash for ETag (djb2)
function hashString(input: string): string {
  let hash = 5381
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 33) ^ input.charCodeAt(i)
  }
  return (hash >>> 0).toString(36)
}

