'use client'

import { Plane, Globe, TrendingUp, AlertCircle } from 'lucide-react'

interface OriginAirport {
  airportCode: string
  city: string
  country: string
  routeCount: number
}

interface RouteStatsProps {
  origins: OriginAirport[]
  totalRoutes: number
  directRoutes: number
  connectionRoutes: number
  unknownRoutes: number
  estimatedRoutes: number
}

export function RouteStats({
  origins,
  totalRoutes,
  directRoutes,
  connectionRoutes,
  unknownRoutes,
  estimatedRoutes
}: RouteStatsProps) {
  const uniqueDestinations = new Set(origins.map(o => o.country)).size
  const verifiedRoutes = totalRoutes - estimatedRoutes
  const dataQualityScore = totalRoutes > 0 ? Math.round((verifiedRoutes / totalRoutes) * 100) : 0

  const stats = [
    {
      label: 'Total Routes',
      value: totalRoutes.toLocaleString(),
      icon: Plane,
      color: 'from-blue-500/20 to-blue-600/20',
      iconColor: 'text-blue-400',
      subtext: `${directRoutes.toLocaleString()} direct, ${connectionRoutes.toLocaleString()} connections`
    },
    {
      label: 'Origin Airports',
      value: origins.length.toLocaleString(),
      icon: Globe,
      color: 'from-green-500/20 to-green-600/20',
      iconColor: 'text-green-400',
      subtext: `Across ${uniqueDestinations} countries`
    },
    {
      label: 'Data Quality',
      value: `${dataQualityScore}%`,
      icon: TrendingUp,
      color: 'from-purple-500/20 to-purple-600/20',
      iconColor: 'text-purple-400',
      subtext: `${verifiedRoutes.toLocaleString()} verified routes`
    },
    {
      label: 'Needs Review',
      value: unknownRoutes.toLocaleString(),
      icon: AlertCircle,
      color: 'from-orange-500/20 to-orange-600/20',
      iconColor: 'text-orange-400',
      subtext: unknownRoutes > 0 ? 'Unknown flight types' : 'All routes verified'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={`bg-gradient-to-br ${stat.color} backdrop-blur-xl rounded-xl border border-white/10 p-6`}
        >
          <div className="flex items-center justify-between mb-3">
            <stat.icon className={`w-8 h-8 ${stat.iconColor}`} />
          </div>
          <div>
            <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
            <p className="text-sm font-medium text-white/70">{stat.label}</p>
            <p className="text-xs text-white/50 mt-2">{stat.subtext}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
