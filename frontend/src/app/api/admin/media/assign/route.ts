import { NextRequest, NextResponse } from 'next/server'
import { cacheGet, cacheSet } from '@/lib/cacheServer'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

function requireAdmin(req: NextRequest): boolean {
  const auth = req.headers.get('authorization') || req.headers.get('Authorization')
  return !!auth && auth.startsWith('Bearer ')
}

function key(dest: string) {
  return `admin:media:assign:${dest}`
}

// GET /api/admin/media/assign?destination=XXX
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const destination = (searchParams.get('destination') || '').toUpperCase()
    if (!destination) return NextResponse.json({ ok: false, error: 'Missing destination' }, { status: 400 })
    const raw = await cacheGet(key(destination))
    return NextResponse.json({ ok: true, data: raw ? JSON.parse(raw) : {} })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Failed to load assignments' }, { status: 500 })
  }
}

// POST /api/admin/media/assign  body: { destination: IATA, assignments: Record<poiId, Record<theme, VideoItem[]>> }
export async function POST(req: NextRequest) {
  try {
    if (!requireAdmin(req)) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    const body = await req.json()
    const destination: string = String(body?.destination || '').toUpperCase()
    const assignments = body?.assignments || {}
    if (!destination || typeof assignments !== 'object') {
      return NextResponse.json({ ok: false, error: 'Invalid payload' }, { status: 400 })
    }
    await cacheSet(key(destination), JSON.stringify(assignments), { ttlSeconds: 30 * 24 * 60 * 60 })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Failed to save assignments' }, { status: 500 })
  }
}
