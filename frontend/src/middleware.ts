import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

// Define protected admin routes
const adminRoutes = ['/admin/']
const publicAdminRoutes = ['/admin/login', '/admin/register']

// Secure JWT secret validation
const getJWTSecret = () => {
  const secret = process.env.ADMIN_JWT_SECRET
  if (!secret || secret === 'your-super-secret-admin-key-change-in-production') {
    console.error('🔒 SECURITY WARNING: ADMIN_JWT_SECRET must be set with a secure secret key')
    // In development, allow with warning; in production, this would fail
    if (process.env.NODE_ENV === 'production') {
      throw new Error('ADMIN_JWT_SECRET environment variable must be set with a secure secret key')
    }
    // Fallback for development only
    console.warn('⚠️ Using fallback JWT secret for development. This is NOT secure for production!')
    return new TextEncoder().encode('dev-fallback-secret-key-not-for-production-use')
  }
  return new TextEncoder().encode(secret)
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if this is an admin route (exact match for /admin or starts with /admin/)
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    // Allow public admin routes
    if (publicAdminRoutes.some(route => pathname.startsWith(route))) {
      return NextResponse.next()
    }

    // Get token from cookie or Authorization header (prefer cookie for security)
    const token = request.cookies.get('admin-token')?.value ||
                  request.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      // Redirect to admin login with proper error tracking
      const loginUrl = new URL('/admin/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      loginUrl.searchParams.set('error', 'no_token')
      return NextResponse.redirect(loginUrl)
    }

    try {
      // Verify JWT token with secure secret
      const { payload } = await jwtVerify(token, getJWTSecret())
      
      // Enhanced token validation
      const currentTime = Math.floor(Date.now() / 1000)
      
      // Check if token is expired
      if (payload.exp && payload.exp < currentTime) {
        throw new Error('Token expired')
      }

      // Check if token is too old (issued more than 24 hours ago)
      if (payload.iat && (currentTime - (payload.iat as number)) > 24 * 60 * 60) {
        throw new Error('Token too old')
      }

      // Validate required claims
      if (!payload.userId || !payload.email || !payload.role) {
        throw new Error('Invalid token claims')
      }

      // Add user info to request headers for use in API routes
      const response = NextResponse.next()
      response.headers.set('x-admin-user-id', payload.userId as string)
      response.headers.set('x-admin-user-email', payload.email as string)
      response.headers.set('x-admin-user-role', payload.role as string)
      response.headers.set('x-admin-user-permissions', JSON.stringify(payload.permissions || []))
      response.headers.set('x-admin-token-issued', (payload.iat as number).toString())

      // Set security headers
      response.headers.set('X-Frame-Options', 'DENY')
      response.headers.set('X-Content-Type-Options', 'nosniff')
      response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

      return response
    } catch (error) {
      console.error('Admin token verification failed:', error)
      
      // Determine the appropriate error message
      let errorType = 'session_expired'
      if (error instanceof Error) {
        if (error.message === 'Token too old') {
          errorType = 'token_refresh_required'
        } else if (error.message === 'Invalid token claims') {
          errorType = 'invalid_token'
        }
      }
      
      // Clear invalid token and redirect to login
      const loginUrl = new URL('/admin/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      loginUrl.searchParams.set('error', errorType)
      
      const response = NextResponse.redirect(loginUrl)
      response.cookies.delete('admin-token')
      
      return response
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}