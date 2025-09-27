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

// Protect /api/admin routes with JWT verification
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
  
  if (!pathname.startsWith('/api/admin')) {
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

  const auth = req.headers.get('authorization') || req.headers.get('Authorization')
  if (!auth || !auth.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = auth.substring(7)
  const secret = process.env.ADMIN_JWT_SECRET || ''

  if (!secret) {
    // If no secret configured, allow in development but block in production
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'Admin auth not configured' }, { status: 503 })
    }
    return NextResponse.next()
  }

  try {
    const [header, payload, signature] = token.split('.')
    if (!header || !payload || !signature) throw new Error('Malformed token')
    const enc = new TextEncoder()

    const data = `${header}.${payload}`
    const sig = base64UrlToUint8Array(signature)
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    )

    const ok = await crypto.subtle.verify('HMAC', key, sig as unknown as ArrayBuffer, enc.encode(data))
    if (!ok) throw new Error('Invalid signature')

    // Claims validation
    const json = JSON.parse(new TextDecoder().decode(base64UrlToUint8Array(payload)))
    const now = Math.floor(Date.now() / 1000)
    if (json.exp && now >= json.exp) throw new Error('Token expired')
    if (json.nbf && now < json.nbf) throw new Error('Token not yet valid')
    const iss = process.env.ADMIN_JWT_ISSUER
    const aud = process.env.ADMIN_JWT_AUDIENCE
    if (iss && json.iss && json.iss !== iss) throw new Error('Invalid issuer')
    if (aud && json.aud && json.aud !== aud) throw new Error('Invalid audience')

    // Simple RBAC: admin required for cache management
    const roles: string[] = Array.isArray(json.roles) ? json.roles : (typeof json.role === 'string' ? [json.role] : [])
    const requiresAdmin = pathname.startsWith('/api/admin/cache')
    if (requiresAdmin && !roles.includes('admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    response = NextResponse.next({
      request: {
        headers: req.headers
      }
    })
    return addSecurityHeaders(response)
  } catch {
    const errorResponse = NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
