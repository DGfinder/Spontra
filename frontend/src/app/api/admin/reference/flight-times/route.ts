import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

const base = process.env.NEXT_PUBLIC_SEARCH_SERVICE_URL || 'http://localhost:8084'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const origin = searchParams.get('origin') || ''
    const destination = searchParams.get('destination') || ''
    const mode = searchParams.get('mode') || '' // route|origin|direct|range|popular|stats|connectivity

    let target = ''
    if (mode === 'route' && origin && destination) target = `/api/v1/durations/route?origin=${origin}&destination=${destination}`
    else if (mode === 'origin' && origin) target = `/api/v1/durations/origin/${origin}?limit=${searchParams.get('limit') || '50'}`
    else if (mode === 'direct' && origin && destination) target = `/api/v1/durations/direct?origin=${origin}&destination=${destination}`
    else if (mode === 'range' && origin) target = `/api/v1/durations/range?origin=${origin}&min=${searchParams.get('min') || '0'}&max=${searchParams.get('max') || '1440'}&limit=${searchParams.get('limit') || '50'}`
    else if (mode === 'popular' && origin) target = `/api/v1/durations/popular?origin=${origin}&directOnly=${searchParams.get('directOnly') || 'false'}&limit=${searchParams.get('limit') || '20'}`
    else if (mode === 'stats') target = `/api/v1/durations/stats/routes`
    else if (mode === 'connectivity' && origin) target = `/api/v1/durations/stats/connectivity/${origin}`
    else return NextResponse.json({ success: false, error: 'Invalid query' }, { status: 400 })

    const res = await fetch(`${base}${target}`, { cache: 'no-store' })
    const data = await res.json()
    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to load flight times' }, { status: 500 })
  }
}


