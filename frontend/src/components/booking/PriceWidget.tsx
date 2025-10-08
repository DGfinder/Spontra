'use client'

import { useEffect, useState } from 'react'
import { Plane, TrendingDown, Loader2 } from 'lucide-react'
import { searchAviasalesFlights } from '@/app/actions/travelpayouts'

interface PriceWidgetProps {
  origin?: string
  destination: string
  cityName: string
  onBookClick?: (price: number) => void
}

export function PriceWidget({ origin, destination, cityName, onBookClick }: PriceWidgetProps) {
  const [price, setPrice] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!origin || !destination) {
      setLoading(false)
      return
    }

    async function fetchPrice() {
      try {
        // Get price for 30 days from now
        const departureDate = new Date()
        departureDate.setDate(departureDate.getDate() + 30)
        const departureDateStr = departureDate.toISOString().split('T')[0]

        const result = await searchAviasalesFlights({
          origin,
          destination,
          departureDate: departureDateStr,
          adults: 1
        })

        if (result.success && result.data?.flights?.[0]) {
          setPrice(result.data.flights[0].price)
        } else {
          setError(true)
        }
      } catch (err) {
        console.error('Price fetch error:', err)
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchPrice()
  }, [origin, destination])

  // Don't render if no origin (anonymous user)
  if (!origin) {
    return null
  }

  // Don't show error state, just hide widget
  if (error) {
    return null
  }

  return (
    <div className="relative">
      {/* Subtle glass card */}
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-4 shadow-xl">
        <div className="flex items-center justify-between gap-4">
          {/* Flight info */}
          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2.5">
              <Plane className="w-5 h-5 text-white" />
            </div>

            <div className="flex flex-col">
              <span className="text-white/60 text-xs font-medium uppercase tracking-wider">
                Flights to {cityName}
              </span>

              {loading ? (
                <div className="flex items-center gap-2 mt-1">
                  <Loader2 className="w-4 h-4 text-white/40 animate-spin" />
                  <span className="text-white/40 text-sm">Finding best price...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-white text-sm">From</span>
                  <span className="text-2xl font-bold text-white">
                    ${price?.toFixed(0)}
                  </span>
                  <span className="text-white/60 text-sm">USD</span>
                </div>
              )}
            </div>
          </div>

          {/* CTA Button */}
          {!loading && price && (
            <button
              onClick={() => onBookClick?.(price)}
              className="bg-brand-blue hover:bg-brand-blue/90 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98] whitespace-nowrap"
            >
              View Flights
            </button>
          )}
        </div>

        {/* Subtle "Best price" indicator */}
        {!loading && price && (
          <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-white/10">
            <TrendingDown className="w-3.5 h-3.5 text-green-400" />
            <span className="text-xs text-white/50">
              Lowest price from {origin} in the next 30 days
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
