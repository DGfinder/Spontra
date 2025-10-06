'use client'

import { MapPin, Globe, Film, AlertTriangle } from 'lucide-react'

interface Destination {
  id: string
  airports: Array<{ isPrimary: boolean; airport: { iataCode: string } }>
  _count: { themePOIs: number }
  country: { id: string; name: string } | null
}

interface DestinationStatsProps {
  destinations: Destination[]
}

export function DestinationStats({ destinations }: DestinationStatsProps) {
  const totalDestinations = destinations.length
  const totalCountries = new Set(destinations.map(d => d.country?.id).filter(Boolean)).size
  const totalPOIs = destinations.reduce((sum, d) => sum + d._count.themePOIs, 0)
  const missingPOIs = destinations.filter(d => d._count.themePOIs === 0).length
  const missingAirports = destinations.filter(d => !d.airports || d.airports.length === 0).length

  const stats = [
    {
      label: 'Total Destinations',
      value: totalDestinations,
      icon: MapPin,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
      borderColor: 'border-blue-500/30'
    },
    {
      label: 'Countries',
      value: totalCountries,
      icon: Globe,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20',
      borderColor: 'border-purple-500/30'
    },
    {
      label: 'Total POIs',
      value: totalPOIs,
      icon: Film,
      color: 'text-green-400',
      bgColor: 'bg-green-500/20',
      borderColor: 'border-green-500/30'
    },
    {
      label: 'Needs Attention',
      value: missingPOIs + missingAirports,
      subtitle: `${missingPOIs} missing POIs, ${missingAirports} missing airports`,
      icon: AlertTriangle,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/20',
      borderColor: 'border-yellow-500/30'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <div
            key={stat.label}
            className={`relative overflow-hidden rounded-xl border ${stat.borderColor} ${stat.bgColor} backdrop-blur-xl p-6 transition-all hover:scale-105`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-white/60 text-sm font-medium mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-white">{stat.value.toLocaleString()}</p>
                {stat.subtitle && (
                  <p className="text-xs text-white/50 mt-2">{stat.subtitle}</p>
                )}
              </div>
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <Icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
