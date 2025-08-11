import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

// Define protected admin routes - use exact matching to avoid false positives
const adminRoutes = ['/admin/']
const publicAdminRoutes = ['/admin/login', '/admin/register']

// JWT secret key
const JWT_SECRET = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET || 'your-super-secret-admin-key-change-in-production'
)

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if this is an admin route (exact match for /admin or starts with /admin/)
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    // Allow public admin routes
    if (publicAdminRoutes.some(route => pathname.startsWith(route))) {
      return NextResponse.next()
    }

    // Get token from cookie or Authorization header
    const token = request.cookies.get('admin-token')?.value ||
                  request.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      // Redirect to admin login
      const loginUrl = new URL('/admin/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    try {
      // Verify JWT token
      const { payload } = await jwtVerify(token, JWT_SECRET)
      
      // Check if token is expired
      if (payload.exp && payload.exp < Date.now() / 1000) {
        throw new Error('Token expired')
      }

      // Add user info to request headers for use in API routes
      const response = NextResponse.next()
      response.headers.set('x-admin-user-id', payload.userId as string)
      response.headers.set('x-admin-user-role', payload.role as string)
      response.headers.set('x-admin-user-permissions', JSON.stringify(payload.permissions || []))

      return response
    } catch (error) {
      console.error('Admin token verification failed:', error)
      
      // Clear invalid token and redirect to login
      const loginUrl = new URL('/admin/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      loginUrl.searchParams.set('error', 'session_expired')
      
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