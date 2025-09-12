'use client'

import React, { useState, useEffect } from 'react'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Star,
  Eye,
  EyeOff,
  Filter,
  Calendar,
  MapPin,
  Target,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import { AdminDestination } from '@/types/admin'

interface DestinationAnalyticsProps {
  destinations: AdminDestination[]
  timeRange?: '24h' | '7d' | '30d' | '90d'
  onTimeRangeChange?: (range: string) => void
}

interface AnalyticsData {
  totalDestinations: number
  activeDestinations: number
  popularDestinations: number
  totalBookings: number
  totalRevenue: number
  averageScore: number
  topPerforming: AdminDestination[]
  underperforming: AdminDestination[]
  countryDistribution: Record<string, number>
  performanceTrends: {
    bookings: number[]
    revenue: number[]
    scores: number[]
  }
}

export function DestinationAnalytics({ 
  destinations, 
  timeRange = '30d',
  onTimeRangeChange 
}: DestinationAnalyticsProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [selectedMetric, setSelectedMetric] = useState<'bookings' | 'revenue' | 'score'>('bookings')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    calculateAnalytics()
  }, [destinations, timeRange])

  const calculateAnalytics = () => {
    setIsLoading(true)
    
    // Simulate analytics calculation
    setTimeout(() => {
      const activeDestinations = destinations.filter(d => d.isActive)
      const popularDestinations = destinations.filter(d => d.isPopular)
      
      const totalBookings = destinations.reduce((sum, d) => sum + d.metrics.totalBookings, 0)
      const totalRevenue = destinations.reduce((sum, d) => sum + d.metrics.totalRevenue, 0)
      
      const averageScore = destinations.reduce((sum, d) => sum + d.metrics.popularityScore, 0) / destinations.length
      
      // Top performing destinations (high bookings + revenue)
      const topPerforming = [...destinations]
        .sort((a, b) => (b.metrics.totalBookings + b.metrics.totalRevenue) - (a.metrics.totalBookings + a.metrics.totalRevenue))
        .slice(0, 5)
      
      // Underperforming destinations (low scores)
      const underperforming = destinations
        .filter(d => d.metrics.popularityScore < 5.0)
        .sort((a, b) => a.metrics.popularityScore - b.metrics.popularityScore)
        .slice(0, 5)
      
      
      // Country distribution
      const countryDistribution: Record<string, number> = {}
      destinations.forEach(dest => {
        countryDistribution[dest.countryName] = (countryDistribution[dest.countryName] || 0) + dest.metrics.totalBookings
      })
      
      // Mock performance trends
      const performanceTrends = {
        bookings: [120, 135, 142, 158, 165, 172, 180],
        revenue: [8500, 9200, 9800, 10500, 11200, 11800, 12500],
        scores: [7.2, 7.4, 7.6, 7.8, 8.0, 8.1, 8.3]
      }
      
      setAnalytics({
        totalDestinations: destinations.length,
        activeDestinations: activeDestinations.length,
        popularDestinations: popularDestinations.length,
        totalBookings,
        totalRevenue,
        averageScore,
        topPerforming,
        underperforming,
        countryDistribution,
        performanceTrends
      })
      
      setIsLoading(false)
    }, 1000)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-EU', {
      style: 'currency',
      currency: 'EUR',
      notation: 'compact'
    }).format(amount)
  }

  const getPerformanceColor = (score: number) => {
    if (score >= 8.5) return 'text-green-600 bg-green-100'
    if (score >= 7.0) return 'text-yellow-600 bg-yellow-100'
    if (score >= 5.5) return 'text-orange-600 bg-orange-100'
    return 'text-red-600 bg-red-100'
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp size={16} className="text-green-600" />
      case 'down': return <TrendingDown size={16} className="text-red-600" />
      default: return <BarChart3 size={16} className="text-gray-600" />
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-6">
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!analytics) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Destination Analytics</h2>
          <p className="text-gray-600">Performance insights and trends</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <select
            value={timeRange}
            onChange={(e) => onTimeRangeChange?.(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MapPin size={20} className="text-blue-600" />
            </div>
            <div className="text-sm text-green-600 flex items-center">
              <TrendingUp size={14} className="mr-1" />
              +12%
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {analytics.totalDestinations}
            </div>
            <p className="text-sm text-gray-600">Total Destinations</p>
            <p className="text-xs text-gray-500 mt-1">
              {analytics.activeDestinations} active, {analytics.popularDestinations} popular
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users size={20} className="text-green-600" />
            </div>
            <div className="text-sm text-green-600 flex items-center">
              <TrendingUp size={14} className="mr-1" />
              +8.5%
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {analytics.totalBookings.toLocaleString()}
            </div>
            <p className="text-sm text-gray-600">Total Bookings</p>
            <p className="text-xs text-gray-500 mt-1">across all destinations</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <DollarSign size={20} className="text-purple-600" />
            </div>
            <div className="text-sm text-purple-600 flex items-center">
              <TrendingUp size={14} className="mr-1" />
              +15.3%
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {formatCurrency(analytics.totalRevenue)}
            </div>
            <p className="text-sm text-gray-600">Total Revenue</p>
            <p className="text-xs text-gray-500 mt-1">from destination bookings</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Star size={20} className="text-yellow-600" />
            </div>
            <div className="text-sm text-yellow-600 flex items-center">
              <Star size={14} className="mr-1" />
              Avg score
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {analytics.averageScore.toFixed(1)}
            </div>
            <p className="text-sm text-gray-600">Average Score</p>
            <p className="text-xs text-gray-500 mt-1">across all themes</p>
          </div>
        </div>
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing Destinations */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Top Performers</h3>
            <Target size={20} className="text-green-600" />
          </div>
          
          <div className="space-y-3">
            {analytics.topPerforming.map((dest, index) => (
              <div key={dest.iataCode} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-xs">{dest.iataCode}</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{dest.cityName}</h4>
                    <p className="text-sm text-gray-600">{dest.countryName}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">
                    {dest.metrics.totalBookings.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">
                    {formatCurrency(dest.metrics.totalRevenue)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Underperforming Destinations */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Needs Attention</h3>
            <AlertTriangle size={20} className="text-orange-600" />
          </div>
          
          <div className="space-y-3">
            {analytics.underperforming.map((dest, index) => (
              <div key={dest.iataCode} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-xs">{dest.iataCode}</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{dest.cityName}</h4>
                    <p className="text-sm text-gray-600">{dest.countryName}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`px-2 py-1 rounded text-xs font-medium ${getPerformanceColor(dest.metrics.popularityScore)}`}>
                    {dest.metrics.popularityScore.toFixed(1)}/10
                  </div>
                  <div className="text-sm text-gray-600">
                    {dest.metrics.totalBookings} bookings
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>


      {/* Country Distribution */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Top Countries by Bookings</h3>
          <MapPin size={20} className="text-green-600" />
        </div>
        
        <div className="space-y-3">
          {Object.entries(analytics.countryDistribution)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([country, bookings]) => {
              const percentage = (bookings / analytics.totalBookings) * 100
              return (
                <div key={country} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="font-medium text-gray-900 w-32">{country}</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-sm font-medium text-gray-900 w-20 text-right">
                    {bookings.toLocaleString()}
                  </div>
                </div>
              )
            })}
        </div>
      </div>
    </div>
  )
}
