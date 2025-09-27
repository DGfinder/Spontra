import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { 
  createUserSessionToken, 
  USER_SESSION_COOKIE, 
  USER_SESSION_MAX_AGE 
} from '@/lib/userAuth'
import { userRepository } from '@/lib/userRepository'
import { loginRateLimit, emailBasedRateLimit } from '@/lib/rateLimitAuth'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().default(false)
})

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting first
    const ipRateLimit = loginRateLimit(request)
    if (ipRateLimit.limited) {
      return ipRateLimit.response!
    }

    const body = loginSchema.parse(await request.json())
    
    // Apply email-based rate limiting for failed attempts
    const emailRateLimit = emailBasedRateLimit(request, body.email)
    if (emailRateLimit.limited) {
      return emailRateLimit.response!
    }
    
    // Verify user credentials
    const result = await userRepository.verifyUserPassword(body.email, body.password)
    
    if (!result || !result.isValid) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Invalid email or password' 
      }, { status: 401 })
    }

    const foundUser = result.user

    // Update last login time
    await userRepository.updateLastLogin(foundUser.id)
    
    // Create session token
    const sessionMaxAge = body.rememberMe ? USER_SESSION_MAX_AGE : 24 * 60 * 60 // 24 hours if not remembered
    const token = await createUserSessionToken({
      userId: foundUser.id,
      email: foundUser.email,
      username: foundUser.username || undefined
    })

    // Store session in database
    const expiresAt = new Date(Date.now() + sessionMaxAge * 1000)
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
    const userAgent = request.headers.get('user-agent') || undefined
    
    await userRepository.createSession(foundUser.id, token, expiresAt, ipAddress, userAgent)

    // Parse user preferences for response
    const userWithPreferences = userRepository.parseUserPreferences(foundUser)

    const response = NextResponse.json({
      ok: true,
      success: true,
      message: 'Login successful',
      token,
      expiresAt: expiresAt.toISOString(),
      user: {
        id: userWithPreferences.id,
        email: userWithPreferences.email,
        username: userWithPreferences.username,
        firstName: userWithPreferences.firstName,
        lastName: userWithPreferences.lastName,
        emailVerified: userWithPreferences.isEmailVerified,
        lastLoginAt: userWithPreferences.lastLoginAt,
        preferences: userWithPreferences.preferences
      }
    })

    // Set secure cookie
    response.cookies.set(USER_SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: sessionMaxAge,
      path: '/',
    })

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
    
    console.error('User login failed:', error)
    return NextResponse.json({ 
      ok: false, 
      error: 'Login failed. Please try again.' 
    }, { status: 500 })
  }
}

