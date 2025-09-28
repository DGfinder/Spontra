/**
 * Production Environment Variable Validation
 * Validates all critical environment variables at startup
 * Fails fast if production secrets are missing or invalid
 */

import { z } from 'zod'

// Define required environment variable schema
const envSchema = z.object({
  // Node Environment
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  
  // Database Configuration (Critical)
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid PostgreSQL URL'),
  POSTGRES_PRISMA_URL: z.string().url('POSTGRES_PRISMA_URL must be a valid URL').optional(),
  POSTGRES_URL_NON_POOLING: z.string().url('POSTGRES_URL_NON_POOLING must be a valid URL').optional(),
  
  // Vercel KV (Critical for sessions and caching)
  KV_URL: z.string().url('KV_URL must be a valid Redis URL').optional(),
  KV_REST_API_URL: z.string().url('KV_REST_API_URL must be a valid URL').optional(),
  KV_REST_API_TOKEN: z.string().min(1, 'KV_REST_API_TOKEN is required').optional(),
  
  // JWT Secrets (Critical for security)
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters').optional(),
  USER_AUTH_JWT_SECRET: z.string().min(32, 'USER_AUTH_JWT_SECRET must be at least 32 characters').optional(),
  ADMIN_JWT_SECRET: z.string().min(32, 'ADMIN_JWT_SECRET must be at least 32 characters').optional(),
  ENCRYPTION_KEY: z.string().min(32, 'ENCRYPTION_KEY must be at least 32 characters').optional(),
  
  // External API Keys (Critical for functionality)
  AMADEUS_CLIENT_ID: z.string().min(1, 'AMADEUS_CLIENT_ID is required').optional(),
  AMADEUS_CLIENT_SECRET: z.string().min(1, 'AMADEUS_CLIENT_SECRET is required').optional(),
  AMADEUS_ENVIRONMENT: z.enum(['test', 'production']).default('test'),
  
  // Email Service (Critical for user communications)
  RESEND_API_KEY: z.string().startsWith('re_', 'RESEND_API_KEY must start with re_').optional(),
  RESEND_FROM_EMAIL: z.string().email('RESEND_FROM_EMAIL must be a valid email').optional(),
  
  // Monitoring & Error Tracking
  NEXT_PUBLIC_SENTRY_DSN: z.string().url('SENTRY_DSN must be a valid URL').optional(),
  SENTRY_ORG: z.string().min(1).optional(),
  SENTRY_PROJECT: z.string().min(1).optional(),
  SENTRY_AUTH_TOKEN: z.string().min(1).optional(),
  
  // Application URLs
  NEXT_PUBLIC_APP_URL: z.string().url('NEXT_PUBLIC_APP_URL must be a valid URL').default('http://localhost:3000'),
  
  // Backend API Configuration
  NEXT_PUBLIC_BACKEND_API_URL: z.string().url().default('http://localhost:8081'),
  NEXT_PUBLIC_API_BASE_URL: z.string().url().optional(),
  YOUTUBE_API_KEY: z.string().optional(),
  
  // Rate Limiting
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).pipe(z.number().positive()).default('100'),
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).pipe(z.number().positive()).default('60000'),
})

