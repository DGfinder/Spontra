import { NextRequest, NextResponse } from 'next/server'
import { searchAirports } from '@/actions/airportActions'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')

    if (!query) {
      return NextResponse.json({ success: true, data: [] })
    }

    const result = await searchAirports(query)
    return NextResponse.json(result)
  } catch (error) {
    console.error('[GET /api/airports/search] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to search airports' },
      { status: 500 }
    )
  }
}
