import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { ADMIN_SESSION_COOKIE, ADMIN_SESSION_MAX_AGE, createAdminSessionToken } from '@/lib/adminAuth'
import type { AdminPermission, AdminUser } from '@/types/admin'

const bodySchema = z.object({
  email: z.string().min(1),
  password: z.string().min(1),
})

const ADMIN_EMAIL = process.env.ADMIN_PANEL_EMAIL || 'admin@spontra.com'
const ADMIN_PASSWORD = process.env.ADMIN_PANEL_PASSWORD || 'change-me'

function buildAdminUser(): AdminUser {
  const now = new Date().toISOString()
  const username = ADMIN_EMAIL.split('@')[0] || 'admin'

  return {
    id: 'admin',
    email: ADMIN_EMAIL,
    username,
    fullName: 'Spontra Admin',
    role: 'admin',
    permissions: [] as AdminPermission[],
    profilePicture: undefined,
    createdAt: now,
    lastLoginAt: now,
    isActive: true,
    mfaEnabled: false,
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = bodySchema.parse(await request.json())
    if (body.email !== ADMIN_EMAIL || body.password !== ADMIN_PASSWORD) {
      return NextResponse.json({ ok: false, error: 'Invalid credentials' }, { status: 401 })
    }

    const token = await createAdminSessionToken({
      role: 'admin',
      email: ADMIN_EMAIL,
    })

    const expiresAt = new Date(Date.now() + ADMIN_SESSION_MAX_AGE * 1000).toISOString()
    const response = NextResponse.json({
      ok: true,
      success: true,
      requiresMFA: false,
      token,
      expiresAt,
      user: buildAdminUser(),
    })

    response.cookies.set(ADMIN_SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: ADMIN_SESSION_MAX_AGE,
      path: '/',
    })

    return response
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: 'Invalid payload', details: error.issues }, { status: 400 })
    }
    console.error('Admin login failed:', error)
    return NextResponse.json({ ok: false, error: 'Login failed' }, { status: 500 })
  }
}
