import { NextRequest, NextResponse } from 'next/server'
import { SignJWT } from 'jose'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

const secret = new TextEncoder().encode(process.env.ADMIN_JWT_SECRET || 'your-secret-key-change-in-production')

// Warn if ADMIN_JWT_SECRET is not properly configured
if (!process.env.ADMIN_JWT_SECRET) {
  console.warn('[Admin Login] WARNING: ADMIN_JWT_SECRET environment variable not set. Using fallback (insecure).')
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    console.log('[Admin Login] Attempt for email:', email)
    console.log('[Admin Login] Environment:', process.env.NODE_ENV)
    console.log('[Admin Login] Request URL:', request.url)

    // Find user
    const user = await db.user.findUnique({
      where: { email }
    })

    if (!user) {
      console.log('[Admin Login] User not found:', email)
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    console.log('[Admin Login] User found, role:', user.role)

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash)
    console.log('[Admin Login] Password valid:', isValidPassword)

    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Check if user is admin
    if (user.role !== 'admin') {
      console.log('[Admin Login] User is not admin, role:', user.role)
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    console.log('[Admin Login] Login successful for:', email)

    // Create JWT token
    const token = await new SignJWT({
      userId: user.id,
      email: user.email,
      role: user.role
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(secret)

    console.log('[Admin Login] JWT token created, length:', token.length)

    // Set cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    })

    // CRITICAL: Set cookie with explicit path='/' so it's sent to /admin/* routes
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/', // Ensure cookie is sent to all routes
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })

    console.log('[Admin Login] Cookie set with path=/, secure:', process.env.NODE_ENV === 'production')

    return response

  } catch (error) {
    console.error('[Admin Login] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
