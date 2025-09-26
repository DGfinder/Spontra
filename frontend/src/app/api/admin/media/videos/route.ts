import { NextRequest, NextResponse } from 'next/server'
import { cacheGet, cacheSet } from '@/lib/cacheServer'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

function requireAdmin(req: NextRequest): boolean {
  const auth = req.headers.get('authorization') || req.headers.get('Authorization')
  return !!auth && auth.startsWith('Bearer ')
}

function key(dest: string, activity: string) {
  return `admin:media:videos:${dest}:${activity || 'all'}`
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const destination = (searchParams.get('destination') || '').toUpperCase()
    const activity = (searchParams.get('activity') || '').toLowerCase()
    const raw = await cacheGet(key(destination, activity))
    return NextResponse.json({ ok: true, data: raw ? JSON.parse(raw) : [] })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Failed to load videos' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!requireAdmin(req)) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    const payload = await req.json()
    const { destination, activity, videos } = payload || {}
    if (!destination || !Array.isArray(videos)) {
      return NextResponse.json({ ok: false, error: 'Invalid payload' }, { status: 400 })
    }
    await cacheSet(key(String(destination).toUpperCase(), String(activity || '').toLowerCase()), JSON.stringify(videos), { ttlSeconds: 30 * 24 * 60 * 60 })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Failed to save videos' }, { status: 500 })
  }
}
