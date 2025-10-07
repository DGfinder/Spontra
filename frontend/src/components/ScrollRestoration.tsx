'use client'

import { useEffect } from 'react'

/**
 * Restores scroll position after navigation
 * Checks sessionStorage for saved scroll position and restores it
 */
export function ScrollRestoration() {
  useEffect(() => {
    const savedScrollPosition = sessionStorage.getItem('scrollPosition')

    if (savedScrollPosition) {
      // Small delay to ensure DOM is ready
      const timeoutId = setTimeout(() => {
        window.scrollTo({
          top: parseInt(savedScrollPosition),
          behavior: 'smooth'
        })
        // Clear the saved position after restoring
        sessionStorage.removeItem('scrollPosition')
      }, 100)

      return () => clearTimeout(timeoutId)
    }
  }, [])

  return null
}
