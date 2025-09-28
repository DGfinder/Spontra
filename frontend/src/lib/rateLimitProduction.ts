/**
 * Production Rate Limiting and Resource Management
 * Implements tiered rate limiting for different endpoints and user types
 */

import { NextRequest } from 'next/server'
import { captureException } from '@sentry/nextjs'
import { trackError } from './monitoring'
import { env, isProduction } from '../config/environment'

export interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
  keyGenerator?: (req: NextRequest) => string
  onLimitReached?: (req: NextRequest, identifier: string) => void
}

export interface RateLimitResult {
  allowed: boolean
  limit: number
  remaining: number
  resetTime: Date
  retryAfter?: number
}

// Rate limit tiers for different endpoints
const RATE_LIMIT_TIERS = {
  // Public endpoints - most restrictive
  public: {
    windowMs: 60000, // 1 minute
    maxRequests: 100,
    burst: {
      windowMs: 1000, // 1 second
      maxRequests: 5
    }
  },
  
  // Search endpoints - moderate limits
  search: {
    windowMs: 60000,
    maxRequests: 200,
    burst: {
      windowMs: 1000,
      maxRequests: 3
    }
  },
  
  // Authentication endpoints - strict limits
  auth: {
    windowMs: 900000, // 15 minutes
    maxRequests: 10,
    burst: {
      windowMs: 1000,
      maxRequests: 1
    }
  },
  
  // Admin endpoints - very restrictive
  admin: {
    windowMs: 60000,
    maxRequests: 50,
    burst: {
      windowMs: 1000,
      maxRequests: 2
    }
  },
  
  // API endpoints - balanced limits
  api: {
    windowMs: 60000,
    maxRequests: 300,
    burst: {
      windowMs: 1000,
      maxRequests: 10
    }
  }
}

// Connection pooling limits
const CONNECTION_LIMITS = {
  database: {
    maxConnections: isProduction ? 20 : 5,
    connectionTimeout: 10000,
    idleTimeout: 30000
  },
  cache: {
    maxConnections: isProduction ? 50 : 10,
    connectionTimeout: 5000,
    idleTimeout: 60000
  },
  external: {
    maxConcurrent: isProduction ? 10 : 3,
    timeout: 15000,
    retryDelay: 1000
  }
}

class ProductionRateLimiter {
  private slidingWindows = new Map<string, { requests: number[]; resetTime: number }>()
  private burstWindows = new Map<string, { requests: number[]; resetTime: number }>()
  private blockedIPs = new Set<string>()
  private suspiciousActivity = new Map<string, number>()

  constructor() {
    // Cleanup old entries every 5 minutes
    if (typeof window === 'undefined') {
      setInterval(() => {
        this.cleanupOldEntries()
      }, 300000)
    }
  }

  /**
   * Check rate limit for request
   */
  async checkRateLimit(
    req: NextRequest,
    tier: keyof typeof RATE_LIMIT_TIERS,
    identifier?: string
  ): Promise<RateLimitResult> {
    const config = RATE_LIMIT_TIERS[tier]
    const key = identifier || this.generateKey(req, tier)
    
    // Check if IP is blocked
    if (this.isBlocked(key)) {
      return {
        allowed: false,
        limit: 0,
        remaining: 0,
        resetTime: new Date(Date.now() + 3600000), // 1 hour block
        retryAfter: 3600
      }
    }

    // Check burst limit first
    const burstResult = this.checkWindow(
      key + ':burst',
      config.burst.windowMs,
      config.burst.maxRequests,
      this.burstWindows
    )

    if (!burstResult.allowed) {
      this.trackSuspiciousActivity(key)
      
      return {
        allowed: false,
        limit: config.burst.maxRequests,
        remaining: burstResult.remaining,
        resetTime: burstResult.resetTime,
        retryAfter: Math.ceil(config.burst.windowMs / 1000)
      }
    }

    // Check main window limit
    const mainResult = this.checkWindow(
      key,
      config.windowMs,
      config.maxRequests,
      this.slidingWindows
    )

    if (!mainResult.allowed) {
      this.trackSuspiciousActivity(key)
      
      trackError({
        errorType: 'api',
        errorCode: 'rate_limit_exceeded',
        endpoint: tier,
        severity: 'medium'
      })
    }

    return mainResult
  }

  /**
   * Check sliding window for rate limiting
   */
  private checkWindow(
    key: string,
    windowMs: number,
    maxRequests: number,
    storage: Map<string, { requests: number[]; resetTime: number }>
  ): RateLimitResult {
    const now = Date.now()
    const windowStart = now - windowMs
    
    let entry = storage.get(key)
    
    if (!entry || entry.resetTime <= now) {
      entry = {
        requests: [],
        resetTime: now + windowMs
      }
      storage.set(key, entry)
    }

    // Remove requests outside the window
    entry.requests = entry.requests.filter(timestamp => timestamp > windowStart)

    const allowed = entry.requests.length < maxRequests
    
    if (allowed) {
      entry.requests.push(now)
    }

    return {
      allowed,
      limit: maxRequests,
      remaining: Math.max(0, maxRequests - entry.requests.length),
      resetTime: new Date(entry.resetTime)
    }
  }

  /**
   * Generate rate limit key
   */
  private generateKey(req: NextRequest, tier: string): string {
    const ip = this.getClientIP(req)
    const userAgent = req.headers.get('user-agent') || 'unknown'
    const path = new URL(req.url).pathname
    
    // Use combination of IP and path for more granular limiting
    return `${tier}:${ip}:${path}`
  }

  /**
   * Get client IP address
   */
  private getClientIP(req: NextRequest): string {
    const forwarded = req.headers.get('x-forwarded-for')
    const realIP = req.headers.get('x-real-ip')
    const cloudflareIP = req.headers.get('cf-connecting-ip')
    
    return cloudflareIP || realIP || forwarded?.split(',')[0] || 'unknown'
  }