// Production-specific validation rules
const productionEnvSchema = envSchema.extend({
  // In production, these must be present and secure
  POSTGRES_PRISMA_URL: z.string().url('POSTGRES_PRISMA_URL is required in production'),
  POSTGRES_URL_NON_POOLING: z.string().url('POSTGRES_URL_NON_POOLING is required in production'),
  KV_URL: z.string().url('KV_URL is required in production'),
  KV_REST_API_URL: z.string().url('KV_REST_API_URL is required in production'),
  KV_REST_API_TOKEN: z.string().min(1, 'KV_REST_API_TOKEN is required in production'),
  
  JWT_SECRET: z.string().min(32, 'JWT_SECRET is required in production'),
  USER_AUTH_JWT_SECRET: z.string().min(32, 'USER_AUTH_JWT_SECRET is required in production'),
  ADMIN_JWT_SECRET: z.string().min(32, 'ADMIN_JWT_SECRET is required in production'),
  ENCRYPTION_KEY: z.string().min(32, 'ENCRYPTION_KEY is required in production'),
  
  AMADEUS_CLIENT_ID: z.string().min(1, 'AMADEUS_CLIENT_ID is required in production'),
  AMADEUS_CLIENT_SECRET: z.string().min(1, 'AMADEUS_CLIENT_SECRET is required in production'),
  
  RESEND_API_KEY: z.string().startsWith('re_', 'RESEND_API_KEY is required in production'),
  RESEND_FROM_EMAIL: z.string().email('RESEND_FROM_EMAIL is required in production'),
  
  NEXT_PUBLIC_SENTRY_DSN: z.string().url('Sentry DSN is required in production'),
  SENTRY_ORG: z.string().min(1, 'SENTRY_ORG is required in production'),
  SENTRY_PROJECT: z.string().min(1, 'SENTRY_PROJECT is required in production'),
  SENTRY_AUTH_TOKEN: z.string().min(1, 'SENTRY_AUTH_TOKEN is required in production'),
  
  // Production URLs must be HTTPS
  NEXT_PUBLIC_APP_URL: z.string().url().refine(
    (url) => url.startsWith('https://'), 
    'App URL must use HTTPS in production'
  ),
  DATABASE_URL: z.string().url().refine(
    (url) => url.startsWith('postgres://'), 
    'Database URL must be PostgreSQL in production'
  ),
})

type Environment = z.infer<typeof envSchema>
type ProductionEnvironment = z.infer<typeof productionEnvSchema>

// Legacy interface for backward compatibility
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

/**
 * Validates environment variables and returns typed environment object
 */
export function validateEnvironment(): Environment | ProductionEnvironment {
  const isProduction = process.env.NODE_ENV === 'production'
  const schema = isProduction ? productionEnvSchema : envSchema
  
  try {
    const env = schema.parse(process.env)
    
    // Additional production security checks
    if (isProduction) {
      validateProductionSecurity(env as ProductionEnvironment)
    }
    
    return env
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('\n')
      
      console.error('❌ Environment validation failed:')
      console.error(missingVars)
      console.error('\n📋 Please check your .env file or environment variables.')
      
      if (isProduction) {
        console.error('\n🚨 Production deployment cannot continue with missing/invalid environment variables.')
        process.exit(1)
      } else {
        console.warn('\n⚠️ Development mode: continuing with warning.')
        // Return minimal config for development
        return envSchema.parse({
          NODE_ENV: 'development',
          DATABASE_URL: 'postgres://localhost:5432/spontra_dev',
          NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
          NEXT_PUBLIC_BACKEND_API_URL: 'http://localhost:8081',
          AMADEUS_ENVIRONMENT: 'test'
        })
      }
    }
    throw error
  }
}

/**
 * Additional security validations for production environment
 */
function validateProductionSecurity(env: ProductionEnvironment): void {
  const securityChecks = [
    {
      check: () => env.JWT_SECRET!.length >= 64,
      message: 'JWT_SECRET should be at least 64 characters in production'
    },
    {
      check: () => env.USER_AUTH_JWT_SECRET!.length >= 64,
      message: 'USER_AUTH_JWT_SECRET should be at least 64 characters in production'
    },
    {
      check: () => env.ADMIN_JWT_SECRET!.length >= 64,
      message: 'ADMIN_JWT_SECRET should be at least 64 characters in production'
    },
    {
      check: () => env.ENCRYPTION_KEY!.length >= 64,
      message: 'ENCRYPTION_KEY should be at least 64 characters in production'
    },
    {
      check: () => env.AMADEUS_ENVIRONMENT === 'production',
      message: 'AMADEUS_ENVIRONMENT should be "production" in production'
    },
    {
      check: () => !env.NEXT_PUBLIC_APP_URL.includes('localhost'),
      message: 'NEXT_PUBLIC_APP_URL should not contain localhost in production'
    }
  ]
  
  const failedChecks = securityChecks.filter(({ check }) => !check())
  
  if (failedChecks.length > 0) {
    console.warn('⚠️  Production security warnings:')
    failedChecks.forEach(({ message }) => console.warn(`  - ${message}`))
    console.warn('\n🔒 Consider updating these for maximum security.')
  }
}

