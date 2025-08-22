'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, Lock, User, Shield, AlertTriangle } from 'lucide-react'
import { adminAuthService } from '@/services/adminAuthService'

export default function AdminLoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    mfaCode: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [requiresMFA, setRequiresMFA] = useState(false)
  
  const redirect = searchParams.get('redirect') || '/admin'
  const sessionError = searchParams.get('error')

  useEffect(() => {
    // Always clear any stale session data on login page load to prevent conflicts
    adminAuthService.clearStaleSession()
    
    // Display session error if present
    if (sessionError === 'session_expired') {
      setError('Your session has expired. Please log in again.')
    } else if (sessionError) {
      setError('Authentication error. Please try logging in again.')
    }
    
    // Check if already authenticated (after cleanup)
    setTimeout(() => {
      if (adminAuthService.isAuthenticated()) {
        router.push(redirect)
      }
    }, 100) // Small delay to ensure cleanup is complete
  }, [sessionError, redirect, router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear error when user starts typing
    if (error) setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const result = await adminAuthService.login({
        email: formData.email,
        password: formData.password,
        mfaCode: formData.mfaCode || undefined
      })

      if (result.success) {
        // Successful login
        router.push(redirect)
      } else if (result.requiresMFA) {
        // MFA required
        setRequiresMFA(true)
        setError(null)
      } else {
        // Login failed
        setError(result.error || 'Invalid credentials')
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = () => {
    // TODO: Implement forgot password flow
    setError('Password reset functionality will be available soon. Please contact your administrator.')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-400 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-72 h-72 bg-purple-500 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl mb-4">
            <Shield size={32} className="text-black" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Spontra Admin</h1>
          <p className="text-slate-400">Access your business dashboard</p>
        </div>

        {/* Login Form */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white/90 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User size={18} className="text-white/50" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                  placeholder="admin@spontra.com"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white/90 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-white/50" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-12 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                  placeholder="Enter your password"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-white/50 hover:text-white/70 transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* MFA Code Field - Show only when MFA is required */}
            {requiresMFA && (
              <div>
                <label htmlFor="mfaCode" className="block text-sm font-medium text-white/90 mb-2">
                  Two-Factor Authentication Code
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Shield size={18} className="text-white/50" />
                  </div>
                  <input
                    id="mfaCode"
                    name="mfaCode"
                    type="text"
                    value={formData.mfaCode}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-3 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all text-center tracking-widest"
                    placeholder="000000"
                    maxLength={6}
                    pattern="[0-9]{6}"
                    required
                    disabled={isLoading}
                    autoFocus
                  />
                </div>
                <p className="text-xs text-white/60 mt-1">
                  Enter the 6-digit code from your authenticator app
                </p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <AlertTriangle size={16} className="text-red-400" />
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-3 px-4 rounded-lg hover:from-blue-600 hover:to-purple-700 focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02]"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Signing In...</span>
                </div>
              ) : requiresMFA ? (
                'Verify & Sign In'
              ) : (
                'Sign In'
              )}
            </button>

            {/* Forgot Password */}
            <div className="text-center">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-sm text-white/70 hover:text-white transition-colors"
                disabled={isLoading}
              >
                Forgot your password?
              </button>
            </div>
          </form>
        </div>

        {/* Demo Credentials */}
        <div className="bg-blue-500/20 border border-blue-500/30 rounded-2xl p-4 mt-6">
          <div className="text-center">
            <h3 className="text-white font-medium mb-2">Demo Access</h3>
            <p className="text-blue-200 text-sm mb-3">
              {error && error.includes('backend is not available') 
                ? 'Backend unavailable - Use demo mode:' 
                : 'Try the admin dashboard with demo credentials:'}
            </p>
            <div className="bg-white/10 rounded-lg p-3 text-left">
              <p className="text-white text-sm font-mono">Email: demo@spontra.com</p>
              <p className="text-white text-sm font-mono">Password: demo123</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setFormData({
                  email: 'demo@spontra.com',
                  password: 'demo123',
                  mfaCode: ''
                })
                setError(null) // Clear any backend errors
              }}
              className="mt-3 text-blue-300 hover:text-blue-200 text-sm transition-colors"
            >
              Fill Demo Credentials
            </button>
            
            {error && error.includes('backend is not available') && (
              <p className="text-yellow-300 text-xs mt-2">
                ✨ Demo mode works offline with full admin features
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-xs text-slate-400">
            Spontra Admin Dashboard • Secure Business Management
          </p>
          <p className="text-xs text-slate-500 mt-1">
            If you're experiencing issues, contact your system administrator
          </p>
        </div>
      </div>
    </div>
  )
}