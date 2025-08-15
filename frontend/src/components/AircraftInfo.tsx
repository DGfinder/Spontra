'use client'

import { useState } from 'react'
import { Plane, Users, Ruler, Eye, X } from 'lucide-react'
import { getAircraftInfo, getSeatConfiguration } from '@/data/aircraft'

interface AircraftInfoProps {
  aircraftCode: string
  size?: 'sm' | 'md' | 'lg'
  showImage?: boolean
  showSpecs?: boolean
  className?: string
}

export function AircraftInfo({
  aircraftCode,
  size = 'md',
  showImage = false,
  showSpecs = false,
  className = ''
}: AircraftInfoProps) {
  const [showModal, setShowModal] = useState(false)
  const [imageError, setImageError] = useState(false)
  
  const aircraft = getAircraftInfo(aircraftCode)
  
  if (!aircraft) {
    return (
      <div className={`flex items-center space-x-2 text-white/60 ${className}`}>
        <Plane size={16} />
        <span className="text-sm">{aircraftCode}</span>
      </div>
    )
  }

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }

  const iconSizes = {
    sm: 12,
    md: 16,
    lg: 20
  }

  return (
    <>
      <div className={`flex items-center space-x-2 ${className}`}>
        <Plane size={iconSizes[size]} className="text-white/80" />
        <div className="flex flex-col">
          <span className={`text-white font-medium ${sizeClasses[size]}`}>
            {aircraft.name}
          </span>
          <span className={`text-white/60 ${size === 'sm' ? 'text-xs' : 'text-xs'}`}>
            {aircraft.type.replace('-', ' ')} • {aircraft.capacity.typical} seats
          </span>
        </div>
        
        {(showImage || showSpecs) && (
          <button
            onClick={() => setShowModal(true)}
            className="ml-2 p-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <Eye size={12} className="text-white/80" />
          </button>
        )}
      </div>

      {/* Aircraft Details Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-gray-900 to-black border border-white/20 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-white text-xl font-bold">{aircraft.name}</h2>
                <p className="text-white/60">{aircraft.manufacturer}</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <X size={20} className="text-white" />
              </button>
            </div>

            {/* Aircraft Image */}
            {aircraft.imageUrl && !imageError && (
              <div className="mb-6">
                <img
                  src={aircraft.imageUrl}
                  alt={aircraft.name}
                  className="w-full h-48 object-cover rounded-lg"
                  onError={() => setImageError(true)}
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Specifications */}
              <div className="space-y-4">
                <h3 className="text-white font-semibold text-lg">Specifications</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/70">Type:</span>
                    <span className="text-white capitalize">{aircraft.type.replace('-', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">Length:</span>
                    <span className="text-white">{aircraft.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">Wingspan:</span>
                    <span className="text-white">{aircraft.wingspan}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">Range:</span>
                    <span className="text-white">{aircraft.range}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">Typical capacity:</span>
                    <span className="text-white">{aircraft.capacity.typical} seats</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">Maximum capacity:</span>
                    <span className="text-white">{aircraft.capacity.maximum} seats</span>
                  </div>
                </div>
              </div>

              {/* Seat Configuration */}
              <div className="space-y-4">
                <h3 className="text-white font-semibold text-lg">Seat Configuration</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/70">Economy:</span>
                    <span className="text-white font-mono">{aircraft.seatConfiguration.economy}</span>
                  </div>
                  {aircraft.seatConfiguration.premiumEconomy && (
                    <div className="flex justify-between">
                      <span className="text-white/70">Premium Economy:</span>
                      <span className="text-white font-mono">{aircraft.seatConfiguration.premiumEconomy}</span>
                    </div>
                  )}
                  {aircraft.seatConfiguration.business && (
                    <div className="flex justify-between">
                      <span className="text-white/70">Business:</span>
                      <span className="text-white font-mono">{aircraft.seatConfiguration.business}</span>
                    </div>
                  )}
                  {aircraft.seatConfiguration.first && (
                    <div className="flex justify-between">
                      <span className="text-white/70">First Class:</span>
                      <span className="text-white font-mono">{aircraft.seatConfiguration.first}</span>
                    </div>
                  )}
                </div>

                {/* Seat Layout Visual */}
                <div className="bg-black/30 rounded-lg p-4 mt-4">
                  <h4 className="text-white/80 text-xs mb-2">Economy Layout Preview</h4>
                  <SeatLayoutPreview configuration={aircraft.seatConfiguration.economy} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// Simple seat layout preview component
function SeatLayoutPreview({ configuration }: { configuration: string }) {
  const seats = configuration.split('-').map(section => parseInt(section))
  
  return (
    <div className="flex items-center justify-center space-x-1">
      {seats.map((seatCount, sectionIndex) => (
        <div key={sectionIndex} className="flex items-center space-x-0.5">
          {Array.from({ length: seatCount }, (_, seatIndex) => (
            <div
              key={seatIndex}
              className="w-2 h-2 bg-blue-400 rounded-sm"
            />
          ))}
          {sectionIndex < seats.length - 1 && (
            <div className="w-1 h-0.5 bg-white/20 mx-1" />
          )}
        </div>
      ))}
    </div>
  )
}

// Compact aircraft badge component
interface AircraftBadgeProps {
  aircraftCode: string
  className?: string
}

export function AircraftBadge({ aircraftCode, className = '' }: AircraftBadgeProps) {
  const aircraft = getAircraftInfo(aircraftCode)
  
  if (!aircraft) {
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded bg-gray-600 text-white text-xs ${className}`}>
        {aircraftCode}
      </span>
    )
  }

  const typeColors = {
    'narrow-body': 'bg-blue-600',
    'wide-body': 'bg-purple-600',
    'regional': 'bg-green-600'
  }

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded ${typeColors[aircraft.type]} text-white text-xs ${className}`}>
      <Plane size={12} className="mr-1" />
      {aircraft.code}
    </span>
  )
}