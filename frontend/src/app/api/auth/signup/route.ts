import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { 
  createUserSessionToken, 
  USER_SESSION_COOKIE, 
  USER_SESSION_MAX_AGE 
} from '@/lib/userAuth'
import { userRepository } from '@/lib/userRepository'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
  username: z.string().min(3, 'Username must be at least 3 characters').optional(),
  newsletter: z.boolean().default(false)
})

export async function POST(request: NextRequest) {
  try {
    const body = signupSchema.parse(await request.json())
    
    // Check if user already exists
    const emailTaken = await userRepository.isEmailTaken(body.email)
    if (emailTaken) {
      return NextResponse.json({ 
        ok: false, 
        error: 'User with this email already exists' 
      }, { status: 409 })
    }

    // Check if username is taken (if provided)
    if (body.username) {
      const usernameTaken = await userRepository.isUsernameTaken(body.username)
      if (usernameTaken) {
        return NextResponse.json({ 
          ok: false, 
          error: 'Username is already taken' 
        }, { status: 409 })
      }
    }

    // Create user in database
    const newUser = await userRepository.createUser({
      email: body.email,
      password: body.password,
      firstName: body.firstName,
      lastName: body.lastName,
      username: body.username || body.email.split('@')[0],
      preferences: {
        newsletter: body.newsletter,
        currency: 'EUR',
        language: 'en',
        preferredCabinClass: 'ECONOMY'
      }
    })

    // Parse user preferences for response
    const userWithPreferences = userRepository.parseUserPreferences(newUser)
    
    // TODO: Send verification email
    // await sendVerificationEmail(newUser.email)

    // Create session token
    const token = await createUserSessionToken({
      userId: newUser.id,
      email: newUser.email,
      username: newUser.username || undefined
    })

    // Store session in database
    const expiresAt = new Date(Date.now() + USER_SESSION_MAX_AGE * 1000)
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
    const userAgent = request.headers.get('user-agent') || undefined
    
    await userRepository.createSession(newUser.id, token, expiresAt, ipAddress, userAgent)

    const response = NextResponse.json({
      ok: true,
      success: true,
      message: 'Account created successfully',
      token,
      expiresAt: expiresAt.toISOString(),
      user: {
        id: userWithPreferences.id,
        email: userWithPreferences.email,
        username: userWithPreferences.username,
        firstName: userWithPreferences.firstName,
        lastName: userWithPreferences.lastName,
        isEmailVerified: userWithPreferences.isEmailVerified,
        createdAt: userWithPreferences.createdAt.toISOString(),
        preferences: userWithPreferences.preferences
      }
    })

    // Set secure cookie
    response.cookies.set(USER_SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: USER_SESSION_MAX_AGE,
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
    
    console.error('User signup failed:', error)
    return NextResponse.json({ 
      ok: false, 
      error: 'Account creation failed. Please try again.' 
    }, { status: 500 })
  }
}