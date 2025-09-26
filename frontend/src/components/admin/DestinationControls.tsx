'use client'

import React, { useState } from 'react'
import {
  CheckCircle,
  XCircle,
  Star,
  StarOff,
  Eye,
  EyeOff,
  Settings,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Filter,
  Search
} from 'lucide-react'
import { AdminDestination } from '@/types/admin'

interface DestinationControlsProps {
  destination: AdminDestination
  onUpdate: (updates: Partial<AdminDestination>) => Promise<void>
  onBulkAction?: (action: string, destinations: AdminDestination[]) => void
  showAdvanced?: boolean
}

export function DestinationControls({ 
  destination, 
  onUpdate, 
  onBulkAction,
  showAdvanced = false 
}: DestinationControlsProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [showAdvancedControls, setShowAdvancedControls] = useState(showAdvanced)

  const handleStatusToggle = async () => {
    setIsUpdating(true)
    try {
      await onUpdate({ isActive: !destination.isActive })
    } finally {
      setIsUpdating(false)
    }
  }

  const handlePopularToggle = async () => {
    setIsUpdating(true)
    try {
      await onUpdate({ isPopular: !destination.isPopular })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleVisibilityToggle = async () => {
    setIsUpdating(true)
    try {
      await onUpdate({ isVisible: !destination.isVisible })
    } finally {
      setIsUpdating(false)
    }
  }

  const getStatusColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-100 text-green-700 border-green-200' 
      : 'bg-red-100 text-red-700 border-red-200'
  }

  const getPopularityColor = (score: number) => {
    if (score >= 8.5) return 'text-green-600'
    if (score >= 7.0) return 'text-yellow-600'
    if (score >= 5.5) return 'text-orange-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-4">
      {/* Primary Controls */}
      <div className="flex items-center space-x-3">
        <button
          onClick={handleStatusToggle}
          disabled={isUpdating}
          className={`flex items-center px-3 py-2 rounded-lg font-medium transition-colors ${
            destination.isActive
              ? 'bg-green-100 text-green-700 hover:bg-green-200'
              : 'bg-red-100 text-red-700 hover:bg-red-200'
          } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {destination.isActive ? (
            <CheckCircle size={16} className="mr-2" />
          ) : (
            <XCircle size={16} className="mr-2" />
          )}
          {destination.isActive ? 'Active' : 'Inactive'}
        </button>

        <button
          onClick={handlePopularToggle}
          disabled={isUpdating}
          className={`flex items-center px-3 py-2 rounded-lg font-medium transition-colors ${
            destination.isPopular
              ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {destination.isPopular ? (
            <Star size={16} className="mr-2" />
          ) : (
            <StarOff size={16} className="mr-2" />
          )}
          {destination.isPopular ? 'Popular' : 'Mark Popular'}
        </button>

        <button
          onClick={() => setShowAdvancedControls(!showAdvancedControls)}
          className="flex items-center px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
        >
          <Settings size={16} className="mr-2" />
          Advanced
        </button>
      </div>

      {/* Status Indicators */}
      <div className="flex items-center space-x-4 text-sm">
        <div className={`px-2 py-1 rounded-full border ${getStatusColor(destination.isActive)}`}>
          {destination.isActive ? 'Live' : 'Hidden'}
        </div>
        
        {destination.isPopular && (
          <div className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 border border-yellow-200">
            Featured
          </div>
        )}

        <div className={`px-2 py-1 rounded-full border ${
          destination.metrics.popularityScore >= 8.5 
            ? 'bg-green-100 text-green-700 border-green-200'
            : destination.metrics.popularityScore >= 7.0
            ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
            : 'bg-orange-100 text-orange-700 border-orange-200'
        }`}>
          Score: {destination.metrics.popularityScore.toFixed(1)}
        </div>
      </div>

      {/* Advanced Controls */}
      {showAdvancedControls && (
        <div className="border-t pt-4 space-y-4">
          <h4 className="font-medium text-gray-900">Advanced Controls</h4>
          
          {/* Visibility Control */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {destination.isVisible ? (
                <Eye size={16} className="text-green-600" />
              ) : (
                <EyeOff size={16} className="text-gray-400" />
              )}
              <span className="text-sm font-medium">Search Visibility</span>
            </div>
            <button
              onClick={handleVisibilityToggle}
              disabled={isUpdating}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                destination.isVisible ? 'bg-green-600' : 'bg-gray-200'
              } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  destination.isVisible ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Performance Indicators */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-600">Bookings</span>
                <TrendingUp size={12} className="text-green-600" />
              </div>
              <div className="text-lg font-semibold text-gray-900">
                {destination.metrics.totalBookings.toLocaleString()}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-600">Revenue</span>
                <TrendingUp size={12} className="text-green-600" />
              </div>
              <div className="text-lg font-semibold text-gray-900">
                EUR {destination.metrics.totalRevenue.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Highlights Preview */}
          <div>
            <h5 className="text-sm font-medium text-gray-700 mb-2">Highlights</h5>
            <div className="flex flex-wrap gap-2">
              {destination.highlights.slice(0, 3).map((highlight, index) => (
                <span
                  key={index}
                  className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700"
                >
                  {highlight}
                </span>
              ))}
            </div>
          </div>

          {/* Alerts */}
          {destination.metrics.popularityScore < 5.0 && (
            <div className="flex items-center space-x-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <AlertTriangle size={16} className="text-orange-600" />
              <span className="text-sm text-orange-700">
                Low performance - consider reviewing content or marketing
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
