import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { ADMIN_SESSION_COOKIE, ADMIN_SESSION_MAX_AGE, createAdminSessionToken } from '@/lib/adminAuth'

const bodySchema = z.object({
  email: z.string().min(1),
  password: z.string().min(1),
})

const ADMIN_EMAIL = process.env.ADMIN_PANEL_EMAIL || 'admin@spontra.com'
const ADMIN_PASSWORD = process.env.ADMIN_PANEL_PASSWORD || 'change-me'

export async function POST(request: NextRequest) {
  try {
    const body = bodySchema.parse(await request.json())
    if (body.email !== ADMIN_EMAIL || body.password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const token = await createAdminSessionToken({
      role: 'admin',
      email: ADMIN_EMAIL,
    })

    const response = NextResponse.json({ ok: true })
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
      return NextResponse.json({ error: 'Invalid payload', details: error.issues }, { status: 400 })
    }
    console.error('Admin login failed:', error)
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}
