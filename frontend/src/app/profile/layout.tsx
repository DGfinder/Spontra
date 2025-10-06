/**
 * User Profile Layout
 *
 * Provides navigation tabs for profile sections:
 * - Account Settings
 * - Saved Searches
 * - Favorite Destinations
 */

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { User, Bookmark, Heart } from 'lucide-react'

const profileTabs = [
  { name: 'Account', href: '/profile', icon: User },
  { name: 'Saved Searches', href: '/profile/saved-searches', icon: Bookmark },
  { name: 'Favorites', href: '/profile/favorites', icon: Heart },
]

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Profile Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">My Profile</h1>
        <p className="text-white/70">Manage your account, saved searches, and favorite destinations</p>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-8">
        <div className="border-b border-white/20">
          <nav className="flex space-x-8" aria-label="Profile sections">
            {profileTabs.map((tab) => {
              const isActive = pathname === tab.href
              const Icon = tab.icon

              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`
                    flex items-center gap-2 pb-4 px-1 border-b-2 transition-colors
                    ${
                      isActive
                        ? 'border-blue-400 text-white'
                        : 'border-transparent text-white/60 hover:text-white/80 hover:border-white/30'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{tab.name}</span>
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Page Content */}
      {children}
    </div>
  )
}
