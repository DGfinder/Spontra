/**
 * Favorite by ID API Route
 *
 * DELETE /api/user/favorites/[id] - Remove a destination from favorites
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
    const favorite = await db.favoriteDestination.findUnique({
      where: { id },
      select: { userId: true },
    })

    if (!favorite) {
      return NextResponse.json({ success: false, error: 'Favorite not found' }, { status: 404 })
    }

    if (favorite.userId !== payload.userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })
    }

    await db.favoriteDestination.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Favorite removed successfully',
    })
  } catch (error) {
    console.error('[Favorite DELETE] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
