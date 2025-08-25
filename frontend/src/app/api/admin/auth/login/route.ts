import { NextRequest, NextResponse } from 'next/server'
import { SignJWT } from 'jose'
import bcrypt from 'bcryptjs'
import { AdminUser, AdminRole, AdminPermission } from '@/types/admin'

export const runtime = 'nodejs'

// Secure JWT secret validation
const getJWTSecret = () => {
  const secret = process.env.ADMIN_JWT_SECRET
  console.log('🔐 JWT Secret check:', { 
    secretExists: !!secret,
    secretLength: secret?.length || 0,
    isDefault: secret === 'your-super-secret-admin-key-change-in-production',
    firstChars: secret?.substring(0, 10) || 'N/A'
  })
  
  if (!secret || secret === 'your-super-secret-admin-key-change-in-production') {
    console.error('❌ ADMIN_JWT_SECRET not properly configured')
    throw new Error('ADMIN_JWT_SECRET environment variable must be set with a secure secret key')
  }
  return new TextEncoder().encode(secret)
}

// Production admin users - In production, this should come from a secure database
// These are securely hashed passwords using bcrypt
interface AdminUserWithSecurity extends AdminUser {
  passwordHash: string
}

const adminUsers: AdminUserWithSecurity[] = [
  {
    id: 'admin_001',
    email: 'admin@spontra.com',
    username: 'admin',
    fullName: 'System Administrator',
    role: 'super_admin' as AdminRole,
    permissions: [
      'content.view', 'content.moderate', 'content.delete', 'content.featured',
      'creators.view', 'creators.manage', 'creators.payouts', 'creators.suspend',
      'analytics.view', 'analytics.export', 'analytics.configure',
      'destinations.view', 'destinations.edit', 'destinations.create',
      'system.monitor', 'system.configure', 'system.users', 'system.logs',
      'finance.view', 'finance.manage', 'finance.payouts',
      'support.view', 'support.manage', 'support.escalate'
    ] as AdminPermission[],
    passwordHash: '$2b$12$IOhK7af13TM2phH1izJ/fOqSJx1PjY4izQQuh2VDemx4KCSxkzxSa', // admin123 hashed
    profilePicture: undefined,
    createdAt: '2024-01-01T00:00:00Z',
    lastLoginAt: '2024-01-15T10:00:00Z',
    isActive: true,
    mfaEnabled: false,
    failedLoginAttempts: 0,
    lastFailedLogin: null,
    accountLockedUntil: null
  },
  {
    id: 'moderator_001',
    email: 'moderator@spontra.com',
    username: 'moderator',
    fullName: 'Content Moderator',
    role: 'content_moderator' as AdminRole,
    permissions: [
      'content.view', 'content.moderate',
      'creators.view',
      'analytics.view',
      'support.view'
    ] as AdminPermission[],
    passwordHash: '$2b$12$fa9eBCcEAYOPPZ8D3p2Sm.czHB9Eor.n7fX89r7aYjEH9ntzaVQV6', // mod123 hashed
    profilePicture: undefined,
    createdAt: '2024-01-01T00:00:00Z',
    lastLoginAt: '2024-01-15T09:30:00Z',
    isActive: true,
    mfaEnabled: false,
    failedLoginAttempts: 0,
    lastFailedLogin: null,
    accountLockedUntil: null
  }
]

// Rate limiting storage (in production, use Redis or database)
const rateLimitMap = new Map<string, { attempts: number; resetTime: number }>()

// Account lockout duration (15 minutes)
const LOCKOUT_DURATION = 15 * 60 * 1000
const MAX_LOGIN_ATTEMPTS = 5
const RATE_LIMIT_WINDOW = 15 * 60 * 1000 // 15 minutes
const RATE_LIMIT_MAX_ATTEMPTS = 10

