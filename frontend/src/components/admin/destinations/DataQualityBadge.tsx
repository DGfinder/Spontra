'use client'

import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'

interface DataQualityBadgeProps {
  hasAirports: boolean
  poiCount: number
}

export type DataQuality = 'complete' | 'warning' | 'empty'

export function getDataQuality(hasAirports: boolean, poiCount: number): DataQuality {
  if (hasAirports && poiCount > 0) return 'complete'
  if (!hasAirports && poiCount === 0) return 'empty'
  return 'warning'
}

export function DataQualityBadge({ hasAirports, poiCount }: DataQualityBadgeProps) {
  const quality = getDataQuality(hasAirports, poiCount)

  const config = {
    complete: {
      icon: CheckCircle2,
      label: 'Complete',
      className: 'bg-green-500/20 text-green-300 border-green-500/30'
    },
    warning: {
      icon: AlertTriangle,
      label: 'Needs Attention',
      className: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
    },
    empty: {
      icon: XCircle,
      label: 'Empty',
      className: 'bg-red-500/20 text-red-300 border-red-500/30'
    }
  }

  const { icon: Icon, label, className } = config[quality]

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${className}`}
      title={
        quality === 'complete'
          ? 'Has airports and POIs'
          : quality === 'warning'
          ? hasAirports
            ? 'Missing POIs'
            : 'Missing airports'
          : 'Missing both airports and POIs'
      }
    >
      <Icon className="w-3.5 h-3.5" />
      <span>{label}</span>
    </span>
  )
}
