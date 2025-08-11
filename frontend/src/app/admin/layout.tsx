'use client'

import { ReactNode } from 'react'
import { usePathname } from 'next/navigation'

interface AdminLayoutProps {
  children: ReactNode
}

export default function AdminLayoutMinimal({ children }: AdminLayoutProps) {
  const pathname = usePathname()

  // For login page, render children without layout
  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  // For all other admin pages, show minimal layout
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b p-4">
        <h1 className="text-xl font-bold">Spontra Admin</h1>
      </header>
      <main className="p-4">
        {children}
      </main>
    </div>
  )
}