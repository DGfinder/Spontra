import { NextRequest, NextResponse } from 'next/server'
import { USER_SESSION_COOKIE } from '@/lib/userAuth'
import { userRepository } from '@/lib/userRepository'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: NextRequest) {
  try {
    // Get the current session token (if any) to delete from database
    const token = request.cookies.get(USER_SESSION_COOKIE)?.value
    
    // Delete session from database
    if (token) {
      await userRepository.deleteSession(token)
    }
    
    const response = NextResponse.json({
      ok: true,
      success: true,
      message: 'Logged out successfully'
    })

    // Clear the session cookie
    response.cookies.set(USER_SESSION_COOKIE, '', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 0, // Expire immediately
      path: '/',
    })

    return response
  } catch (error) {
    console.error('User logout failed:', error)
    return NextResponse.json({ 
      ok: false, 
      error: 'Logout failed' 
    }, { status: 500 })
  }
}

// Alternative GET method for logout links
export async function GET(request: NextRequest) {
  return POST(request)
}