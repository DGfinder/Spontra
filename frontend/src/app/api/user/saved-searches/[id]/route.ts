/**
 * Saved Search by ID API Route
 *
 * DELETE /api/user/saved-searches/[id] - Delete a saved search
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyUserToken } from '@/lib/auth'

export async function DELETE(
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

    // Verify ownership and delete
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

    await db.savedSearch.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Search deleted successfully',
    })
  } catch (error) {
    console.error('[Saved Search DELETE] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
