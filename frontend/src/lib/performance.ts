// Performance optimization utilities

/**
 * Debounce function for reducing API calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * Throttle function for limiting execution frequency
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

/**
 * Memoization with TTL support
 */
export function memoizeWithTTL<T extends (...args: any[]) => any>(
  fn: T,
  ttl: number = 5000
): T {
  const cache = new Map<string, { value: ReturnType<T>; expiry: number }>()
  
  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args)
    const now = Date.now()
    
    const cached = cache.get(key)
    if (cached && cached.expiry > now) {
      return cached.value
    }
    
    const result = fn(...args)
    cache.set(key, { value: result, expiry: now + ttl })
    
    // Clean up expired entries periodically
    if (cache.size > 100) {
      for (const [k, v] of cache.entries()) {
        if (v.expiry <= now) {
          cache.delete(k)
        }
      }
    }
    
    return result
  }) as T
}

/**
 * Virtual scrolling helper for large lists
 */
export class VirtualScroller {
  private itemHeight: number
  private containerHeight: number
  private overscan: number

  constructor(itemHeight: number, containerHeight: number, overscan: number = 5) {
    this.itemHeight = itemHeight
    this.containerHeight = containerHeight
    this.overscan = overscan
  }

  getVisibleRange(scrollTop: number, totalItems: number) {
    const visibleStart = Math.floor(scrollTop / this.itemHeight)
    const visibleEnd = Math.min(
      visibleStart + Math.ceil(this.containerHeight / this.itemHeight),
      totalItems - 1
    )

    const start = Math.max(0, visibleStart - this.overscan)
    const end = Math.min(totalItems - 1, visibleEnd + this.overscan)

    return { start, end, visibleStart, visibleEnd }
  }

  getScrollHeight(totalItems: number) {
    return totalItems * this.itemHeight
  }

  getOffsetY(index: number) {
    return index * this.itemHeight
  }
}

/**
 * Batch DOM updates for better performance
 */
export function batchDOMUpdates(updates: (() => void)[]): void {
  // Use requestAnimationFrame to batch DOM updates
  requestAnimationFrame(() => {
    updates.forEach(update => update())
  })
}

/**
 * Lazy evaluation for expensive computations
 */
export class LazyValue<T> {
  private _value: T | undefined = undefined
  private _computed = false

  constructor(private compute: () => T) {}

  get value(): T {
    if (!this._computed) {
      this._value = this.compute()
      this._computed = true
    }
    return this._value!
  }

  reset(): void {
    this._computed = false
    this._value = undefined
  }
}

/**
 * Resource pool for reusing expensive objects
 */
export class ResourcePool<T> {
  private available: T[] = []
  private inUse = new Set<T>()

  constructor(
    private factory: () => T,
    private reset?: (item: T) => void,
    initialSize: number = 5
  ) {
    for (let i = 0; i < initialSize; i++) {
      this.available.push(this.factory())
    }
  }

  acquire(): T {
    let item = this.available.pop()
    
    if (!item) {
      item = this.factory()
    }
    
    this.inUse.add(item)
    return item
  }

  release(item: T): void {
    if (this.inUse.has(item)) {
      this.inUse.delete(item)
      
      if (this.reset) {
        this.reset(item)
      }
      
      this.available.push(item)
    }
  }

  size(): { available: number; inUse: number } {
    return {
      available: this.available.length,
      inUse: this.inUse.size,
    }
  }
}

/**
 * Performance monitoring utilities
 */
export class PerformanceMonitor {
  private static marks = new Map<string, number>()
  private static measures = new Map<string, number>()

  static mark(name: string): void {
    this.marks.set(name, performance.now())
    
    if ('performance' in window && 'mark' in performance) {
      performance.mark(name)
    }
  }

  static measure(name: string, startMark: string): number {
    const startTime = this.marks.get(startMark)
    const endTime = performance.now()
    
    if (startTime === undefined) {
      console.warn(`Start mark "${startMark}" not found`)
      return 0
    }
    
    const duration = endTime - startTime
    this.measures.set(name, duration)
    
    if ('performance' in window && 'measure' in performance) {
      try {
        performance.measure(name, startMark)
      } catch (error) {
        // Ignore if marks don't exist in performance timeline
      }
    }
    
    return duration
  }

  static getMetrics() {
    return {
      marks: Object.fromEntries(this.marks),
      measures: Object.fromEntries(this.measures),
    }
  }

  static clear(): void {
    this.marks.clear()
    this.measures.clear()
    
    if ('performance' in window) {
      try {
        performance.clearMarks()
        performance.clearMeasures()
      } catch (error) {
        // Ignore errors
      }
    }
  }
}

/**
 * Intersection Observer pool for better performance
 */
export class IntersectionObserverPool {
  private static observers = new Map<string, IntersectionObserver>()
  private static callbacks = new Map<Element, Set<IntersectionObserverCallback>>()

  static observe(
    element: Element,
    callback: IntersectionObserverCallback,
    options: IntersectionObserverInit = {}
  ): () => void {
    const key = JSON.stringify(options)
    
    let observer = this.observers.get(key)
    if (!observer) {
      observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
          const callbacks = this.callbacks.get(entry.target)
          if (callbacks) {
            callbacks.forEach(cb => cb([entry], obs))
          }
        })
      }, options)
      this.observers.set(key, observer)
    }

    let callbacks = this.callbacks.get(element)
    if (!callbacks) {
      callbacks = new Set()
      this.callbacks.set(element, callbacks)
      observer.observe(element)
    }
    
    callbacks.add(callback)

    // Return cleanup function
    return () => {
      const callbacks = this.callbacks.get(element)
      if (callbacks) {
        callbacks.delete(callback)
        if (callbacks.size === 0) {
          this.callbacks.delete(element)
          const observer = this.observers.get(key)
          if (observer) {
            observer.unobserve(element)
          }
        }
      }
    }
  }

  static cleanup(): void {
    this.observers.forEach(observer => observer.disconnect())
    this.observers.clear()
    this.callbacks.clear()
  }
}

/**
 * Image optimization utilities
 */
export const ImageOptimization = {
  /**
   * Generate responsive image sizes
   */
  generateSizes: (breakpoints: Record<string, number>) => {
    return Object.entries(breakpoints)
      .map(([breakpoint, width]) => `(max-width: ${breakpoint}px) ${width}px`)
      .join(', ')
  },

  /**
   * Create optimized image URL with Vercel Image Optimization
   */
  optimizeUrl: (src: string, width: number, quality: number = 75) => {
    const params = new URLSearchParams({
      url: src,
      w: width.toString(),
      q: quality.toString(),
    })
    return `/_next/image?${params.toString()}`
  },

  /**
   * Preload critical images
   */
  preloadImage: (src: string, options: { as?: string; crossOrigin?: string } = {}) => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = options.as || 'image'
    link.href = src
    if (options.crossOrigin) {
      link.crossOrigin = options.crossOrigin
    }
    document.head.appendChild(link)
  },
}

export default {
  debounce,
  throttle,
  memoizeWithTTL,
  VirtualScroller,
  batchDOMUpdates,
  LazyValue,
  ResourcePool,
  PerformanceMonitor,
  IntersectionObserverPool,
  ImageOptimization,
}