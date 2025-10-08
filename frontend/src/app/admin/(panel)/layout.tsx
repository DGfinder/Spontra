'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutGrid, Globe, MapPin, Route, Map, Video, ArrowLeft } from 'lucide-react'
import { ToastContainer } from '@/components/ui/Toast'

export default function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  const navItems = [
    { href: '/admin/countries', label: 'Countries', icon: Globe },
    { href: '/admin/destinations', label: 'Destinations', icon: MapPin },
    { href: '/admin/routes', label: 'Flight Routes', icon: Route },
    { href: '/admin/map', label: 'Map View', icon: Map },
    { href: '/admin/moderate-videos', label: 'Moderate Videos', icon: Video },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-purple via-brand-blue to-brand-teal">
      {/* Glassmorphic Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-64 bg-white/10 backdrop-blur-xl border-r border-white/20 flex flex-col">
        {/* Logo/Brand */}
        <div className="h-16 flex items-center px-6 border-b border-white/10">
          <LayoutGrid className="w-6 h-6 text-white mr-3" />
          <h1 className="text-lg font-bold text-white">Spontra Admin</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                  ${isActive
                    ? 'bg-white/20 text-white shadow-lg'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-white/10">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Site
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>

      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  )
}
