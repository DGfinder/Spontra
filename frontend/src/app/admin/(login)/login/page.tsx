'use client'

import LoginForm from '@/components/admin/LoginForm'

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-white">Admin Login</h2>
          <p className="mt-2 text-sm text-gray-400">Sign in to access the admin panel</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
