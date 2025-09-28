/**
 * API Security Validation
 * Comprehensive security validation for all API endpoints
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { captureException } from '@sentry/nextjs'
import { trackError } from './monitoring'
import { env, isProduction } from '../config/environment'

export interface SecurityValidationOptions {
  requireAuth?: boolean
  allowedMethods?: string[]
  validateInput?: z.ZodSchema
  rateLimitBypass?: boolean
  requireHTTPS?: boolean
  allowedOrigins?: string[]
  maxRequestSize?: number
}

export interface SecurityValidationResult {
  success: boolean
  error?: string
  code?: string
  statusCode?: number
}

class APISecurityValidator {
  private blockedUserAgents = new Set([
    'bot', 'crawler', 'spider', 'scraper', 'curl', 'wget', 'postman'
  ])
  
  private suspiciousPatterns = [
    /[<>'"&]/, // XSS attempts
    /union\s+select/i, // SQL injection
    /javascript:/i, // JavaScript injection
    /<script/i, // Script injection
    /\.\.\//, // Directory traversal
    /\0/, // Null bytes
  ]

  /**
   * Validate API request security
   */
  async validateRequest(
    req: NextRequest,
    options: SecurityValidationOptions = {}
  ): Promise<SecurityValidationResult> {
    try {
      // 1. HTTPS validation (production only)
      if (options.requireHTTPS !== false && isProduction) {
        const httpsResult = this.validateHTTPS(req)
        if (!httpsResult.success) return httpsResult
      }

      // 2. Method validation
      if (options.allowedMethods) {
        const methodResult = this.validateMethod(req, options.allowedMethods)
        if (!methodResult.success) return methodResult
      }

      // 3. Origin validation
      if (options.allowedOrigins) {
        const originResult = this.validateOrigin(req, options.allowedOrigins)
        if (!originResult.success) return originResult
      }

      // 4. Content-Type validation
      const contentTypeResult = this.validateContentType(req)
      if (!contentTypeResult.success) return contentTypeResult

      // 5. Request size validation
      if (options.maxRequestSize) {
        const sizeResult = await this.validateRequestSize(req, options.maxRequestSize)
        if (!sizeResult.success) return sizeResult
      }

      // 6. User Agent validation
      const userAgentResult = this.validateUserAgent(req)
      if (!userAgentResult.success) return userAgentResult

      // 7. Header security validation
      const headerResult = this.validateHeaders(req)
      if (!headerResult.success) return headerResult

      // 8. URL pattern validation
      const urlResult = this.validateURL(req)
      if (!urlResult.success) return urlResult

      // 9. Input validation (if schema provided)
      if (options.validateInput) {
        const inputResult = await this.validateInput(req, options.validateInput)
        if (!inputResult.success) return inputResult
      }

      // 10. Authentication validation (if required)
      if (options.requireAuth) {
        const authResult = this.validateAuthentication(req)
        if (!authResult.success) return authResult
      }

      return { success: true }

    } catch (error) {
      console.error('Security validation error:', error)
      
      captureException(error, {
        tags: { component: 'api_security' },
        extra: { url: req.url, method: req.method }
      })

      return {
        success: false,
        error: 'Security validation failed',
        code: 'validation_error',
        statusCode: 500
      }
    }
  }

  /**
   * Validate HTTPS requirement
   */
  private validateHTTPS(req: NextRequest): SecurityValidationResult {
    const protocol = req.headers.get('x-forwarded-proto') || 'http'
    
    if (protocol !== 'https') {
      trackError({
        errorType: 'api',
        errorCode: 'insecure_request',
        endpoint: new URL(req.url).pathname,
        severity: 'medium'
      })

      return {
        success: false,
        error: 'HTTPS required',
        code: 'insecure_protocol',
        statusCode: 400
      }
    }

    return { success: true }
  }

  /**
   * Validate HTTP method
   */
  private validateMethod(req: NextRequest, allowedMethods: string[]): SecurityValidationResult {
    if (!allowedMethods.includes(req.method)) {
      return {
        success: false,
        error: `Method ${req.method} not allowed`,
        code: 'method_not_allowed',
        statusCode: 405
      }
    }

    return { success: true }
  }

  /**
   * Validate request origin
   */
  private validateOrigin(req: NextRequest, allowedOrigins: string[]): SecurityValidationResult {
    const origin = req.headers.get('origin')
    
    if (origin && !allowedOrigins.includes(origin)) {
      trackError({
        errorType: 'api',
        errorCode: 'invalid_origin',
        endpoint: new URL(req.url).pathname,
        severity: 'high'
      })

      return {
        success: false,
        error: 'Origin not allowed',
        code: 'invalid_origin',
        statusCode: 403
      }
    }

    return { success: true }
  }

  /**
   * Validate Content-Type header
   */
  private validateContentType(req: NextRequest): SecurityValidationResult {
    const contentType = req.headers.get('content-type')
    const method = req.method.toUpperCase()

    // POST/PUT/PATCH should have valid content-type
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      if (!contentType) {
        return {
          success: false,
          error: 'Content-Type header required',
          code: 'missing_content_type',
          statusCode: 400
        }
      }

      const validTypes = [
        'application/json',
        'application/x-www-form-urlencoded',
        'multipart/form-data'
      ]

      const isValid = validTypes.some(type => contentType.includes(type))
      
      if (!isValid) {
        return {
          success: false,
          error: 'Invalid Content-Type',
          code: 'invalid_content_type',
          statusCode: 400
        }
      }
    }

    return { success: true }
  }

  /**
   * Validate request size
   */
  private async validateRequestSize(req: NextRequest, maxSize: number): Promise<SecurityValidationResult> {
    const contentLength = req.headers.get('content-length')
    
    if (contentLength && parseInt(contentLength) > maxSize) {
      return {
        success: false,
        error: 'Request too large',
        code: 'request_too_large',
        statusCode: 413
      }
    }

    return { success: true }
  }

  /**
   * Validate User-Agent header
   */
  private validateUserAgent(req: NextRequest): SecurityValidationResult {
    const userAgent = req.headers.get('user-agent')?.toLowerCase()
    
    if (!userAgent) {
      // Allow missing user agent in development
      if (!isProduction) {
        return { success: true }
      }

      return {
        success: false,
        error: 'User-Agent header required',
        code: 'missing_user_agent',
        statusCode: 400
      }
    }

    // Block known bots and scrapers (except authorized ones)
    for (const blocked of this.blockedUserAgents) {
      if (userAgent.includes(blocked) && !this.isAuthorizedBot(userAgent)) {
        trackError({
          errorType: 'api',
          errorCode: 'blocked_user_agent',
          endpoint: new URL(req.url).pathname,
          severity: 'medium'
        })

        return {
          success: false,
          error: 'User-Agent not allowed',
          code: 'blocked_user_agent',
          statusCode: 403
        }
      }
    }

    return { success: true }
  }

  /**
   * Check if bot is authorized (search engines, monitoring, etc.)
   */
  private isAuthorizedBot(userAgent: string): boolean {
    const authorizedBots = [
      'googlebot', 'bingbot', 'slurp', 'duckduckbot',
      'uptimerobot', 'pingdom', 'newrelic'
    ]

    return authorizedBots.some(bot => userAgent.includes(bot))
  }

  /**
   * Validate security headers
   */
  private validateHeaders(req: NextRequest): SecurityValidationResult {
    // Check for suspicious headers
    const suspiciousHeaders = ['x-forwarded-host', 'x-real-ip']
    
    for (const header of suspiciousHeaders) {
      const value = req.headers.get(header)
      if (value && this.containsSuspiciousPattern(value)) {
        trackError({
          errorType: 'api',
          errorCode: 'suspicious_header',
          endpoint: new URL(req.url).pathname,
          severity: 'high'
        })

        return {
          success: false,
          error: 'Suspicious header detected',
          code: 'suspicious_header',
          statusCode: 400
        }
      }
    }

    return { success: true }
  }

  /**
   * Validate URL patterns
   */
  private validateURL(req: NextRequest): SecurityValidationResult {
    const url = new URL(req.url)
    const fullPath = url.pathname + url.search

    // Check for suspicious patterns in URL
    if (this.containsSuspiciousPattern(fullPath)) {
      trackError({
        errorType: 'api',
        errorCode: 'suspicious_url',
        endpoint: url.pathname,
        severity: 'high'
      })

      return {
        success: false,
        error: 'Suspicious URL pattern detected',
        code: 'suspicious_url',
        statusCode: 400
      }
    }

    // Check URL length
    if (fullPath.length > 2048) {
      return {
        success: false,
        error: 'URL too long',
        code: 'url_too_long',
        statusCode: 414
      }
    }

    return { success: true }
  }

  /**
   * Validate request input against schema
   */
  private async validateInput(req: NextRequest, schema: z.ZodSchema): Promise<SecurityValidationResult> {
    try {
      const contentType = req.headers.get('content-type')
      
      if (contentType?.includes('application/json')) {
        const body = await req.json()
        schema.parse(body)
      }

      return { success: true }

    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: 'Input validation failed',
          code: 'invalid_input',
          statusCode: 400
        }
      }

      throw error
    }
  }

  /**
   * Validate authentication
   */
  private validateAuthentication(req: NextRequest): SecurityValidationResult {
    const auth = req.headers.get('authorization')
    
    if (!auth) {
      return {
        success: false,
        error: 'Authentication required',
        code: 'missing_auth',
        statusCode: 401
      }
    }

    if (!auth.startsWith('Bearer ')) {
      return {
        success: false,
        error: 'Invalid authentication format',
        code: 'invalid_auth_format',
        statusCode: 401
      }
    }

    // Additional JWT validation would go here
    return { success: true }
  }

  /**
   * Check if string contains suspicious patterns
   */
  private containsSuspiciousPattern(value: string): boolean {
    return this.suspiciousPatterns.some(pattern => pattern.test(value))
  }

  /**
   * Create security validation middleware
   */
  createMiddleware(options: SecurityValidationOptions = {}) {
    return async (req: NextRequest): Promise<NextResponse | null> => {
      const result = await this.validateRequest(req, options)
      
      if (!result.success) {
        return NextResponse.json(
          { 
            error: result.error,
            code: result.code
          },
          { status: result.statusCode || 400 }
        )
      }

      return null // Continue processing
    }
  }
}

// Singleton instance
export const apiSecurity = new APISecurityValidator()

// Helper functions for common validation scenarios
export const validatePublicAPI = apiSecurity.createMiddleware({
  allowedMethods: ['GET', 'POST'],
  maxRequestSize: 1024 * 1024, // 1MB
  requireHTTPS: true
})

export const validateAuthenticatedAPI = apiSecurity.createMiddleware({
  requireAuth: true,
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  maxRequestSize: 5 * 1024 * 1024, // 5MB
  requireHTTPS: true
})

export const validateAdminAPI = apiSecurity.createMiddleware({
  requireAuth: true,
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  maxRequestSize: 10 * 1024 * 1024, // 10MB
  requireHTTPS: true,
  allowedOrigins: isProduction ? [env.NEXT_PUBLIC_APP_URL] : undefined
})

export default apiSecurity