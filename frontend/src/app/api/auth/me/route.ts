import { NextRequest, NextResponse } from 'next/server'
import { requireUserContext } from '@/lib/userAuth'
import { userRepository } from '@/lib/userRepository'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const userContext = await requireUserContext(request)
    
    // Get user from database
    const user = await userRepository.findUserById(userContext.userId)
    
    if (!user) {
      return NextResponse.json({ 
        ok: false, 
        error: 'User not found' 
      }, { status: 404 })
    }

    // Parse user preferences and return profile without sensitive information
    const userWithPreferences = userRepository.parseUserPreferences(user)
    
    return NextResponse.json({
      ok: true,
      user: {
        id: userWithPreferences.id,
        email: userWithPreferences.email,
        username: userWithPreferences.username,
        firstName: userWithPreferences.firstName,
        lastName: userWithPreferences.lastName,
        profilePicture: userWithPreferences.profileImageUrl,
        emailVerified: userWithPreferences.isEmailVerified,
        createdAt: userWithPreferences.createdAt,
        lastLoginAt: userWithPreferences.lastLoginAt,
        preferences: userWithPreferences.preferences
      }
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'UserAuthError') {
      return NextResponse.json({ 
        ok: false, 
        error: 'Authentication required' 
      }, { status: 401 })
    }
    
    console.error('Get user profile failed:', error)
    return NextResponse.json({ 
      ok: false, 
      error: 'Failed to get user profile' 
    }, { status: 500 })
  }
}

