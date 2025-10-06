/**
 * Favorite Destinations Page
 *
 * Displays user's favorite destinations with options to:
 * - View destination details
 * - Remove from favorites
 * - Search flights to destination
 */

'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Heart, MapPin, Plane, X } from 'lucide-react'
import { toast } from 'react-toastify'

interface FavoriteDestination {
  id: string
  destinationId: string
  createdAt: string
  destination: {
    id: string
    cityName: string
    countryName: string
    airportCode: string
    description: string | null
    imageUrl: string | null
    slug: string | null
  }
}

export default function FavoritesPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [favorites, setFavorites] = useState<FavoriteDestination[]>([])
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(true)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    } else if (user) {
      fetchFavorites()
    }
  }, [user, isLoading, router])

  const fetchFavorites = async () => {
    try {
      const response = await fetch('/api/user/favorites', {
        credentials: 'include',
      })

      const data = await response.json()

      if (data.success) {
        setFavorites(data.favorites)
      } else {
        toast.error('Failed to load favorites')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setIsLoadingFavorites(false)
    }
  }

  const handleRemoveFavorite = async (id: string) => {
    try {
      const response = await fetch(`/api/user/favorites/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      const data = await response.json()

      if (data.success) {
        setFavorites(favorites.filter((f) => f.id !== id))
        toast.success('Removed from favorites')
      } else {
        toast.error('Failed to remove favorite')
      }
    } catch (error) {
      toast.error('An error occurred')
    }
  }

  const handleSearchFlights = (airportCode: string) => {
    router.push(`/?destination=${airportCode}`)
  }

  if (isLoading || isLoadingFavorites) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-white/60">Loading favorites...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Favorite Destinations</h2>
        <p className="text-white/70">
          Your saved destinations. Click to view details or search for flights.
        </p>
      </div>

      {favorites.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Heart className="w-12 h-12 text-white/40 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No Favorites Yet</h3>
          <p className="text-white/60 mb-6">
            Start exploring destinations and save your favorites for quick access later.
          </p>
          <Button onClick={() => router.push('/')}>Explore Destinations</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {favorites.map((favorite) => (
            <div key={favorite.id} className="glass-card overflow-hidden group relative">
              {/* Remove Button */}
              <button
                onClick={() => handleRemoveFavorite(favorite.id)}
                className="absolute top-3 right-3 z-10 p-2 bg-black/50 hover:bg-red-500/80 rounded-full transition-colors"
                aria-label="Remove from favorites"
              >
                <X className="w-4 h-4 text-white" />
              </button>

              {/* Destination Image */}
              {favorite.destination.imageUrl ? (
                <div className="relative h-40 overflow-hidden">
                  <img
                    src={favorite.destination.imageUrl}
                    alt={favorite.destination.cityName}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </div>
              ) : (
                <div className="h-40 bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                  <MapPin className="w-12 h-12 text-white/40" />
                </div>
              )}

              {/* Content */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {favorite.destination.cityName}
                    </h3>
                    <p className="text-sm text-white/60 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {favorite.destination.countryName}
                    </p>
                  </div>
                  <div className="text-xs text-white/40">
                    {favorite.destination.airportCode}
                  </div>
                </div>

                {favorite.destination.description && (
                  <p className="text-sm text-white/70 mb-4 line-clamp-2">
                    {favorite.destination.description}
                  </p>
                )}

                <div className="flex gap-2">
                  {favorite.destination.slug ? (
                    <Link href={`/destinations/${favorite.destination.slug}`} className="flex-1">
                      <Button variant="secondary" size="sm" className="w-full">
                        View Details
                      </Button>
                    </Link>
                  ) : (
                    <Button
                      onClick={() => handleSearchFlights(favorite.destination.airportCode)}
                      size="sm"
                      className="flex-1 flex items-center justify-center gap-2"
                    >
                      <Plane className="w-4 h-4" />
                      Find Flights
                    </Button>
                  )}
                </div>

                <p className="text-xs text-white/40 mt-3">
                  Added {new Date(favorite.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
