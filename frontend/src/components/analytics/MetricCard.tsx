'use client'

import { LucideIcon } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  subtitle?: string
  color?: 'blue' | 'green' | 'purple' | 'yellow' | 'red'
}

const COLOR_CLASSES = {
  blue: 'bg-blue-500/20 text-blue-200 border-blue-500/30',
  green: 'bg-green-500/20 text-green-200 border-green-500/30',
  purple: 'bg-purple-500/20 text-purple-200 border-purple-500/30',
  yellow: 'bg-yellow-500/20 text-yellow-200 border-yellow-500/30',
  red: 'bg-red-500/20 text-red-200 border-red-500/30'
}

export function MetricCard({
  title,
  value,
  icon: Icon,
  trend,
  subtitle,
  color = 'blue'
}: MetricCardProps) {
  return (
    <div className={`${COLOR_CLASSES[color]} backdrop-blur-xl rounded-xl border p-6`}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium opacity-90">{title}</span>
        <Icon className="w-5 h-5 opacity-70" />
      </div>

      <div className="space-y-2">
        <p className="text-3xl font-bold">{value}</p>

        {subtitle && (
          <p className="text-xs opacity-70">{subtitle}</p>
        )}

        {trend && (
          <div className={`text-xs flex items-center gap-1 ${trend.isPositive ? 'text-green-300' : 'text-red-300'}`}>
            <span>{trend.isPositive ? '↑' : '↓'}</span>
            <span>{Math.abs(trend.value)}%</span>
            <span className="opacity-70">vs last period</span>
          </div>
        )}
      </div>
    </div>
  )
}
