import { NextResponse } from 'next/server'
import { db } from '@/server/db'

export async function GET() {
  try {
    const destinations = await db.destination.findMany({
      take: 10,
      orderBy: {
        popularityScore: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      destinations,
      count: destinations.length
    })

  } catch (error) {
    console.error('Popular destinations API error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch popular destinations',
      destinations: []
    }, { status: 500 })
  }
}