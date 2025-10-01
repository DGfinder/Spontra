import { onCLS, onFCP, onFID, onINP, onLCP, onTTFB } from 'web-vitals'
import { trace } from '@opentelemetry/api'

interface VitalMetric {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  delta: number
  id: string
  navigationType: string
  entries: PerformanceEntry[]
}

interface PerformanceReport extends VitalMetric {
  // Enhanced context
  route: string
  userAgent: string
  connectionType: string
  deviceMemory: number
  hardwareConcurrency: number
  timestamp: number
  sessionId: string
  userId?: string
  // Navigation context
  navigationTiming?: PerformanceNavigationTiming
  // Custom attributes
  isBot: boolean
  hasServiceWorker: boolean
  cacheStatus?: string
  // Quality controls
  deviceClass: 'mobile' | 'desktop' | 'tablet'
  country: string
  interactionCount: number
  sampleRate: number
  // Attribution data
  lcpElement?: string
  lcpResourceOrigin?: string
  clsAttribution?: string[]
  hydrationPhase?: 'start' | 'end' | 'interactive'
}

class PerformanceReporter {
  private sessionId: string
  private userId?: string
  private route: string
  private tracer = trace.getTracer('spontra-performance')
  private interactionCount = 0
  private sampleRate: number
  private isQualified = true

  constructor() {
    this.sessionId = this.generateSessionId()
    this.route = typeof window !== 'undefined' ? window.location.pathname : '/'
    this.sampleRate = this.getSampleRate()
    this.checkQualityControls()
    
    if (this.isQualified && this.shouldSample()) {
      this.initializeTracking()
    }
  }

