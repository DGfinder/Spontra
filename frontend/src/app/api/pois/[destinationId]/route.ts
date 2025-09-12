import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

function isIata(code: string) {
  return /^[A-Z]{3}$/.test(code)
}

export async function GET(
  req: NextRequest,
  { params }: { params: { destinationId: string } }
) {
  const destinationId = (params?.destinationId || '').toUpperCase()
  const { searchParams } = new URL(req.url)
  const theme = (searchParams.get('theme') || '').toLowerCase()
  const limit = Math.min(parseInt(searchParams.get('limit') || '12', 10), 50)

  if (!isIata(destinationId)) {
    return NextResponse.json({ ok: false, error: 'Invalid destinationId' }, { status: 400 })
  }

  const base = process.env.POI_PUBLIC_BASE_URL
  if (!base) {
    // No mock fallback: surface that POI service is not configured
    return NextResponse.json({ ok: false, error: 'POI service unavailable' }, { status: 503 })
  }

  try {
    const url = new URL(base.replace(/\/$/, '') + '/pois')
    url.searchParams.set('destination', destinationId)
    if (theme) url.searchParams.set('theme', theme)
    url.searchParams.set('limit', String(limit))

    const res = await fetch(url.toString(), { cache: 'no-store' })
    if (!res.ok) {
      return NextResponse.json({ ok: false, error: `Upstream error ${res.status}` }, { status: 502 })
    }
    const data = await res.json()
    return NextResponse.json({ ok: true, data })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'POI fetch failed' }, { status: 500 })
  }
}

