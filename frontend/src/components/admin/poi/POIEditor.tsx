'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { MapPin, Instagram, Type, FileText } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import type { ThemePOI } from '@/lib/hooks/usePOIManagement'

const poiSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  videoUrl: z.string().url('Invalid URL').or(z.literal('')).optional(),
  latitude: z.number().min(-90).max(90).optional().or(z.nan()),
  longitude: z.number().min(-180).max(180).optional().or(z.nan()),
  caption: z.string().max(300, 'Caption too long (max 300 chars)').optional(),
  altText: z.string().max(255, 'Alt text too long (max 255 chars)').optional(),
  instagramUrl: z.string().url('Invalid Instagram URL').or(z.literal('')).optional()
})

type POIFormData = z.infer<typeof poiSchema>

interface POIEditorProps {
  poi?: ThemePOI | null
  onSubmit: (data: POIFormData) => Promise<{ success: boolean; error?: string }>
  onCancel: () => void
  isSubmitting?: boolean
  templateData?: Partial<POIFormData> // Pre-fill from templates
}

export function POIEditor({
  poi,
  onSubmit,
  onCancel,
  isSubmitting = false,
  templateData
}: POIEditorProps) {
  const isEditing = !!poi
  const toast = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<POIFormData>({
    resolver: zodResolver(poiSchema),
    defaultValues: {
      name: poi?.name || templateData?.name || '',
      description: poi?.description || templateData?.description || '',
      videoUrl: poi?.videoUrl || templateData?.videoUrl || '',
      latitude: poi?.latitude ? Number(poi.latitude) : templateData?.latitude || undefined,
      longitude: poi?.longitude ? Number(poi.longitude) : templateData?.longitude || undefined,
      caption: poi?.caption || templateData?.caption || '',
      altText: poi?.altText || templateData?.altText || '',
      instagramUrl: poi?.instagramUrl || templateData?.instagramUrl || ''
    }
  })

  const handleFormSubmit = async (data: POIFormData) => {
    const result = await onSubmit(data)
    if (!result.success && result.error) {
      toast.error(isEditing ? 'Failed to update POI' : 'Failed to create POI', result.error)
    } else if (result.success) {
      toast.success(
        isEditing ? 'POI updated' : 'POI created',
        `"${data.name}" has been ${isEditing ? 'updated' : 'created'} successfully`
      )
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="bg-white/5 rounded-lg p-6 border border-white/10">
        <h3 className="text-white font-medium mb-4">
          {isEditing ? 'Edit POI' : 'Add New POI'}
        </h3>

        <div className="space-y-4">
          {/* POI Name */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              POI Name *
            </label>
            <input
              type="text"
              {...register('name')}
              placeholder="e.g., Eiffel Tower, Central Park"
              className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40 transition-colors"
              disabled={isSubmitting}
            />
            {errors.name && (
              <p className="text-red-300 text-xs mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Description
            </label>
            <textarea
              {...register('description')}
              placeholder="Brief description of this point of interest..."
              rows={3}
              className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40 transition-colors resize-none"
              disabled={isSubmitting}
            />
            {errors.description && (
              <p className="text-red-300 text-xs mt-1">{errors.description.message}</p>
            )}
          </div>

          {/* Coordinates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                Latitude
              </label>
              <input
                type="number"
                step="any"
                {...register('latitude', { valueAsNumber: true })}
                placeholder="e.g., 48.8584"
                className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40 transition-colors"
                disabled={isSubmitting}
              />
              {errors.latitude && (
                <p className="text-red-300 text-xs mt-1">{errors.latitude.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-2 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                Longitude
              </label>
              <input
                type="number"
                step="any"
                {...register('longitude', { valueAsNumber: true })}
                placeholder="e.g., 2.2945"
                className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40 transition-colors"
                disabled={isSubmitting}
              />
              {errors.longitude && (
                <p className="text-red-300 text-xs mt-1">{errors.longitude.message}</p>
              )}
            </div>
          </div>

          {/* SEO Fields Section */}
          <div className="pt-4 border-t border-white/10">
            <h4 className="text-sm font-medium text-white/70 mb-3 flex items-center gap-1.5">
              <FileText className="w-4 h-4" />
              SEO & Social Media
            </h4>

            <div className="space-y-4">
              {/* Caption */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Caption (for social/SEO)
                </label>
                <textarea
                  {...register('caption')}
                  placeholder="Instagram-style caption (50-100 words recommended)"
                  rows={2}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40 transition-colors resize-none"
                  disabled={isSubmitting}
                />
                {errors.caption && (
                  <p className="text-red-300 text-xs mt-1">{errors.caption.message}</p>
                )}
                <p className="text-white/40 text-xs mt-1">
                  Used for SEO and social media sharing
                </p>
              </div>

              {/* Alt Text */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2 flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5" />
                  Alt Text
                </label>
                <input
                  type="text"
                  {...register('altText')}
                  placeholder="e.g., Eiffel Tower at sunset with Paris skyline"
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40 transition-colors"
                  disabled={isSubmitting}
                />
                {errors.altText && (
                  <p className="text-red-300 text-xs mt-1">{errors.altText.message}</p>
                )}
                <p className="text-white/40 text-xs mt-1">
                  For accessibility and image SEO
                </p>
              </div>

              {/* Instagram URL */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2 flex items-center gap-1.5">
                  <Instagram className="w-3.5 h-3.5" />
                  Instagram Post URL
                </label>
                <input
                  type="url"
                  {...register('instagramUrl')}
                  placeholder="https://instagram.com/p/..."
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40 transition-colors"
                  disabled={isSubmitting}
                />
                {errors.instagramUrl && (
                  <p className="text-red-300 text-xs mt-1">{errors.instagramUrl.message}</p>
                )}
                <p className="text-white/40 text-xs mt-1">
                  Link to related Instagram post (optional)
                </p>
              </div>
            </div>
          </div>

          {/* Legacy Video URL (deprecated) */}
          <div className="pt-4 border-t border-white/10">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                YouTube Video URL (Legacy)
              </label>
              <input
                type="url"
                {...register('videoUrl')}
                placeholder="https://youtube.com/shorts/..."
                className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40 transition-colors"
                disabled={isSubmitting}
              />
              {errors.videoUrl && (
                <p className="text-red-300 text-xs mt-1">{errors.videoUrl.message}</p>
              )}
              <p className="text-yellow-300/60 text-xs mt-1">
                ⚠️ Deprecated: Use "Add Videos" button instead for multiple videos
              </p>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-white/10">
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
            {isSubmitting ? 'Saving...' : isEditing ? 'Update POI' : 'Create POI'}
          </button>
        </div>
      </div>
    </form>
  )
}
