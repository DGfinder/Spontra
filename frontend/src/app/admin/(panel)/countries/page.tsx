'use client'

import { useState, useEffect } from 'react'
import { getCountries, createCountry, updateCountry, deleteCountry } from '@/actions/countryActions'

interface Country {
  id: string
  name: string
  code: string
  _count: {
    destinations: number
  }
}

export default function CountriesPage() {
  const [countries, setCountries] = useState<Country[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingCountry, setEditingCountry] = useState<Country | null>(null)
  const [formData, setFormData] = useState({ name: '', code: '' })

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
    setFormData({ name: '', code: '' })
    setIsFormOpen(true)
  }

  function openEditForm(country: Country) {
    setEditingCountry(country)
    setFormData({ name: country.name, code: country.code })
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
            {countries.map((country) => (
              <tr key={country.id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                  {country.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white/70">
                  {country.code}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white/70">
                  {country._count.destinations} cities
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                  <button
                    onClick={() => openEditForm(country)}
                    className="text-blue-300 hover:text-blue-200"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(country.id)}
                    className="text-red-300 hover:text-red-200"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
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
    </div>
  )
}
