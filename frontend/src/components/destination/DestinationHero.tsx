'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, MapPin, Plane } from 'lucide-react'
import { Button } from '../ui/Button'
import { PriceWidget } from '../booking/PriceWidget'
import { BookingModal } from '../booking/BookingModal'
import type { DestinationData } from '../DestinationDetail'

interface DestinationHeroProps {
  destination: DestinationData
  originAirport?: string
  departureDate?: string
  returnDate?: string
  cachedPrice?: number
  cachedDuration?: number
}

export function DestinationHero({
  destination,
  originAirport,
  departureDate,
  returnDate,
  cachedPrice,
  cachedDuration
}: DestinationHeroProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const airportDisplay = destination.airportCode || 'Airport info unavailable'

  return (
    <div className="relative py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to search</span>
        </Link>

        {/* Hero Content */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl md:text-6xl font-bold text-white">
            {destination.cityName}
          </h1>

          <div className="flex items-center justify-center gap-4 text-white/80">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              <span className="text-lg">
                {destination.country?.name || 'Unknown Country'}
              </span>
            </div>

            <span className="text-white/40">•</span>

            <div className="flex items-center gap-2">
              <Plane className="w-5 h-5" />
              <span className="text-lg">{airportDisplay}</span>
            </div>
          </div>

          {destination.description && (
            <p className="text-xl text-white/70 max-w-3xl mx-auto mt-6">
              {destination.description}
            </p>
          )}

          {/* Price Widget */}
          {originAirport && destination.airportCode && (
            <div className="max-w-2xl mx-auto mt-8">
              <PriceWidget
                origin={originAirport}
                destination={destination.airportCode}
                cityName={destination.cityName}
                departureDate={departureDate}
                cachedPrice={cachedPrice}
                cachedDuration={cachedDuration}
                onBookClick={() => setIsModalOpen(true)}
              />
            </div>
          )}

          {/* CTA Buttons */}
          <div className="flex items-center justify-center gap-4 pt-6">
            <Button
              variant="primary"
              size="lg"
              onClick={() => {
                // Scroll to video feed
                const feed = document.getElementById('poi-feed')
                feed?.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              Explore Videos
            </Button>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {originAirport && destination.airportCode && (
        <BookingModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          origin={originAirport}
          destination={destination.airportCode}
          cityName={destination.cityName}
          departureDate={departureDate}
          returnDate={returnDate}
        />
      )}
    </div>
  )
}
