import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

const CSRF_TOKEN_LENGTH = 32
const CSRF_COOKIE_NAME = 'csrf-token'
const CSRF_HEADER_NAME = 'x-csrf-token'

interface CSRFConfig {
  cookieOptions?: {
    httpOnly?: boolean
    secure?: boolean
    sameSite?: 'strict' | 'lax' | 'none'
    maxAge?: number
    path?: string
  }
}

const DEFAULT_CONFIG: CSRFConfig = {
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60, // 24 hours
    path: '/'
  }
}

export function generateCSRFToken(): string {
  return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('hex')
}

export function setCSRFToken(response: NextResponse, config: CSRFConfig = {}): string {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }
  const token = generateCSRFToken()
  
  response.cookies.set(CSRF_COOKIE_NAME, token, finalConfig.cookieOptions)
  
  return token
}

export function getCSRFToken(request: NextRequest): string | null {
  return request.cookies.get(CSRF_COOKIE_NAME)?.value || null
}

export function getCSRFTokenFromHeader(request: NextRequest): string | null {
  return request.headers.get(CSRF_HEADER_NAME) || null
}

export function validateCSRFToken(request: NextRequest): boolean {
  // Skip CSRF validation for GET, HEAD, OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    return true
  }

  const cookieToken = getCSRFToken(request)
  const headerToken = getCSRFTokenFromHeader(request)

  if (!cookieToken || !headerToken) {
    return false
  }

  // Use timing-safe comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(cookieToken, 'hex'),
    Buffer.from(headerToken, 'hex')
  )
}

export function createCSRFErrorResponse(): NextResponse {
  return NextResponse.json(
    {
      ok: false,
      error: 'csrf_token_invalid',
      message: 'CSRF token validation failed. Please refresh the page and try again.'
    },
    { status: 403 }
  )
}

export function withCSRFProtection(
  handler: (request: NextRequest) => Promise<NextResponse>,
  config: CSRFConfig = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Validate CSRF token for state-changing requests
    if (!validateCSRFToken(request)) {
      return createCSRFErrorResponse()
    }

    // Call the original handler
    const response = await handler(request)

    // Set new CSRF token on successful responses
    if (response.status < 400) {
      setCSRFToken(response, config)
    }

    return response
  }
}

// Helper function to generate CSRF token for client-side use
export function createCSRFTokenResponse(): NextResponse {
  const token = generateCSRFToken()
  const response = NextResponse.json({ csrfToken: token })
  
  response.cookies.set(CSRF_COOKIE_NAME, token, DEFAULT_CONFIG.cookieOptions)
  
  return response
}

// Middleware helper for protecting routes
export function protectWithCSRF(request: NextRequest): NextResponse | null {
  if (!validateCSRFToken(request)) {
    return createCSRFErrorResponse()
  }
  return null
}