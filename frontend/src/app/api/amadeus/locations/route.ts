import { NextRequest, NextResponse } from 'next/server'
import { amadeusClient } from '@/lib/amadeus-simple'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const keyword = searchParams.get('keyword')
    const subType = searchParams.get('subType') || 'AIRPORT'

    if (!keyword) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Missing required parameter: keyword' 
      }, { status: 400 })
    }

    const locations = await amadeusClient.searchLocations(keyword, subType)

    return NextResponse.json({ 
      ok: true, 
      data: locations 
    })
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 })
  }
}