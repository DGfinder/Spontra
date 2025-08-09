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
   * Authenticate admin user
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
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
        document.cookie = `admin-token=${result.token}; path=/admin; max-age=86400; samesite=strict`
        
        // Store session data
        this.currentSession = {
          user: result.user,
          token: result.token,
          expiresAt: result.expiresAt,
          lastActivity: new Date().toISOString(),
          ipAddress: '', // Will be set by server
          userAgent: navigator.userAgent
        }

        // Store in localStorage for persistence
        localStorage.setItem('admin-session', JSON.stringify(this.currentSession))
      }

      return result
    } catch (error) {
      console.error('Admin login failed:', error)
      return {
        success: false,
        error: 'Login failed. Please try again.'
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

// Auto-refresh token every 30 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    if (adminAuthService.isAuthenticated()) {
      adminAuthService.refreshToken()
      adminAuthService.updateActivity()
    }
  }, 30 * 60 * 1000)
}

export default adminAuthService