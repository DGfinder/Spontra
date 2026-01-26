import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { verifyUserSessionToken, USER_SESSION_COOKIE } from '@/lib/userAuth'
import { userRepository } from '@/lib/userRepository'

export const dynamic = 'force-dynamic'

async function getSession(request: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get(USER_SESSION_COOKIE)?.value
  return verifyUserSessionToken(token)
}

const profileSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  username: z.string().min(3).max(30).optional(),
})

// GET /api/user/profile — Get current user profile
export async function GET(request: NextRequest): Promise<Response> {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }

    const user = await userRepository.findUserById(session.userId)
    if (!user) {
      return NextResponse.json({ ok: false, error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      ok: true,
      profile: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('Get profile error:', error)
    return NextResponse.json({ ok: false, error: 'Failed to get profile' }, { status: 500 })
  }
}

// PATCH /api/user/profile — Update user profile
export async function PATCH(request: NextRequest): Promise<Response> {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = profileSchema.parse(await request.json())

    // Check if username is taken (if changing)
    if (body.username) {
      const existing = await userRepository.findUserByUsername(body.username)
      if (existing && existing.id !== session.userId) {
        return NextResponse.json({ 
          ok: false, 
          error: 'Username already taken' 
        }, { status: 409 })
      }
    }

    const updated = await userRepository.updateUser(session.userId, body)

    return NextResponse.json({
      ok: true,
      profile: {
        id: updated.id,
        email: updated.email,
        username: updated.username,
        firstName: updated.firstName,
        lastName: updated.lastName,
      },
      message: 'Profile updated',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Invalid profile data', 
        details: error.issues 
      }, { status: 400 })
    }

    console.error('Update profile error:', error)
    return NextResponse.json({ ok: false, error: 'Failed to update profile' }, { status: 500 })
  }
}
