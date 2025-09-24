type RateLimitKey = string

interface RateLimitBucket {
  remaining: number
  resetAt: number
}

declare global {
  // eslint-disable-next-line no-var
  var __spontraRateLimitBuckets: Map<RateLimitKey, RateLimitBucket> | undefined
}

const buckets: Map<RateLimitKey, RateLimitBucket> = globalThis.__spontraRateLimitBuckets || new Map()

if (!globalThis.__spontraRateLimitBuckets) {
  globalThis.__spontraRateLimitBuckets = buckets
}

export function consumeRateLimit(key: RateLimitKey, limit: number, windowMs: number): {
  allowed: boolean
  remaining: number
  resetAt: number
} {
  const now = Date.now()
  const bucket = buckets.get(key)

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { remaining: limit - 1, resetAt: now + windowMs })
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs }
  }

  if (bucket.remaining <= 0) {
    return { allowed: false, remaining: 0, resetAt: bucket.resetAt }
  }

  bucket.remaining -= 1
  return { allowed: true, remaining: bucket.remaining, resetAt: bucket.resetAt }
}

export {}
