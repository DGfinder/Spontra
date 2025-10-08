'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { submitCreatorVideo, getPOIsForDestination } from '@/actions/videoSubmissionActions'
import { extractYouTubeId } from '@/lib/youtube'

const THEMES = [
  { value: 'adventure', label: 'Adventure', emoji: '🏔️' },
  { value: 'nature', label: 'Nature', emoji: '🌿' },
  { value: 'vibe', label: 'Vibe', emoji: '🎵' },
  { value: 'indulge', label: 'Indulge', emoji: '🍷' },
  { value: 'discover', label: 'Discover', emoji: '🔍' }
]

interface Destination {
  id: string
  cityName: string
  country: {
    name: string
    code: string
  } | null
}

interface POI {
  id: string
  name: string
  description: string | null
}

interface VideoUploadFormProps {
  creatorId: string
  destinations: Destination[]
}

export function VideoUploadForm({ creatorId, destinations }: VideoUploadFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    destinationId: '',
    theme: '',
    poiId: '',
    videoUrl: '',
    caption: '',
    altText: '',
    instagramUrl: ''
  })

  const [availablePOIs, setAvailablePOIs] = useState<POI[]>([])
  const [loadingPOIs, setLoadingPOIs] = useState(false)

  // Load POIs when destination and theme are selected
  async function loadPOIs(destinationId: string, theme: string) {
    if (!destinationId || !theme) return

    setLoadingPOIs(true)
    const result = await getPOIsForDestination(destinationId, theme)

    if (result.success && result.data) {
      setAvailablePOIs(result.data)
    } else {
      setAvailablePOIs([])
    }
    setLoadingPOIs(false)
  }

  // Handle destination change
  function handleDestinationChange(destinationId: string) {
    setFormData({ ...formData, destinationId, poiId: '' })
    if (formData.theme) {
      loadPOIs(destinationId, formData.theme)
    }
  }

  // Handle theme change
  function handleThemeChange(theme: string) {
    setFormData({ ...formData, theme, poiId: '' })
    if (formData.destinationId) {
      loadPOIs(formData.destinationId, theme)
    }
  }

  // Validate video URL
  function validateVideoUrl(url: string): string | null {
    const youtubeId = extractYouTubeId(url)
    if (!youtubeId) {
      return 'Invalid YouTube URL. Please use a YouTube Shorts link.'
    }
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    // Validate video URL
    const urlError = validateVideoUrl(formData.videoUrl)
    if (urlError) {
      setError(urlError)
      return
    }

    if (!formData.poiId) {
      setError('Please select a point of interest')
      return
    }

    setIsSubmitting(true)

    try {
      const result = await submitCreatorVideo({
        creatorId,
        destinationId: formData.destinationId,
        poiId: formData.poiId,
        theme: formData.theme,
        videoUrl: formData.videoUrl,
        caption: formData.caption || undefined,
        altText: formData.altText || undefined,
        instagramUrl: formData.instagramUrl || undefined
      })

      if (result.success) {
        setSuccess(true)
        // Reset form
        setFormData({
          destinationId: '',
          theme: '',
          poiId: '',
          videoUrl: '',
          caption: '',
          altText: '',
          instagramUrl: ''
        })
        setAvailablePOIs([])

        // Redirect after 2 seconds
        setTimeout(() => {
          router.push('/dashboard/creator')
        }, 2000)
      } else {
        setError(result.error || 'Failed to submit video')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedDestination = destinations.find(d => d.id === formData.destinationId)

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Success Message */}
      {success && (
        <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4">
          <p className="text-green-200 text-sm">
            ✅ Video uploaded successfully! Redirecting to dashboard...
          </p>
        </div>
      )}

      {/* Video URL */}
      <div>
        <label htmlFor="videoUrl" className="block text-sm font-medium text-white/70 mb-2">
          Video URL <span className="text-red-400">*</span>
        </label>
        <input
          id="videoUrl"
          type="url"
          value={formData.videoUrl}
          onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40 transition-colors"
          placeholder="https://youtube.com/shorts/..."
          required
          disabled={isSubmitting}
        />
        <p className="text-xs text-white/50 mt-1">
          Currently supports YouTube Shorts only. Instagram & TikTok coming soon.
        </p>
      </div>

      {/* Destination */}
      <div>
        <label htmlFor="destination" className="block text-sm font-medium text-white/70 mb-2">
          Destination <span className="text-red-400">*</span>
        </label>
        <select
          id="destination"
          value={formData.destinationId}
          onChange={(e) => handleDestinationChange(e.target.value)}
          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40 transition-colors"
          required
          disabled={isSubmitting}
        >
          <option value="" className="bg-gray-900">Select a destination</option>
          {destinations.map((dest) => (
            <option key={dest.id} value={dest.id} className="bg-gray-900">
              {dest.cityName}{dest.country ? `, ${dest.country.name}` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Theme */}
      <div>
        <label htmlFor="theme" className="block text-sm font-medium text-white/70 mb-2">
          Theme <span className="text-red-400">*</span>
        </label>
        <select
          id="theme"
          value={formData.theme}
          onChange={(e) => handleThemeChange(e.target.value)}
          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40 transition-colors"
          required
          disabled={isSubmitting}
        >
          <option value="" className="bg-gray-900">Select a theme</option>
          {THEMES.map((theme) => (
            <option key={theme.value} value={theme.value} className="bg-gray-900">
              {theme.emoji} {theme.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-white/50 mt-1">
          What type of experience does this video showcase?
        </p>
      </div>

      {/* POI Selection */}
      {formData.destinationId && formData.theme && (
        <div>
          <label htmlFor="poi" className="block text-sm font-medium text-white/70 mb-2">
            Point of Interest <span className="text-red-400">*</span>
          </label>
          {loadingPOIs ? (
            <div className="text-white/50 text-sm">Loading options...</div>
          ) : availablePOIs.length > 0 ? (
            <select
              id="poi"
              value={formData.poiId}
              onChange={(e) => setFormData({ ...formData, poiId: e.target.value })}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40 transition-colors"
              required
              disabled={isSubmitting}
            >
              <option value="" className="bg-gray-900">Select a POI</option>
              {availablePOIs.map((poi) => (
                <option key={poi.id} value={poi.id} className="bg-gray-900">
                  {poi.name}
                </option>
              ))}
            </select>
          ) : (
            <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4">
              <p className="text-yellow-200 text-sm">
                No POIs found for this destination and theme combination. Please contact support to add one.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Caption */}
      <div>
        <label htmlFor="caption" className="block text-sm font-medium text-white/70 mb-2">
          Caption
        </label>
        <textarea
          id="caption"
          value={formData.caption}
          onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40 transition-colors resize-y"
          placeholder="Describe what makes this place special..."
          rows={4}
          maxLength={500}
          disabled={isSubmitting}
        />
        <p className="text-xs text-white/50 mt-1">
          {formData.caption.length}/500 characters (helps with discovery & SEO)
        </p>
      </div>

      {/* Alt Text */}
      <div>
        <label htmlFor="altText" className="block text-sm font-medium text-white/70 mb-2">
          Alt Text (for accessibility)
        </label>
        <input
          id="altText"
          type="text"
          value={formData.altText}
          onChange={(e) => setFormData({ ...formData, altText: e.target.value })}
          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40 transition-colors"
          placeholder="Brief description for screen readers"
          maxLength={255}
          disabled={isSubmitting}
        />
      </div>

      {/* Instagram URL (optional) */}
      <div>
        <label htmlFor="instagramUrl" className="block text-sm font-medium text-white/70 mb-2">
          Instagram Post URL (optional)
        </label>
        <input
          id="instagramUrl"
          type="url"
          value={formData.instagramUrl}
          onChange={(e) => setFormData({ ...formData, instagramUrl: e.target.value })}
          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40 transition-colors"
          placeholder="https://instagram.com/p/..."
          disabled={isSubmitting}
        />
        <p className="text-xs text-white/50 mt-1">
          Link to original Instagram post for attribution
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
          <p className="text-red-200 text-sm">{error}</p>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting || !formData.destinationId || !formData.theme || !formData.poiId || !formData.videoUrl}
        className="w-full bg-white text-purple-900 px-6 py-4 rounded-lg font-semibold hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Uploading...' : 'Upload Video'}
      </button>

      <p className="text-xs text-white/50 text-center">
        Videos are reviewed within 24 hours. You'll be notified when approved.
      </p>
    </form>
  )
}
