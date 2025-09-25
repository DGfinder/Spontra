import LoginForm from '@/components/admin/LoginForm'

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">Spontra Admin</h1>
          <p className="mt-1 text-sm text-slate-600">Log in to manage destinations.</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
