'use server'

import { db } from '@/lib/db'
import { processBookingAttribution } from './videoTrackingActions'
import { revalidatePath } from 'next/cache'

/**
 * Confirm a booking and trigger creator attribution
 *
 * Called when user manually confirms they completed a booking
 * (Option 1: Client-side confirmation flow)
 */
export async function confirmBooking(data: {
  clickId: string        // AffiliateClick ID from localStorage
  sessionId: string      // User's session ID
  bookingAmount: number  // Estimated booking value (for commission calc)
}) {
  try {
    // Find the affiliate click
    const affiliateClick = await db.affiliateClick.findUnique({
      where: { id: data.clickId },
      include: {
        creatorEarnings: true // Check if already processed
      }
    })

    if (!affiliateClick) {
      return {
        success: false,
        error: 'Affiliate click not found'
      }
    }

    // Prevent duplicate processing
    if (affiliateClick.converted || affiliateClick.creatorEarnings.length > 0) {
      return {
        success: false,
        error: 'Booking already confirmed'
      }
    }

    // Verify session ID matches (prevent fraud)
    if (affiliateClick.sessionId && affiliateClick.sessionId !== data.sessionId) {
      console.warn('[Booking Attribution] Session ID mismatch - potential fraud')
      return {
        success: false,
        error: 'Session verification failed'
      }
    }

    // Estimate commission (8% of booking value is typical for flight affiliates)
    // In production, this would come from affiliate network webhook
    const estimatedCommission = data.bookingAmount * 0.08

    // Mark affiliate click as converted
    await db.affiliateClick.update({
      where: { id: data.clickId },
      data: {
        converted: true,
        convertedAt: new Date(),
        commission: estimatedCommission
      }
    })

    // Get destination ID for attribution
    if (!affiliateClick.destinationId) {
      return {
        success: false,
        error: 'No destination associated with this click'
      }
    }

    // Process creator attribution
    const attributionResult = await processBookingAttribution({
      affiliateClickId: data.clickId,
      userId: affiliateClick.userId || undefined,
      sessionId: data.sessionId,
      destinationId: affiliateClick.destinationId,
      bookingValue: data.bookingAmount,
      commission: estimatedCommission
    })

    if (!attributionResult.success) {
      return {
        success: false,
        error: attributionResult.error || 'Failed to process attribution'
      }
    }

    // Revalidate creator dashboards
    revalidatePath('/dashboard/creator')

    return {
      success: true,
      data: {
        clickId: data.clickId,
        commission: estimatedCommission,
        creatorsEarned: attributionResult.attributed ? (attributionResult.creatorsCount || 0) : 0,
        totalPaid: attributionResult.attributed ? (attributionResult.totalPaid || 0) : 0
      }
    }
  } catch (error) {
    console.error('[Booking Attribution] Error confirming booking:', error)
    return {
      success: false,
      error: 'Failed to confirm booking'
    }
  }
}

/**
 * Get pending bookings (affiliate clicks that haven't been confirmed)
 * For user to manually confirm their bookings
 */
export async function getPendingBookings(sessionId: string) {
  try {
    // Get affiliate clicks from last 30 days that haven't converted
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const pendingClicks = await db.affiliateClick.findMany({
      where: {
        sessionId,
        converted: false,
        createdAt: { gte: thirtyDaysAgo }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return {
      success: true,
      data: pendingClicks.map(click => ({
        id: click.id,
        partner: click.partner,
        destinationId: click.destinationId,
        originAirport: click.originAirport,
        destinationAirport: click.destinationAirport,
        clickedAt: click.createdAt
      }))
    }
  } catch (error) {
    console.error('[Booking Attribution] Error fetching pending bookings:', error)
    return {
      success: false,
      error: 'Failed to fetch pending bookings'
    }
  }
}

/**
 * Webhook endpoint handler for affiliate network conversions
 * (Option 2: Production webhook integration)
 *
 * This would be called by Skyscanner/KAYAK when a booking completes
 */
export async function processAffiliateWebhook(data: {
  clickId: string
  transactionId: string  // From affiliate network
  commission: number     // Actual commission from network
  bookingValue: number   // Total booking value
  signature: string      // Webhook verification signature
}) {
  try {
    // TODO: Verify webhook signature
    // const isValid = verifyWebhookSignature(data, process.env.AFFILIATE_WEBHOOK_SECRET)
    // if (!isValid) return { success: false, error: 'Invalid signature' }

    // Find the affiliate click
    const affiliateClick = await db.affiliateClick.findUnique({
      where: { id: data.clickId }
    })

    if (!affiliateClick) {
      return {
        success: false,
        error: 'Affiliate click not found'
      }
    }

    // Prevent duplicate processing
    if (affiliateClick.converted) {
      return {
        success: true,
        message: 'Already processed'
      }
    }

    // Mark as converted
    await db.affiliateClick.update({
      where: { id: data.clickId },
      data: {
        converted: true,
        convertedAt: new Date(),
        commission: data.commission
      }
    })

    // Process creator attribution
    if (affiliateClick.destinationId && affiliateClick.sessionId) {
      await processBookingAttribution({
        affiliateClickId: data.clickId,
        userId: affiliateClick.userId || undefined,
        sessionId: affiliateClick.sessionId,
        destinationId: affiliateClick.destinationId,
        bookingValue: data.bookingValue,
        commission: data.commission
      })
    }

    revalidatePath('/dashboard/creator')

    return {
      success: true,
      message: 'Webhook processed'
    }
  } catch (error) {
    console.error('[Booking Attribution] Webhook error:', error)
    return {
      success: false,
      error: 'Webhook processing failed'
    }
  }
}
