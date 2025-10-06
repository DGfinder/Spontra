'use client'

import { useState } from 'react'
import { X, Check, AlertCircle } from 'lucide-react'
import { extractYouTubeId, getYouTubeThumbnail } from '@/lib/youtube'
import { updateVideoUrl } from '@/actions/poiVideoActions'
import { useToast } from '@/components/ui/Toast'

interface VideoEditDialogProps {
  videoId: string
  currentUrl: string
  onClose: () => void
  onUpdate: () => Promise<void>
}

export function VideoEditDialog({
  videoId,
  currentUrl,
  onClose,
  onUpdate
}: VideoEditDialogProps) {
  const [url, setUrl] = useState(currentUrl)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const toast = useToast()

  const videoId_parsed = extractYouTubeId(url)
  const isValid = url.trim() === '' ? null : videoId_parsed !== null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!isValid || !url.trim()) {
      setError('Please enter a valid YouTube URL')
      return
    }

    setIsSubmitting(true)
    setError(null)

    const result = await updateVideoUrl(videoId, url.trim())

    if (result.success) {
      toast.success('Video URL updated', 'The video URL has been successfully updated')
      await onUpdate()
      onClose()
    } else {
      setError(result.error || 'Failed to update video URL')
      toast.error('Update failed', result.error || 'Failed to update video URL')
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[70]
                   w-full max-w-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="video-edit-title"
      >
        <div className="bg-[rgba(11,15,18,0.95)] backdrop-blur-xl border border-white/20 rounded-2xl p-6 m-4 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 id="video-edit-title" className="text-xl font-bold text-white">
              Edit Video URL
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
              aria-label="Close dialog"
              disabled={isSubmitting}
            >
              <X className="w-5 h-5 text-white/60" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* URL Input */}
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                YouTube Video URL
              </label>
              <div className="relative">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://youtube.com/shorts/VIDEO_ID or youtu.be/VIDEO_ID"
                  className={`w-full px-4 py-2.5 pr-10 bg-white/10 border rounded-lg text-white placeholder-white/50 focus:outline-none transition-colors ${
                    isValid === false
                      ? 'border-red-400/60 focus:border-red-400'
                      : isValid === true
                      ? 'border-green-400/60 focus:border-green-400'
                      : 'border-white/20 focus:border-white/40'
                  }`}
                  disabled={isSubmitting}
                  autoFocus
                />

                {/* Validation Icon */}
                {url.trim() !== '' && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {isValid === true ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : isValid === false ? (
                      <AlertCircle className="w-4 h-4 text-red-400" />
                    ) : null}
                  </div>
                )}
              </div>

              {/* Validation Error */}
              {isValid === false && (
                <p className="text-xs text-red-300 mt-1">
                  Invalid YouTube URL. Supported formats: youtube.com/shorts/, youtu.be/, youtube.com/watch?v=
                </p>
              )}
            </div>

            {/* Preview Thumbnail */}
            {isValid && url && videoId_parsed && (
              <div className="rounded-lg overflow-hidden border border-white/10">
                <img
                  src={getYouTubeThumbnail(videoId_parsed, 'medium')}
                  alt="Video preview"
                  className="w-full h-auto"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-white/70 hover:text-white transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-white text-brand-purple rounded-lg font-medium hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting || !isValid}
              >
                {isSubmitting ? 'Updating...' : 'Update Video'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
