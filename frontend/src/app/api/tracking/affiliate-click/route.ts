import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyUserToken } from '@/lib/auth'

/**
 * POST /api/tracking/affiliate-click
 *
 * Record affiliate link click for commission tracking
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      partner,
      clickUrl,
      destinationId,
      originAirport,
      destinationAirport,
      sessionId
    } = body

    // Validate required fields
    if (!partner || !clickUrl) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: partner, clickUrl' },
        { status: 400 }
      )
    }

    // Validate partner
    const validPartners = ['skyscanner', 'kayak', 'google_flights', 'other']
    if (!validPartners.includes(partner)) {
      return NextResponse.json(
        { success: false, error: 'Invalid partner. Must be: ' + validPartners.join(', ') },
        { status: 400 }
      )
    }

    // Get user ID from JWT if logged in (optional)
    let userId: string | null = null
    const token = request.cookies.get('user_token')?.value

    if (token) {
      try {
        const payload = await verifyUserToken(token)
        if (payload) {
          userId = payload.userId
        }
      } catch (error) {
        // Ignore - user is not logged in or token is invalid
        console.log('[Affiliate Tracking] User not authenticated')
      }
    }

    // Extract tracking metadata from headers
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                      request.headers.get('x-real-ip') ||
                      'unknown'
    const userAgent = request.headers.get('user-agent') || null
    const referrer = request.headers.get('referer') || null

    // Save affiliate click to database
    const affiliateClick = await db.affiliateClick.create({
      data: {
        userId,
        sessionId,
        destinationId,
        partner,
        clickUrl,
        originAirport,
        destinationAirport,
        referrer,
        ipAddress,
        userAgent,
        converted: false,  // Will be updated by webhook if partner supports it
      }
    })

    console.log(`[Affiliate Tracking] Click recorded: ${partner} - ${affiliateClick.id}`)

    return NextResponse.json({
      success: true,
      clickId: affiliateClick.id
    })

  } catch (error) {
    console.error('[Affiliate Tracking] Error recording click:', error)

    return NextResponse.json(
      { success: false, error: 'Failed to record affiliate click' },
      { status: 500 }
    )
  }
}
