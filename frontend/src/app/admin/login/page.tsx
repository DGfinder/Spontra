import LoginForm from '@/components/admin/LoginForm'

type LoginSearchParams = {
  error?: string
}

function getErrorMessage(code?: string): string | null {
  switch (code) {
    case 'session_expired':
      return 'Your session has expired. Please log in again.'
    case 'token_refresh_required':
      return 'Your session needs to be renewed. Please log in again.'
    case 'invalid_token':
      return 'Invalid session detected. Please log in again.'
    case 'no_token':
      return 'Authentication required. Please log in to access the admin panel.'
    case undefined:
    case '':
      return null
    default:
      return 'Authentication error. Please try logging in again.'
  }
}

export default function AdminLoginPage({ searchParams }: { searchParams?: LoginSearchParams }) {
  const message = getErrorMessage(searchParams?.error)

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">Spontra Admin</h1>
          <p className="mt-1 text-sm text-slate-600">Log in to manage destinations.</p>
        </div>
        {message ? (
          <div className="mb-4 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700">{message}</div>
        ) : null}
        <LoginForm />
      </div>
    </div>
  )
}
