import { AdminUser, AdminSession, AdminRole, AdminPermission } from '@/types/admin'

interface LoginCredentials {
  email: string
  password: string
  mfaCode?: string
}

interface LoginResponse {
  success: boolean
  user?: AdminUser
  token?: string
  requiresMFA?: boolean
  error?: string
}

interface RegisterData {
  email: string
  password: string
  fullName: string
  username: string
  role: AdminRole
}

class AdminAuthService {
  private baseUrl: string
  private currentSession: AdminSession | null = null

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_ADMIN_API_URL || 'http://localhost:8082'
  }

  /**
   * Clear any existing session data
   */
  private clearSession(): void {
    this.currentSession = null
    if (typeof window !== 'undefined') {
      try {
        // Clear localStorage
        localStorage.removeItem('admin-session')
        localStorage.removeItem('admin-user')
        localStorage.removeItem('admin-token')
        
        // Clear sessionStorage
        sessionStorage.clear()
        
        // Clear all admin cookies
        const adminCookies = ['admin-token', 'admin-session', 'admin-user']
        adminCookies.forEach(cookieName => {
          document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT`
          document.cookie = `${cookieName}=; path=/admin; expires=Thu, 01 Jan 1970 00:00:01 GMT`
        })
        
        console.log('🧹 Admin session cleared completely')
      } catch (error) {
        console.warn('Session cleanup had issues:', error)
      }
    }
  }

  /**
   * Public method to clear stale sessions (for login page)
   */
  clearStaleSession(): void {
    console.log('🔄 Clearing stale admin session...')
    this.clearSession()
  }

  /**
   * Force complete browser cleanup (for troubled sessions)
   */
  forceCompleteCleanup(): boolean {
    if (typeof window !== 'undefined') {
      try {
        // Clear all localStorage
        const localStorageKeys = Object.keys(localStorage)
        localStorageKeys.forEach(key => {
          if (key.includes('admin') || key.includes('session') || key.includes('auth')) {
            localStorage.removeItem(key)
          }
        })
        
        // Clear all cookies
        const cookies = document.cookie.split(';')
        cookies.forEach(cookie => {
          const eqPos = cookie.indexOf('=')
          const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()
          if (name.includes('admin') || name.includes('auth') || name.includes('session')) {
            document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT`
            document.cookie = `${name}=; path=/admin; expires=Thu, 01 Jan 1970 00:00:01 GMT`
          }
        })
        
        console.log('🚨 Force cleanup completed')
        return true
      } catch (error) {
        console.error('Force cleanup failed:', error)
        return false
      }
    }
    return false
  }

  /**
   * Check if backend is available
   */
  private async isBackendAvailable(): Promise<boolean> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3000) // 3 second timeout
      
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      return response.ok
    } catch (error) {
      return false
    }
  }

  /**
   * Authenticate admin user
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      console.log('🔐 Starting admin login process...', { email: credentials.email })
      
      // Clear any existing stale session first
      this.clearSession()

      // DEMO MODE: Check for demo credentials first
      if (credentials.email === 'demo@spontra.com' && credentials.password === 'demo123') {
        console.log('✨ Demo credentials detected - activating demo mode')
        
        // Force complete cleanup before demo login
        this.forceCompleteCleanup()
        
        await new Promise(resolve => setTimeout(resolve, 100)) // Brief delay for cleanup
        const demoUser: AdminUser = {
          id: 'demo-admin',
          email: 'demo@spontra.com',
          username: 'demo_admin',
          fullName: 'Demo Administrator',
          role: 'super_admin',
          permissions: [
            'content.view', 'content.moderate', 'content.delete', 'content.featured',
            'creators.view', 'creators.manage', 'creators.payouts', 'creators.suspend',
            'analytics.view', 'analytics.export', 'analytics.configure',
            'destinations.view', 'destinations.edit', 'destinations.create',
            'system.monitor', 'system.configure', 'system.users', 'system.logs',
            'finance.view', 'finance.manage', 'finance.payouts',
            'support.view', 'support.manage', 'support.escalate'
          ],
          profilePicture: undefined,
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
          isActive: true,
          mfaEnabled: false
        }

        const demoToken = 'demo-jwt-token-' + Date.now()
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours

        // Store demo session
        this.currentSession = {
          user: demoUser,
          token: demoToken,
          expiresAt,
          lastActivity: new Date().toISOString(),
          ipAddress: '127.0.0.1',
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Demo Client'
        }

        // Store in localStorage for persistence
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('admin-session', JSON.stringify(this.currentSession))
            document.cookie = `admin-token=${demoToken}; path=/admin; max-age=86400; samesite=strict`
            console.log('✅ Demo session stored successfully')
          } catch (error) {
            console.error('❌ Failed to store demo session:', error)
          }
        }

        console.log('🎉 Demo login successful!')
        return {
          success: true,
          user: demoUser,
          token: demoToken
        }
      }

      // Production mode: Check backend availability first
      const backendAvailable = await this.isBackendAvailable()
      
      if (!backendAvailable) {
        return {
          success: false,
          error: 'Admin backend is not available. Please use demo credentials (demo@spontra.com / demo123) or contact your administrator.'
        }
      }

      // Try API authentication
      const response = await fetch(`${this.baseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      })

      const result = await response.json()

      if (result.success && result.token) {
        // Store token in cookie
        if (typeof window !== 'undefined') {
          document.cookie = `admin-token=${result.token}; path=/admin; max-age=86400; samesite=strict`
        }
        
        // Store session data
        this.currentSession = {
          user: result.user,
          token: result.token,
          expiresAt: result.expiresAt,
          lastActivity: new Date().toISOString(),
          ipAddress: '', // Will be set by server
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown'
        }

        // Store in localStorage for persistence
        if (typeof window !== 'undefined') {
          localStorage.setItem('admin-session', JSON.stringify(this.currentSession))
        }
      }

      return result
    } catch (error) {
      console.error('❌ Admin login failed:', error)
      
      // If it's demo credentials and something failed, try fallback demo mode
      if (credentials.email === 'demo@spontra.com' && credentials.password === 'demo123') {
        console.log('🔄 Demo login failed, attempting fallback...')
        return this.fallbackDemoLogin()
      }
      
      return {
        success: false,
        error: 'Login failed. Please try again.'
      }
    }
  }

  /**
   * Fallback demo login method
   */
  private fallbackDemoLogin(): LoginResponse {
    try {
      console.log('🚑 Activating fallback demo mode...')
      
      // Force cleanup and set minimal demo session
      this.forceCompleteCleanup()
      
      const demoUser: AdminUser = {
        id: 'demo-admin-fallback',
        email: 'demo@spontra.com',
        username: 'demo_admin',
        fullName: 'Demo Administrator',
        role: 'super_admin',
        permissions: [
          'content.view', 'content.moderate', 'content.delete', 'content.featured',
          'creators.view', 'creators.manage', 'creators.payouts', 'creators.suspend',
          'analytics.view', 'analytics.export', 'analytics.configure',
          'destinations.view', 'destinations.edit', 'destinations.create',
          'system.monitor', 'system.configure', 'system.users', 'system.logs',
          'finance.view', 'finance.manage', 'finance.payouts',
          'support.view', 'support.manage', 'support.escalate'
        ],
        profilePicture: undefined,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        isActive: true,
        mfaEnabled: false
      }

      const demoToken = 'demo-fallback-token-' + Date.now()
      
      // Set session without storage dependencies
      this.currentSession = {
        user: demoUser,
        token: demoToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        lastActivity: new Date().toISOString(),
        ipAddress: '127.0.0.1',
        userAgent: 'Demo Fallback'
      }

      console.log('✅ Fallback demo login successful!')
      return {
        success: true,
        user: demoUser,
        token: demoToken
      }
    } catch (error) {
      console.error('❌ Fallback demo login also failed:', error)
      return {
        success: false,
        error: 'Demo mode is experiencing issues. Please refresh the page and try again.'
      }
    }
  }

  /**
   * Register new admin user (super admin only)
   */
  async register(userData: RegisterData): Promise<LoginResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getToken()}`
        },
        body: JSON.stringify(userData),
      })

      return await response.json()
    } catch (error) {
      console.error('Admin registration failed:', error)
      return {
        success: false,
        error: 'Registration failed. Please try again.'
      }
    }
  }

  /**
   * Logout current session
   */
  async logout(): Promise<void> {
    try {
      const token = this.getToken()
      if (token) {
        await fetch(`${this.baseUrl}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      }
    } catch (error) {
      console.error('Logout API call failed:', error)
    } finally {
      // Clear local data
      this.currentSession = null
      localStorage.removeItem('admin-session')
      
      // Clear cookie
      document.cookie = 'admin-token=; path=/admin; expires=Thu, 01 Jan 1970 00:00:01 GMT'
      
      // Redirect to login
      window.location.href = '/admin/login'
    }
  }

  /**
   * Get current admin user
   */
  getCurrentUser(): AdminUser | null {
    if (this.currentSession) {
      return this.currentSession.user
    }

    // Only access localStorage in browser environment
    if (typeof window === 'undefined') {
      return null
    }

    // Try to restore from localStorage
    const savedSession = localStorage.getItem('admin-session')
    if (savedSession) {
      try {
        this.currentSession = JSON.parse(savedSession)
        return this.currentSession?.user || null
      } catch {
        localStorage.removeItem('admin-session')
      }
    }

    return null
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const user = this.getCurrentUser()
    return !!user && this.isTokenValid()
  }

  /**
   * Check if token is still valid
   */
  private isTokenValid(): boolean {
    if (!this.currentSession) return false
    
    const expiresAt = new Date(this.currentSession.expiresAt)
    return expiresAt > new Date()
  }

  /**
   * Get current JWT token
   */
  getToken(): string | null {
    if (this.currentSession && this.isTokenValid()) {
      return this.currentSession.token
    }

    // Only access document.cookie in browser environment
    if (typeof window === 'undefined') {
      return null
    }

    // Try to get from cookie
    const cookies = document.cookie.split(';')
    const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('admin-token='))
    
    if (tokenCookie) {
      return tokenCookie.split('=')[1]
    }

    return null
  }

  /**
   * Check if user has specific permission
   */
  hasPermission(permission: AdminPermission): boolean {
    const user = this.getCurrentUser()
    return user?.permissions.includes(permission) || false
  }

  /**
   * Check if user has any of the specified permissions
   */
  hasAnyPermission(permissions: AdminPermission[]): boolean {
    return permissions.some(permission => this.hasPermission(permission))
  }

  /**
   * Check if user has specific role
   */
  hasRole(role: AdminRole): boolean {
    const user = this.getCurrentUser()
    return user?.role === role
  }

  /**
   * Check if user has elevated privileges (super admin or business manager)
   */
  isElevated(): boolean {
    return this.hasRole('super_admin') || this.hasRole('business_manager')
  }

  /**
   * Refresh session token
   */
  async refreshToken(): Promise<boolean> {
    try {
      const token = this.getToken()
      if (!token) return false

      // Skip refresh for demo tokens
      if (token.startsWith('demo-jwt-token-')) {
        return true // Demo tokens don't need refresh
      }

      // Check if backend is available before attempting refresh
      const backendAvailable = await this.isBackendAvailable()
      if (!backendAvailable) {
        console.warn('Backend unavailable for token refresh')
        return false
      }

      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const result = await response.json()

      if (result.success && result.token) {
        // Update token in cookie
        document.cookie = `admin-token=${result.token}; path=/admin; max-age=86400; samesite=strict`
        
        // Update session
        if (this.currentSession) {
          this.currentSession.token = result.token
          this.currentSession.expiresAt = result.expiresAt
          localStorage.setItem('admin-session', JSON.stringify(this.currentSession))
        }

        return true
      }

      return false
    } catch (error) {
      console.error('Token refresh failed:', error)
      return false
    }
  }

  /**
   * Setup MFA for current user
   */
  async setupMFA(): Promise<{ success: boolean; qrCode?: string; secret?: string; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/mfa/setup`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.getToken()}`
        }
      })

      return await response.json()
    } catch (error) {
      console.error('MFA setup failed:', error)
      return {
        success: false,
        error: 'Failed to setup MFA'
      }
    }
  }

  /**
   * Verify MFA code
   */
  async verifyMFA(code: string): Promise<{ success: boolean; backupCodes?: string[]; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/mfa/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getToken()}`
        },
        body: JSON.stringify({ code })
      })

      return await response.json()
    } catch (error) {
      console.error('MFA verification failed:', error)
      return {
        success: false,
        error: 'Failed to verify MFA code'
      }
    }
  }

  /**
   * Get user activity log
   */
  async getUserActivity(userId?: string, limit = 50): Promise<any[]> {
    try {
      const queryParams = new URLSearchParams({
        limit: limit.toString(),
        ...(userId && { userId })
      })

      const response = await fetch(`${this.baseUrl}/auth/activity?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${this.getToken()}`
        }
      })

      const result = await response.json()
      return result.data || []
    } catch (error) {
      console.error('Failed to fetch user activity:', error)
      return []
    }
  }

  /**
   * Update last activity timestamp
   */
  updateActivity(): void {
    if (this.currentSession) {
      this.currentSession.lastActivity = new Date().toISOString()
      localStorage.setItem('admin-session', JSON.stringify(this.currentSession))
    }
  }
}

// Singleton instance
export const adminAuthService = new AdminAuthService()

// Auto-refresh token every 30 minutes (but skip for demo mode)
if (typeof window !== 'undefined') {
  setInterval(() => {
    if (adminAuthService.isAuthenticated()) {
      const token = adminAuthService.getToken()
      // Skip auto-refresh for demo tokens
      if (token && !token.startsWith('demo-jwt-token-')) {
        adminAuthService.refreshToken()
      }
      adminAuthService.updateActivity()
    }
  }, 30 * 60 * 1000)
}

export default adminAuthService