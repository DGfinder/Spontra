'use client'

import { Clock, CheckCircle, XCircle, Video } from 'lucide-react'

interface ModerationStatsProps {
  stats: {
    pending: number
    approved: number
    rejected: number
    total: number
  }
}

export function ModerationStats({ stats }: ModerationStatsProps) {
  const statCards = [
    {
      label: 'Pending Review',
      value: stats.pending,
      icon: Clock,
      color: 'bg-yellow-500/20 text-yellow-200 border-yellow-500/30'
    },
    {
      label: 'Approved',
      value: stats.approved,
      icon: CheckCircle,
      color: 'bg-green-500/20 text-green-200 border-green-500/30'
    },
    {
      label: 'Rejected',
      value: stats.rejected,
      icon: XCircle,
      color: 'bg-red-500/20 text-red-200 border-red-500/30'
    },
    {
      label: 'Total Videos',
      value: stats.total,
      icon: Video,
      color: 'bg-blue-500/20 text-blue-200 border-blue-500/30'
    }
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat) => {
        const Icon = stat.icon
        return (
          <div
            key={stat.label}
            className={`${stat.color} backdrop-blur-xl rounded-xl border p-4`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">{stat.label}</span>
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-3xl font-bold">{stat.value}</p>
          </div>
        )
      })}
    </div>
  )
}
