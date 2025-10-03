'use client'

import Link from 'next/link'
import { ArrowLeft, MapPin, Plane } from 'lucide-react'
import { Button } from '../ui/Button'
import { generateSkyscannerLink, trackAffiliateClick } from '@/lib/affiliate'
import type { DestinationData } from '../DestinationDetail'

interface DestinationHeroProps {
  destination: DestinationData
  originAirport?: string
}

export function DestinationHero({ destination, originAirport }: DestinationHeroProps) {
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

            {originAirport && destination.airportCode && (
              <Button
                variant="secondary"
                size="lg"
                onClick={() => {
                  // Generate affiliate link with 30 days from now as departure
                  const departureDate = new Date()
                  departureDate.setDate(departureDate.getDate() + 30)
                  const departureDateStr = departureDate.toISOString().split('T')[0]

                  const affiliateUrl = generateSkyscannerLink({
                    origin: originAirport,
                    destination: destination.airportCode!,
                    departureDate: departureDateStr,
                    adults: 1
                  })

                  // Track the click
                  trackAffiliateClick({
                    provider: 'skyscanner',
                    origin: originAirport,
                    destination: destination.airportCode!
                  })

                  window.open(affiliateUrl, '_blank')
                }}
              >
                Book Flights
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
