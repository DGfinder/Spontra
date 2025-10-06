/**
 * Delete Account API Route
 *
 * DELETE /api/user/delete-account
 *
 * GDPR compliance - allows users to permanently delete their account and all data
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyUserToken } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function DELETE(request: NextRequest) {
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

    // Delete user and all associated data (cascades via Prisma schema)
    // This will delete:
    // - Email verification tokens
    // - Password reset tokens
    // - Saved searches
    // - Favorite destinations
    await db.user.delete({
      where: { id: payload.userId },
    })

    // Clear auth cookie
    const cookieStore = await cookies()
    cookieStore.delete('auth_token')

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully',
    })
  } catch (error) {
    console.error('[Delete Account] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
