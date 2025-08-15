'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, DollarSign, Calculator, Info } from 'lucide-react'

interface PriceBreakdownProps {
  totalPrice: number
  currency: string
  baseFare?: number
  taxes?: number
  fees?: number
  baggage?: number
  seats?: number
  className?: string
  showDetails?: boolean
}

export function PriceBreakdown({
  totalPrice,
  currency,
  baseFare,
  taxes,
  fees,
  baggage = 0,
  seats = 0,
  className = '',
  showDetails = false
}: PriceBreakdownProps) {
  const [expanded, setExpanded] = useState(showDetails)

  // Calculate breakdown if not provided
  const calculatedBaseFare = baseFare || Math.round(totalPrice * 0.75)
  const calculatedTaxes = taxes || Math.round(totalPrice * 0.20)
  const calculatedFees = fees || Math.round(totalPrice * 0.05)

  const breakdown = [
    { label: 'Base Fare', amount: calculatedBaseFare, color: 'text-green-400' },
    { label: 'Taxes', amount: calculatedTaxes, color: 'text-blue-400' },
    { label: 'Fees', amount: calculatedFees, color: 'text-purple-400' }
  ]

  if (baggage > 0) {
    breakdown.push({ label: 'Baggage', amount: baggage, color: 'text-orange-400' })
  }

  if (seats > 0) {
    breakdown.push({ label: 'Seat Selection', amount: seats, color: 'text-pink-400' })
  }

  return (
    <div className={`bg-black/20 backdrop-blur-sm rounded-lg border border-white/10 ${className}`}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center space-x-2">
          <Calculator size={16} className="text-white/60" />
          <span className="text-white font-medium">Price Breakdown</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-white font-bold text-lg">{currency}{totalPrice}</span>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {/* Breakdown Details */}
      {expanded && (
        <div className="border-t border-white/10 p-4 space-y-3">
          {breakdown.map((item, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <span className="text-white/80">{item.label}</span>
              <span className={`font-medium ${item.color}`}>
                {currency}{item.amount}
              </span>
            </div>
          ))}
          
          <div className="border-t border-white/10 pt-3 flex items-center justify-between font-bold">
            <span className="text-white">Total</span>
            <span className="text-yellow-400 text-lg">{currency}{totalPrice}</span>
          </div>

          <div className="bg-blue-500/10 border border-blue-400/20 rounded p-2 text-xs">
            <div className="flex items-start space-x-2">
              <Info size={12} className="text-blue-400 mt-0.5 flex-shrink-0" />
              <p className="text-blue-200">
                All prices include taxes and mandatory fees. Additional services like baggage and seat selection are optional.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Fare Class Selection Component
interface FareClass {
  type: 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST'
  name: string
  price: number
  currency: string
  features: string[]
  baggage?: string
  popular?: boolean
}

interface FareClassSelectorProps {
  fareClasses: FareClass[]
  selectedClass?: string
  onSelect: (fareClass: FareClass) => void
  className?: string
}

export function FareClassSelector({ 
  fareClasses, 
  selectedClass, 
  onSelect, 
  className = '' 
}: FareClassSelectorProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      <h3 className="text-white font-semibold text-lg mb-4">Choose Your Fare</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fareClasses.map((fareClass, index) => (
          <div
            key={index}
            onClick={() => onSelect(fareClass)}
            className={`relative cursor-pointer border rounded-xl p-4 transition-all duration-300 hover:scale-105 ${
              selectedClass === fareClass.type
                ? 'border-yellow-400 bg-yellow-400/10'
                : 'border-white/20 bg-black/20 hover:border-white/40'
            }`}
          >
            {fareClass.popular && (
              <div className="absolute -top-2 left-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs font-bold px-2 py-1 rounded">
                Most Popular
              </div>
            )}

            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-semibold text-white">{fareClass.name}</h4>
                {fareClass.baggage && (
                  <p className="text-white/60 text-sm">{fareClass.baggage}</p>
                )}
              </div>
              <div className="text-right">
                <div className="text-white font-bold text-lg">
                  {fareClass.currency}{fareClass.price}
                </div>
              </div>
            </div>

            <ul className="space-y-1 text-sm text-white/80">
              {fareClass.features.map((feature, idx) => (
                <li key={idx} className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}