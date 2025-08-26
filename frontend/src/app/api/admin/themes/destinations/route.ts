import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

const base = process.env.NEXT_PUBLIC_DATA_INGESTION_URL || process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8081'

// POST /api/admin/themes/destinations
// Body: { origin: string, theme: string, maxFlightTime?: number, minScore?: number, limit?: number }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const payload = {
      origin: body.origin,
      theme: body.theme,
      max_flight_time: body.maxFlightTime,
      min_score: body.minScore,
      limit: body.limit
    }
    const res = await fetch(`${base}/api/v1/themes/destinations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    const data = await res.json()
    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to load theme destinations' }, { status: 500 })
  }
}


