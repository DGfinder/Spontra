'use client'

import { useState } from 'react'
import { Plus, X, Check, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react'
import { extractYouTubeId, getYouTubeThumbnail } from '@/lib/youtube'

export interface VideoWithMetadata {
  url: string
  caption?: string
  altText?: string
  instagramUrl?: string
}

interface AddVideosFormProps {
  onSubmit: (videos: VideoWithMetadata[]) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

interface VideoInput extends VideoWithMetadata {
  id: string
  isValid: boolean | null
  isExpanded: boolean
}

export function AddVideosForm({ onSubmit, onCancel, isSubmitting = false }: AddVideosFormProps) {
  const [videos, setVideos] = useState<VideoInput[]>([
    { id: crypto.randomUUID(), url: '', caption: '', altText: '', instagramUrl: '', isValid: null, isExpanded: false }
  ])

  function addVideoField() {
    setVideos([
      ...videos,
      { id: crypto.randomUUID(), url: '', caption: '', altText: '', instagramUrl: '', isValid: null, isExpanded: false }
    ])
  }

  function removeVideoField(id: string) {
    if (videos.length === 1) return
    setVideos(videos.filter(v => v.id !== id))
  }

  function updateVideo(id: string, field: keyof VideoInput, value: string | boolean) {
    setVideos(videos.map(v => {
      if (v.id === id) {
        const updated = { ...v, [field]: value }
        if (field === 'url') {
          updated.isValid = value === '' ? null : extractYouTubeId(value as string) !== null
        }
        return updated
      }
      return v
    }))
  }

  function toggleExpanded(id: string) {
    setVideos(videos.map(v =>
      v.id === id ? { ...v, isExpanded: !v.isExpanded } : v
    ))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const validVideos = videos
      .filter(v => v.url.trim() !== '')
      .map(v => ({
        url: v.url.trim(),
        caption: v.caption?.trim() || undefined,
        altText: v.altText?.trim() || undefined,
        instagramUrl: v.instagramUrl?.trim() || undefined
      }))

    if (validVideos.length === 0) {
      alert('Please add at least one video URL')
      return
    }

    const allValid = videos
      .filter(v => v.url.trim() !== '')
      .every(v => v.isValid === true)

    if (!allValid) {
      alert('Please fix invalid YouTube URLs before submitting')
      return
    }

    await onSubmit(validVideos)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
        {videos.map((video, index) => (
          <div key={video.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
            {/* Video URL */}
            <div className="flex items-start gap-2">
              <div className="flex-1">
                <label className="block text-xs font-medium text-white/70 mb-2">
                  Video URL {index + 1} *
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={video.url}
                    onChange={(e) => updateVideo(video.id, 'url', e.target.value)}
                    placeholder="https://youtube.com/shorts/VIDEO_ID"
                    className={`w-full px-4 py-2.5 pr-10 bg-white/10 border rounded-lg text-white placeholder-white/50 focus:outline-none transition-colors ${
                      video.isValid === false
                        ? 'border-red-400/60 focus:border-red-400'
                        : video.isValid === true
                        ? 'border-green-400/60 focus:border-green-400'
                        : 'border-white/20 focus:border-white/40'
                    }`}
                    disabled={isSubmitting}
                  />

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

                {video.isValid === false && (
                  <p className="text-xs text-red-300 mt-1">
                    Invalid YouTube URL
                  </p>
                )}

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

              {videos.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeVideoField(video.id)}
                  className="mt-7 text-white/40 hover:text-red-300 transition-colors"
                  disabled={isSubmitting}
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* SEO Metadata Toggle */}
            <button
              type="button"
              onClick={() => toggleExpanded(video.id)}
              className="mt-3 flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
            >
              {video.isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              SEO Metadata (optional)
            </button>

            {/* Expandable Metadata Fields */}
            {video.isExpanded && (
              <div className="mt-3 space-y-3 pl-6 border-l-2 border-white/10">
                {/* Caption */}
                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1">
                    Caption
                  </label>
                  <textarea
                    value={video.caption}
                    onChange={(e) => updateVideo(video.id, 'caption', e.target.value)}
                    placeholder="Instagram-style caption for SEO (50-100 words)"
                    rows={2}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40 resize-none text-sm"
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-white/40 mt-1">
                    Used for SEO and social media sharing
                  </p>
                </div>

                {/* Alt Text */}
                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1">
                    Alt Text
                  </label>
                  <input
                    type="text"
                    value={video.altText}
                    onChange={(e) => updateVideo(video.id, 'altText', e.target.value)}
                    placeholder="e.g., Sunset view from Eiffel Tower"
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40 text-sm"
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-white/40 mt-1">
                    For accessibility and image SEO
                  </p>
                </div>

                {/* Instagram URL */}
                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1">
                    Instagram Post URL
                  </label>
                  <input
                    type="url"
                    value={video.instagramUrl}
                    onChange={(e) => updateVideo(video.id, 'instagramUrl', e.target.value)}
                    placeholder="https://instagram.com/p/..."
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40 text-sm"
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-white/40 mt-1">
                    Link to related Instagram post
                  </p>
                </div>
              </div>
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
