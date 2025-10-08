'use client'

import { useEffect, useState } from 'react'
import { Plane } from 'lucide-react'
import { getCheapestPrice } from '@/app/actions/travelpayouts-calendar'

interface PriceBadgeProps {
  origin?: string
  destination: string
  themeColor?: string
}

/**
 * Minimal price badge for destination cards
 * Shows "From $XXX" if price available
 */
export function PriceBadge({ origin, destination, themeColor = '#3b82f6' }: PriceBadgeProps) {
  const [price, setPrice] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!origin || !destination) {
      setLoading(false)
      return
    }

    async function fetchPrice() {
      try {
        const result = await getCheapestPrice({ origin, destination })
        setPrice(result)
      } catch (err) {
        console.error('Price badge error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchPrice()
  }, [origin, destination])

  // Don't render if no origin or loading/error
  if (!origin || loading || !price) {
    return null
  }

  return (
    <div
      className="absolute top-3 right-3 bg-black/60 backdrop-blur-md rounded-full px-3 py-1.5 flex items-center gap-1.5 shadow-lg border border-white/20"
      style={{
        borderColor: `${themeColor}40`
      }}
    >
      <Plane className="w-3 h-3 text-white" />
      <span className="text-white text-sm font-semibold">
        ${price}
      </span>
    </div>
  )
}
