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
  const [validationErrors, setValidationErrors] = useState<{
    email?: string
    password?: string
    mfaCode?: string
  }>({})
  const [isOnline, setIsOnline] = useState(true)
  
  const redirect = searchParams.get('redirect') || '/admin'
  const sessionError = searchParams.get('error')

  useEffect(() => {
    // Always clear any stale session data on login page load to prevent conflicts
    adminAuthService.clearStaleSession()
    
    // Display session error if present with more specific messaging
    if (sessionError === 'session_expired') {
      setError('Your session has expired. Please log in again.')
    } else if (sessionError === 'token_refresh_required') {
      setError('Your session needs to be renewed. Please log in again.')
    } else if (sessionError === 'invalid_token') {
      setError('Invalid session detected. Please log in again.')
    } else if (sessionError === 'no_token') {
      setError('Authentication required. Please log in to access the admin panel.')
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

  // Validation functions
  const validateEmail = (email: string): string | undefined => {
    if (!email) return 'Email is required'
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) return 'Please enter a valid email address'
    return undefined
  }

  const validatePassword = (password: string): string | undefined => {
    if (!password) return 'Password is required'
    if (password.length < 6) return 'Password must be at least 6 characters long'
    return undefined
  }

  const validateMFACode = (code: string): string | undefined => {
    if (requiresMFA && !code) return 'MFA code is required'
    if (requiresMFA && !/^\d{6}$/.test(code)) return 'MFA code must be 6 digits'
    return undefined
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear errors when user starts typing
    if (error) setError(null)
    
    // Clear field-specific validation errors
    setValidationErrors(prev => ({ ...prev, [name]: undefined }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setValidationErrors({})

    console.log('🚀 Login form submitted', { email: formData.email })

    try {
      // Validate form fields
      const emailError = validateEmail(formData.email)
      const passwordError = validatePassword(formData.password)
      const mfaError = validateMFACode(formData.mfaCode)

      const newValidationErrors = {
        email: emailError,
        password: passwordError,
        mfaCode: mfaError
      }

      // Remove undefined errors
      Object.keys(newValidationErrors).forEach(key => {
        if (!newValidationErrors[key as keyof typeof newValidationErrors]) {
          delete newValidationErrors[key as keyof typeof newValidationErrors]
        }
      })

      // If there are validation errors, show them and stop
      if (Object.keys(newValidationErrors).length > 0) {
        setValidationErrors(newValidationErrors)
        setIsLoading(false)
        return
      }

      // Check network connectivity
      if (!navigator.onLine) {
        setError('No internet connection. Please check your network and try again.')
        setIsLoading(false)
        return
      }

      // Add small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 300))
      
      const result = await adminAuthService.login({
        email: formData.email.trim(),
        password: formData.password,
        mfaCode: formData.mfaCode?.trim() || undefined
      })

      console.log('📝 Login result:', { success: result.success, hasUser: !!result.user })

      if (result.success) {
        console.log('✅ Login successful, redirecting to:', redirect)
        // Enhanced delay to ensure session is fully stored and state is updated
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Use router push for better navigation
        if (redirect === '/admin') {
          router.push('/admin')
        } else {
          router.push(redirect)
        }
      } else if (result.requiresMFA) {
        console.log('🔐 MFA required')
        setRequiresMFA(true)
        setError(null)
      } else {
        console.log('❌ Login failed:', result.error)
        const errorMessage = result.error || 'Login failed'
        
        // Provide more specific error messages
        if (errorMessage.includes('Too many')) {
          setError(errorMessage)
        } else if (errorMessage.includes('locked')) {
          setError(errorMessage)
        } else if (errorMessage.includes('Invalid credentials')) {
          setError('Invalid email or password. Please check your credentials and try again.')
        } else {
          setError(errorMessage)
        }
      }
    } catch (err) {
      console.error('💥 Login exception:', err)
      
      // More specific error handling
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('Unable to connect to the authentication service. Please check your connection and try again.')
      } else if (err instanceof Error) {
        setError(`Login error: ${err.message}`)
      } else {
        setError('An unexpected error occurred. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleForceCleanup = () => {
    console.log('🧹 Force cleanup requested by user')
    adminAuthService.forceCompleteCleanup()
    setError('Browser data cleared. Please try logging in again.')
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
                  className={`w-full pl-10 pr-3 py-3 bg-white/10 border rounded-lg text-white placeholder-white/50 focus:ring-2 focus:border-transparent transition-all ${
                    validationErrors.email
                      ? 'border-red-400 focus:ring-red-400'
                      : 'border-white/20 focus:ring-blue-400'
                  }`}
                  placeholder="admin@spontra.com"
                  required
                  disabled={isLoading}
                  autoComplete="email"
                  aria-describedby={validationErrors.email ? "email-error" : undefined}
                />
              </div>
              {validationErrors.email && (
                <p id="email-error" className="text-red-300 text-sm mt-1 flex items-center">
                  <AlertTriangle size={14} className="mr-1" />
                  {validationErrors.email}
                </p>
              )}
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
                  className={`w-full pl-10 pr-12 py-3 bg-white/10 border rounded-lg text-white placeholder-white/50 focus:ring-2 focus:border-transparent transition-all ${
                    validationErrors.password
                      ? 'border-red-400 focus:ring-red-400'
                      : 'border-white/20 focus:ring-blue-400'
                  }`}
                  placeholder="Enter your password"
                  required
                  disabled={isLoading}
                  autoComplete="current-password"
                  aria-describedby={validationErrors.password ? "password-error" : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-white/50 hover:text-white/70 transition-colors"
                  disabled={isLoading}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {validationErrors.password && (
                <p id="password-error" className="text-red-300 text-sm mt-1 flex items-center">
                  <AlertTriangle size={14} className="mr-1" />
                  {validationErrors.password}
                </p>
              )}
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
                    className={`w-full pl-10 pr-3 py-3 bg-white/10 border rounded-lg text-white placeholder-white/50 focus:ring-2 focus:border-transparent transition-all text-center tracking-widest ${
                      validationErrors.mfaCode
                        ? 'border-red-400 focus:ring-red-400'
                        : 'border-white/20 focus:ring-blue-400'
                    }`}
                    placeholder="000000"
                    maxLength={6}
                    pattern="[0-9]{6}"
                    required
                    disabled={isLoading}
                    autoFocus
                    autoComplete="one-time-code"
                    aria-describedby={validationErrors.mfaCode ? "mfa-error" : "mfa-help"}
                  />
                </div>
                {validationErrors.mfaCode && (
                  <p id="mfa-error" className="text-red-300 text-sm mt-1 flex items-center">
                    <AlertTriangle size={14} className="mr-1" />
                    {validationErrors.mfaCode}
                  </p>
                )}
                <p id="mfa-help" className="text-xs text-white/60 mt-1">
                  Enter the 6-digit code from your authenticator app
                </p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle size={16} className="text-red-400" />
                    <p className="text-red-300 text-sm">{error}</p>
                  </div>
                  {error.includes('Browser extensions') && (
                    <button
                      onClick={handleForceCleanup}
                      className="text-red-300 hover:text-red-200 text-xs underline ml-2"
                    >
                      Clear Data
                    </button>
                  )}
                </div>
                {error.includes('unexpected error') && (
                  <div className="mt-2 text-xs text-red-200">
                    💡 Try refreshing the page, disabling browser extensions, or using incognito mode
                  </div>
                )}
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

        {/* System Information */}
        <div className="bg-slate-800/20 border border-slate-600/30 rounded-2xl p-4 mt-6">
          <div className="text-center">
            <h3 className="text-white font-medium mb-2">Admin Access</h3>
            <p className="text-slate-300 text-sm mb-3">
              Use your administrator credentials to access the admin panel
            </p>
            <div className="bg-white/10 rounded-lg p-3 text-left">
              <p className="text-slate-300 text-sm">📧 Email: admin@spontra.com</p>
              <p className="text-slate-300 text-sm">🔑 Password: admin123</p>
              <p className="text-slate-300 text-xs mt-2 opacity-75">Default credentials for initial setup</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setFormData({
                  email: 'admin@spontra.com',
                  password: 'admin123',
                  mfaCode: ''
                })
                setError(null)
              }}
              className="mt-3 text-slate-300 hover:text-slate-200 text-sm transition-colors"
            >
              Fill Admin Credentials
            </button>
            
            <button
              type="button"
              onClick={handleForceCleanup}
              className="mt-2 text-slate-400 hover:text-slate-300 text-xs transition-colors block w-full"
            >
              Having login issues? Clear browser data
            </button>
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