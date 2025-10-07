'use client'

import React, { useState, useEffect } from 'react'
import { getCountries, getCountryWithCities, createCountry, updateCountry, deleteCountry } from '@/actions/countryActions'
import { ManagePOIModal } from '@/components/admin/poi/ManagePOIModal'
import { ChevronDown, ChevronRight } from 'lucide-react'

interface Country {
  id: string
  name: string
  code: string
  mapSvg?: string | null
  _count: {
    destinations: number
  }
}

interface CityInCountry {
  id: string
  cityName: string
  airportCode: string | null
  airports: Array<{
    iataCode: string
    name: string
    isPrimary: boolean
  }>
  _count: {
    themePOIs: number
  }
}

export default function CountriesPage() {
  const [countries, setCountries] = useState<Country[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingCountry, setEditingCountry] = useState<Country | null>(null)
  const [formData, setFormData] = useState({ name: '', code: '', mapSvg: '' })

  // Expansion state
  const [expandedCountryId, setExpandedCountryId] = useState<string | null>(null)
  const [citiesInCountry, setCitiesInCountry] = useState<CityInCountry[]>([])
  const [loadingCities, setLoadingCities] = useState(false)

  // POI Modal state
  const [selectedDestinationId, setSelectedDestinationId] = useState<string | null>(null)

  useEffect(() => {
    loadCountries()
  }, [])

  async function loadCountries() {
    setIsLoading(true)
    const result = await getCountries()
    if (result.success && result.data) {
      setCountries(result.data)
    }
    setIsLoading(false)
  }

  function openCreateForm() {
    setEditingCountry(null)
    setFormData({ name: '', code: '', mapSvg: '' })
    setIsFormOpen(true)
  }

  function openEditForm(country: Country) {
    setEditingCountry(country)
    setFormData({ name: country.name, code: country.code, mapSvg: country.mapSvg || '' })
    setIsFormOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (editingCountry) {
      const result = await updateCountry(editingCountry.id, formData)
      if (result.success) {
        await loadCountries()
        setIsFormOpen(false)
      } else {
        alert(result.error)
      }
    } else {
      const result = await createCountry(formData)
      if (result.success) {
        await loadCountries()
        setIsFormOpen(false)
      } else {
        alert(result.error)
      }
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this country?')) return

    const result = await deleteCountry(id)
    if (result.success) {
      await loadCountries()
    } else {
      alert(result.error)
    }
  }

  async function toggleCountryExpansion(countryId: string) {
    if (expandedCountryId === countryId) {
      // Collapse
      setExpandedCountryId(null)
      setCitiesInCountry([])
    } else {
      // Expand
      setExpandedCountryId(countryId)
      setLoadingCities(true)
      const result = await getCountryWithCities(countryId)
      if (result.success && result.data) {
        setCitiesInCountry(result.data)
      }
      setLoadingCities(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-white/30 border-t-white"></div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Countries</h1>
          <p className="text-white/70 mt-1">Manage countries for destination organization</p>
        </div>
        <button
          onClick={openCreateForm}
          className="bg-white text-brand-purple px-4 py-2 rounded-lg font-medium hover:bg-white/90 transition-colors"
        >
          + Add Country
        </button>
      </div>

      {/* Table */}
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden">
        <table className="min-w-full divide-y divide-white/10">
          <thead className="bg-white/5">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                Country Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                ISO Code
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                Destinations
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-white/70 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {countries.map((country) => {
              const isExpanded = expandedCountryId === country.id
              return (
                <React.Fragment key={country.id}>
                  {/* Main Country Row */}
                  <tr
                    onClick={() => toggleCountryExpansion(country.id)}
                    className="hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-white/70" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-white/70" />
                        )}
                        {country.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white/70">
                      {country.code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white/70">
                      {country._count.destinations} cities
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          openEditForm(country)
                        }}
                        className="text-blue-300 hover:text-blue-200"
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(country.id)
                        }}
                        className="text-red-300 hover:text-red-200"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>

                  {/* Expanded Cities Section */}
                  {isExpanded && (
                    <tr>
                      <td colSpan={4} className="bg-white/5 px-6 py-4">
                        {loadingCities ? (
                          <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-4 border-white/30 border-t-white"></div>
                          </div>
                        ) : citiesInCountry.length === 0 ? (
                          <div className="text-center py-8 text-white/50">
                            No cities in this country yet
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {/* Summary */}
                            <div className="flex items-center gap-6 text-sm text-white/70 pb-2 border-b border-white/10">
                              <span>{citiesInCountry.length} cities</span>
                              <span>{citiesInCountry.reduce((sum, city) => sum + city._count.themePOIs, 0)} total POIs</span>
                              <span>{citiesInCountry.reduce((sum, city) => sum + city.airports.length, 0)} airports</span>
                            </div>

                            {/* Nested Cities Table */}
                            <table className="min-w-full">
                              <thead>
                                <tr className="text-xs text-white/50 uppercase">
                                  <th className="text-left pb-2">City Name</th>
                                  <th className="text-left pb-2">Airports</th>
                                  <th className="text-left pb-2">POIs</th>
                                  <th className="text-right pb-2">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/5">
                                {citiesInCountry.map((city) => (
                                  <tr key={city.id} className="hover:bg-white/5 transition-colors">
                                    <td className="py-3 text-sm text-white">
                                      {city.cityName}
                                    </td>
                                    <td className="py-3 text-sm text-white/70">
                                      <div className="flex flex-wrap gap-1">
                                        {city.airports.length > 0 ? (
                                          city.airports.map((airport) => (
                                            <span
                                              key={airport.iataCode}
                                              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                                airport.isPrimary
                                                  ? 'bg-white/20 text-white'
                                                  : 'bg-white/10 text-white/70'
                                              }`}
                                              title={airport.name}
                                            >
                                              {airport.iataCode}
                                              {airport.isPrimary && ' ★'}
                                            </span>
                                          ))
                                        ) : city.airportCode ? (
                                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-white/20 text-white">
                                            {city.airportCode}
                                          </span>
                                        ) : (
                                          <span className="text-white/50">No airports</span>
                                        )}
                                      </div>
                                    </td>
                                    <td className="py-3 text-sm text-white/70">
                                      {city._count.themePOIs} POIs
                                    </td>
                                    <td className="py-3 text-right text-sm">
                                      <button
                                        onClick={() => setSelectedDestinationId(city.id)}
                                        className="text-blue-300 hover:text-blue-200"
                                      >
                                        Manage POIs
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              )
            })}
          </tbody>
        </table>

        {countries.length === 0 && (
          <div className="text-center py-12">
            <p className="text-white/50">No countries yet. Add your first one!</p>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold text-white mb-4">
              {editingCountry ? 'Edit Country' : 'Add Country'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Country Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40"
                  placeholder="United States"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  ISO Code
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40 uppercase"
                  placeholder="US"
                  maxLength={2}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Map SVG Code (Optional)
                </label>
                <textarea
                  value={formData.mapSvg}
                  onChange={(e) => setFormData({ ...formData, mapSvg: e.target.value })}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40 font-mono text-xs resize-y"
                  placeholder='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">...</svg>'
                  rows={6}
                />
                <p className="text-xs text-white/50 mt-1">
                  Paste the complete SVG code for the country map outline
                </p>
                {formData.mapSvg && (
                  <div className="mt-2 p-3 bg-white/5 rounded-lg border border-white/10">
                    <div className="text-xs text-white/70 mb-2">Preview:</div>
                    <div
                      className="w-16 h-16 mx-auto"
                      dangerouslySetInnerHTML={{ __html: formData.mapSvg }}
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 text-white/70 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-white text-brand-purple rounded-lg font-medium hover:bg-white/90 transition-colors"
                >
                  {editingCountry ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POI Management Modal */}
      <ManagePOIModal
        destinationId={selectedDestinationId}
        isOpen={selectedDestinationId !== null}
        onClose={() => setSelectedDestinationId(null)}
        onSuccess={loadCountries}
      />
    </div>
  )
}
