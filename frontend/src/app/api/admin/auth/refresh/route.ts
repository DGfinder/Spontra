import { NextRequest, NextResponse } from 'next/server'
import { captureException } from '@sentry/nextjs'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { ADMIN_SESSION_COOKIE, ADMIN_SESSION_MAX_AGE, createAdminSessionToken } from '@/lib/adminAuth'
import { adminRepository } from '@/lib/adminRepository'
import { trackError } from '@/lib/monitoring'
import type { AdminPermission, AdminUser } from '@/types/admin'

function buildAdminUserResponse(dbUser: any): AdminUser {
  return {
    id: dbUser.id,
    email: dbUser.email,
    username: dbUser.username || dbUser.email.split('@')[0],
    fullName: `${dbUser.firstName} ${dbUser.lastName}`,
    role: dbUser.role as 'admin' | 'moderator',
    permissions: [] as AdminPermission[], // TODO: Implement permissions system
    profilePicture: dbUser.profileImageUrl || undefined,
    createdAt: dbUser.createdAt.toISOString(),
    lastLoginAt: dbUser.lastLoginAt?.toISOString() || new Date().toISOString(),
    isActive: true,
    mfaEnabled: dbUser.mfaEnabled || false
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get session token from cookie or Authorization header
    const cookieToken = request.cookies.get(ADMIN_SESSION_COOKIE)?.value
    const authHeader = request.headers.get('authorization')
    const headerToken = authHeader?.replace('Bearer ', '')
    const sessionToken = cookieToken || headerToken

    if (!sessionToken) {
      return NextResponse.json({
        success: false,
        error: 'No session token provided'
      }, { status: 401 })
    }

    // Find and validate the current session in database
    const currentSession = await adminRepository.findAdminSession(sessionToken)
    
    if (!currentSession) {
      return NextResponse.json({
        success: false,
        error: 'Invalid or expired session'
      }, { status: 401 })
    }

    // Get the admin user from database
    const adminUser = await adminRepository.findAdminById(currentSession.userId)
    
    if (!adminUser) {
      return NextResponse.json({
        success: false,
        error: 'Admin user not found or inactive'
      }, { status: 401 })
    }

    // Update session activity
    await adminRepository.updateSessionActivity(sessionToken)
    
    // Get client info for new session
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown'
    const userAgent = request.headers.get('user-agent') || undefined

    // Create new JWT token
    const newToken = await createAdminSessionToken({
      role: adminUser.role,
      email: adminUser.email,
      userId: adminUser.id
    })

    // Create new database session
    const expiresAt = new Date(Date.now() + ADMIN_SESSION_MAX_AGE * 1000)
    const newSession = await adminRepository.createAdminSession(
      adminUser.id,
      newToken,
      expiresAt,
      ip !== 'unknown' ? ip : undefined,
      userAgent
    )

    // Invalidate the old session
    await adminRepository.invalidateAdminSession(sessionToken)

    // Update last login time
    await adminRepository.updateAdminLastLogin(adminUser.id)

    // Build response user object
    const responseUser = buildAdminUserResponse(adminUser)

    // Create response with new session
    const response = NextResponse.json({
      success: true,
      token: newToken,
      user: responseUser,
      expiresAt: expiresAt.toISOString(),
      sessionId: newSession.id
    })

    // Set secure HTTP-only cookie
    response.cookies.set(ADMIN_SESSION_COOKIE, newToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: ADMIN_SESSION_MAX_AGE,
      path: '/',
    })

    console.log(`✅ Admin session refreshed: ${adminUser.email} (${adminUser.id})`)

    return response

  } catch (error) {
    console.error('Admin token refresh failed:', error)
    captureException(error, {
      tags: { component: 'admin_auth', endpoint: 'refresh' }
    })

    trackError({
      errorType: 'api',
      errorCode: 'admin_refresh_failed',
      endpoint: '/api/admin/auth/refresh',
      severity: 'medium'
    })

    return NextResponse.json({
      success: false,
      error: 'Token refresh failed'
    }, { status: 500 })
  }
}