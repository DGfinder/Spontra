'use client'

import { useState } from 'react'
import Link from 'next/link'

interface HeaderProps {
  isExploreMode?: boolean
  onNavigateToSearch?: () => void
}

export function Header({ isExploreMode = false, onNavigateToSearch }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showComingSoon, setShowComingSoon] = useState(false)

  const handleComingSoonClick = (feature: string) => {
    setShowComingSoon(true)
    setTimeout(() => setShowComingSoon(false), 3000)
  }

  const handleFlightsClick = () => {
    // Navigate to search/home
    if (onNavigateToSearch) {
      onNavigateToSearch()
    } else {
      window.location.href = '/'
    }
  }

  if (isExploreMode) {
    return (
      <header className="absolute top-0 left-0 right-0 z-30 bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo for Explore Mode */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <span className="text-2xl font-light text-white">spon</span>
                <span className="text-2xl font-normal text-white/70">EXPLORE</span>
              </Link>
            </div>

            {/* Right side - simplified for explore mode */}
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => handleComingSoonClick('sign-in')}
                className="text-white/80 hover:text-white transition-colors text-sm"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-900">Spontra</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <button 
              onClick={handleFlightsClick}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Flights
            </button>
            <button 
              onClick={() => handleComingSoonClick('hotels')}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Hotels
            </button>
            <button 
              onClick={() => handleComingSoonClick('deals')}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Deals
            </button>
            <button 
              onClick={() => handleComingSoonClick('my-trips')}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              My Trips
            </button>
          </nav>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <button 
              onClick={() => handleComingSoonClick('sign-in')}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Sign In
            </button>
            <button 
              onClick={() => handleComingSoonClick('sign-up')}
              className="btn-primary"
            >
              Sign Up
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-600 hover:text-gray-900 focus:outline-none"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <nav className="flex flex-col space-y-4">
              <button 
                onClick={handleFlightsClick}
                className="text-gray-600 hover:text-gray-900 transition-colors text-left"
              >
                Flights
              </button>
              <button 
                onClick={() => handleComingSoonClick('hotels')}
                className="text-gray-600 hover:text-gray-900 transition-colors text-left"
              >
                Hotels
              </button>
              <button 
                onClick={() => handleComingSoonClick('deals')}
                className="text-gray-600 hover:text-gray-900 transition-colors text-left"
              >
                Deals
              </button>
              <button 
                onClick={() => handleComingSoonClick('my-trips')}
                className="text-gray-600 hover:text-gray-900 transition-colors text-left"
              >
                My Trips
              </button>
              <div className="pt-4 border-t border-gray-200 flex flex-col space-y-2">
                <button 
                  onClick={() => handleComingSoonClick('sign-in')}
                  className="text-gray-600 hover:text-gray-900 transition-colors text-left"
                >
                  Sign In
                </button>
                <button 
                  onClick={() => handleComingSoonClick('sign-up')}
                  className="btn-primary inline-block text-center"
                >
                  Sign Up
                </button>
              </div>
            </nav>
          </div>
        )}
      </div>

      {/* Coming Soon Notification */}
      {showComingSoon && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">Coming Soon!</span>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}