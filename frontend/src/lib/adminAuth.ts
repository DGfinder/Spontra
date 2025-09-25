import { NextRequest } from 'next/server'
import { jwtVerify, SignJWT } from 'jose'
import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies'

export const ADMIN_ROLES = ['owner', 'admin', 'curator', 'analyst', 'support'] as const
export type AdminRole = (typeof ADMIN_ROLES)[number]

export interface AdminRequestContext {
  role: AdminRole
  userId?: string
  email?: string
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
const SESSION_MAX_AGE = 7 * 24 * 60 * 60 // 7 days

function getJwtSecret(): Uint8Array {
  const secret = process.env.ADMIN_PANEL_JWT_SECRET
  if (!secret) {
    throw new Error('ADMIN_PANEL_JWT_SECRET environment variable is required for admin authentication')
  }
  return new TextEncoder().encode(secret)
}

export async function createAdminSessionToken(payload: Omit<AdminSessionPayload, 'issuedAt'>): Promise<string> {
  const token = await new SignJWT({ role: payload.role, email: payload.email, userId: payload.userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + SESSION_MAX_AGE)
    .sign(getJwtSecret())

  return token
}

export async function verifyAdminSessionToken(token?: string | null): Promise<AdminSessionPayload | null> {
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, getJwtSecret())
    const role = payload.role as AdminRole | undefined
    if (!role || !ADMIN_ROLES.includes(role)) return null
    return {
      role,
      email: typeof payload.email === 'string' ? payload.email : undefined,
      userId: typeof payload.userId === 'string' ? payload.userId : undefined,
      issuedAt: typeof payload.iat === 'number' ? payload.iat : Date.now(),
    }
  } catch {
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
    if (ADMIN_ROLES.includes(normalised as AdminRole)) {
      return normalised as AdminRole
    }
  }
  return null
}

export async function requireAdminContext(request: NextRequest, allowedRoles: AdminRole[]): Promise<AdminRequestContext> {
  const headerRole = parseRoleFromHeaders(request)
  if (headerRole) {
    if (!allowedRoles.includes(headerRole)) {
      throw new AdminAuthError('Forbidden for this admin role', 403)
    }
    return { role: headerRole }
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value
  const session = await verifyAdminSessionToken(token)
  if (!session) {
    throw new AdminAuthError('Missing admin credentials', 401)
  }

  if (!allowedRoles.includes(session.role)) {
    throw new AdminAuthError('Forbidden for this admin role', 403)
  }

  return { role: session.role, email: session.email, userId: session.userId }
}

export const ADMIN_SESSION_COOKIE = SESSION_COOKIE_NAME
export const ADMIN_SESSION_MAX_AGE = SESSION_MAX_AGE
