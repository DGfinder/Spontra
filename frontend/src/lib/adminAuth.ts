import { NextRequest } from 'next/server'
import { jwtVerify, SignJWT } from 'jose'
import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies'

export const ADMIN_ROLES = ['admin', 'moderator'] as const
export type AdminRole = (typeof ADMIN_ROLES)[number]

export interface AdminRequestContext {
  role: AdminRole
  userId: string
  email: string
  sessionId?: string
}

export class AdminAuthError extends Error {
  status: number

  constructor(message: string, status = 401) {
    super(message)
    this.name = 'AdminAuthError'
    this.status = status
  }
}

export interface AdminSessionPayload {
  role: AdminRole
  email?: string
  userId?: string
  issuedAt: number
}

const SESSION_COOKIE_NAME = 'admin_session'
const SESSION_MAX_AGE = 4 * 60 * 60 // 4 hours (shorter for security)
const DEVELOPMENT_FALLBACK_SECRET = 'dev-admin-panel-secret-change-me'

function getJwtSecret(): Uint8Array {
  const secret =
    process.env.ADMIN_JWT_SECRET ||
    process.env.ADMIN_PANEL_JWT_SECRET ||
    (process.env.NODE_ENV !== 'production' ? process.env.NEXTAUTH_SECRET : undefined) ||
    (process.env.NODE_ENV !== 'production' ? DEVELOPMENT_FALLBACK_SECRET : undefined)

  if (!secret) {
    throw new Error('ADMIN_JWT_SECRET environment variable is required for admin authentication')
  }

  if (process.env.NODE_ENV === 'production' && secret === DEVELOPMENT_FALLBACK_SECRET) {
    throw new Error('Development fallback secret cannot be used in production')
  }

  return new TextEncoder().encode(secret)
}

export async function createAdminSessionToken(payload: Omit<AdminSessionPayload, 'issuedAt'>): Promise<string> {
  const token = await new SignJWT({ 
    role: payload.role, 
    email: payload.email, 
    userId: payload.userId 
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + SESSION_MAX_AGE)
    .setIssuer('spontra-admin')
    .setAudience('spontra-admin-panel')
    .sign(getJwtSecret())

  return token
}

export async function verifyAdminSessionToken(token?: string | null): Promise<AdminSessionPayload | null> {
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, getJwtSecret(), {
      issuer: 'spontra-admin',
      audience: 'spontra-admin-panel'
    })
    
    // Verify role is valid admin role
    if (!ADMIN_ROLES.includes(payload.role as AdminRole)) return null
    
    return {
      role: payload.role as AdminRole,
      email: typeof payload.email === 'string' ? payload.email : undefined,
      userId: typeof payload.userId === 'string' ? payload.userId : undefined,
      issuedAt: typeof payload.iat === 'number' ? payload.iat : Date.now(),
    }
  } catch (error) {
    console.error('Token verification failed:', error)
    return null
  }
}

export function getSessionFromCookies(cookieStore: ReadonlyRequestCookies): Promise<AdminSessionPayload | null> {
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value
  return verifyAdminSessionToken(token)
}

function parseRoleFromHeaders(request: NextRequest): AdminRole | null {
  const ROLE_HEADER_KEYS = ['x-spontra-admin-role', 'x-admin-role', 'x-role']
  for (const header of ROLE_HEADER_KEYS) {
    const value = request.headers.get(header)
    if (!value) continue
    const normalised = value.trim().toLowerCase()
    if (normalised === 'admin') {
      return 'admin'
    }
  }
  return null
}

export async function requireAdminContext(request: NextRequest): Promise<AdminRequestContext> {
  // Check if admin context was already set by middleware
  const userId = request.headers.get('x-admin-user-id')
  const email = request.headers.get('x-admin-user-email') 
  const role = request.headers.get('x-admin-user-role')
  const sessionId = request.headers.get('x-admin-session-id')
  
  if (userId && email && role && ADMIN_ROLES.includes(role as AdminRole)) {
    return { 
      role: role as AdminRole, 
      userId, 
      email,
      sessionId: sessionId || undefined
    }
  }

  // Fallback to header role parsing (for development)
  const headerRole = parseRoleFromHeaders(request)
  if (headerRole && process.env.NODE_ENV === 'development') {
    return { role: headerRole, userId: 'dev-admin', email: 'dev@spontra.com' }
  }

  // Fallback to token verification (should not be needed with middleware)
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value
  const session = await verifyAdminSessionToken(token)
  if (!session || !session.userId || !session.email) {
    throw new AdminAuthError('Missing admin credentials', 401)
  }

  return { role: session.role, email: session.email, userId: session.userId }
}

export const ADMIN_SESSION_COOKIE = SESSION_COOKIE_NAME
export const ADMIN_SESSION_MAX_AGE = SESSION_MAX_AGE
