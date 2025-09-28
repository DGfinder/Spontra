'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { getPerformanceReporter } from '@/lib/performanceRUM'

export function PerformanceTracker() {
  const pathname = usePathname()
  
  useEffect(() => {
    // Initialize performance tracking
    const reporter = getPerformanceReporter()
    
    // Update route for tracking
    reporter.setRoute(pathname)
    
    // Mark page navigation for custom metrics
    reporter.mark('page-start')
    
    // Track when page is fully loaded
    const handleLoad = () => {
      reporter.measure('page-load', 'page-start')
    }
    
    // Track route changes for SPA navigation
    reporter.mark('route-change-start')
    reporter.measure('route-change', 'route-change-start')
    
    window.addEventListener('load', handleLoad, { once: true })
    
    return () => {
      window.removeEventListener('load', handleLoad)
    }
  }, [pathname])
  
  // This component renders nothing - it's just for tracking
  return null
}