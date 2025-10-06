/**
 * Toggle Price Alert API Route
 *
 * PATCH /api/user/saved-searches/[id]/price-alert - Enable/disable price alerts
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyUserToken } from '@/lib/auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params
    const { enabled } = await request.json()

    if (typeof enabled !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'Enabled must be a boolean' },
        { status: 400 }
      )
    }

    // Verify ownership and update
    const savedSearch = await db.savedSearch.findUnique({
      where: { id },
      select: { userId: true },
    })

    if (!savedSearch) {
      return NextResponse.json({ success: false, error: 'Search not found' }, { status: 404 })
    }

    if (savedSearch.userId !== payload.userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })
    }

    const updated = await db.savedSearch.update({
      where: { id },
      data: { priceAlertEnabled: enabled },
    })

    return NextResponse.json({
      success: true,
      search: updated,
    })
  } catch (error) {
    console.error('[Price Alert PATCH] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
