import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface PreloadOptions {
  delay?: number
  condition?: () => boolean
  priority?: 'high' | 'low'
}

/**
 * Hook for preloading resources and components
 */
export function usePreload() {
  const router = useRouter()

  const preloadRoute = useCallback((href: string, options: PreloadOptions = {}) => {
    const { delay = 0, condition = () => true, priority = 'low' } = options

    if (!condition()) return

    const preload = () => {
      try {
        router.prefetch(href)
      } catch (error) {
        console.warn('Failed to preload route:', href, error)
      }
    }

    if (delay > 0) {
      setTimeout(preload, delay)
    } else if (priority === 'high') {
      preload()
    } else {
      // Use requestIdleCallback for low priority preloading
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(preload)
      } else {
        setTimeout(preload, 100)
      }
    }
  }, [router])

  const preloadImage = useCallback((src: string, options: PreloadOptions = {}) => {
    const { delay = 0, condition = () => true } = options

    if (!condition()) return

    const preload = () => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'image'
      link.href = src
      document.head.appendChild(link)
    }

    if (delay > 0) {
      setTimeout(preload, delay)
    } else {
      preload()
    }
  }, [])

  const preloadFont = useCallback((href: string, type: string = 'font/woff2') => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'font'
    link.type = type
    link.href = href
    link.crossOrigin = 'anonymous'
    document.head.appendChild(link)
  }, [])

  const preloadScript = useCallback((src: string, options: PreloadOptions = {}) => {
    const { delay = 0, condition = () => true } = options

    if (!condition()) return

    const preload = () => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'script'
      link.href = src
      document.head.appendChild(link)
    }

    if (delay > 0) {
      setTimeout(preload, delay)
    } else {
      preload()
    }
  }, [])

  return {
    preloadRoute,
    preloadImage,
    preloadFont,
    preloadScript,
  }
}

/**
 * Hook for preloading critical resources on mount
 */
export function useCriticalPreload() {
  const { preloadRoute, preloadImage, preloadFont } = usePreload()

  useEffect(() => {
    // Preload critical fonts
    preloadFont('/fonts/inter.woff2')
    preloadFont('/fonts/mulish.woff2')

    // Preload critical images
    preloadImage('/images/hero-bg.webp', { 
      condition: () => window.innerWidth > 768 
    })
    preloadImage('/images/logo.svg')

    // Preload likely next routes based on current path
    const currentPath = window.location.pathname

    if (currentPath === '/') {
      // From homepage, users likely go to search
      preloadRoute('/search', { delay: 2000 })
      preloadRoute('/destinations', { delay: 3000 })
    } else if (currentPath.startsWith('/search')) {
      // From search, users likely go to flight details
      preloadRoute('/booking', { delay: 1000 })
    } else if (currentPath.startsWith('/booking')) {
      // From booking, users might need profile
      preloadRoute('/profile', { delay: 2000 })
    }
  }, [preloadRoute, preloadImage, preloadFont])
}

/**
 * Hook for intersection-based preloading
 */
export function useIntersectionPreload() {
  const { preloadRoute, preloadImage } = usePreload()

  const preloadOnIntersection = useCallback((
    element: Element | null,
    resource: string,
    type: 'route' | 'image' = 'route'
  ) => {
    if (!element) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (type === 'route') {
              preloadRoute(resource, { priority: 'high' })
            } else {
              preloadImage(resource)
            }
            observer.disconnect()
          }
        })
      },
      { rootMargin: '100px' } // Preload when element is 100px away from viewport
    )

    observer.observe(element)

    return () => observer.disconnect()
  }, [preloadRoute, preloadImage])

  return { preloadOnIntersection }
}

/**
 * Hook for hover-based preloading
 */
export function useHoverPreload() {
  const { preloadRoute } = usePreload()

  const preloadOnHover = useCallback((href: string) => {
    return {
      onMouseEnter: () => preloadRoute(href, { priority: 'high' }),
      onTouchStart: () => preloadRoute(href, { priority: 'high' }), // For mobile
    }
  }, [preloadRoute])

  return { preloadOnHover }
}

/**
 * Hook for network-aware preloading
 */
export function useNetworkAwarePreload() {
  const { preloadRoute, preloadImage } = usePreload()

  const isSlowConnection = useCallback(() => {
    // @ts-ignore - navigator.connection is experimental
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
    
    if (!connection) return false
    
    return (
      connection.effectiveType === 'slow-2g' ||
      connection.effectiveType === '2g' ||
      connection.saveData
    )
  }, [])

  const preloadIfFastConnection = useCallback((
    resource: string,
    type: 'route' | 'image' = 'route',
    options: PreloadOptions = {}
  ) => {
    const condition = () => !isSlowConnection() && (options.condition?.() ?? true)

    if (type === 'route') {
      preloadRoute(resource, { ...options, condition })
    } else {
      preloadImage(resource, { ...options, condition })
    }
  }, [preloadRoute, preloadImage, isSlowConnection])

  return {
    preloadIfFastConnection,
    isSlowConnection,
  }
}