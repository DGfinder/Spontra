import { NextRequest, NextResponse } from 'next/server'
import { SignJWT } from 'jose'
import { AdminUser, AdminRole, AdminPermission } from '@/types/admin'

export const runtime = 'nodejs'

// JWT secret
const JWT_SECRET = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET || 'your-super-secret-admin-key-change-in-production'
)

// Mock admin users - in production this would come from your user database
const mockAdminUsers = [
  {
    id: 'admin_001',
    email: 'admin@spontra.com',
    username: 'admin',
    fullName: 'Admin User',
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
    passwordHash: 'hashed_password_admin123', // In production, use proper bcrypt hash
    profilePicture: null,
    createdAt: '2024-01-01T00:00:00Z',
    lastLoginAt: '2024-01-15T10:00:00Z',
    isActive: true,
    mfaEnabled: false
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
    passwordHash: 'hashed_password_mod123',
    profilePicture: null,
    createdAt: '2024-01-01T00:00:00Z',
    lastLoginAt: '2024-01-15T09:30:00Z',
    isActive: true,
    mfaEnabled: false
  },
  {
    id: 'analyst_001',
    email: 'analyst@spontra.com',
    username: 'analyst',
    fullName: 'Analytics Manager',
    role: 'analytics_manager' as AdminRole,
    permissions: [
      'analytics.view', 'analytics.export', 'analytics.configure',
      'creators.view',
      'destinations.view',
      'finance.view'
    ] as AdminPermission[],
    passwordHash: 'hashed_password_analyst123',
    profilePicture: null,
    createdAt: '2024-01-01T00:00:00Z',
    lastLoginAt: '2024-01-15T08:45:00Z',
    isActive: true,
    mfaEnabled: true
  }
]

export async function POST(req: NextRequest) {
  try {
    const { email, password, mfaCode } = await req.json()

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json({
        success: false,
        error: 'Email and password are required'
      }, { status: 400 })
    }

    // Find user by email
    const user = mockAdminUsers.find(u => u.email === email)
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Invalid credentials'
      }, { status: 401 })
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json({
        success: false,
        error: 'Account is deactivated'
      }, { status: 401 })
    }

    // Verify password (in production, use proper password verification)
    const validPassword = verifyPassword(password, user.passwordHash)
    if (!validPassword) {
      return NextResponse.json({
        success: false,
        error: 'Invalid credentials'
      }, { status: 401 })
    }

    // Check MFA if enabled
    if (user.mfaEnabled) {
      if (!mfaCode) {
        return NextResponse.json({
          success: false,
          requiresMFA: true,
          error: 'MFA code required'
        }, { status: 200 })
      }

      // Verify MFA code (in production, use proper TOTP verification)
      const validMFA = verifyMFACode(mfaCode, user.id)
      if (!validMFA) {
        return NextResponse.json({
          success: false,
          error: 'Invalid MFA code'
        }, { status: 401 })
      }
    }

    // Create JWT token
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    
    const token = await new SignJWT({
      userId: user.id,
      email: user.email,
      role: user.role,
      permissions: user.permissions
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(JWT_SECRET)

    // Update last login time (in production, update in database)
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

    return NextResponse.json({
      success: true,
      user: safeUser,
      token,
      expiresAt: expiresAt.toISOString()
    })

  } catch (error) {
    console.error('Admin login error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// Helper functions (in production, these would be proper implementations)
function verifyPassword(password: string, hash: string): boolean {
  // Mock password verification - in production use bcrypt
  const expectedPasswords: Record<string, string> = {
    'hashed_password_admin123': 'admin123',
    'hashed_password_mod123': 'mod123',
    'hashed_password_analyst123': 'analyst123'
  }
  
  return expectedPasswords[hash] === password
}

function verifyMFACode(code: string, userId: string): boolean {
  // Mock MFA verification - in production use TOTP library
  // For demo purposes, accept any 6-digit code
  return /^\d{6}$/.test(code)
}