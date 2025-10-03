import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key-change-in-production')

export async function middleware(request: NextRequest) {
  // Protect admin panel routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Allow access to login page
    if (request.nextUrl.pathname.startsWith('/admin/login')) {
      console.log('[Middleware] Allowing access to login page')
      return NextResponse.next()
    }

    // Check for auth token
    const token = request.cookies.get('auth_token')?.value
    console.log('[Middleware] Checking admin route:', request.nextUrl.pathname)
    console.log('[Middleware] Auth token present:', !!token)
    console.log('[Middleware] All cookies:', request.cookies.getAll().map(c => c.name))

    if (!token) {
      console.log('[Middleware] No token found, redirecting to login')
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    try {
      // Verify JWT token
      const { payload } = await jwtVerify(token, secret)
      console.log('[Middleware] JWT verified, role:', payload.role)

      // Check if user has admin role
      if (payload.role !== 'admin') {
        console.log('[Middleware] User is not admin, redirecting to login')
        return NextResponse.redirect(new URL('/admin/login', request.url))
      }

      // Allow access
      console.log('[Middleware] Access granted to:', request.nextUrl.pathname)
      return NextResponse.next()
    } catch (error) {
      // Invalid token, redirect to login
      console.error('[Middleware] JWT verification failed:', error)
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*']
}
