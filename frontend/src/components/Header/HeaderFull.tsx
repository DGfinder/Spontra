'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, User, LogOut } from 'lucide-react'
import { ExploreDropdown } from './ExploreDropdown'
import { HeaderMobileMenu } from './HeaderMobileMenu'
import { useAuth } from '@/lib/hooks/useAuth'

interface HeaderFullProps {
  theme?: string
  className?: string
}

/**
 * Full navigation header for landing pages and legal pages
 * - Spontra logo + navigation links
 * - Explore mega menu dropdown
 * - Mobile hamburger menu
 * - "Powered by Amadeus" attribution
 * - Scroll-aware transparency: transparent over backgrounds, adds glassmorphism on scroll
 * - Auth links (Login/Signup or User menu)
 */
export function HeaderFull({ theme, className = '' }: HeaderFullProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [hasScrolled, setHasScrolled] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const { user, isAuthenticated, logout, isLoading } = useAuth()

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      // Add background after scrolling 100px
      setHasScrolled(currentScrollY > 100)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      <header
        className={`
          sticky top-0 z-40
          transition-all duration-300
          ${hasScrolled
            ? 'bg-gradient-to-b from-[rgba(11,15,18,0.95)] to-[rgba(11,15,18,0.85)] backdrop-blur-xl border-b border-white/10 shadow-lg'
            : 'bg-transparent'
          }
          ${className}
        `}
        role="banner"
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Link
              href="/"
              className="text-white font-bold text-xl hover:opacity-80 transition-opacity flex-shrink-0"
            >
              Spontra
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6" aria-label="Main navigation">
              {/* Explore Dropdown */}
              <ExploreDropdown />

              {/* Hotels Link */}
              <Link
                href="/hotels"
                className="px-3 py-2 text-white/80 hover:text-white transition-colors"
              >
                Hotels
              </Link>

              {/* Destinations Link */}
              <Link
                href="/destinations"
                className="px-3 py-2 text-white/80 hover:text-white transition-colors"
              >
                Destinations
              </Link>

              {/* About Link */}
              <Link
                href="/about"
                className="px-3 py-2 text-white/80 hover:text-white transition-colors"
              >
                About
              </Link>
            </nav>

            {/* Right Side */}
            <div className="flex items-center gap-4">
              {/* Auth Links (Desktop) */}
              {!isLoading && (
                <div className="hidden md:flex items-center gap-3">
                  {isAuthenticated ? (
                    /* Logged In - User Menu */
                    <div className="relative">
                      <button
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white"
                        aria-label="User menu"
                        aria-expanded={showUserMenu}
                      >
                        <User className="w-4 h-4" />
                        <span className="text-sm">{user?.email}</span>
                      </button>

                      {/* Dropdown Menu */}
                      {showUserMenu && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setShowUserMenu(false)}
                          />
                          <div className="absolute right-0 top-full mt-2 w-56 bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg shadow-xl z-20 overflow-hidden">
                            <div className="p-3 border-b border-white/10">
                              <p className="text-white text-sm font-medium truncate">{user?.email}</p>
                              <p className="text-white/60 text-xs">
                                {user?.isEmailVerified ? '✓ Verified' : '⚠ Not verified'}
                              </p>
                            </div>
                            <div className="py-1">
                              <Link
                                href="/profile"
                                className="block px-4 py-2 text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                                onClick={() => setShowUserMenu(false)}
                              >
                                My Profile
                              </Link>
                              <Link
                                href="/saved-searches"
                                className="block px-4 py-2 text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                                onClick={() => setShowUserMenu(false)}
                              >
                                Saved Searches
                              </Link>
                              <button
                                onClick={() => {
                                  setShowUserMenu(false)
                                  logout()
                                }}
                                className="w-full text-left px-4 py-2 text-white/80 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2"
                              >
                                <LogOut className="w-4 h-4" />
                                Log Out
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    /* Logged Out - Login/Signup Buttons */
                    <>
                      <Link
                        href="/login"
                        className="px-4 py-2 text-white/80 hover:text-white transition-colors"
                      >
                        Log In
                      </Link>
                      <Link
                        href="/signup"
                        className="px-4 py-2 bg-brand-blue hover:bg-brand-blue/90 text-white rounded-lg transition-colors font-medium"
                      >
                        Sign Up
                      </Link>
                    </>
                  )}
                </div>
              )}

              {/* Powered by Amadeus (Desktop only) */}
              <a
                href="https://amadeus.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden lg:block text-white/40 text-xs hover:text-white/60 transition-colors"
              >
                Powered by Amadeus
              </a>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Open menu"
                aria-expanded={isMobileMenuOpen}
              >
                <Menu className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <HeaderMobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
    </>
  )
}