  /**
   * Track suspicious activity
   */
  private trackSuspiciousActivity(key: string): void {
    const count = this.suspiciousActivity.get(key) || 0
    this.suspiciousActivity.set(key, count + 1)

    // Block IP after multiple rate limit violations
    if (count > 10) {
      this.blockedIPs.add(key)
      console.warn(`🚫 Blocked suspicious IP: ${key}`)
      
      trackError({
        errorType: 'api',
        errorCode: 'ip_blocked',
        endpoint: 'rate_limiter',
        severity: 'high'
      })
    }
  }

  /**
   * Check if identifier is blocked
   */
  private isBlocked(key: string): boolean {
    return this.blockedIPs.has(key)
  }

  /**
   * Cleanup old entries to prevent memory leaks
   */
  private cleanupOldEntries(): void {
    const now = Date.now()
    
    // Clean sliding windows
    for (const [key, entry] of this.slidingWindows.entries()) {
      if (entry.resetTime <= now) {
        this.slidingWindows.delete(key)
      }
    }

    // Clean burst windows
    for (const [key, entry] of this.burstWindows.entries()) {
      if (entry.resetTime <= now) {
        this.burstWindows.delete(key)
      }
    }

    // Clean suspicious activity (reset after 1 hour)
    for (const [key, timestamp] of this.suspiciousActivity.entries()) {
      if (now - timestamp > 3600000) {
        this.suspiciousActivity.delete(key)
      }
    }

    console.log(`🧹 Rate limiter cleanup: ${this.slidingWindows.size} windows, ${this.blockedIPs.size} blocked IPs`)
  }

  /**
   * Get current statistics
   */
  getStats(): {
    activeWindows: number
    blockedIPs: number
    suspiciousActivity: number
  } {
    return {
      activeWindows: this.slidingWindows.size + this.burstWindows.size,
      blockedIPs: this.blockedIPs.size,
      suspiciousActivity: this.suspiciousActivity.size
    }
  }

  /**
   * Unblock IP (for admin use)
   */
  unblockIP(ip: string): void {
    this.blockedIPs.delete(ip)
    this.suspiciousActivity.delete(ip)
    console.log(`✅ Unblocked IP: ${ip}`)
  }
}

class ResourceLimitManager {
  private activeConnections = new Map<string, number>()
  private connectionQueues = new Map<string, Array<() => void>>()

  /**
   * Acquire connection with limit enforcement
   */
  async acquireConnection(
    resource: keyof typeof CONNECTION_LIMITS,
    operation: () => Promise<any>
  ): Promise<any> {
    const config = CONNECTION_LIMITS[resource]
    const key = resource
    
    // Check current connections
    const current = this.activeConnections.get(key) || 0
    
    if (current >= config.maxConnections) {
      // Queue the request
      await this.queueRequest(key)
    }

    // Increment active connections
    this.activeConnections.set(key, current + 1)

    try {
      // Execute operation with timeout
      const result = await Promise.race([
        operation(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Operation timeout')), config.connectionTimeout)
        )
      ])

      return result

    } finally {
      // Decrement active connections
      const newCount = (this.activeConnections.get(key) || 1) - 1
      this.activeConnections.set(key, Math.max(0, newCount))
      
      // Process queue if available
      this.processQueue(key)
    }
  }

  /**
   * Queue request when limit reached
   */
  private async queueRequest(key: string): Promise<void> {
    return new Promise((resolve) => {
      if (!this.connectionQueues.has(key)) {
        this.connectionQueues.set(key, [])
      }
      
      this.connectionQueues.get(key)!.push(resolve)
    })
  }

  /**
   * Process queued requests
   */
  private processQueue(key: string): void {
    const queue = this.connectionQueues.get(key)
    if (queue && queue.length > 0) {
      const next = queue.shift()
      if (next) {
        next()
      }
    }
  }

  /**
   * Get resource usage statistics
   */
  getResourceStats(): Record<string, { active: number; limit: number; queued: number }> {
    const stats: Record<string, { active: number; limit: number; queued: number }> = {}
    
    for (const [resource, config] of Object.entries(CONNECTION_LIMITS)) {
      const active = this.activeConnections.get(resource) || 0
      const queued = this.connectionQueues.get(resource)?.length || 0
      
      stats[resource] = {
        active,
        limit: config.maxConnections,
        queued
      }
    }
    
    return stats
  }
}

// Singleton instances
export const rateLimiter = new ProductionRateLimiter()
export const resourceManager = new ResourceLimitManager()

// Helper functions for middleware usage
export async function checkAPIRateLimit(req: NextRequest): Promise<RateLimitResult> {
  const path = new URL(req.url).pathname
  
  // Determine rate limit tier based on path
  let tier: keyof typeof RATE_LIMIT_TIERS = 'public'
  
  if (path.startsWith('/api/admin/')) {
    tier = 'admin'
  } else if (path.startsWith('/api/auth/')) {
    tier = 'auth'
  } else if (path.includes('/search') || path.includes('/destinations')) {
    tier = 'search'
  } else if (path.startsWith('/api/')) {
    tier = 'api'
  }
  
  return rateLimiter.checkRateLimit(req, tier)
}

export async function withDatabaseLimit<T>(operation: () => Promise<T>): Promise<T> {
  return resourceManager.acquireConnection('database', operation)
}

export async function withCacheLimit<T>(operation: () => Promise<T>): Promise<T> {
  return resourceManager.acquireConnection('cache', operation)
}

export async function withExternalLimit<T>(operation: () => Promise<T>): Promise<T> {
  return resourceManager.acquireConnection('external', operation)
}

export default { rateLimiter, resourceManager }