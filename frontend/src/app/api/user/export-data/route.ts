/**
 * Export User Data API Route
 *
 * GET /api/user/export-data
 *
 * GDPR compliance - allows users to download all their personal data
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

    // Fetch all user data
    const user = await db.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        role: true,
        isEmailVerified: true,
        createdAt: true,
        updatedAt: true,
        savedSearches: {
          select: {
            id: true,
            originAirport: true,
            theme: true,
            minFlightTime: true,
            maxFlightTime: true,
            priceAlertEnabled: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        favoriteDestinations: {
          select: {
            id: true,
            destinationId: true,
            createdAt: true,
            destination: {
              select: {
                cityName: true,
                countryName: true,
                airportCode: true,
              },
            },
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    // Get affiliate click history (if exists)
    const affiliateClicks = await db.affiliateClick.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        partner: true,
        originAirport: true,
        destinationAirport: true,
        createdAt: true,
        converted: true,
        commission: true,
      },
    })

    // Prepare export data
    const exportData = {
      exportDate: new Date().toISOString(),
      account: {
        id: user.id,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      savedSearches: user.savedSearches,
      favoriteDestinations: user.favoriteDestinations,
      affiliateClicks: affiliateClicks,
    }

    // Return as JSON file download
    const jsonData = JSON.stringify(exportData, null, 2)

    return new NextResponse(jsonData, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="spontra-data-export-${new Date().toISOString().split('T')[0]}.json"`,
      },
    })
  } catch (error) {
    console.error('[Export Data] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
