import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q') || ''
    const base = process.env.NEXT_PUBLIC_USER_SERVICE_URL || 'http://localhost:8080'
    // This assumes a users search endpoint; if not available, return empty list gracefully
    const res = await fetch(`${base}/api/v1/users/search?q=${encodeURIComponent(q)}`, { cache: 'no-store' })
    if (!res.ok) return NextResponse.json({ success: true, data: { items: [], count: 0 } })
    const data = await res.json()
    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json({ success: true, data: { items: [], count: 0 } })
  }
}


