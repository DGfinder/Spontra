import { NextRequest, NextResponse } from 'next/server'
import { cacheGet } from '@/lib/cacheServer'

export const runtime = 'nodejs'

function key(dest: string) {
  return `admin:media:assign:${dest}`
}

// GET /api/media/assign?destination=XXX&poiId=YYY&theme=adventure
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const destination = (searchParams.get('destination') || '').toUpperCase()
    const poiId = searchParams.get('poiId') || ''
    const theme = (searchParams.get('theme') || '').toLowerCase()
    if (!destination) return NextResponse.json({ ok: false, error: 'Missing destination' }, { status: 400 })

    const raw = await cacheGet(key(destination))
    if (!raw) return NextResponse.json({ ok: true, data: [] })
    const map = JSON.parse(raw) as Record<string, Record<string, any[]>>
    if (poiId) {
      const byPoi = map[poiId] || {}
      const list = theme ? (byPoi[theme] || []) : Object.values(byPoi).flat()
      return NextResponse.json({ ok: true, data: list })
    } else {
      // Aggregate across all POIs for destination
      const all = Object.values(map).flatMap((themes) => theme ? (themes[theme] || []) : Object.values(themes).flat())
      return NextResponse.json({ ok: true, data: all })
    }
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Failed to fetch assignments' }, { status: 500 })
  }
}
