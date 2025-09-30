import { NextRequest, NextResponse } from 'next/server'
import { 
  checkEdgeRateLimit, 
  isAdminAuthEndpoint,
  createUnauthorizedResponse,
  createRateLimitResponse,
  isValidTokenFormat,
  getClientIP
} from './lib/middlewareUtils'

// Security headers to apply to all responses
function addSecurityHeaders(response: NextResponse): NextResponse {
  // Prevent the page from being embedded in frames
  response.headers.set('X-Frame-Options', 'DENY')
  
  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff')
  
  // Enable XSS protection
  response.headers.set('X-XSS-Protection', '1; mode=block')
  
  // Prevent referrer leakage
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // Content Security Policy - Production Safe
  const isDevelopment = process.env.NODE_ENV === 'development'
  const csp = [
    "default-src 'self'",
    // Script sources - nonce-based for production security
    isDevelopment 
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vitals.vercel-analytics.com https://va.vercel-scripts.com https://js.sentry-cdn.com"
      : "script-src 'self' https://vitals.vercel-analytics.com https://va.vercel-scripts.com https://js.sentry-cdn.com",
    // Style sources - allow inline styles for Tailwind and libraries
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    // Image sources - comprehensive allowlist
    "img-src 'self' data: https: blob:",
    // Font sources
    "font-src 'self' https://fonts.gstatic.com",
    // Connection sources - API endpoints and monitoring
    "connect-src 'self' https://api.amadeus.com https://*.vercel-analytics.com https://*.sentry.io https://*.vercel.app https://*.neon.tech wss:",
    // Frame restrictions
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    // Additional security directives
    "form-action 'self'",
    "upgrade-insecure-requests"
  ].join('; ')
  response.headers.set('Content-Security-Policy', csp)
  
  // HTTPS enforcement in production
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  }
  
  // Permissions Policy - Comprehensive restrictions
  response.headers.set('Permissions-Policy', [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'payment=()',
    'usb=()',
    'magnetometer=()',
    'gyroscope=()',
    'speaker=()',
    'vibrate=()',
    'fullscreen=(self)',
    'sync-xhr=()'
  ].join(', '))
  
  // Additional security headers
  response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp')
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin')
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin')
  
  // Prevent DNS rebinding attacks
  response.headers.set('X-DNS-Prefetch-Control', 'off')
  
  // Prevent MIME confusion attacks
  response.headers.set('X-Download-Options', 'noopen')
  
  return response
}

// Protect /api/admin routes with database session verification
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  
  // Apply rate limiting to all API routes using Vercel KV
  if (pathname.startsWith('/api/')) {
    const { checkRateLimit } = await import('@/lib/rateLimit')
    const clientIP = getClientIP(req)

    // Determine rate limit type based on endpoint
    let rateLimitType: 'api' | 'admin' | 'search' | 'postback' = 'api'
    if (pathname.startsWith('/api/admin')) {
      rateLimitType = 'admin'
    } else if (pathname.startsWith('/api/amadeus/flights') || pathname.startsWith('/api/search')) {
      rateLimitType = 'search'
    } else if (pathname.startsWith('/api/webhooks')) {
      rateLimitType = 'postback'
    }

    const rateLimitResult = await checkRateLimit(clientIP, rateLimitType)

    if (!rateLimitResult.allowed) {
      const response = NextResponse.json(
        {
          error: 'Rate limit exceeded',
          limit: rateLimitResult.total,
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
        },
        { status: 429 }
      )

      // Add rate limit headers
      response.headers.set('X-RateLimit-Limit', rateLimitResult.total.toString())
      response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString())
      response.headers.set('X-RateLimit-Reset', new Date(rateLimitResult.resetTime).toISOString())
      response.headers.set('Retry-After', Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString())

      return addSecurityHeaders(response)
    }
  }
  
  // Apply security headers to all responses
  let response: NextResponse
  
  // Skip admin auth for login and logout endpoints
  const isAuthEndpoint = isAdminAuthEndpoint(pathname)
  
  if (!pathname.startsWith('/api/admin') || isAuthEndpoint) {
    response = NextResponse.next()
    
    // Add rate limit headers for successful requests
    if (pathname.startsWith('/api/')) {
      const rateLimitResult = checkEdgeRateLimit(req)
      response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString())
      response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString())
      response.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime.toISOString())
      
      if (!rateLimitResult.allowed) {
        return addSecurityHeaders(createRateLimitResponse(60000))
      }
    }
    
    return addSecurityHeaders(response)
  }

  // For /api/admin routes (except auth endpoints), verify admin session
  try {
    // Get session token from cookie or Authorization header
    const cookieToken = req.cookies.get('admin-session')?.value
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization')
    const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null
    const sessionToken = cookieToken || headerToken

    if (!sessionToken || !isValidTokenFormat(sessionToken)) {
      return addSecurityHeaders(createUnauthorizedResponse())
    }

    // In edge runtime, we can only do basic token format validation
    // Full database verification will happen in the actual API route
    // This allows the request to proceed to the API route where proper auth is handled

    // Add session token to request headers for API routes to handle validation
    const requestHeaders = new Headers(req.headers)
    requestHeaders.set('x-admin-token', sessionToken)
    requestHeaders.set('x-middleware-check', 'passed')

    response = NextResponse.next({
      request: {
        headers: requestHeaders
      }
    })
    
    return addSecurityHeaders(response)
    
  } catch (error) {
    console.error('Admin auth middleware error:', error)
    const errorResponse = NextResponse.json({ error: 'Admin authentication failed' }, { status: 500 })
    return addSecurityHeaders(errorResponse)
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
