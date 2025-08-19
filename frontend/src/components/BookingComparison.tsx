'use client'

import { useState } from 'react'
import { ExternalLink, Star, Shield, Zap, Gift, TrendingDown, Info } from 'lucide-react'
import { BookingOption, generateBookingOptions, getBestBookingOption, comparePrices } from '@/services/bookingService'

interface BookingComparisonProps {
  airlineCode: string
  basePrice: number
  currency: string
  flightId: string
  onBookingSelect: (option: BookingOption) => void
  className?: string
}

export function BookingComparison({
  airlineCode,
  basePrice,
  currency,
  flightId,
  onBookingSelect,
  className = ''
}: BookingComparisonProps) {
  const [showAllOptions, setShowAllOptions] = useState(false)
  
  const bookingOptions = generateBookingOptions(airlineCode, basePrice, currency, flightId)
  const bestOption = getBestBookingOption(bookingOptions)
  const { cheapest, savings, airlineDirect } = comparePrices(bookingOptions)
  
  const displayOptions = showAllOptions ? bookingOptions : bookingOptions.slice(0, 3)

  const getProviderTypeIcon = (type: string) => {
    switch (type) {
      case 'airline': return <Shield size={16} className="text-blue-400" />
      case 'ota': return <Zap size={16} className="text-purple-400" />
      case 'aggregator': return <Info size={16} className="text-green-400" />
      default: return null
    }
  }

  const getProviderTypeLabel = (type: string) => {
    switch (type) {
      case 'airline': return 'Airline Direct'
      case 'ota': return 'Travel Agency'
      case 'aggregator': return 'Price Comparison'
      default: return ''
    }
  }

  return (
    <div className={`bg-black/20 backdrop-blur-sm rounded-xl border border-white/20 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-white font-bold text-lg">Compare Booking Options</h3>
          <p className="text-white/60 text-sm">
            {savings > 0 && `Save up to ${currency}${savings} by comparing prices`}
          </p>
        </div>
        {bestOption && (
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-1 rounded-full text-sm font-medium">
            <Star size={12} className="inline mr-1" />
            Best Value
          </div>
        )}
      </div>

      {/* Booking Options */}
      <div className="space-y-3">
        {displayOptions.map((option, index) => (
          <div
            key={option.provider.id}
            className={`relative border rounded-lg p-4 transition-all hover:border-white/40 cursor-pointer ${
              option.provider.id === bestOption.provider.id
                ? 'border-green-400 bg-green-400/5'
                : 'border-white/20 bg-white/5'
            }`}
            onClick={() => onBookingSelect(option)}
          >
            {/* Best Option Badge */}
            {option.provider.id === bestOption.provider.id && (
              <div className="absolute -top-2 left-4 bg-gradient-to-r from-green-400 to-emerald-500 text-black text-xs font-bold px-2 py-1 rounded">
                Recommended
              </div>
            )}

            <div className="flex items-center justify-between">
              {/* Provider Info */}
              <div className="flex items-center space-x-3">
                {option.provider.logoUrl && (
                  <img
                    src={option.provider.logoUrl}
                    alt={option.provider.name}
                    className="w-8 h-8 object-contain rounded"
                  />
                )}
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-white font-medium">{option.provider.name}</span>
                    {getProviderTypeIcon(option.provider.type)}
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-white/60">
                    <span>{getProviderTypeLabel(option.provider.type)}</span>
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star
                          key={i}
                          size={10}
                          className={i < option.provider.trustScore ? 'text-yellow-400' : 'text-gray-500'}
                          fill="currentColor"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Price and Action */}
              <div className="text-right">
                <div className="flex items-center space-x-2">
                  {option.price === cheapest.price && option.provider.id !== cheapest.provider.id && (
                    <TrendingDown size={16} className="text-green-400" />
                  )}
                  <span className="text-white font-bold text-lg">
                    {currency}{option.price}
                  </span>
                </div>
                {option.provider.bookingFee && option.provider.bookingFee > 0 && (
                  <div className="text-xs text-white/60">
                    +{currency}{option.provider.bookingFee} booking fee
                  </div>
                )}
                <div className="mt-2">
                  <button className="bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded text-sm transition-colors flex items-center space-x-1">
                    <span>Book Now</span>
                    <ExternalLink size={12} />
                  </button>
                </div>
              </div>
            </div>

            {/* Benefits */}
            {option.benefits && option.benefits.length > 0 && (
              <div className="mt-3 pt-3 border-t border-white/10">
                <div className="flex flex-wrap gap-2">
                  {option.benefits.slice(0, 3).map((benefit, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center space-x-1 bg-white/10 text-white text-xs px-2 py-1 rounded"
                    >
                      <Gift size={10} />
                      <span>{benefit}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Show More/Less Button */}
      {optimizedOptions.length > 3 && (
        <button
          onClick={() => setShowAllOptions(!showAllOptions)}
          className="w-full mt-4 text-white/70 hover:text-white text-sm border border-white/20 rounded-lg py-2 transition-colors"
        >
          {showAllOptions ? 'Show Less' : `Show ${optimizedOptions.length - 3} More Options`}
        </button>
      )}

      {/* Price Comparison Summary */}
      <div className="mt-6 bg-blue-500/10 border border-blue-400/20 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Info size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="text-blue-200 font-medium mb-2">Booking Tips:</p>
            <ul className="text-blue-200/80 space-y-1 text-xs">
              <li>• Airline direct bookings often include better customer service and flexibility</li>
              <li>• Travel agencies may offer package deals and additional protection</li>
              <li>• Price comparison sites help you find the best deals across multiple providers</li>
              {airlineDirect && (
                <li>• Booking direct with {airlineDirect.provider.name} includes loyalty program benefits</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}