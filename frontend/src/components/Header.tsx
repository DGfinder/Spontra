'use client'

import { useState } from 'react'
import Link from 'next/link'

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

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
            <Link href="/flights" className="text-gray-600 hover:text-gray-900 transition-colors">
              Flights
            </Link>
            <Link href="/hotels" className="text-gray-600 hover:text-gray-900 transition-colors">
              Hotels
            </Link>
            <Link href="/deals" className="text-gray-600 hover:text-gray-900 transition-colors">
              Deals
            </Link>
            <Link href="/my-trips" className="text-gray-600 hover:text-gray-900 transition-colors">
              My Trips
            </Link>
          </nav>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/login" className="text-gray-600 hover:text-gray-900 transition-colors">
              Sign In
            </Link>
            <Link href="/register" className="btn-primary">
              Sign Up
            </Link>
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
              <Link href="/flights" className="text-gray-600 hover:text-gray-900 transition-colors">
                Flights
              </Link>
              <Link href="/hotels" className="text-gray-600 hover:text-gray-900 transition-colors">
                Hotels
              </Link>
              <Link href="/deals" className="text-gray-600 hover:text-gray-900 transition-colors">
                Deals
              </Link>
              <Link href="/my-trips" className="text-gray-600 hover:text-gray-900 transition-colors">
                My Trips
              </Link>
              <div className="pt-4 border-t border-gray-200 flex flex-col space-y-2">
                <Link href="/login" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Sign In
                </Link>
                <Link href="/register" className="btn-primary inline-block text-center">
                  Sign Up
                </Link>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}