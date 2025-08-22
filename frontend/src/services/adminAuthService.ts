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
    // Use the current domain for admin API routes since we have them locally
    this.baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
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
   * Check if admin API is available
   */
  private async isAPIAvailable(): Promise<boolean> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3000) // 3 second timeout
      
      // Test the admin login route which we know exists
      const response = await fetch(`${this.baseUrl}/api/admin/auth/login`, {
        method: 'HEAD', // Just check if endpoint exists
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      // Accept both 200 and 405 (Method Not Allowed) as API is available
      return response.status === 200 || response.status === 405
    } catch (error) {
      console.warn('Admin API availability check failed:', error)
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

      // Check if admin API is available
      const apiAvailable = await this.isAPIAvailable()
      
      if (!apiAvailable) {
        return {
          success: false,
          error: 'Admin authentication service is not available. Please check your connection and try again.'
        }
      }

      // Make API request to our local admin auth endpoint
      const response = await fetch(`${this.baseUrl}/api/admin/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
          mfaCode: credentials.mfaCode
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        return {
          success: false,
          error: errorData.error || 'Authentication failed',
          requiresMFA: errorData.requiresMFA || false
        }
      }

      const result = await response.json()

      if (result.success && result.token && result.user) {
        // The secure cookie is already set by the API route
        // Just store the session data locally
        this.currentSession = {
          user: result.user,
          token: result.token,
          expiresAt: result.expiresAt,
          lastActivity: new Date().toISOString(),
          ipAddress: '', // Will be handled by server
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown'
        }

        // Store in localStorage for persistence
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('admin-session', JSON.stringify(this.currentSession))
            console.log('✅ Login successful, session stored')
          } catch (error) {
            console.warn('⚠️ Could not store session in localStorage:', error)
            // Continue anyway, cookie-based auth will work
          }
        }

        return {
          success: true,
          user: result.user,
          token: result.token,
          requiresMFA: result.requiresMFA
        }
      }

      return {
        success: false,
        error: result.error || 'Login failed',
        requiresMFA: result.requiresMFA || false
      }

    } catch (error) {
      console.error('❌ Admin login failed:', error)
      return {
        success: false,
        error: 'Network error occurred during login. Please check your connection and try again.'
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
        // Attempt to notify server of logout
        await fetch(`${this.baseUrl}/api/admin/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }).catch(error => {
          // Don't fail logout if server call fails
          console.warn('Logout API call failed:', error)
        })
      }
    } catch (error) {
      console.error('Logout process error:', error)
    } finally {
      // Always clear local data regardless of server response
      this.clearSession()
      
      // Redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/admin/login'
      }
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
      if (!token) {
        console.log('No token available for refresh')
        return false
      }

      // Check if admin API is available before attempting refresh
      const apiAvailable = await this.isAPIAvailable()
      if (!apiAvailable) {
        console.warn('Admin API unavailable for token refresh')
        return false
      }

      const response = await fetch(`${this.baseUrl}/api/admin/auth/refresh`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        console.error('Token refresh failed with status:', response.status)
        return false
      }

      const result = await response.json()

      if (result.success && result.token) {
        // Update session with new token
        if (this.currentSession) {
          this.currentSession.token = result.token
          this.currentSession.expiresAt = result.expiresAt
          this.currentSession.lastActivity = new Date().toISOString()
          
          // Update localStorage
          if (typeof window !== 'undefined') {
            localStorage.setItem('admin-session', JSON.stringify(this.currentSession))
          }
        }

        console.log('✅ Token refreshed successfully')
        return true
      }

      console.warn('Token refresh response missing required data')
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

// Auto-refresh token every 30 minutes and update activity
if (typeof window !== 'undefined') {
  // Set up periodic token refresh and activity updates
  setInterval(() => {
    if (adminAuthService.isAuthenticated()) {
      // Update activity tracking
      adminAuthService.updateActivity()
      
      // Check if token needs refresh (refresh 5 minutes before expiry)
      const token = adminAuthService.getToken()
      if (token) {
        const currentSession = adminAuthService.getCurrentUser()
        if (currentSession) {
          try {
            // Parse the session to check expiry
            const session = JSON.parse(localStorage.getItem('admin-session') || '{}')
            const expiresAt = new Date(session.expiresAt)
            const now = new Date()
            const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000)
            
            // Refresh token if it expires within 5 minutes
            if (expiresAt < fiveMinutesFromNow) {
              console.log('🔄 Token expiring soon, attempting refresh...')
              adminAuthService.refreshToken().catch(error => {
                console.warn('Auto token refresh failed:', error)
              })
            }
          } catch (error) {
            console.warn('Error checking token expiry:', error)
          }
        }
      }
    }
  }, 5 * 60 * 1000) // Check every 5 minutes instead of 30 for better responsiveness
}

export default adminAuthService