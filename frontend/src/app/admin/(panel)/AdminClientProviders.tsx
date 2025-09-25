'use client'

import { ReactNode } from 'react'

import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ToastProvider } from '@/components/Toast'
import AdminShell from '@/components/admin/AdminShell'
import type { AdminSessionPayload } from '@/lib/adminAuth'

interface AdminClientProvidersProps {
  session: AdminSessionPayload
  children: ReactNode
}

export default function AdminClientProviders({ session, children }: AdminClientProvidersProps) {
  return (
    <ToastProvider>
      <ErrorBoundary
        fallback={(error, _info, reset) => (
          <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 py-12">
            <div className="w-full max-w-md space-y-4 text-center">
              <h1 className="text-2xl font-semibold text-slate-900">Something went wrong</h1>
              <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                {error.message || 'An unexpected error occurred inside the admin panel.'}
              </p>
              <div className="flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => window.location.assign('/admin/dashboard')}
                  className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  Go to dashboard
                </button>
                <button
                  type="button"
                  onClick={reset}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        )}
      >
        <AdminShell session={session}>{children}</AdminShell>
      </ErrorBoundary>
    </ToastProvider>
  )
}
