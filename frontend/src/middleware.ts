import { NextRequest, NextResponse } from 'next/server'
import { checkAPIRateLimit } from './lib/rateLimitProduction'

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
  
  // Apply rate limiting to all API routes
  if (pathname.startsWith('/api/')) {
    const rateLimitResult = await checkAPIRateLimit(req)
    
    if (!rateLimitResult.allowed) {
      const response = NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          retryAfter: rateLimitResult.retryAfter || 60
        },
        { status: 429 }
      )
      
      // Add rate limit headers
      response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString())
      response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString())
      response.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime.toISOString())
      
      if (rateLimitResult.retryAfter) {
        response.headers.set('Retry-After', rateLimitResult.retryAfter.toString())
      }
      
      return addSecurityHeaders(response)
    }
  }
  
  // Apply security headers to all responses
  let response: NextResponse
  
  // Skip admin auth for login and logout endpoints
  const isAdminAuthEndpoint = pathname === '/api/admin/auth/login' || 
                             pathname === '/api/admin/auth/logout' ||
                             pathname === '/api/admin/auth/refresh'
  
  if (!pathname.startsWith('/api/admin') || isAdminAuthEndpoint) {
    response = NextResponse.next()
    
    // Add rate limit headers for successful requests
    if (pathname.startsWith('/api/')) {
      const rateLimitResult = await checkAPIRateLimit(req)
      response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString())
      response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString())
      response.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime.toISOString())
    }
    
    return addSecurityHeaders(response)
  }

  // For /api/admin routes (except auth endpoints), verify admin session
  try {
    // Import adminRepository dynamically to avoid circular dependencies
    const { adminRepository } = await import('./lib/adminRepository')
    const { ADMIN_SESSION_COOKIE } = await import('./lib/adminAuth')
    
    // Get session token from cookie or Authorization header
    const cookieToken = req.cookies.get(ADMIN_SESSION_COOKIE)?.value
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization')
    const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null
    const sessionToken = cookieToken || headerToken

    if (!sessionToken) {
      const errorResponse = NextResponse.json({ error: 'Admin authentication required' }, { status: 401 })
      return addSecurityHeaders(errorResponse)
    }

    // Verify session exists and is valid in database
    const session = await adminRepository.findAdminSession(sessionToken)
    
    if (!session) {
      const errorResponse = NextResponse.json({ error: 'Invalid or expired admin session' }, { status: 401 })
      return addSecurityHeaders(errorResponse)
    }

    // Get admin user to verify they still have admin privileges
    const adminUser = await adminRepository.findAdminById(session.userId)
    
    if (!adminUser || !['admin', 'moderator'].includes(adminUser.role)) {
      const errorResponse = NextResponse.json({ error: 'Admin privileges required' }, { status: 403 })
      return addSecurityHeaders(errorResponse)
    }

    // Update session activity
    await adminRepository.updateSessionActivity(sessionToken)

    // Role-based access control
    const requiresSuperAdmin = pathname.startsWith('/api/admin/system') || 
                              pathname.startsWith('/api/admin/cache')
    if (requiresSuperAdmin && adminUser.role !== 'admin') {
      const errorResponse = NextResponse.json({ error: 'Super admin privileges required' }, { status: 403 })
      return addSecurityHeaders(errorResponse)
    }

    // Add admin user info to request headers for use in API routes
    const requestHeaders = new Headers(req.headers)
    requestHeaders.set('x-admin-user-id', adminUser.id)
    requestHeaders.set('x-admin-user-email', adminUser.email)
    requestHeaders.set('x-admin-user-role', adminUser.role)
    requestHeaders.set('x-admin-session-id', session.id)

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

function base64UrlToUint8Array(base64Url: string): Uint8Array {
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (base64Url.length % 4)) % 4)
  const str = atob(base64)
  const bytes = new Uint8Array(str.length)
  for (let i = 0; i < str.length; i++) bytes[i] = str.charCodeAt(i)
  return bytes
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
