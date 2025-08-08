import { NextRequest, NextResponse } from 'next/server'
import { amadeusClient } from '@/lib/amadeus-simple'

// Ensure this runs in a Node.js runtime so server env vars are available
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const { origin, maxFlightTime, theme, departureDate } = await req.json()

    if (!origin) {
      return NextResponse.json({ ok: false, error: 'Missing required parameter: origin' }, { status: 400 })
    }

    const recommendations = await amadeusClient.exploreDestinations({
      origin,
      maxFlightTime,
      theme,
      departureDate,
    })

    return NextResponse.json({ ok: true, data: recommendations })
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || 'Internal Server Error' },
      { status: 500 }
    )
  }
}

