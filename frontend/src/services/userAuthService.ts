import type { User } from '@/lib/userAuth'

export interface LoginCredentials {
  email: string
  password: string
  rememberMe?: boolean
}

export interface SignupData {
  email: string
  password: string
  firstName?: string
  lastName?: string
  username?: string
  newsletter?: boolean
}

export interface AuthResponse {
  ok: boolean
  success?: boolean
  message?: string
  error?: string
  user?: Partial<User>
  token?: string
  expiresAt?: string
  details?: Array<{ field: string; message: string }>
}

class UserAuthService {
  private baseUrl = '/api/auth'

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      })

      const data = await response.json()
      return data
    } catch (error) {
      return {
        ok: false,
        error: 'Network error. Please check your connection and try again.',
      }
    }
  }

  async signup(signupData: SignupData): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(signupData),
      })

      const data = await response.json()
      return data
    } catch (error) {
      return {
        ok: false,
        error: 'Network error. Please check your connection and try again.',
      }
    }
  }

  async logout(): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()
      return data
    } catch (error) {
      return {
        ok: false,
        error: 'Logout failed. Please try again.',
      }
    }
  }

  async getCurrentUser(): Promise<{ ok: boolean; user?: Partial<User>; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()
      return data
    } catch (error) {
      return {
        ok: false,
        error: 'Failed to get user information.',
      }
    }
  }

  async updateProfile(profileData: Partial<User>): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      })

      const data = await response.json()
      return data
    } catch (error) {
      return {
        ok: false,
        error: 'Failed to update profile. Please try again.',
      }
    }
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      })

      const data = await response.json()
      return data
    } catch (error) {
      return {
        ok: false,
        error: 'Failed to change password. Please try again.',
      }
    }
  }

  async requestPasswordReset(email: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()
      return data
    } catch (error) {
      return {
        ok: false,
        error: 'Failed to send password reset email. Please try again.',
      }
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          newPassword,
        }),
      })

      const data = await response.json()
      return data
    } catch (error) {
      return {
        ok: false,
        error: 'Failed to reset password. Please try again.',
      }
    }
  }

  // Helper method to check if user is logged in
  async isLoggedIn(): Promise<boolean> {
    const result = await this.getCurrentUser()
    return result.ok && !!result.user
  }

  // Helper method to validate email format
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Helper method to validate password strength
  isValidPassword(password: string): { valid: boolean; message?: string } {
    if (password.length < 6) {
      return { valid: false, message: 'Password must be at least 6 characters long' }
    }
    if (!/[a-zA-Z]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one letter' }
    }
    if (!/[0-9]/.test(password)) {
      return { valid: false, message: 'Password should contain at least one number for better security' }
    }
    return { valid: true }
  }
}

export const userAuthService = new UserAuthService()