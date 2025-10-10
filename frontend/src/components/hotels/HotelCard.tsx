'use client'

import { Star, ExternalLink } from 'lucide-react'

interface HotelCardProps {
  hotel: {
    hotelId: string | number
    hotelName: string
    location?: {
      lat: number
      lon: number
    }
    priceFrom: number
    stars?: number
    link?: string
    photoUrl?: string
    address?: string
  }
  checkIn: string
  checkOut: string
}

export function HotelCard({ hotel, checkIn, checkOut }: HotelCardProps) {
  const handleBookingClick = () => {
    if (hotel.link) {
      // Track click in future (affiliate tracking)
      window.open(hotel.link, '_blank', 'noopener,noreferrer')
    }
  }

  // Generate placeholder image if no photo
  const imageUrl = hotel.photoUrl || `https://source.unsplash.com/400x400/?hotel,${encodeURIComponent(hotel.hotelName)}`

  return (
    <div
      className="group bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20
                 hover:bg-white/15 hover:border-white/30 hover:scale-[1.02]
                 transition-all duration-300 transform-gpu shadow-xl hover:shadow-2xl relative"
      style={{
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 24px rgba(127, 106, 228, 0.1)'
      }}
    >
      {/* Circular Hotel Image */}
      <div className="flex justify-center mb-4">
        <div
          className="w-32 h-32 rounded-full overflow-hidden border-4 border-white/20
                     group-hover:border-white/30 transition-all duration-300 shadow-lg"
          style={{
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)'
          }}
        >
          <img
            src={imageUrl}
            alt={hotel.hotelName}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            onError={(e) => {
              // Fallback to generic hotel image if specific one fails
              (e.target as HTMLImageElement).src = 'https://source.unsplash.com/400x400/?luxury-hotel,resort'
            }}
          />
        </div>
      </div>

      {/* Hotel Info */}
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2 min-h-[3.5rem]">
          {hotel.hotelName}
        </h3>

        {/* Star Rating */}
        {hotel.stars && hotel.stars > 0 && (
          <div className="flex items-center justify-center gap-1 mb-2">
            {Array.from({ length: hotel.stars }).map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            ))}
          </div>
        )}

        {/* Address (if available) */}
        {hotel.address && (
          <p className="text-white/60 text-xs mb-2 line-clamp-1">
            {hotel.address}
          </p>
        )}
      </div>

      {/* Price */}
      <div className="text-center mb-4">
        <div className="inline-block bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
          <p className="text-white/70 text-xs mb-1">From</p>
          <p className="text-white font-bold text-xl">
            ${hotel.priceFrom}
            <span className="text-sm font-normal text-white/70">/night</span>
          </p>
        </div>
      </div>

      {/* Book Button */}
      <button
        onClick={handleBookingClick}
        disabled={!hotel.link}
        className="w-full bg-[#7f6ae4] hover:bg-[#6b5ac8] text-white font-semibold
                 py-3 px-6 rounded-xl transition-all duration-200
                 disabled:opacity-50 disabled:cursor-not-allowed
                 flex items-center justify-center gap-2 group/btn
                 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98]"
      >
        <span>View Hotel</span>
        <ExternalLink className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
      </button>

      {/* Multi-Provider Info Badge */}
      <div className="mt-3 text-center">
        <p className="text-white/50 text-xs">
          Compare prices from multiple providers
        </p>
      </div>
    </div>
  )
}
