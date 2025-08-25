import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    // In production, this would:
    // 1. Validate the JWT token
    // 2. Add token to blacklist/revocation list
    // 3. Log the logout event
    // 4. Clear any server-side session data
    
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    
    if (token) {
      console.log('🔐 Admin logout processed for token ending in:', token.slice(-8))
      // TODO: Add token to blacklist in production
    }

    // Create response that clears the admin token cookie
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    })

    // Clear the secure admin token cookie
    response.cookies.set('admin-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0, // Expire immediately
      path: '/admin'
    })

    return response

  } catch (error) {
    console.error('Admin logout error:', error)
    
    // Even if there's an error, clear the cookie and return success
    // to ensure the client can always logout
    const response = NextResponse.json({
      success: true,
      message: 'Logged out'
    })

    response.cookies.set('admin-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/admin'
    })

    return response
  }
}