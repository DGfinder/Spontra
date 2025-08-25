import { NextRequest, NextResponse } from 'next/server'
import { SignJWT, jwtVerify } from 'jose'
import { AdminUser } from '@/types/admin'

export const runtime = 'nodejs'

// Secure JWT secret validation (same as login route)
const getJWTSecret = () => {
  const secret = process.env.ADMIN_JWT_SECRET
  if (!secret || secret === 'your-super-secret-admin-key-change-in-production') {
    throw new Error('ADMIN_JWT_SECRET environment variable must be set with a secure secret key')
  }
  return new TextEncoder().encode(secret)
}

// Same admin users as login route (in production, this would be from database)
const adminUsers = [
  {
    id: 'admin_001',
    email: 'admin@spontra.com',
    username: 'admin',
    fullName: 'System Administrator',
    role: 'super_admin',
    permissions: [
      'content.view', 'content.moderate', 'content.delete', 'content.featured',
      'creators.view', 'creators.manage', 'creators.payouts', 'creators.suspend',
      'analytics.view', 'analytics.export', 'analytics.configure',
      'destinations.view', 'destinations.edit', 'destinations.create',
      'system.monitor', 'system.configure', 'system.users', 'system.logs',
      'finance.view', 'finance.manage', 'finance.payouts',
      'support.view', 'support.manage', 'support.escalate'
    ],
    isActive: true,
    mfaEnabled: false
  },
  {
    id: 'moderator_001',
    email: 'moderator@spontra.com',
    username: 'moderator',
    fullName: 'Content Moderator',
    role: 'content_moderator',
    permissions: [
      'content.view', 'content.moderate',
      'creators.view',
      'analytics.view',
      'support.view'
    ],
    isActive: true,
    mfaEnabled: false
  }
]

export async function POST(req: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'No token provided'
      }, { status: 401 })
    }

    // Verify current token
    let payload
    try {
      const result = await jwtVerify(token, getJWTSecret())
      payload = result.payload
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: 'Invalid or expired token'
      }, { status: 401 })
    }

    // Validate token claims
    if (!payload.userId || !payload.email) {
      return NextResponse.json({
        success: false,
        error: 'Invalid token claims'
      }, { status: 401 })
    }

    // Find user to ensure they still exist and are active
    const user = adminUsers.find(u => u.id === payload.userId && u.email === payload.email)
    
    if (!user || !user.isActive) {
      return NextResponse.json({
        success: false,
        error: 'User not found or inactive'
      }, { status: 401 })
    }

    // Check if token is not too old (max 24 hours since issued)
    const currentTime = Math.floor(Date.now() / 1000)
    if (payload.iat && (currentTime - (payload.iat as number)) > 24 * 60 * 60) {
      return NextResponse.json({
        success: false,
        error: 'Token too old, please login again'
      }, { status: 401 })
    }

    // Generate new token with extended expiry
    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000) // 8 hours
    
    const newToken = await new SignJWT({
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

    // Create safe user object for response
    const safeUser: AdminUser = {
      id: user.id,
      email: user.email,
      username: user.username,
      fullName: user.fullName,
      role: user.role as any,
      permissions: user.permissions as any,
      profilePicture: undefined,
      createdAt: '2024-01-01T00:00:00Z', // Would come from database
      lastLoginAt: new Date().toISOString(),
      isActive: user.isActive,
      mfaEnabled: user.mfaEnabled
    }

    // Set secure cookie with new token
    const response = NextResponse.json({
      success: true,
      token: newToken,
      user: safeUser,
      expiresAt: expiresAt.toISOString()
    })

    response.cookies.set('admin-token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 8 * 60 * 60, // 8 hours
      path: '/admin'
    })

    return response

  } catch (error) {
    console.error('Token refresh error:', error)
    return NextResponse.json({
      success: false,
      error: 'Token refresh failed'
    }, { status: 500 })
  }
}