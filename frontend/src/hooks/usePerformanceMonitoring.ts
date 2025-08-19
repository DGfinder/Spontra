import { useEffect, useRef, useCallback } from 'react'

interface PerformanceMetrics {
  renderCount: number
  renderTime: number
  lastRenderDuration: number
  averageRenderTime: number
}

/**
 * Hook for monitoring component performance and render metrics
 * Useful for identifying performance bottlenecks and measuring optimization impact
 */
export function usePerformanceMonitoring(componentName: string, enabled = process.env.NODE_ENV === 'development') {
  const renderCountRef = useRef(0)
  const renderTimesRef = useRef<number[]>([])
  const lastRenderStartRef = useRef<number>(0)

  // Start measuring render time
  const startRender = useCallback(() => {
    if (!enabled) return
    lastRenderStartRef.current = performance.now()
  }, [enabled])

  // End measuring render time
  const endRender = useCallback(() => {
    if (!enabled) return
    
    const renderDuration = performance.now() - lastRenderStartRef.current
    renderTimesRef.current.push(renderDuration)
    renderCountRef.current += 1

    // Keep only last 50 render times for moving average
    if (renderTimesRef.current.length > 50) {
      renderTimesRef.current = renderTimesRef.current.slice(-50)
    }

    // Log performance warnings for slow renders
    if (renderDuration > 16) { // 16ms threshold for 60fps
      console.warn(`🐌 Slow render detected in ${componentName}: ${renderDuration.toFixed(2)}ms`)
    }
  }, [enabled, componentName])

  // Get current performance metrics
  const getMetrics = useCallback((): PerformanceMetrics => {
    const renderTimes = renderTimesRef.current
    const totalRenderTime = renderTimes.reduce((sum, time) => sum + time, 0)
    
    return {
      renderCount: renderCountRef.current,
      renderTime: totalRenderTime,
      lastRenderDuration: renderTimes[renderTimes.length - 1] || 0,
      averageRenderTime: renderTimes.length > 0 ? totalRenderTime / renderTimes.length : 0
    }
  }, [])

  // Log metrics to console (development only)
  const logMetrics = useCallback(() => {
    if (!enabled) return
    
    const metrics = getMetrics()
    console.log(`📊 ${componentName} Performance:`, {
      renders: metrics.renderCount,
      avgRenderTime: `${metrics.averageRenderTime.toFixed(2)}ms`,
      lastRender: `${metrics.lastRenderDuration.toFixed(2)}ms`,
      totalTime: `${metrics.renderTime.toFixed(2)}ms`
    })
  }, [enabled, componentName, getMetrics])

  // Track each render
  useEffect(() => {
    startRender()
    return () => {
      endRender()
    }
  })

  // Periodic metrics logging (every 10 renders)
  useEffect(() => {
    if (!enabled) return
    
    const renderCount = renderCountRef.current
    if (renderCount > 0 && renderCount % 10 === 0) {
      logMetrics()
    }
  }, [enabled, logMetrics])

  return {
    getMetrics,
    logMetrics,
    startRender,
    endRender
  }
}

/**
 * Hook for measuring expensive operations
 */
export function useOperationTiming(operationName: string, enabled = process.env.NODE_ENV === 'development') {
  const measureOperation = useCallback(<T>(operation: () => T): T => {
    if (!enabled) return operation()
    
    const startTime = performance.now()
    const result = operation()
    const duration = performance.now() - startTime
    
    if (duration > 5) { // 5ms threshold for expensive operations
      console.warn(`⏱️ Expensive operation "${operationName}": ${duration.toFixed(2)}ms`)
    }
    
    return result
  }, [enabled, operationName])

  const measureAsyncOperation = useCallback(async <T>(operation: () => Promise<T>): Promise<T> => {
    if (!enabled) return operation()
    
    const startTime = performance.now()
    const result = await operation()
    const duration = performance.now() - startTime
    
    if (duration > 100) { // 100ms threshold for async operations
      console.warn(`⏱️ Slow async operation "${operationName}": ${duration.toFixed(2)}ms`)
    }
    
    return result
  }, [enabled, operationName])

  return {
    measureOperation,
    measureAsyncOperation
  }
}

/**
 * Hook for tracking component mounts and unmounts
 */
export function useComponentLifecycle(componentName: string, enabled = process.env.NODE_ENV === 'development') {
  const mountTimeRef = useRef<number>(0)

  useEffect(() => {
    if (!enabled) return

    mountTimeRef.current = performance.now()
    console.log(`🎬 ${componentName} mounted`)

    return () => {
      const mountDuration = performance.now() - mountTimeRef.current
      console.log(`🎬 ${componentName} unmounted after ${mountDuration.toFixed(2)}ms`)
    }
  }, [enabled, componentName])

  return {
    getMountDuration: () => performance.now() - mountTimeRef.current
  }
}

/**
 * Hook for monitoring memory usage (experimental)
 */
export function useMemoryMonitoring(componentName: string, enabled = process.env.NODE_ENV === 'development') {
  const logMemoryUsage = useCallback(() => {
    if (!enabled || !('memory' in performance)) return

    const memInfo = (performance as any).memory
    if (memInfo) {
      console.log(`🧠 ${componentName} Memory:`, {
        used: `${Math.round(memInfo.usedJSHeapSize / 1024 / 1024)}MB`,
        total: `${Math.round(memInfo.totalJSHeapSize / 1024 / 1024)}MB`,
        limit: `${Math.round(memInfo.jsHeapSizeLimit / 1024 / 1024)}MB`
      })
    }
  }, [enabled, componentName])

  useEffect(() => {
    if (!enabled) return

    // Log memory usage on mount and every 30 seconds
    logMemoryUsage()
    const interval = setInterval(logMemoryUsage, 30000)

    return () => clearInterval(interval)
  }, [enabled, logMemoryUsage])

  return { logMemoryUsage }
}