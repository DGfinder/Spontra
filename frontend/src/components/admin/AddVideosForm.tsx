'use client'

import { useState } from 'react'
import { Plus, X, Check, AlertCircle } from 'lucide-react'
import { extractYouTubeId, getYouTubeThumbnail } from '@/lib/youtube'

interface AddVideosFormProps {
  onSubmit: (videoUrls: string[]) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

interface VideoInput {
  id: string
  url: string
  isValid: boolean | null
}

export function AddVideosForm({ onSubmit, onCancel, isSubmitting = false }: AddVideosFormProps) {
  const [videos, setVideos] = useState<VideoInput[]>([
    { id: crypto.randomUUID(), url: '', isValid: null }
  ])

  function addVideoField() {
    setVideos([
      ...videos,
      { id: crypto.randomUUID(), url: '', isValid: null }
    ])
  }

  function removeVideoField(id: string) {
    if (videos.length === 1) return // Keep at least one field
    setVideos(videos.filter(v => v.id !== id))
  }

  function updateVideoUrl(id: string, url: string) {
    setVideos(videos.map(v => {
      if (v.id === id) {
        const isValid = url.trim() === '' ? null : extractYouTubeId(url) !== null
        return { ...v, url, isValid }
      }
      return v
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Filter out empty URLs and validate all
    const validUrls = videos
      .filter(v => v.url.trim() !== '')
      .map(v => v.url.trim())

    if (validUrls.length === 0) {
      alert('Please add at least one video URL')
      return
    }

    // Check if all URLs are valid
    const allValid = videos
      .filter(v => v.url.trim() !== '')
      .every(v => v.isValid === true)

    if (!allValid) {
      alert('Please fix invalid YouTube URLs before submitting')
      return
    }

    await onSubmit(validUrls)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
        {videos.map((video, index) => (
          <div key={video.id} className="relative">
            <div className="flex items-start gap-2">
              {/* Input */}
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="url"
                    value={video.url}
                    onChange={(e) => updateVideoUrl(video.id, e.target.value)}
                    placeholder="https://youtube.com/shorts/VIDEO_ID or youtu.be/VIDEO_ID"
                    className={`w-full px-4 py-2.5 pr-10 bg-white/10 border rounded-lg text-white placeholder-white/50 focus:outline-none transition-colors ${
                      video.isValid === false
                        ? 'border-red-400/60 focus:border-red-400'
                        : video.isValid === true
                        ? 'border-green-400/60 focus:border-green-400'
                        : 'border-white/20 focus:border-white/40'
                    }`}
                    disabled={isSubmitting}
                  />

                  {/* Validation Icon */}
                  {video.url.trim() !== '' && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {video.isValid === true ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : video.isValid === false ? (
                        <AlertCircle className="w-4 h-4 text-red-400" />
                      ) : null}
                    </div>
                  )}
                </div>

                {/* Preview Thumbnail */}
                {video.isValid && video.url && (
                  <div className="mt-2 rounded-lg overflow-hidden border border-white/10">
                    <img
                      src={getYouTubeThumbnail(extractYouTubeId(video.url)!, 'medium')}
                      alt="Video preview"
                      className="w-full h-auto"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Remove Button */}
              {videos.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeVideoField(video.id)}
                  className="mt-2.5 text-white/40 hover:text-red-300 transition-colors"
                  disabled={isSubmitting}
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Error Message */}
            {video.isValid === false && (
              <p className="text-xs text-red-300 mt-1 ml-1">
                Invalid YouTube URL. Supported formats: youtube.com/shorts/, youtu.be/, youtube.com/watch?v=
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Add Another Button */}
      <button
        type="button"
        onClick={addVideoField}
        className="w-full py-2.5 border-2 border-dashed border-white/20 rounded-lg text-white/60 hover:text-white hover:border-white/40 transition-colors flex items-center justify-center gap-2"
        disabled={isSubmitting}
      >
        <Plus className="w-4 h-4" />
        Add Another Video
      </button>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-white/70 hover:text-white transition-colors"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-white text-brand-purple rounded-lg font-medium hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Adding...' : `Add ${videos.filter(v => v.url.trim() !== '').length} Video${videos.filter(v => v.url.trim() !== '').length !== 1 ? 's' : ''}`}
        </button>
      </div>
    </form>
  )
}