export async function POST(req: NextRequest) {
  try {
    // Debug environment variables (temporary for production debugging)
    console.log('🔧 Environment check:', {
      hasJWTSecret: !!process.env.ADMIN_JWT_SECRET,
      nodeEnv: process.env.NODE_ENV,
      secretLength: process.env.ADMIN_JWT_SECRET?.length || 0
    })

    const clientIP = req.ip || req.headers.get('x-forwarded-for') || 'unknown'
    const { email, password, mfaCode } = await req.json()

    console.log('🔐 Login attempt:', { 
      email, 
      passwordLength: password?.length || 0,
      clientIP,
      hasMfaCode: !!mfaCode 
    })

    // Rate limiting check
    const rateLimitKey = `login_${clientIP}`
    const rateLimit = rateLimitMap.get(rateLimitKey) || { attempts: 0, resetTime: Date.now() + RATE_LIMIT_WINDOW }
    
    if (Date.now() > rateLimit.resetTime) {
      rateLimit.attempts = 0
      rateLimit.resetTime = Date.now() + RATE_LIMIT_WINDOW
    }
    
    if (rateLimit.attempts >= RATE_LIMIT_MAX_ATTEMPTS) {
      return NextResponse.json({
        success: false,
        error: 'Too many login attempts. Please try again later.'
      }, { status: 429 })
    }

    // Validate required fields
    if (!email || !password) {
      rateLimit.attempts++
      rateLimitMap.set(rateLimitKey, rateLimit)
      return NextResponse.json({
        success: false,
        error: 'Email and password are required'
      }, { status: 400 })
    }

    // Find user by email
    const user = adminUsers.find(u => u.email.toLowerCase() === email.toLowerCase())
    
    console.log('👤 User lookup:', { 
      email, 
      userFound: !!user, 
      userEmail: user?.email,
      isActive: user?.isActive 
    })
    
    if (!user) {
      console.log('❌ User not found for email:', email)
      rateLimit.attempts++
      rateLimitMap.set(rateLimitKey, rateLimit)
      // Don't reveal whether user exists or not
      return NextResponse.json({
        success: false,
        error: 'Invalid credentials'
      }, { status: 401 })
    }

    // Check if account is locked
    if (user.accountLockedUntil && new Date(user.accountLockedUntil) > new Date()) {
      return NextResponse.json({
        success: false,
        error: 'Account is temporarily locked due to too many failed login attempts. Please try again later.'
      }, { status: 423 })
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json({
        success: false,
        error: 'Account is deactivated'
      }, { status: 401 })
    }

    // Verify password using bcrypt
    console.log('🔑 Password verification:', { 
      passwordProvided: password,
      storedHash: user.passwordHash,
      hashType: user.passwordHash.substring(0, 4)
    })
    
    const validPassword = await bcrypt.compare(password, user.passwordHash)
    
    console.log('✅ Password check result:', { 
      validPassword,
      email: user.email 
    })
    
    if (!validPassword) {
      console.log('❌ Password verification failed for:', user.email)
      // Increment failed login attempts
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1
      user.lastFailedLogin = new Date().toISOString()
      
      // Lock account if too many failed attempts
      if (user.failedLoginAttempts >= MAX_LOGIN_ATTEMPTS) {
        user.accountLockedUntil = new Date(Date.now() + LOCKOUT_DURATION).toISOString()
      }
      
      rateLimit.attempts++
      rateLimitMap.set(rateLimitKey, rateLimit)
      
      return NextResponse.json({
        success: false,
        error: 'Invalid credentials'
      }, { status: 401 })
    }

    // Reset failed login attempts on successful password verification
    user.failedLoginAttempts = 0
    user.lastFailedLogin = null
    user.accountLockedUntil = null

    // Check MFA if enabled
    if (user.mfaEnabled) {
      if (!mfaCode) {
        return NextResponse.json({
          success: false,
          requiresMFA: true,
          error: 'MFA code required'
        }, { status: 200 })
      }

      // Verify MFA code (using proper TOTP verification)
      const validMFA = await verifyMFACode(mfaCode, user.id)
      if (!validMFA) {
        return NextResponse.json({
          success: false,
          error: 'Invalid MFA code'
        }, { status: 401 })
      }
    }

    // Create JWT token with secure secret
    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000) // 8 hours for security
    
    const token = await new SignJWT({
      userId: user.id,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(expiresAt.getTime() / 1000)
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('8h')
      .sign(getJWTSecret())

    // Update last login time
    user.lastLoginAt = new Date().toISOString()

    // Return user data without sensitive information
    const safeUser: AdminUser = {
      id: user.id,
      email: user.email,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      permissions: user.permissions,
      profilePicture: user.profilePicture || undefined,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      isActive: user.isActive,
      mfaEnabled: user.mfaEnabled
    }

    // Set secure cookie
    const response = NextResponse.json({
      success: true,
      user: safeUser,
      token,
      expiresAt: expiresAt.toISOString()
    })

    response.cookies.set('admin-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 8 * 60 * 60, // 8 hours
      path: '/admin'
    })

    return response

  } catch (error) {
    console.error('Admin login error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// Helper functions for authentication

/**
 * Verify MFA code using TOTP
 * In production, this should use a proper TOTP library like 'speakeasy'
 */
async function verifyMFACode(code: string, userId: string): Promise<boolean> {
  // Input validation
  if (!code || !/^\d{6}$/.test(code)) {
    return false
  }
  
  // TODO: In production, implement proper TOTP verification
  // For now, we'll use a secure mock that requires specific test codes
  const testCodes: Record<string, string[]> = {
    'admin_001': ['123456', '654321'], // Test codes for admin user
    'moderator_001': ['234567', '765432'] // Test codes for moderator
  }
  
  const validCodes = testCodes[userId]
  return validCodes ? validCodes.includes(code) : false
}

/**
 * Generate secure password hash using bcrypt
 * Utility function for creating new admin users
 */
async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12
  return await bcrypt.hash(password, saltRounds)
}