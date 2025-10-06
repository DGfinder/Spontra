/**
 * Saved Searches API Routes
 *
 * GET /api/user/saved-searches - List all saved searches for authenticated user
 * POST /api/user/saved-searches - Create a new saved search
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

    // Fetch user's saved searches
    const searches = await db.savedSearch.findMany({
      where: { userId: payload.userId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      searches,
    })
  } catch (error) {
    console.error('[Saved Searches GET] Error:', error)
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
    const { originAirport, theme, minFlightTime, maxFlightTime, priceAlertEnabled } =
      await request.json()

    if (!originAirport) {
      return NextResponse.json(
        { success: false, error: 'Origin airport is required' },
        { status: 400 }
      )
    }

    // Create saved search
    const savedSearch = await db.savedSearch.create({
      data: {
        userId: payload.userId,
        originAirport,
        theme: theme || null,
        minFlightTime: minFlightTime || null,
        maxFlightTime: maxFlightTime || null,
        priceAlertEnabled: priceAlertEnabled || false,
      },
    })

    return NextResponse.json({
      success: true,
      search: savedSearch,
    })
  } catch (error) {
    console.error('[Saved Searches POST] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
