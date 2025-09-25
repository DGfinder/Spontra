import { AdminUser, AdminSession, AdminRole } from '@/types/admin'

interface LoginCredentials {
  email: string
  password: string
}

interface LoginResponse {
  success: boolean
  user?: AdminUser
  token?: string
  requiresMFA?: boolean
  error?: string
}

class AdminAuthService {
  private readonly storageKey = 'admin-session'
  private currentSession: AdminSession | null = null

  private persistSession(session: AdminSession): void {
    this.currentSession = session
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(session))
        localStorage.setItem('admin-user', JSON.stringify(session.user))
        localStorage.setItem('admin-token', session.token)
      } catch (error) {
        console.warn('Failed to persist admin session:', error)
      }
    }
  }

  private loadSessionFromStorage(): AdminSession | null {
    if (typeof window === 'undefined') return null
    const raw = localStorage.getItem(this.storageKey)
    if (!raw) return null
    try {
      return JSON.parse(raw) as AdminSession
    } catch (error) {
      console.warn('Failed to parse stored admin session, clearing it.', error)
      localStorage.removeItem(this.storageKey)
      return null
    }
  }

  private clearStorage(): void {
    if (typeof window === 'undefined') return
    try {
      localStorage.removeItem(this.storageKey)
      localStorage.removeItem('admin-user')
      localStorage.removeItem('admin-token')
      sessionStorage.clear()
      const adminCookies = ['admin-token', 'admin-session', 'admin-user']
      adminCookies.forEach((cookieName) => {
        document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT`
        document.cookie = `${cookieName}=; path=/admin; expires=Thu, 01 Jan 1970 00:00:01 GMT`
      })
    } catch (error) {
      console.warn('Failed to clear stored admin session:', error)
    }
  }

  private buildSession(user: AdminUser, token: string, expiresAt?: string): AdminSession {
    const expiry = expiresAt ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    return {
      user,
      token,
      expiresAt: expiry,
      lastActivity: new Date().toISOString(),
      ipAddress: '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    }
  }

  private ensureSession(): AdminSession | null {
    if (this.currentSession) return this.currentSession
    const stored = this.loadSessionFromStorage()
    if (stored) {
      this.currentSession = stored
    }
    return this.currentSession
  }

  clearSession(): void {
    this.currentSession = null
    this.clearStorage()
  }

  clearStaleSession(): void {
    this.clearSession()
  }

  forceCompleteCleanup(): boolean {
    this.clearSession()
    return true
  }

  getCurrentUser(): AdminUser | null {
    return this.ensureSession()?.user ?? null
  }

  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null
  }

  getToken(): string | null {
    return this.ensureSession()?.token ?? null
  }

  updateActivity(): void {
    const session = this.ensureSession()
    if (!session) return
    session.lastActivity = new Date().toISOString()
    this.persistSession(session)
  }

  hasPermission(_permission: string): boolean {
    return true
  }

  hasAnyPermission(_permissions: string[]): boolean {
    return true
  }

  hasRole(role: AdminRole): boolean {
    const user = this.getCurrentUser()
    return user?.role === role
  }

  isElevated(): boolean {
    return true
  }

  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      })

      const payload = await response.json().catch(() => ({}))
      if (!response.ok || !payload?.ok) {
        return { success: false, error: payload?.error || 'Invalid credentials' }
      }

      const user = payload.user as AdminUser | undefined
      if (!user) {
        return { success: false, error: 'Login response missing user payload' }
      }

      const token = typeof payload.token === 'string' ? payload.token : ''
      const session = this.buildSession(user, token, payload.expiresAt)
      this.persistSession(session)

      return { success: true, user, token, requiresMFA: Boolean(payload.requiresMFA) }
    } catch (error) {
      console.error('Admin login failed:', error)
      return { success: false, error: 'Network error occurred during login. Please try again.' }
    }
  }

  async refreshToken(): Promise<boolean> {
    try {
      const response = await fetch('/api/admin/auth/refresh', { method: 'POST' })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok || !payload?.token) {
        return false
      }

      const user = (payload.user as AdminUser | undefined) ?? this.getCurrentUser()
      if (!user) {
        return false
      }

      const session = this.buildSession(user, payload.token, payload.expiresAt)
      this.persistSession(session)
      return true
    } catch (error) {
      console.warn('Admin token refresh failed:', error)
      return false
    }
  }

  async logout(): Promise<void> {
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' })
    } catch (error) {
      console.warn('Admin logout request failed:', error)
    } finally {
      this.clearSession()
      if (typeof window !== 'undefined') {
        window.location.href = '/admin/login'
      }
    }
  }
}

export const adminAuthService = new AdminAuthService()

export default adminAuthService