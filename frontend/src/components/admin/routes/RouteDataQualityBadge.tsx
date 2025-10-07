'use client'

import { CheckCircle, AlertTriangle, HelpCircle } from 'lucide-react'

export type RouteDataQuality = 'verified' | 'estimated' | 'unknown'

interface RouteDataQualityBadgeProps {
  isEstimated: boolean
  isDirect: boolean | null
}

export function getRouteDataQuality(isEstimated: boolean, isDirect: boolean | null): RouteDataQuality {
  if (!isEstimated && isDirect !== null) {
    return 'verified'
  }
  if (isEstimated && isDirect !== null) {
    return 'estimated'
  }
  return 'unknown'
}

export function RouteDataQualityBadge({ isEstimated, isDirect }: RouteDataQualityBadgeProps) {
  const quality = getRouteDataQuality(isEstimated, isDirect)

  const configs = {
    verified: {
      label: 'Verified',
      icon: CheckCircle,
      bgClass: 'bg-green-500/20',
      textClass: 'text-green-300',
      borderClass: 'border-green-500/30'
    },
    estimated: {
      label: 'Estimated',
      icon: AlertTriangle,
      bgClass: 'bg-yellow-500/20',
      textClass: 'text-yellow-300',
      borderClass: 'border-yellow-500/30'
    },
    unknown: {
      label: 'Needs Review',
      icon: HelpCircle,
      bgClass: 'bg-red-500/20',
      textClass: 'text-red-300',
      borderClass: 'border-red-500/30'
    }
  }

  const config = configs[quality]
  const Icon = config.icon

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.bgClass} ${config.textClass} ${config.borderClass}`}
      title={`Data quality: ${config.label}`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span>{config.label}</span>
    </div>
  )
}