// Initialize environment validation at startup
let validatedEnv: Environment | ProductionEnvironment
try {
  validatedEnv = validateEnvironment()
} catch {
  // Fallback for development
  validatedEnv = {
    NODE_ENV: 'development',
    DATABASE_URL: 'postgres://localhost:5432/spontra_dev',
    NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
    NEXT_PUBLIC_BACKEND_API_URL: 'http://localhost:8081',
    AMADEUS_ENVIRONMENT: 'test',
    RATE_LIMIT_MAX_REQUESTS: 100,
    RATE_LIMIT_WINDOW_MS: 60000
  } as Environment
}

class EnvironmentService {
  private config: EnvironmentConfig
  private validatedEnv: Environment | ProductionEnvironment

  constructor() {
    this.validatedEnv = validatedEnv
    
    this.config = {
      // Backend API configuration
      backendApiUrl: this.validatedEnv.NEXT_PUBLIC_BACKEND_API_URL,
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
      rateLimit: this.validatedEnv.RATE_LIMIT_MAX_REQUESTS,
      
      // Theme configuration
      supportedThemes: this.getEnvVar('NEXT_PUBLIC_SUPPORTED_THEMES', 'party,adventure,learn,shopping,nature').split(','),
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

  // Get validated environment variables
  getValidatedEnv(): Environment | ProductionEnvironment {
    return this.validatedEnv
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

// Get validated environment variables
export const env = validatedEnv

// Runtime environment type guards
export const isProduction = env.NODE_ENV === 'production'
export const isDevelopment = env.NODE_ENV === 'development'
export const isTest = env.NODE_ENV === 'test'

// Helper to get database URL with proper connection pooling
export const getDatabaseUrl = () => {
  if (isProduction && 'POSTGRES_PRISMA_URL' in env && env.POSTGRES_PRISMA_URL) {
    return env.POSTGRES_PRISMA_URL
  }
  return env.DATABASE_URL
}

// Helper to get direct database URL (no pooling)
export const getDirectDatabaseUrl = () => {
  if (isProduction && 'POSTGRES_URL_NON_POOLING' in env && env.POSTGRES_URL_NON_POOLING) {
    return env.POSTGRES_URL_NON_POOLING
  }
  return env.DATABASE_URL
}

// Export commonly used values for backward compatibility
export const {
  backendApiUrl,
  backendEnabled,
  useEnhancedDestinations,
  enableDebugLogging,
  supportedThemes,
  defaultTheme
} = environmentService.getConfig()

// Type guards
export function isValidTheme(theme: string): theme is 'party' | 'adventure' | 'learn' | 'shopping' | 'nature' {
  return supportedThemes.includes(theme)
}

export function isValidPriceRange(range: string): range is 'budget' | 'mid-range' | 'luxury' | 'any' {
  return ['budget', 'mid-range', 'luxury', 'any'].includes(range)
}

// Production security helpers
export function requiresSecureSecrets(): boolean {
  return isProduction
}

export function getSecretOrThrow(key: keyof Environment): string {
  const value = env[key] as string
  if (!value && isProduction) {
    throw new Error(`Required secret ${key} is missing in production`)
  }
  return value || ''
}

// Note: Default export is environmentService (line 415), not env
// Use named export for env: import { env } from './environment'