'use server'

import Stripe from 'stripe'
import { db } from '@/lib/db'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover'
})

/**
 * Create a Stripe Connect Express account for a creator
 * Returns the account ID and onboarding URL
 */
export async function createStripeConnectAccount(creatorId: string) {
  try {
    const creator = await db.creator.findUnique({
      where: { id: creatorId },
      include: { user: true }
    })

    if (!creator) {
      return { success: false, error: 'Creator not found' }
    }

    // Check if account already exists
    if (creator.stripeAccountId) {
      return {
        success: false,
        error: 'Stripe account already exists',
        accountId: creator.stripeAccountId
      }
    }

    // Create Express account
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US', // Default to US, can be changed during onboarding
      email: creator.user.email,
      capabilities: {
        transfers: { requested: true }
      },
      business_type: 'individual',
      metadata: {
        creatorId: creator.id,
        userId: creator.userId
      }
    })

    // Update creator with Stripe account ID
    await db.creator.update({
      where: { id: creatorId },
      data: {
        stripeAccountId: account.id,
        payoutMethod: 'stripe'
      }
    })

    return {
      success: true,
      accountId: account.id
    }
  } catch (error) {
    console.error('Error creating Stripe Connect account:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Generate Stripe Connect onboarding link
 * Creators complete this to activate their account
 */
export async function createStripeOnboardingLink(creatorId: string) {
  try {
    const creator = await db.creator.findUnique({
      where: { id: creatorId }
    })

    if (!creator || !creator.stripeAccountId) {
      return { success: false, error: 'No Stripe account found' }
    }

    const accountLink = await stripe.accountLinks.create({
      account: creator.stripeAccountId,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/creator/settings/payments`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/creator/settings/payments?onboarding=complete`,
      type: 'account_onboarding'
    })

    return {
      success: true,
      url: accountLink.url
    }
  } catch (error) {
    console.error('Error creating onboarding link:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Check Stripe account status
 * Returns whether the creator can receive payouts
 */
export async function getStripeAccountStatus(creatorId: string) {
  try {
    const creator = await db.creator.findUnique({
      where: { id: creatorId }
    })

    if (!creator || !creator.stripeAccountId) {
      return {
        success: false,
        error: 'No Stripe account found',
        status: 'not_connected'
      }
    }

    const account = await stripe.accounts.retrieve(creator.stripeAccountId)

    const canReceivePayouts = account.charges_enabled && account.payouts_enabled

    return {
      success: true,
      status: canReceivePayouts ? 'active' : 'pending',
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      requiresAction: account.requirements?.currently_due?.length ? true : false,
      requirements: account.requirements?.currently_due || []
    }
  } catch (error) {
    console.error('Error retrieving account status:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      status: 'error'
    }
  }
}

/**
 * Process a payout to a creator
 * Transfers USD from platform to creator's Stripe account
 */
export async function processCreatorPayout(payoutId: string) {
  try {
    const payout = await db.payout.findUnique({
      where: { id: payoutId },
      include: {
        creator: true
      }
    })

    if (!payout) {
      return { success: false, error: 'Payout not found' }
    }

    if (payout.status !== 'pending') {
      return { success: false, error: `Payout already ${payout.status}` }
    }

    if (!payout.creator.stripeAccountId) {
      return { success: false, error: 'Creator has no Stripe account' }
    }

    // Create transfer to creator's account
    const transfer = await stripe.transfers.create({
      amount: Math.round(Number(payout.amount) * 100), // Convert to cents
      currency: 'usd',
      destination: payout.creator.stripeAccountId,
      description: `Payout for ${payout.periodStart?.toISOString().slice(0, 7)} earnings`,
      metadata: {
        payoutId: payout.id,
        creatorId: payout.creatorId,
        periodStart: payout.periodStart?.toISOString() || '',
        periodEnd: payout.periodEnd?.toISOString() || ''
      }
    })

    // Update payout status
    await db.payout.update({
      where: { id: payoutId },
      data: {
        status: 'completed',
        processedAt: new Date(),
        transactionId: transfer.id
      }
    })

    return {
      success: true,
      transferId: transfer.id,
      amount: payout.amount
    }
  } catch (error) {
    console.error('Error processing payout:', error)

    // Mark payout as failed
    await db.payout.update({
      where: { id: payoutId },
      data: {
        status: 'failed',
        failureReason: error instanceof Error ? error.message : 'Unknown error'
      }
    })

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Calculate creator earnings ready for payout
 * After 60-day hold period
 */
export async function calculateCreatorEarnings(creatorId: string) {
  try {
    const sixtyDaysAgo = new Date()
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

    // Get earnings past hold period, not yet paid out
    const earnings = await db.creatorEarning.findMany({
      where: {
        creatorId: creatorId,
        isPaid: false,
        earnedAt: {
          lte: sixtyDaysAgo
        }
      }
    })

    const totalAmount = earnings.reduce(
      (sum, earning) => sum + Number(earning.amount),
      0
    )

    return {
      success: true,
      totalAmount,
      earningsCount: earnings.length,
      earnings
    }
  } catch (error) {
    console.error('Error calculating earnings:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Create a payout for a creator
 * Called by admin monthly payout cron
 */
export async function createPayout(data: {
  creatorId: string
  amount: number
  periodStart: Date
  periodEnd: Date
  earningIds: string[]
}) {
  try {
    const minimumPayout = 25 // $25 USD minimum

    if (data.amount < minimumPayout) {
      return {
        success: false,
        error: `Minimum payout is $${minimumPayout} USD`
      }
    }

    const payout = await db.payout.create({
      data: {
        creatorId: data.creatorId,
        amount: data.amount,
        status: 'pending',
        method: 'stripe',
        periodStart: data.periodStart,
        periodEnd: data.periodEnd
      }
    })

    // Mark earnings as paid out
    await db.creatorEarning.updateMany({
      where: {
        id: { in: data.earningIds }
      },
      data: {
        isPaid: true,
        payoutId: payout.id
      }
    })

    return {
      success: true,
      payoutId: payout.id
    }
  } catch (error) {
    console.error('Error creating payout:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Admin: Process all pending payouts
 * Run monthly via cron job
 */
export async function processMonthlyPayouts() {
  try {
    const pendingPayouts = await db.payout.findMany({
      where: {
        status: 'pending'
      },
      include: {
        creator: true
      }
    })

    const results = {
      total: pendingPayouts.length,
      successful: 0,
      failed: 0,
      errors: [] as string[]
    }

    for (const payout of pendingPayouts) {
      const result = await processCreatorPayout(payout.id)

      if (result.success) {
        results.successful++
      } else {
        results.failed++
        results.errors.push(`${payout.creator.displayName}: ${result.error}`)
      }

      // Rate limit: 1 transfer per second
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    return {
      success: true,
      results
    }
  } catch (error) {
    console.error('Error processing monthly payouts:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get creator payout history
 */
export async function getCreatorPayouts(creatorId: string) {
  try {
    const payouts = await db.payout.findMany({
      where: { creatorId },
      orderBy: { initiatedAt: 'desc' },
      take: 50
    })

    return {
      success: true,
      payouts
    }
  } catch (error) {
    console.error('Error fetching payouts:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
