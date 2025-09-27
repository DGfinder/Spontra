import { describe, it, expect, beforeEach, vi } from 'vitest'
import { userAuthService } from '@/services/userAuthService'

// Mock fetch globally
global.fetch = vi.fn()

describe('Profile Management', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('updateProfile', () => {
    it('should successfully update user profile', async () => {
      const mockResponse = {
        ok: true,
        message: 'Profile updated successfully',
        user: {
          id: '123',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          username: 'johndoe'
        }
      }

      ;(fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const profileData = {
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe'
      }

      const result = await userAuthService.updateProfile(profileData)

      expect(fetch).toHaveBeenCalledWith('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData)
      })
      expect(result).toEqual(mockResponse)
    })

    it('should handle profile update failure', async () => {
      const mockResponse = {
        ok: false,
        error: 'Profile update failed'
      }

      ;(fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => mockResponse
      })

      const result = await userAuthService.updateProfile({})

      expect(result.ok).toBe(false)
      expect(result.error).toBe('Profile update failed')
    })

    it('should handle network errors', async () => {
      ;(fetch as any).mockRejectedValueOnce(new Error('Network error'))

      const result = await userAuthService.updateProfile({})

      expect(result.ok).toBe(false)
      expect(result.error).toBe('Failed to update profile. Please try again.')
    })
  })

  describe('changePassword', () => {
    it('should successfully change password', async () => {
      const mockResponse = {
        ok: true,
        message: 'Password changed successfully'
      }

      ;(fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const result = await userAuthService.changePassword('oldPassword', 'newPassword')

      expect(fetch).toHaveBeenCalledWith('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: 'oldPassword',
          newPassword: 'newPassword'
        })
      })
      expect(result).toEqual(mockResponse)
    })

    it('should handle password change validation errors', async () => {
      const mockResponse = {
        ok: false,
        error: 'weak_password',
        message: 'Password must be at least 8 characters long',
        details: [{ field: 'newPassword', message: 'Password must be at least 8 characters long' }]
      }

      ;(fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => mockResponse
      })

      const result = await userAuthService.changePassword('oldPassword', 'weak')

      expect(result.ok).toBe(false)
      expect(result.details).toBeDefined()
      expect(result.details?.[0].field).toBe('newPassword')
    })
  })

  describe('requestPasswordReset', () => {
    it('should successfully request password reset', async () => {
      const mockResponse = {
        ok: true,
        message: 'If an account with that email exists, you will receive a password reset link shortly.'
      }

      ;(fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const result = await userAuthService.requestPasswordReset('test@example.com')

      expect(fetch).toHaveBeenCalledWith('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: 'test@example.com' })
      })
      expect(result).toEqual(mockResponse)
    })

    it('should handle invalid email format', async () => {
      const mockResponse = {
        ok: false,
        error: 'invalid_email',
        message: 'Please enter a valid email address',
        details: [{ field: 'email', message: 'Please enter a valid email address' }]
      }

      ;(fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => mockResponse
      })

      const result = await userAuthService.requestPasswordReset('invalid-email')

      expect(result.ok).toBe(false)
      expect(result.details?.[0].field).toBe('email')
    })
  })

  describe('resetPassword', () => {
    it('should successfully reset password', async () => {
      const mockResponse = {
        ok: true,
        message: 'Password reset successfully. You can now log in with your new password.'
      }

      ;(fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const result = await userAuthService.resetPassword('valid-token', 'newPassword123')

      expect(fetch).toHaveBeenCalledWith('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: 'valid-token',
          newPassword: 'newPassword123'
        })
      })
      expect(result).toEqual(mockResponse)
    })

    it('should handle invalid token', async () => {
      const mockResponse = {
        ok: false,
        error: 'invalid_token',
        message: 'Invalid or expired reset token. Please request a new password reset.'
      }

      ;(fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => mockResponse
      })

      const result = await userAuthService.resetPassword('invalid', 'newPassword123')

      expect(result.ok).toBe(false)
      expect(result.error).toBe('invalid_token')
    })
  })
})