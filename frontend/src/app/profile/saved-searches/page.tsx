/**
 * Saved Searches Page
 *
 * Displays user's saved flight searches with options to:
 * - Re-run searches
 * - Enable/disable price alerts
 * - Delete saved searches
 */

'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Trash2, Bell, BellOff, Search, Plane, Clock } from 'lucide-react'
import { toast } from 'react-toastify'

interface SavedSearch {
  id: string
  originAirport: string
  theme: string | null
  minFlightTime: number | null
  maxFlightTime: number | null
  priceAlertEnabled: boolean
  createdAt: string
  updatedAt: string
}

export default function SavedSearchesPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [searches, setSearches] = useState<SavedSearch[]>([])
  const [isLoadingSearches, setIsLoadingSearches] = useState(true)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    } else if (user) {
      fetchSavedSearches()
    }
  }, [user, isLoading, router])

  const fetchSavedSearches = async () => {
    try {
      const response = await fetch('/api/user/saved-searches', {
        credentials: 'include',
      })

      const data = await response.json()

      if (data.success) {
        setSearches(data.searches)
      } else {
        toast.error('Failed to load saved searches')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setIsLoadingSearches(false)
    }
  }

  const handleDeleteSearch = async (id: string) => {
    try {
      const response = await fetch(`/api/user/saved-searches/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      const data = await response.json()

      if (data.success) {
        setSearches(searches.filter((s) => s.id !== id))
        toast.success('Search deleted')
      } else {
        toast.error('Failed to delete search')
      }
    } catch (error) {
      toast.error('An error occurred')
    }
  }

  const handleTogglePriceAlert = async (id: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/user/saved-searches/${id}/price-alert`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ enabled }),
      })

      const data = await response.json()

      if (data.success) {
        setSearches(
          searches.map((s) => (s.id === id ? { ...s, priceAlertEnabled: enabled } : s))
        )
        toast.success(enabled ? 'Price alerts enabled' : 'Price alerts disabled')
      } else {
        toast.error('Failed to update price alert')
      }
    } catch (error) {
      toast.error('An error occurred')
    }
  }

  const handleRunSearch = (search: SavedSearch) => {
    const params = new URLSearchParams()
    params.set('origin', search.originAirport)
    if (search.theme) params.set('theme', search.theme)
    if (search.minFlightTime) params.set('minTime', search.minFlightTime.toString())
    if (search.maxFlightTime) params.set('maxTime', search.maxFlightTime.toString())

    router.push(`/?${params.toString()}`)
  }

  if (isLoading || isLoadingSearches) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-white/60">Loading saved searches...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Saved Searches</h2>
        <p className="text-white/70">
          Your saved flight searches. Enable price alerts to get notified of price changes.
        </p>
      </div>

      {searches.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Search className="w-12 h-12 text-white/40 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No Saved Searches</h3>
          <p className="text-white/60 mb-6">
            Save your flight searches to quickly access them later and get price alerts.
          </p>
          <Button onClick={() => router.push('/')}>Start Searching</Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {searches.map((search) => (
            <div key={search.id} className="glass-card p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <Plane className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        From {search.originAirport}
                      </h3>
                      <p className="text-sm text-white/60">
                        Saved {new Date(search.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm mb-4">
                    {search.theme && (
                      <div className="flex items-center gap-2 text-white/80">
                        <span className="text-white/50">Theme:</span>
                        <span className="capitalize">{search.theme}</span>
                      </div>
                    )}
                    {(search.minFlightTime || search.maxFlightTime) && (
                      <div className="flex items-center gap-2 text-white/80">
                        <Clock className="w-4 h-4 text-white/50" />
                        <span>
                          {search.minFlightTime || 0} - {search.maxFlightTime || 12} hours
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handleRunSearch(search)}
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Search className="w-4 h-4" />
                      Run Search
                    </Button>

                    <Button
                      onClick={() => handleTogglePriceAlert(search.id, !search.priceAlertEnabled)}
                      variant="secondary"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      {search.priceAlertEnabled ? (
                        <>
                          <BellOff className="w-4 h-4" />
                          Disable Alerts
                        </>
                      ) : (
                        <>
                          <Bell className="w-4 h-4" />
                          Enable Alerts
                        </>
                      )}
                    </Button>

                    <Button
                      onClick={() => handleDeleteSearch(search.id)}
                      variant="danger"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </Button>
                  </div>
                </div>

                {search.priceAlertEnabled && (
                  <div className="ml-4">
                    <div className="px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full">
                      <span className="text-xs text-green-400 font-medium flex items-center gap-1">
                        <Bell className="w-3 h-3" />
                        Alerts On
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