  private generateSessionId(): string {
    return `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private getSampleRate(): number {
    // Production: 0.1 (10%), Development: 1.0 (100%)
    return parseFloat(process.env.NEXT_PUBLIC_RUM_SAMPLE_RATE || '1.0')
  }

  private shouldSample(): boolean {
    return Math.random() < this.sampleRate
  }

  private checkQualityControls() {
    if (typeof navigator === 'undefined') return

    const ua = navigator.userAgent.toLowerCase()
    
    // Bot & QA filtering
    const botPatterns = [
      'headless', 'phantom', 'crawler', 'bot', 'spider',
      'lighthouse', 'pagespeed', 'gtmetrix', 'pingdom',
      'webpagetest', 'selenium', 'puppeteer', 'playwright'
    ]
    
    const isBot = botPatterns.some(pattern => ua.includes(pattern))
    
    // Check for QA headers
    const isQA = document.documentElement.hasAttribute('data-qa') ||
                 window.location.search.includes('qa=1') ||
                 window.location.hostname.includes('test')
    
    // Navigation spam detection (>20 nav/min)
    const navCount = parseInt(sessionStorage.getItem('perf_nav_count') || '0')
    const navTime = parseInt(sessionStorage.getItem('perf_nav_time') || '0')
    const now = Date.now()
    
    if (now - navTime > 60000) {
      // Reset counter every minute
      sessionStorage.setItem('perf_nav_count', '1')
      sessionStorage.setItem('perf_nav_time', now.toString())
    } else {
      const newCount = navCount + 1
      sessionStorage.setItem('perf_nav_count', newCount.toString())
      
      if (newCount > 20) {
        this.isQualified = false
        return
      }
    }
    
    this.isQualified = !isBot && !isQA
  }

  private getDeviceClass(): 'mobile' | 'desktop' | 'tablet' {
    if (typeof navigator === 'undefined') return 'desktop'
    
    const ua = navigator.userAgent
    if (/iPhone|iPod/.test(ua)) return 'mobile'
    if (/iPad/.test(ua)) return 'tablet'
    if (/Android.*Mobile/.test(ua)) return 'mobile'
    if (/Android/.test(ua)) return 'tablet'
    
    // Screen-based detection
    if (typeof screen !== 'undefined') {
      const width = Math.min(screen.width, screen.height)
      if (width < 768) return 'mobile'
      if (width < 1024) return 'tablet'
    }
    
    return 'desktop'
  }

  private getCountry(): string {
    // Cloudflare country header or timezone-based detection
    const cf_country = (window as any).CF_COUNTRY
    if (cf_country) return cf_country
    
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
      const country = timezone.split('/')[0]
      return country || 'unknown'
    } catch {
      return 'unknown'
    }
  }

  private getLCPAttribution(): { element?: string; resourceOrigin?: string } {
    try {
      const lcpEntries = performance.getEntriesByType('largest-contentful-paint') as any[]
      const lastEntry = lcpEntries[lcpEntries.length - 1]
      
      if (!lastEntry) return {}
      
      const element = lastEntry.element
      const elementType = element?.tagName?.toLowerCase() || 'unknown'
      const elementInfo = element?.src ? 'image' : 'text'
      
      let resourceOrigin = 'same-origin'
      if (element?.src) {
        const url = new URL(element.src, window.location.origin)
        if (url.origin !== window.location.origin) {
          resourceOrigin = url.hostname.includes('vercel') ? 'cdn' : '3p'
        }
      }
      
      return {
        element: `${elementType}:${elementInfo}`,
        resourceOrigin
      }
    } catch {
      return {}
    }
  }

  private getCLSAttribution(): string[] {
    const attribution: string[] = []
    
    try {
      // Check for known layout shifters
      const shifters = [
        { selector: '[data-consent-banner]', name: 'consent-banner' },
        { selector: '[data-affiliate-disclosure]', name: 'affiliate-ribbon' },
        { selector: '.ad-container', name: 'ads' },
        { selector: '[data-lazy-load]', name: 'lazy-images' }
      ]
      
      shifters.forEach(shifter => {
        if (document.querySelector(shifter.selector)) {
          attribution.push(shifter.name)
        }
      })
    } catch {
      // Ignore errors
    }
    
    return attribution
  }

  private getDeviceInfo() {
    if (typeof navigator === 'undefined') return {}
    
    return {
      userAgent: navigator.userAgent,
      connectionType: (navigator as any).connection?.effectiveType || 'unknown',
      deviceMemory: (navigator as any).deviceMemory || 0,
      hardwareConcurrency: navigator.hardwareConcurrency || 0,
      isBot: /bot|crawler|spider|crawling/i.test(navigator.userAgent),
      hasServiceWorker: 'serviceWorker' in navigator
    }
  }

  private getNavigationTiming(): PerformanceNavigationTiming | undefined {
    if (typeof performance === 'undefined') return undefined
    
    const entries = performance.getEntriesByType('navigation')
    return entries[0] as PerformanceNavigationTiming
  }

  private createReport(metric: VitalMetric): PerformanceReport {
    const deviceInfo = this.getDeviceInfo()
    const navigationTiming = this.getNavigationTiming()
    const lcpAttribution = metric.name === 'lcp' ? this.getLCPAttribution() : {}
    const clsAttribution = metric.name === 'cls' ? this.getCLSAttribution() : undefined
    
    // Track hydration phases for attribution
    let hydrationPhase: 'start' | 'end' | 'interactive' | undefined
    if (metric.name === 'hydration') {
      if (metric.id.includes('start')) hydrationPhase = 'start'
      else if (metric.id.includes('end')) hydrationPhase = 'end'
      else if (metric.id.includes('interactive') || metric.id.includes('timeout')) hydrationPhase = 'interactive'
    }

    return {
      ...metric,
      route: this.route,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId,
      userAgent: navigator?.userAgent || 'unknown',
      connectionType: (navigator as any)?.connection?.effectiveType || 'unknown',
      deviceMemory: (navigator as any)?.deviceMemory || 4,
      hardwareConcurrency: navigator?.hardwareConcurrency || 4,
      navigationTiming,
      deviceClass: this.getDeviceClass(),
      country: this.getCountry(),
      interactionCount: this.interactionCount,
      sampleRate: this.sampleRate,
      lcpElement: lcpAttribution.element,
      lcpResourceOrigin: lcpAttribution.resourceOrigin,
      clsAttribution,
      hydrationPhase,
      ...deviceInfo
    }
  }

  private async sendToAnalytics(report: PerformanceReport) {
    // Send to existing OTel pipeline
    const span = this.tracer.startSpan(`performance.${report.name}`)
    
    span.setAttributes({
      'performance.metric.name': report.name,
      'performance.metric.value': report.value,
      'performance.metric.rating': report.rating,
      'performance.route': report.route,
      'performance.session_id': report.sessionId,
      'performance.user_agent': report.userAgent,
      'performance.connection_type': report.connectionType,
      'performance.device_memory': report.deviceMemory,
      'performance.is_bot': report.isBot,
      'performance.navigation_type': report.navigationType
    })

    span.end()

    // Also send to analytics endpoint for dashboards
    try {
      await fetch('/api/analytics/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report),
        // Don't block the main thread
        keepalive: true
      })
    } catch (error) {
      console.warn('Failed to send performance metrics:', error)
    }
  }

  private async reportMetric(metric: VitalMetric) {
    const report = this.createReport(metric)
    
    // Log for debugging
    console.log(`📊 ${metric.name}: ${metric.value.toFixed(2)}ms (${metric.rating})`)
    
    await this.sendToAnalytics(report)
  }

  private initializeTracking() {
    if (typeof window === 'undefined') return

    // Set up interaction counting for quality controls
    this.trackInteractions()

    // Track all Core Web Vitals with bias controls
    onCLS((metric) => this.reportMetric(metric))
    onFCP((metric) => this.reportMetric(metric))
    onFID((metric) => this.reportMetric(metric))
    onINP((metric) => {
      // INP bias control: Only report if we have sufficient interactions
      if (this.interactionCount >= 3) {
        this.reportMetric(metric)
      }
    })
    onLCP((metric) => this.reportMetric(metric))
    onTTFB((metric) => this.reportMetric(metric))

    // Track custom metrics
    this.trackHydrationTiming()
    this.trackRouteChanges()
  }

  private trackInteractions() {
    if (typeof window === 'undefined') return

    const interactionEvents = ['click', 'keydown', 'pointerdown', 'touchstart']
    
    const handleInteraction = () => {
      this.interactionCount++
    }

    interactionEvents.forEach(event => {
      document.addEventListener(event, handleInteraction, { 
        passive: true, 
        capture: true 
      })
    })
  }

  private trackHydrationTiming() {
    if (typeof window === 'undefined') return

    const hydrationStart = performance.now()
    let isFirstInteractionDetected = false
    
    // Track hydration start
    this.reportMetric({
      name: 'hydration',
      value: 0,
      rating: 'good',
      delta: 0,
      id: `hydration-start-${this.sessionId}`,
      navigationType: 'navigate',
      entries: []
    })

    // Wait for React to hydrate (hydration end)
    setTimeout(() => {
      const hydrationEnd = performance.now()
      const hydrationTime = hydrationEnd - hydrationStart

      this.reportMetric({
        name: 'hydration',
        value: hydrationTime,
        rating: hydrationTime < 1000 ? 'good' : hydrationTime < 2500 ? 'needs-improvement' : 'poor',
        delta: hydrationTime,
        id: `hydration-end-${this.sessionId}`,
        navigationType: 'navigate',
        entries: []
      })
    }, 0)

    // Simple click probe for "first interactive" detection
    const interactiveProbe = (event: MouseEvent | TouchEvent) => {
      if (isFirstInteractionDetected) return
      
      const interactiveTime = performance.now()
      const timeToInteractive = interactiveTime - hydrationStart
      isFirstInteractionDetected = true

      this.reportMetric({
        name: 'hydration',
        value: timeToInteractive,
        rating: timeToInteractive < 1500 ? 'good' : timeToInteractive < 3000 ? 'needs-improvement' : 'poor',
        delta: timeToInteractive,
        id: `hydration-interactive-${this.sessionId}`,
        navigationType: 'navigate',
        entries: []
      })

      // Clean up listeners after first interaction
      document.removeEventListener('click', interactiveProbe, { capture: true })
      document.removeEventListener('touchstart', interactiveProbe, { capture: true })
    }

    // Listen for first meaningful interaction
    document.addEventListener('click', interactiveProbe, { capture: true, passive: true })
    document.addEventListener('touchstart', interactiveProbe, { capture: true, passive: true })

    // Timeout fallback - assume interactive after 5 seconds if no interaction
    setTimeout(() => {
      if (!isFirstInteractionDetected) {
        const fallbackTime = performance.now()
        const timeToInteractive = fallbackTime - hydrationStart
        isFirstInteractionDetected = true

        this.reportMetric({
          name: 'hydration',
          value: timeToInteractive,
          rating: 'poor', // No interaction suggests poor UX
          delta: timeToInteractive,
          id: `hydration-timeout-${this.sessionId}`,
          navigationType: 'navigate',
          entries: []
        })

        document.removeEventListener('click', interactiveProbe, { capture: true })
        document.removeEventListener('touchstart', interactiveProbe, { capture: true })
      }
    }, 5000)
  }

  private trackRouteChanges() {
    if (typeof window === 'undefined') return

    // Track SPA route changes
    let routeChangeStart = 0
    
    const originalPushState = history.pushState
    const originalReplaceState = history.replaceState

    history.pushState = function(...args) {
      routeChangeStart = performance.now()
      originalPushState.apply(this, args)
    }

    history.replaceState = function(...args) {
      routeChangeStart = performance.now()
      originalReplaceState.apply(this, args)
    }

    window.addEventListener('popstate', () => {
      routeChangeStart = performance.now()
    })

    // Track when route change completes
    const observer = new MutationObserver(() => {
      if (routeChangeStart > 0) {
        const routeChangeTime = performance.now() - routeChangeStart
        
        this.reportMetric({
          name: 'route-change',
          value: routeChangeTime,
          rating: routeChangeTime < 500 ? 'good' : routeChangeTime < 1000 ? 'needs-improvement' : 'poor',
          delta: routeChangeTime,
          id: `route-change-${this.sessionId}`,
          navigationType: 'spa',
          entries: []
        })

        routeChangeStart = 0
      }
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true
    })
  }

  public setUserId(userId: string) {
    this.userId = userId
  }

  public setRoute(route: string) {
    this.route = route
  }

  // Manual performance marks for custom tracking
  public mark(name: string) {
    if (typeof performance !== 'undefined') {
      performance.mark(`spontra:${name}`)
    }
  }

  public measure(name: string, startMark?: string) {
    if (typeof performance !== 'undefined') {
      const measureName = `spontra:${name}`
      
      if (startMark) {
        performance.measure(measureName, `spontra:${startMark}`)
      } else {
        performance.measure(measureName)
      }

      const measures = performance.getEntriesByName(measureName, 'measure')
      const measure = measures[measures.length - 1]

      if (measure) {
        this.reportMetric({
          name: `custom.${name}`,
          value: measure.duration,
          rating: measure.duration < 100 ? 'good' : measure.duration < 300 ? 'needs-improvement' : 'poor',
          delta: measure.duration,
          id: `custom-${name}-${this.sessionId}`,
          navigationType: 'custom',
          entries: [measure]
        })
      }
    }
  }
}

// Singleton instance
let performanceReporter: PerformanceReporter | null = null

export function getPerformanceReporter(): PerformanceReporter {
  if (!performanceReporter) {
    performanceReporter = new PerformanceReporter()
  }
  return performanceReporter
}

// Convenience functions for React components
export function usePerformanceTracking() {
  const reporter = getPerformanceReporter()
  
  return {
    mark: (name: string) => reporter.mark(name),
    measure: (name: string, startMark?: string) => reporter.measure(name, startMark),
    setUserId: (userId: string) => reporter.setUserId(userId),
    setRoute: (route: string) => reporter.setRoute(route)
  }
}

// Initialize tracking automatically
if (typeof window !== 'undefined') {
  getPerformanceReporter()
}