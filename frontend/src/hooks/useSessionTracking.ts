'use client'

import { useEffect, useState } from 'react'

const SESSION_ID_KEY = 'spontra_session_id'

/**
 * Client-side hook to get or create session ID for tracking
 * Uses localStorage to persist session ID across page loads
 */
export function useSessionTracking() {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Get or create session ID
    let sid = localStorage.getItem(SESSION_ID_KEY)

    if (!sid) {
      // Generate new UUID v4
      sid = crypto.randomUUID()
      localStorage.setItem(SESSION_ID_KEY, sid)
    }

    setSessionId(sid)
    setIsLoading(false)
  }, [])

  return { sessionId, isLoading }
}
