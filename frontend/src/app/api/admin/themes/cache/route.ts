import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

// GET /api/admin/themes/cache - list cache entries
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = searchParams.get('limit') || '100'
    const base = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8081'
    const res = await fetch(`${base}/api/v1/themes/cache/recommendations?limit=${encodeURIComponent(limit)}`)
    const data = await res.json()
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Failed to list cache:', error)
    return NextResponse.json({ success: false, error: 'Failed to list cache' }, { status: 500 })
  }
}


