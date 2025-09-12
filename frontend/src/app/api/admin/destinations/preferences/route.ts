import { NextRequest, NextResponse } from 'next/server'
import { cacheGet, cacheSet } from '@/lib/cacheServer'

export const runtime = 'nodejs'

const STORE_KEY = 'admin:dest:preferences'

type ThemeKey = 'vibe' | 'adventure' | 'discover' | 'indulge' | 'nature'

interface DestinationPreference {
  iataCode: string
  whitelisted: boolean
  themeScores: Partial<Record<ThemeKey, number>>
  updatedAt: string
}

async function readAll(): Promise<Record<string, DestinationPreference>> {
  try { const raw = await cacheGet(STORE_KEY); return raw ? JSON.parse(raw) : {} } catch { return {} }
}

async function writeAll(map: Record<string, DestinationPreference>): Promise<void> {
  await cacheSet(STORE_KEY, JSON.stringify(map), { ttlSeconds: 365 * 24 * 60 * 60 }).catch(() => {})
}

// GET /api/admin/destinations/preferences?destination=IATA (optional)
export async function GET(req: NextRequest) {
  const dest = (new URL(req.url).searchParams.get('destination') || '').toUpperCase()
  const all = await readAll()
  if (dest) return NextResponse.json({ ok: true, data: all[dest] || null })
  return NextResponse.json({ ok: true, data: all })
}

// PUT body: { iataCode, whitelisted, themeScores }
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const iata = String(body?.iataCode || '').toUpperCase()
    if (!iata || iata.length !== 3) return NextResponse.json({ ok: false, error: 'Invalid IATA' }, { status: 400 })
    const all = await readAll()
    const prev = all[iata] || { iataCode: iata, whitelisted: false, themeScores: {}, updatedAt: '' }
    const next: DestinationPreference = {
      iataCode: iata,
      whitelisted: Boolean(body?.whitelisted),
      themeScores: { ...prev.themeScores, ...(body?.themeScores || {}) },
      updatedAt: new Date().toISOString()
    }
    all[iata] = next
    await writeAll(all)
    return NextResponse.json({ ok: true, data: next })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Failed to save' }, { status: 500 })
  }
}

