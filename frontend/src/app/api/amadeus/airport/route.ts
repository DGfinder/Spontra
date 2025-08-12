import { NextRequest, NextResponse } from 'next/server'
import { amadeusService } from '@/services/amadeusService'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json()
    if (!code || typeof code !== 'string' || code.length !== 3) {
      return NextResponse.json({ ok: false, error: 'Invalid airport code' }, { status: 400 })
    }
    const info = await amadeusService.getAirportInfo(code.toUpperCase())
    return NextResponse.json({ ok: true, data: info })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Internal Server Error' }, { status: 500 })
  }
}

