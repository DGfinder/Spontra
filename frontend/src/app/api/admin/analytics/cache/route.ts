import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

const base = process.env.NEXT_PUBLIC_SEARCH_SERVICE_URL || 'http://localhost:8084'

export async function GET(_req: NextRequest) {
  try {
    const res = await fetch(`${base}/api/v1/cache/stats`, { cache: 'no-store' })
    const data = await res.json()
    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to load cache stats' }, { status: 500 })
  }
}


