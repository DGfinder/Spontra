'use client'

import { Database } from 'lucide-react'

interface CacheIndicatorProps {
  isVisible?: boolean
  className?: string
}

export function CacheIndicator({ isVisible = true, className = '' }: CacheIndicatorProps) {
  if (!isVisible) return null

  return (
    <div className={`flex items-center gap-2 text-xs text-gray-500 ${className}`}>
      <Database className="w-4 h-4" />
      <span>Data cached for performance</span>
    </div>
  )
}