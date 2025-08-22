// Environment configuration for backend integration

export interface EnvironmentConfig {
  // Backend API configuration
  backendApiUrl: string
  backendEnabled: boolean
  healthCheckInterval: number
  requestTimeout: number
  
  // Feature flags
  useEnhancedDestinations: boolean
  useFallbackService: boolean
  enableCaching: boolean
  enableDebugLogging: boolean
  
  // Cache configuration
  cacheExpiration: number
  maxCacheSize: number
  
  // API limits
  maxDestinationResults: number
  maxConcurrentRequests: number
  rateLimit: number
  
  // Theme configuration
  supportedThemes: string[]
  defaultTheme: string
  
  // Error handling
  maxRetryAttempts: number
  retryBackoffMs: number
  fallbackTimeout: number
}

class EnvironmentService {
  private config: EnvironmentConfig

  constructor() {
    this.config = {
      // Backend API configuration
      backendApiUrl: this.getEnvVar('NEXT_PUBLIC_BACKEND_API_URL', 'http://localhost:8081'),
      backendEnabled: this.getEnvVar('NEXT_PUBLIC_BACKEND_ENABLED', 'true') === 'true',
      healthCheckInterval: parseInt(this.getEnvVar('NEXT_PUBLIC_HEALTH_CHECK_INTERVAL', '30000')),
      requestTimeout: parseInt(this.getEnvVar('NEXT_PUBLIC_REQUEST_TIMEOUT', '30000')),
      
      // Feature flags
      useEnhancedDestinations: this.getEnvVar('NEXT_PUBLIC_USE_ENHANCED_DESTINATIONS', 'true') === 'true',
      useFallbackService: this.getEnvVar('NEXT_PUBLIC_USE_FALLBACK_SERVICE', 'true') === 'true',
      enableCaching: this.getEnvVar('NEXT_PUBLIC_ENABLE_CACHING', 'true') === 'true',
      enableDebugLogging: this.getEnvVar('NEXT_PUBLIC_DEBUG_LOGGING', 'false') === 'true',
      
      // Cache configuration
      cacheExpiration: parseInt(this.getEnvVar('NEXT_PUBLIC_CACHE_EXPIRATION', '3600000')), // 1 hour
      maxCacheSize: parseInt(this.getEnvVar('NEXT_PUBLIC_MAX_CACHE_SIZE', '100')),
      
      // API limits
      maxDestinationResults: parseInt(this.getEnvVar('NEXT_PUBLIC_MAX_DESTINATION_RESULTS', '50')),
      maxConcurrentRequests: parseInt(this.getEnvVar('NEXT_PUBLIC_MAX_CONCURRENT_REQUESTS', '5')),
      rateLimit: parseInt(this.getEnvVar('NEXT_PUBLIC_RATE_LIMIT', '100')), // requests per minute
      
      // Theme configuration
      supportedThemes: this.getEnvVar('NEXT_PUBLIC_SUPPORTED_THEMES', 'vibe,adventure,discover,indulge,nature').split(','),
      defaultTheme: this.getEnvVar('NEXT_PUBLIC_DEFAULT_THEME', 'adventure'),
      
      // Error handling
      maxRetryAttempts: parseInt(this.getEnvVar('NEXT_PUBLIC_MAX_RETRY_ATTEMPTS', '3')),
      retryBackoffMs: parseInt(this.getEnvVar('NEXT_PUBLIC_RETRY_BACKOFF_MS', '1000')),
      fallbackTimeout: parseInt(this.getEnvVar('NEXT_PUBLIC_FALLBACK_TIMEOUT', '5000'))
    }

    // Validate configuration
    this.validateConfig()
    
    if (this.config.enableDebugLogging) {
      console.log('🔧 Environment configuration loaded:', this.config)
    }
  }

  private getEnvVar(key: string, defaultValue: string): string {
    // Check browser environment variables (NEXT_PUBLIC_ prefixed)
    if (typeof window !== 'undefined') {
      return process.env[key] || defaultValue
    }
    
    // Check server environment variables
    return process.env[key] || process.env[`NEXT_PUBLIC_${key.replace('NEXT_PUBLIC_', '')}`] || defaultValue
  }

