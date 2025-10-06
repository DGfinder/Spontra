/**
 * Favorites API Routes
 *
 * GET /api/user/favorites - List all favorite destinations for authenticated user
 * POST /api/user/favorites - Add a destination to favorites
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyUserToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.cookies.get('auth_token')?.value

    if (!token) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    }

    const payload = await verifyUserToken(token)

    if (!payload) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 })
    }

    // Fetch user's favorite destinations with full destination details
    const favorites = await db.favoriteDestination.findMany({
      where: { userId: payload.userId },
      include: {
        destination: {
          select: {
            id: true,
            cityName: true,
            countryName: true,
            airportCode: true,
            description: true,
            imageUrl: true,
            slug: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      favorites,
    })
  } catch (error) {
    console.error('[Favorites GET] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.cookies.get('auth_token')?.value

    if (!token) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    }

    const payload = await verifyUserToken(token)

    if (!payload) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 })
    }

    // Parse request body
    const { destinationId } = await request.json()

    if (!destinationId) {
      return NextResponse.json(
        { success: false, error: 'Destination ID is required' },
        { status: 400 }
      )
    }

    // Check if already favorited
    const existing = await db.favoriteDestination.findFirst({
      where: {
        userId: payload.userId,
        destinationId,
      },
    })

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Destination already in favorites' },
        { status: 400 }
      )
    }

    // Verify destination exists
    const destination = await db.destination.findUnique({
      where: { id: destinationId },
    })

    if (!destination) {
      return NextResponse.json(
        { success: false, error: 'Destination not found' },
        { status: 404 }
      )
    }

    // Create favorite
    const favorite = await db.favoriteDestination.create({
      data: {
        userId: payload.userId,
        destinationId,
      },
      include: {
        destination: {
          select: {
            id: true,
            cityName: true,
            countryName: true,
            airportCode: true,
            description: true,
            imageUrl: true,
            slug: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      favorite,
    })
  } catch (error) {
    console.error('[Favorites POST] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
