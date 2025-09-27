'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { userAuthService, type LoginCredentials, type SignupData, type AuthResponse } from '@/services/userAuthService'
import type { User } from '@/lib/userAuth'

interface UserAuthContextType {
  user: Partial<User> | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (credentials: LoginCredentials) => Promise<AuthResponse>
  signup: (signupData: SignupData) => Promise<AuthResponse>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  updateProfile: (profileData: Partial<User>) => Promise<AuthResponse>
  changePassword: (currentPassword: string, newPassword: string) => Promise<AuthResponse>
}

const UserAuthContext = createContext<UserAuthContextType | undefined>(undefined)

export function useUserAuth() {
  const context = useContext(UserAuthContext)
  if (!context) {
    throw new Error('useUserAuth must be used within a UserAuthProvider')
  }
  return context
}

interface UserAuthProviderProps {
  children: ReactNode
}

export function UserAuthProvider({ children }: UserAuthProviderProps) {
  const [user, setUser] = useState<Partial<User> | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const isAuthenticated = !!user

  // Load user on mount
  useEffect(() => {
    loadUser()
  }, [])

  const loadUser = async () => {
    try {
      setIsLoading(true)
      const result = await userAuthService.getCurrentUser()
      if (result.ok && result.user) {
        setUser(result.user)
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error('Failed to load user:', error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      setIsLoading(true)
      const result = await userAuthService.login(credentials)
      
      if (result.ok && result.user) {
        setUser(result.user)
      }
      
      return result
    } catch (error) {
      console.error('Login error:', error)
      return {
        ok: false,
        error: 'Login failed. Please try again.',
      }
    } finally {
      setIsLoading(false)
    }
  }

  const signup = async (signupData: SignupData): Promise<AuthResponse> => {
    try {
      setIsLoading(true)
      const result = await userAuthService.signup(signupData)
      
      if (result.ok && result.user) {
        setUser(result.user)
      }
      
      return result
    } catch (error) {
      console.error('Signup error:', error)
      return {
        ok: false,
        error: 'Account creation failed. Please try again.',
      }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true)
      await userAuthService.logout()
      setUser(null)
      
      // Redirect to home page after logout
      if (typeof window !== 'undefined') {
        window.location.href = '/'
      }
    } catch (error) {
      console.error('Logout error:', error)
      // Even if logout fails on server, clear local state
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const refreshUser = async (): Promise<void> => {
    await loadUser()
  }

  const updateProfile = async (profileData: Partial<User>): Promise<AuthResponse> => {
    try {
      const result = await userAuthService.updateProfile(profileData)
      
      if (result.ok && result.user) {
        setUser(result.user)
      }
      
      return result
    } catch (error) {
      console.error('Update profile error:', error)
      return {
        ok: false,
        error: 'Failed to update profile. Please try again.',
      }
    }
  }

  const changePassword = async (currentPassword: string, newPassword: string): Promise<AuthResponse> => {
    try {
      const result = await userAuthService.changePassword(currentPassword, newPassword)
      return result
    } catch (error) {
      console.error('Change password error:', error)
      return {
        ok: false,
        error: 'Failed to change password. Please try again.',
      }
    }
  }

  const value = {
    user,
    isLoading,
    isAuthenticated,
    login,
    signup,
    logout,
    refreshUser,
    updateProfile,
    changePassword,
  }

  return (
    <UserAuthContext.Provider value={value}>
      {children}
    </UserAuthContext.Provider>
  )
}

// Hook for protected routes
export function useRequireAuth() {
  const { user, isLoading, isAuthenticated } = useUserAuth()
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Redirect to login if not authenticated
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname
        window.location.href = `/auth/login?redirect=${encodeURIComponent(currentPath)}`
      }
    }
  }, [isLoading, isAuthenticated])

  return { user, isLoading, isAuthenticated }
}

// Component wrapper for protected routes
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isLoading, isAuthenticated } = useRequireAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Will redirect in useRequireAuth
  }

  return <>{children}</>
}