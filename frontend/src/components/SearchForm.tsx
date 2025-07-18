'use client'

import { useState } from 'react'

interface SearchFormData {
  origin: string
  destination: string
  departureDate: string
  returnDate?: string
  passengers: number
  tripType: 'roundtrip' | 'oneway'
}

export function SearchForm() {
  const [formData, setFormData] = useState<SearchFormData>({
    origin: '',
    destination: '',
    departureDate: '',
    returnDate: '',
    passengers: 1,
    tripType: 'roundtrip'
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement search functionality
    console.log('Search form submitted:', formData)
  }

  const handleInputChange = (field: keyof SearchFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Trip Type Selector */}
      <div className="flex mb-6">
        <button
          type="button"
          onClick={() => handleInputChange('tripType', 'roundtrip')}
          className={`px-4 py-2 rounded-l-lg font-medium transition-colors ${
            formData.tripType === 'roundtrip'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Roundtrip
        </button>
        <button
          type="button"
          onClick={() => handleInputChange('tripType', 'oneway')}
          className={`px-4 py-2 rounded-r-lg font-medium transition-colors ${
            formData.tripType === 'oneway'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          One way
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Origin */}
          <div>
            <label htmlFor="origin" className="block text-sm font-medium text-gray-700 mb-1">
              From
            </label>
            <input
              type="text"
              id="origin"
              placeholder="Origin city or airport"
              value={formData.origin}
              onChange={(e) => handleInputChange('origin', e.target.value)}
              className="input-field"
              required
            />
          </div>

          {/* Destination */}
          <div>
            <label htmlFor="destination" className="block text-sm font-medium text-gray-700 mb-1">
              To
            </label>
            <input
              type="text"
              id="destination"
              placeholder="Destination city or airport"
              value={formData.destination}
              onChange={(e) => handleInputChange('destination', e.target.value)}
              className="input-field"
              required
            />
          </div>

          {/* Departure Date */}
          <div>
            <label htmlFor="departureDate" className="block text-sm font-medium text-gray-700 mb-1">
              Departure
            </label>
            <input
              type="date"
              id="departureDate"
              value={formData.departureDate}
              onChange={(e) => handleInputChange('departureDate', e.target.value)}
              className="input-field"
              required
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Return Date */}
          {formData.tripType === 'roundtrip' && (
            <div>
              <label htmlFor="returnDate" className="block text-sm font-medium text-gray-700 mb-1">
                Return
              </label>
              <input
                type="date"
                id="returnDate"
                value={formData.returnDate}
                onChange={(e) => handleInputChange('returnDate', e.target.value)}
                className="input-field"
                min={formData.departureDate || new Date().toISOString().split('T')[0]}
              />
            </div>
          )}

          {/* Passengers */}
          <div className={formData.tripType === 'oneway' ? 'lg:col-start-4' : ''}>
            <label htmlFor="passengers" className="block text-sm font-medium text-gray-700 mb-1">
              Passengers
            </label>
            <select
              id="passengers"
              value={formData.passengers}
              onChange={(e) => handleInputChange('passengers', parseInt(e.target.value))}
              className="input-field"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                <option key={num} value={num}>
                  {num} {num === 1 ? 'passenger' : 'passengers'}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search Button */}
        <div className="flex justify-center">
          <button
            type="submit"
            className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200 text-lg"
          >
            Search Flights
          </button>
        </div>
      </form>
    </div>
  )
}