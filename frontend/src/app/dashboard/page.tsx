'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  Plane, 
  User, 
  Search, 
  Heart, 
  Clock, 
  MapPin, 
  Settings,
  ArrowRight,
  Plus
} from 'lucide-react'
import { ProtectedRoute, useUserAuth } from '@/contexts/UserAuthContext'

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  )
}

function DashboardContent() {
  const { user, logout } = useUserAuth()
  const [recentSearches] = useState([
    { id: 1, from: 'LHR', to: 'BCN', date: '2024-10-15', theme: 'adventure' },
    { id: 2, from: 'LHR', to: 'CDG', date: '2024-10-20', theme: 'discover' },
  ])
  
  const [savedFlights] = useState([
    { id: 1, from: 'LHR', to: 'BCN', price: '€180', airline: 'BA', date: '2024-10-15' },
    { id: 2, from: 'LHR', to: 'FCO', price: '€220', airline: 'BA', date: '2024-11-01' },
  ])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-white/10 p-6">
        <div className="container mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
              <Plane className="w-5 h-5 text-black" />
            </div>
            <div>
              <h1 className="text-xl font-bold">SPONTRA</h1>
              <p className="text-white/60 text-sm">Dashboard</p>
            </div>
          </Link>
          
          <div className="flex items-center space-x-4">
            <Link
              href="/"
              className="bg-yellow-400 text-black px-4 py-2 rounded-lg hover:bg-yellow-300 transition-colors"
            >
              New Search
            </Link>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-black text-sm font-semibold">
                {(user?.firstName?.[0] || user?.username?.[0] || user?.email?.[0] || 'U').toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium">{user?.firstName || user?.username}</p>
                <p className="text-xs text-white/60">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">
            Welcome back, {user?.firstName || user?.username || 'Explorer'}!
          </h2>
          <p className="text-white/60">
            Ready to discover your next adventure? Let's find some amazing destinations.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link
            href="/"
            className="bg-black/40 backdrop-blur-sm border border-white/20 rounded-xl p-6 hover:border-white/40 transition-all group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                <Search className="w-6 h-6 text-black" />
              </div>
              <ArrowRight className="w-5 h-5 text-white/40 group-hover:text-white/80 transition-colors" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Find Flights</h3>
            <p className="text-white/60 text-sm">Search for flights by theme or destination</p>
          </Link>

          <Link
            href="/auth/profile"
            className="bg-black/40 backdrop-blur-sm border border-white/20 rounded-xl p-6 hover:border-white/40 transition-all group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <ArrowRight className="w-5 h-5 text-white/40 group-hover:text-white/80 transition-colors" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Profile Settings</h3>
            <p className="text-white/60 text-sm">Manage your account and preferences</p>
          </Link>

          <div className="bg-black/40 backdrop-blur-sm border border-white/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs bg-yellow-400 text-black px-2 py-1 rounded-full font-medium">Coming Soon</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Saved Flights</h3>
            <p className="text-white/60 text-sm">Keep track of your favorite flights</p>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Searches */}
          <div className="bg-black/40 backdrop-blur-sm border border-white/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Recent Searches
              </h3>
              <Link href="/" className="text-yellow-400 hover:text-yellow-300 text-sm transition-colors">
                New Search
              </Link>
            </div>

            {recentSearches.length > 0 ? (
              <div className="space-y-4">
                {recentSearches.map((search) => (
                  <div key={search.id} className="bg-black/30 rounded-lg p-4 hover:bg-black/40 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-sm bg-white/10 px-2 py-1 rounded">{search.from}</span>
                          <ArrowRight className="w-4 h-4 text-white/60" />
                          <span className="font-mono text-sm bg-white/10 px-2 py-1 rounded">{search.to}</span>
                        </div>
                        <span className="text-xs bg-yellow-400/20 text-yellow-200 px-2 py-1 rounded capitalize">
                          {search.theme}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-white/60">{search.date}</p>
                        <button className="text-yellow-400 hover:text-yellow-300 text-xs transition-colors">
                          Search Again
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Search className="w-12 h-12 text-white/30 mx-auto mb-4" />
                <p className="text-white/60 mb-4">No recent searches</p>
                <Link
                  href="/"
                  className="inline-flex items-center text-yellow-400 hover:text-yellow-300 text-sm transition-colors"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Start your first search
                </Link>
              </div>
            )}
          </div>

          {/* Watched Flights */}
          <div className="bg-black/40 backdrop-blur-sm border border-white/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold flex items-center">
                <Heart className="w-5 h-5 mr-2" />
                Watched Flights
              </h3>
              <span className="text-xs bg-yellow-400/20 text-yellow-200 px-2 py-1 rounded">Coming Soon</span>
            </div>

            <div className="text-center py-8">
              <Heart className="w-12 h-12 text-white/30 mx-auto mb-4" />
              <p className="text-white/60 mb-2">Flight tracking coming soon</p>
              <p className="text-white/40 text-sm">Get price alerts and notifications for your favorite routes</p>
            </div>
          </div>
        </div>

        {/* Account Status */}
        <div className="mt-8 bg-black/40 backdrop-blur-sm border border-white/20 rounded-xl p-6">
          <h3 className="text-xl font-semibold mb-4">Account Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400 mb-1">
                {user?.emailVerified ? '✅' : '⏳'}
              </div>
              <p className="text-sm text-white/80">Email Status</p>
              <p className="text-xs text-white/60">
                {user?.emailVerified ? 'Verified' : 'Pending verification'}
              </p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400 mb-1">
                {recentSearches.length}
              </div>
              <p className="text-sm text-white/80">Total Searches</p>
              <p className="text-xs text-white/60">This month</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400 mb-1">
                €0
              </div>
              <p className="text-sm text-white/80">Savings</p>
              <p className="text-xs text-white/60">From using Spontra</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}