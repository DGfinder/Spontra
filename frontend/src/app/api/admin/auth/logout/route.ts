import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { ADMIN_SESSION_COOKIE } from '@/lib/adminAuth'
import { adminRepository } from '@/lib/adminRepository'
import { trackError } from '@/lib/monitoring'

export async function POST(request: NextRequest): Promise<Response> {
  try {
    // Get session token from cookie
    const sessionToken = request.cookies.get(ADMIN_SESSION_COOKIE)?.value
    
    if (sessionToken) {
      // Invalidate the session in the database
      await adminRepository.invalidateAdminSession(sessionToken)
      
      console.log('✅ Admin session invalidated')
    }

    // Clear the cookie regardless of whether session existed
    const response = NextResponse.json({ 
      ok: true, 
      message: 'Logged out successfully' 
    })
    
    response.cookies.set(ADMIN_SESSION_COOKIE, '', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      expires: new Date(0),
      path: '/',
    })
    
    return response
  } catch (error) {
    console.error('Admin logout failed:', error)
    console.error('Admin logout error:', error)

    trackError(new Error('Admin logout failed'), {
      errorType: 'api',
      errorCode: 'admin_logout_failed',
      endpoint: '/api/admin/auth/logout',
      severity: 'medium'
    })

    // Still clear the cookie even if database cleanup failed
    const response = NextResponse.json({ 
      ok: true, 
      message: 'Logged out successfully'
    })
    
    response.cookies.set(ADMIN_SESSION_COOKIE, '', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      expires: new Date(0),
      path: '/',
    })
    
    return response
  }
}