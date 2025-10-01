import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/server/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''

    if (query.length < 2) {
      return NextResponse.json({ airports: [] })
    }

    const airports = await db.airport.findMany({
      where: {
        OR: [
          { iataCode: { contains: query.toUpperCase() } },
          { name: { contains: query, mode: 'insensitive' } },
          { city: { contains: query, mode: 'insensitive' } },
          { country: { contains: query, mode: 'insensitive' } }
        ],
        isActive: true
      },
      select: {
        iataCode: true,
        name: true,
        city: true,
        country: true
      },
      take: 10,
      orderBy: [
        { city: 'asc' },
        { name: 'asc' }
      ]
    })

    return NextResponse.json({ airports })

  } catch (error) {
    console.error('Airport search error:', error)
    return NextResponse.json({ airports: [] }, { status: 500 })
  }
}