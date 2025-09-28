'use client'

import Link from 'next/link'
import { useUserAuth } from '@/contexts/UserAuthContext'

// Client component for interactive user navigation
export function UserNavigation() {
  const { user, isAuthenticated, logout } = useUserAuth()

  return (
    <div className="text-white/80 text-xs sm:text-sm hover:text-white font-muli transition-colors duration-200">
      {isAuthenticated ? (
        <div className="relative group">
          <button className="flex items-center space-x-2">
            <span>Hi, {user?.firstName || user?.username || 'User'}</span>
            <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-black text-xs font-semibold">
              {(user?.firstName?.[0] || user?.username?.[0] || user?.email?.[0] || 'U').toUpperCase()}
            </div>
          </button>
          
          {/* Dropdown Menu */}
          <div className="absolute right-0 top-full mt-2 w-48 bg-black/80 backdrop-blur-sm border border-white/20 rounded-lg py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
            <Link 
              href="/dashboard" 
              className="block px-4 py-2 text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              Dashboard
            </Link>
            <Link 
              href="/auth/profile" 
              className="block px-4 py-2 text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              Profile
            </Link>
            <button
              onClick={logout}
              className="block w-full text-left px-4 py-2 text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      ) : (
        <Link href="/auth/login" className="hover:text-white transition-colors">
          Sign In
        </Link>
      )}
    </div>
  )
}