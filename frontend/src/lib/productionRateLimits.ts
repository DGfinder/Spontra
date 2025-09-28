/**
 * Production Rate Limiting Configuration
 * 
 * Sane defaults for production to prevent abuse while maintaining UX
 */

interface RateLimitConfig {
  requests: number;
  windowMs: number;
  burst?: number;
  skipSuccessfulRequests?: boolean;
}

export const PRODUCTION_RATE_LIMITS: Record<string, RateLimitConfig> = {
  // Click-out endpoints - aggressive protection
  '/out/*': {
    requests: 20,     // 20 requests per minute per IP
    windowMs: 60000,  // 1 minute window
    burst: 10,        // Allow burst of 10
    skipSuccessfulRequests: true
  },
  
  // Reprice endpoints - moderate protection
  '/api/reprice': {
    requests: 30,
    windowMs: 60000,
    burst: 5
  },
  
  // Postback endpoints - strict protection  
  '/api/aff/postback/*': {
    requests: 100,    // High volume expected from networks
    windowMs: 60000,
    burst: 20
  },
  
  // Search endpoints - user-friendly
  '/api/search/*': {
    requests: 60,     // 1 per second average
    windowMs: 60000,
    burst: 20
  },
  
  // Admin endpoints - strict protection
  '/api/admin/*': {
    requests: 100,
    windowMs: 60000,
    burst: 10
  }
};

// Session-based limits (more permissive for logged-in users)
export const SESSION_RATE_LIMITS: Record<string, RateLimitConfig> = {
  '/out/*': {
    requests: 60,     // 60 clicks per minute per session
    windowMs: 60000,
    burst: 20
  }
};

// Geographic rate limiting (per country/region)
export const GEO_RATE_LIMITS: Record<string, RateLimitConfig> = {
  'suspicious_regions': {
    requests: 10,     // Stricter limits for VPN-heavy regions
    windowMs: 60000,
    burst: 3
  }
};

// ASN-based limiting (per autonomous system)
export const ASN_RATE_LIMITS = {
  max_clicks_per_hour: 500,    // 500 clicks/hour from any single ASN
  auto_block_threshold: 1000,  // Auto-block ASN if >1000 clicks/hour
  whitelist_asns: [
    // Major ISPs that should never be blocked
    'AS7922',  // Comcast
    'AS3215',  // Orange France  
    'AS4766',  // Korea Telecom
    'AS4713',  // NTT Communications
    'AS1221'   // Telstra Australia
  ]
};

/**
 * Enhanced rate limiting with fingerprinting
 */
export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
  reason?: string;
}

/**
 * Rate limit storage (in-memory, use Redis in production)
 */
const rateLimitStore = new Map<string, {
  count: number;
  resetTime: number;
  firstRequest: number;
}>();

export function checkRateLimit(
  identifier: string,
  endpoint: string,
  config?: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  
  // Get rate limit config for endpoint
  const endpointConfig = config || 
    Object.entries(PRODUCTION_RATE_LIMITS)
      .find(([pattern]) => endpoint.match(pattern.replace('*', '.*')))?.[1] ||
    { requests: 60, windowMs: 60000 };
  
  const key = `${identifier}:${endpoint}`;
  const current = rateLimitStore.get(key);
  
  // Clean expired entries periodically
  if (Math.random() < 0.01) {
    for (const [k, v] of rateLimitStore.entries()) {
      if (now > v.resetTime) {
        rateLimitStore.delete(k);
      }
    }
  }
  
  if (!current || now > current.resetTime) {
    // First request or window expired
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + endpointConfig.windowMs,
      firstRequest: now
    });
    
    return {
      allowed: true,
      limit: endpointConfig.requests,
      remaining: endpointConfig.requests - 1,
      resetTime: now + endpointConfig.windowMs
    };
  }
  
  // Check burst allowance
  const timeSinceFirst = now - current.firstRequest;
  const burstLimit = endpointConfig.burst || Math.floor(endpointConfig.requests / 4);
  
  if (timeSinceFirst < 10000 && current.count >= burstLimit) {
    // Burst limit exceeded
    return {
      allowed: false,
      limit: endpointConfig.requests,
      remaining: 0,
      resetTime: current.resetTime,
      retryAfter: current.resetTime - now,
      reason: 'BURST_LIMIT_EXCEEDED'
    };
  }
  
  if (current.count >= endpointConfig.requests) {
    // Rate limit exceeded
    return {
      allowed: false,
      limit: endpointConfig.requests,
      remaining: 0,
      resetTime: current.resetTime,
      retryAfter: current.resetTime - now,
      reason: 'RATE_LIMIT_EXCEEDED'
    };
  }
  
  // Allow request and increment counter
  current.count++;
  
  return {
    allowed: true,
    limit: endpointConfig.requests,
    remaining: endpointConfig.requests - current.count,
    resetTime: current.resetTime
  };
}

/**
 * Get client fingerprint for rate limiting
 */
export function getClientFingerprint(req: Request): {
  ip: string;
  sessionId?: string;
  userAgent: string;
  asn?: string;
} {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
             req.headers.get('x-real-ip') ||
             req.headers.get('cf-connecting-ip') ||
             '127.0.0.1';
             
  const userAgent = req.headers.get('user-agent') || 'unknown';
  const sessionId = req.headers.get('cookie')
    ?.split(';')
    .find(c => c.trim().startsWith('session='))
    ?.split('=')[1];
    
  // In production, lookup ASN from IP (use MaxMind or similar)
  const asn = req.headers.get('cf-asn') || undefined;
  
  return { ip, sessionId, userAgent, asn };
}

/**
 * Apply rate limiting to response headers
 */
export function addRateLimitHeaders(response: Response, result: RateLimitResult): Response {
  const headers = new Headers(response.headers);
  
  headers.set('X-RateLimit-Limit', result.limit.toString());
  headers.set('X-RateLimit-Remaining', result.remaining.toString());
  headers.set('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000).toString());
  
  if (!result.allowed && result.retryAfter) {
    headers.set('Retry-After', Math.ceil(result.retryAfter / 1000).toString());
  }
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}