  private validateConfig(): void {
    const errors: string[] = []

    // Validate required URLs
    if (!this.isValidUrl(this.config.backendApiUrl)) {
      errors.push(`Invalid backend API URL: ${this.config.backendApiUrl}`)
    }

    // Validate numeric values
    if (this.config.healthCheckInterval < 1000) {
      errors.push('Health check interval must be at least 1000ms')
    }

    if (this.config.requestTimeout < 1000) {
      errors.push('Request timeout must be at least 1000ms')
    }

    if (this.config.maxDestinationResults < 1 || this.config.maxDestinationResults > 100) {
      errors.push('Max destination results must be between 1 and 100')
    }

    // Validate themes
    const validThemes = ['vibe', 'adventure', 'discover', 'indulge', 'nature']
    const invalidThemes = this.config.supportedThemes.filter(theme => !validThemes.includes(theme))
    if (invalidThemes.length > 0) {
      errors.push(`Invalid themes found: ${invalidThemes.join(', ')}`)
    }

    if (!this.config.supportedThemes.includes(this.config.defaultTheme)) {
      errors.push(`Default theme '${this.config.defaultTheme}' not in supported themes`)
    }

    if (errors.length > 0) {
      console.warn('⚠️ Environment configuration issues:', errors)
      // Don't throw errors in production or when services are starting up
      // Allow graceful degradation instead of failing completely
      if (this.config.enableDebugLogging && process.env.NODE_ENV === 'development') {
        console.warn('Debug mode enabled but allowing startup with configuration warnings')
        // throw new Error(`Environment configuration errors: ${errors.join('; ')}`)
      }
    }
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  // Public getters
  getConfig(): EnvironmentConfig {
    return { ...this.config }
  }

  getBackendUrl(): string {
    return this.config.backendApiUrl
  }

  isBackendEnabled(): boolean {
    return this.config.backendEnabled
  }

  isDebugEnabled(): boolean {
    return this.config.enableDebugLogging
  }

  getMaxDestinations(): number {
    return this.config.maxDestinationResults
  }

  getSupportedThemes(): string[] {
    return [...this.config.supportedThemes]
  }

  getDefaultTheme(): string {
    return this.config.defaultTheme
  }

  getCacheConfig(): { expiration: number; maxSize: number; enabled: boolean } {
    return {
      expiration: this.config.cacheExpiration,
      maxSize: this.config.maxCacheSize,
      enabled: this.config.enableCaching
    }
  }

  getRetryConfig(): { maxAttempts: number; backoffMs: number; timeout: number } {
    return {
      maxAttempts: this.config.maxRetryAttempts,
      backoffMs: this.config.retryBackoffMs,
      timeout: this.config.fallbackTimeout
    }
  }

  // Development helpers
  isDevelopment(): boolean {
    return process.env.NODE_ENV === 'development'
  }

  isProduction(): boolean {
    return process.env.NODE_ENV === 'production'
  }

  shouldUseFallback(): boolean {
    return this.config.useFallbackService
  }

  // Update configuration at runtime (for testing)
  updateConfig(updates: Partial<EnvironmentConfig>): void {
    this.config = { ...this.config, ...updates }
    this.validateConfig()
    
    if (this.config.enableDebugLogging) {
      console.log('🔄 Environment configuration updated:', updates)
    }
  }
}

// Singleton instance
export const environmentService = new EnvironmentService()
export default environmentService

// Export commonly used values
export const {
  backendApiUrl,
  backendEnabled,
  useEnhancedDestinations,
  enableDebugLogging,
  supportedThemes,
  defaultTheme
} = environmentService.getConfig()

// Type guards
export function isValidTheme(theme: string): theme is 'vibe' | 'adventure' | 'discover' | 'indulge' | 'nature' {
  return supportedThemes.includes(theme)
}

export function isValidPriceRange(range: string): range is 'budget' | 'mid-range' | 'luxury' | 'any' {
  return ['budget', 'mid-range', 'luxury', 'any'].includes(range)
}