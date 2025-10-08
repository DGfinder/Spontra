import { cookies } from 'next/headers'
import { v4 as uuidv4 } from 'uuid'
import { verifyUserToken } from './auth'

/**
 * Get or create a session ID for anonymous user tracking
 * Used for video view attribution when user is not logged in
 */
export async function getSessionId(): Promise<string> {
  const cookieStore = await cookies()
  const existing = cookieStore.get('session_id')

  if (existing?.value) {
    return existing.value
  }

  // Create new session ID
  const sessionId = uuidv4()

  // Set cookie for 30 days
  cookieStore.set('session_id', sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30 // 30 days
  })

  return sessionId
}

/**
 * Get user ID from auth token (if logged in)
 */
export async function getUserId(): Promise<string | null> {
  const cookieStore = await cookies()
  const authToken = cookieStore.get('auth_token')

  if (!authToken?.value) {
    return null
  }

  // Decode JWT and extract userId
  const payload = await verifyUserToken(authToken.value)
  return payload?.userId || null
}

/**
 * Get tracking context (userId or sessionId)
 */
export async function getTrackingContext(): Promise<{
  userId: string | null
  sessionId: string
}> {
  const [userId, sessionId] = await Promise.all([
    getUserId(),
    getSessionId()
  ])

  return { userId, sessionId }
}
