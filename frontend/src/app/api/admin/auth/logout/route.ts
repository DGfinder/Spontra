import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0


import { ADMIN_SESSION_COOKIE } from '@/lib/adminAuth'

export async function POST() {
  const response = NextResponse.json({ ok: true })
  response.cookies.set(ADMIN_SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    expires: new Date(0),
    path: '/',
  })
  return response
}