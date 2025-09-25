'use client'\n\nimport Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { ReactNode, useTransition } from 'react'

import type { AdminSessionPayload } from '@/lib/adminAuth'

const NAV_ITEMS = [
  { href: '/admin/dashboard', label: 'Dashboard' },
  { href: '/admin/destinations', label: 'Destinations' },
  { href: '/admin/moderation', label: 'Moderation' },
]

interface AdminShellProps {
  session: AdminSessionPayload
  children: ReactNode
}

export default function AdminShell({ session, children }: AdminShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const handleLogout = () => {
    startTransition(async () => {
      await fetch('/api/admin/auth/logout', { method: 'POST' })
      router.replace('/admin/login')
    })
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/admin/dashboard" className="text-lg font-semibold text-blue-600">
            Spontra Admin
          </Link>
          <nav className="flex items-center gap-6 text-sm text-slate-600">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname?.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    'rounded-md px-3 py-2 transition-colors ' +
                    (isActive ? 'bg-blue-50 text-blue-600' : 'hover:bg-slate-100')
                  }
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
          <div className="flex items-center gap-3 text-sm text-slate-600">
            {session.email ? <span>{session.email}</span> : null}
            <button
              onClick={handleLogout}
              disabled={pending}
              className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-6">
        {children}
      </main>
    </div>
  )
}

