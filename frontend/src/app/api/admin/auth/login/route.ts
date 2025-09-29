import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { captureException } from '@sentry/nextjs'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { ADMIN_SESSION_COOKIE, ADMIN_SESSION_MAX_AGE, createAdminSessionToken } from '@/lib/adminAuth'
import { adminRepository } from '@/lib/adminRepository'
import { trackError } from '@/lib/monitoring'
import type { AdminPermission, AdminUser } from '@/types/admin'

const bodySchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
})

// Rate limiting for admin login attempts
const loginAttempts = new Map<string, { count: number; lastAttempt: Date }>()
const MAX_LOGIN_ATTEMPTS = 5
const LOCKOUT_DURATION = 15 * 60 * 1000 // 15 minutes

function checkRateLimit(email: string, ip: string): { allowed: boolean; retryAfter?: number } {
  const key = `${email}:${ip}`
  const now = new Date()
  const attempt = loginAttempts.get(key)

  if (attempt) {
    // Reset if lockout period has passed
    if (now.getTime() - attempt.lastAttempt.getTime() > LOCKOUT_DURATION) {
      loginAttempts.delete(key)
      return { allowed: true }
    }

    // Check if locked out
    if (attempt.count >= MAX_LOGIN_ATTEMPTS) {
      const retryAfter = Math.ceil((LOCKOUT_DURATION - (now.getTime() - attempt.lastAttempt.getTime())) / 1000)
      return { allowed: false, retryAfter }
    }
  }

  return { allowed: true }
}

function recordFailedAttempt(email: string, ip: string): void {
  const key = `${email}:${ip}`
  const now = new Date()
  const attempt = loginAttempts.get(key)

  if (attempt) {
    attempt.count++
    attempt.lastAttempt = now
  } else {
    loginAttempts.set(key, { count: 1, lastAttempt: now })
  }
}

function clearFailedAttempts(email: string, ip: string): void {
  const key = `${email}:${ip}`
  loginAttempts.delete(key)
}

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
    const body = bodySchema.parse(await request.json())
    
    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown'
    
    // Check rate limiting
    const rateLimit = checkRateLimit(body.email, ip)
    if (!rateLimit.allowed) {
      trackError({
        errorType: 'api',
        errorCode: 'admin_login_rate_limited',
        endpoint: '/api/admin/auth/login',
        severity: 'medium'
      })

      return NextResponse.json(
        { 
          ok: false, 
          error: 'Too many failed login attempts. Please try again later.',
          retryAfter: rateLimit.retryAfter
        },
        { status: 429 }
      )
    }

    // Verify admin credentials against database
    const loginResult = await adminRepository.verifyAdminCredentials(body.email, body.password)
    
    if (!loginResult || !loginResult.isValid) {
      // Record failed attempt
      recordFailedAttempt(body.email, ip)
      
      trackError({
        errorType: 'api',
        errorCode: 'admin_login_failed',
        endpoint: '/api/admin/auth/login',
        severity: 'high'
      })

      return NextResponse.json(
        { ok: false, error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Clear failed attempts on successful login
    clearFailedAttempts(body.email, ip)

    const adminUser = loginResult.user
    const userAgent = request.headers.get('user-agent') || undefined

    // Create JWT token
    const token = await createAdminSessionToken({
      role: adminUser.role,
      email: adminUser.email,
      userId: adminUser.id
    })

    // Create database session
    const expiresAt = new Date(Date.now() + ADMIN_SESSION_MAX_AGE * 1000)
    const session = await adminRepository.createAdminSession(
      adminUser.id,
      token,
      expiresAt,
      ip !== 'unknown' ? ip : undefined,
      userAgent
    )

    // Update last login time
    await adminRepository.updateAdminLastLogin(adminUser.id)

    // Build response user object
    const responseUser = buildAdminUserResponse(adminUser)

    const response = NextResponse.json({
      ok: true,
      success: true,
      requiresMFA: loginResult.requiresMFA || false,
      token,
      expiresAt: expiresAt.toISOString(),
      user: responseUser,
      sessionId: session.id
    })

    // Set secure HTTP-only cookie
    response.cookies.set(ADMIN_SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: ADMIN_SESSION_MAX_AGE,
      path: '/',
    })

    console.log(`✅ Admin login successful: ${adminUser.email} (${adminUser.id})`)

    return response

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Invalid input',
        details: error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message
        }))
      }, { status: 400 })
    }
    
    console.error('Admin login failed:', error)
    captureException(error, {
      tags: { component: 'admin_auth', endpoint: 'login' }
    })

    return NextResponse.json({ 
      ok: false, 
      error: 'Login failed. Please try again.' 
    }, { status: 500 })
  }
}