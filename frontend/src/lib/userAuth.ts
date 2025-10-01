import { NextRequest } from 'next/server'
import { jwtVerify, SignJWT } from 'jose'
import { cookies } from 'next/headers'
import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies'

export interface User {
  id: string
  email: string
  username?: string
  firstName?: string
  lastName?: string
  profilePicture?: string
  createdAt: string
  lastLoginAt: string
  isActive: boolean
  emailVerified: boolean
  preferences?: {
    preferredAirport?: string
    preferredCabinClass?: 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST'
    currency?: string
    language?: string
    newsletter?: boolean
  }
}

export interface UserRequestContext {
  userId: string
  email: string
  username?: string
}

export class UserAuthError extends Error {
  status: number

  constructor(message: string, status = 401) {
    super(message)
    this.name = 'UserAuthError'
    this.status = status
  }
}

export interface UserSessionPayload {
  userId: string
  email: string
  username?: string
  issuedAt: number
}

const SESSION_COOKIE_NAME = 'user_session'
const SESSION_MAX_AGE = 30 * 24 * 60 * 60 // 30 days
const DEVELOPMENT_FALLBACK_SECRET = 'dev-user-auth-secret-change-me-not-for-production'

function getJwtSecret(): Uint8Array {
  const secret = process.env.USER_AUTH_JWT_SECRET || process.env.JWT_SECRET

  // Strict production check - never allow fallback secrets in production
  if (process.env.NODE_ENV === 'production') {
    if (!secret) {
      throw new Error('CRITICAL SECURITY ERROR: USER_AUTH_JWT_SECRET or JWT_SECRET environment variable is required in production')
    }
    if (secret === DEVELOPMENT_FALLBACK_SECRET || secret.includes('dev-') || secret.includes('change-me')) {
      throw new Error('CRITICAL SECURITY ERROR: Development JWT secret detected in production. Set a secure USER_AUTH_JWT_SECRET.')
    }
    if (secret.length < 32) {
      throw new Error('CRITICAL SECURITY ERROR: JWT secret must be at least 32 characters long in production.')
    }
  }

  // Development fallback only in non-production environments
  const finalSecret = secret || (process.env.NODE_ENV !== 'production' ? DEVELOPMENT_FALLBACK_SECRET : null)

  if (!finalSecret) {
    throw new Error('USER_AUTH_JWT_SECRET or JWT_SECRET environment variable is required for user authentication')
  }

  return new TextEncoder().encode(finalSecret)
}

export async function createUserSessionToken(payload: Omit<UserSessionPayload, 'issuedAt'>): Promise<string> {
  const token = await new SignJWT({ 
    userId: payload.userId, 
    email: payload.email, 
    username: payload.username 
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + SESSION_MAX_AGE)
    .sign(getJwtSecret())

  return token
}

export async function verifyUserSessionToken(token?: string | null): Promise<UserSessionPayload | null> {
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, getJwtSecret())
    return {
      userId: typeof payload.userId === 'string' ? payload.userId : '',
      email: typeof payload.email === 'string' ? payload.email : '',
      username: typeof payload.username === 'string' ? payload.username : undefined,
      issuedAt: typeof payload.iat === 'number' ? payload.iat : Date.now(),
    }
  } catch {
    return null
  }
}

export function getSessionFromCookies(cookieStore: ReadonlyRequestCookies): Promise<UserSessionPayload | null> {
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value
  return verifyUserSessionToken(token)
}

export async function getCurrentUser(): Promise<UserSessionPayload | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value
    return await verifyUserSessionToken(token)
  } catch {
    return null
  }
}

export async function requireUserContext(request: NextRequest): Promise<UserRequestContext> {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value
  const session = await verifyUserSessionToken(token)
  if (!session) {
    throw new UserAuthError('Authentication required', 401)
  }

  return { 
    userId: session.userId, 
    email: session.email, 
    username: session.username 
  }
}

export const USER_SESSION_COOKIE = SESSION_COOKIE_NAME
export const USER_SESSION_MAX_AGE = SESSION_MAX_AGE

// Helper function for password hashing (we'll implement this when we add the backend)
export async function hashPassword(password: string): Promise<string> {
  // For now, this will be handled by the backend service
  // We'll implement bcrypt here if needed
  return password
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  // For now, this will be handled by the backend service
  // We'll implement bcrypt verification here if needed
  return password === hashedPassword
}