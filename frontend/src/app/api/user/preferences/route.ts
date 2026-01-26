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

const preferencesSchema = z.object({
  currency: z.enum(['EUR', 'USD', 'GBP', 'AUD', 'CAD']).optional(),
  language: z.string().min(2).max(5).optional(),
  preferredCabinClass: z.enum(['ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST']).optional(),
  newsletter: z.boolean().optional(),
  homeAirport: z.string().length(3).optional(),
})

// GET /api/user/preferences — Get current user preferences
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

    const parsed = userRepository.parseUserPreferences(user)

    return NextResponse.json({
      ok: true,
      preferences: parsed.preferences,
    })
  } catch (error) {
    console.error('Get preferences error:', error)
    return NextResponse.json({ ok: false, error: 'Failed to get preferences' }, { status: 500 })
  }
}

// PATCH /api/user/preferences — Update user preferences
export async function PATCH(request: NextRequest): Promise<Response> {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = preferencesSchema.parse(await request.json())

    const user = await userRepository.findUserById(session.userId)
    if (!user) {
      return NextResponse.json({ ok: false, error: 'User not found' }, { status: 404 })
    }

    // Merge with existing preferences
    const existingPrefs = typeof user.preferences === 'string' 
      ? JSON.parse(user.preferences) 
      : user.preferences || {}

    const updatedPrefs = { ...existingPrefs, ...body }

    await userRepository.updateUser(session.userId, { preferences: updatedPrefs })

    return NextResponse.json({
      ok: true,
      preferences: updatedPrefs,
      message: 'Preferences updated',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Invalid preferences', 
        details: error.issues 
      }, { status: 400 })
    }

    console.error('Update preferences error:', error)
    return NextResponse.json({ ok: false, error: 'Failed to update preferences' }, { status: 500 })
  }
}
