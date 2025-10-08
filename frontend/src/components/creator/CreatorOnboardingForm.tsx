'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createCreatorProfile } from '@/actions/creatorActions'

interface CreatorOnboardingFormProps {
  userId: string
}

export function CreatorOnboardingForm({ userId }: CreatorOnboardingFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    displayName: '',
    bio: '',
    instagramHandle: '',
    tiktokHandle: ''
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const result = await createCreatorProfile({
        userId,
        displayName: formData.displayName,
        bio: formData.bio || undefined,
        instagramHandle: formData.instagramHandle || undefined,
        tiktokHandle: formData.tiktokHandle || undefined
      })

      if (result.success) {
        // Redirect to creator dashboard
        router.push('/dashboard/creator')
      } else {
        setError(result.error || 'Failed to create profile')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Display Name */}
      <div>
        <label htmlFor="displayName" className="block text-sm font-medium text-white/70 mb-2">
          Display Name <span className="text-red-400">*</span>
        </label>
        <input
          id="displayName"
          type="text"
          value={formData.displayName}
          onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40 transition-colors"
          placeholder="Your creator name"
          required
          disabled={isSubmitting}
        />
        <p className="text-xs text-white/50 mt-1">
          This is how viewers will see you on the platform
        </p>
      </div>

      {/* Bio */}
      <div>
        <label htmlFor="bio" className="block text-sm font-medium text-white/70 mb-2">
          Bio
        </label>
        <textarea
          id="bio"
          value={formData.bio}
          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40 transition-colors resize-y"
          placeholder="Tell viewers about your travel style and experiences..."
          rows={4}
          maxLength={500}
          disabled={isSubmitting}
        />
        <p className="text-xs text-white/50 mt-1">
          {formData.bio.length}/500 characters
        </p>
      </div>

      {/* Instagram Handle */}
      <div>
        <label htmlFor="instagram" className="block text-sm font-medium text-white/70 mb-2">
          Instagram Handle
        </label>
        <div className="flex items-center gap-2">
          <span className="text-white/50">@</span>
          <input
            id="instagram"
            type="text"
            value={formData.instagramHandle}
            onChange={(e) => setFormData({ ...formData, instagramHandle: e.target.value.replace('@', '') })}
            className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40 transition-colors"
            placeholder="yourusername"
            disabled={isSubmitting}
          />
        </div>
        <p className="text-xs text-white/50 mt-1">
          Optional - helps verify your content
        </p>
      </div>

      {/* TikTok Handle */}
      <div>
        <label htmlFor="tiktok" className="block text-sm font-medium text-white/70 mb-2">
          TikTok Handle
        </label>
        <div className="flex items-center gap-2">
          <span className="text-white/50">@</span>
          <input
            id="tiktok"
            type="text"
            value={formData.tiktokHandle}
            onChange={(e) => setFormData({ ...formData, tiktokHandle: e.target.value.replace('@', '') })}
            className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40 transition-colors"
            placeholder="yourusername"
            disabled={isSubmitting}
          />
        </div>
        <p className="text-xs text-white/50 mt-1">
          Optional - helps verify your content
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
          <p className="text-red-200 text-sm">{error}</p>
        </div>
      )}

      {/* Agreement */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <p className="text-blue-200 text-sm">
          By creating a creator profile, you agree to our Creator Terms and confirm that you have the rights to all content you upload.
        </p>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting || !formData.displayName}
        className="w-full bg-white text-purple-900 px-6 py-4 rounded-lg font-semibold hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Creating Profile...' : 'Create Creator Profile'}
      </button>

      {/* Tier Info */}
      <div className="bg-white/5 rounded-lg p-4 border border-white/10">
        <h3 className="text-white font-semibold mb-2">Your Starting Tier: NEW (5%)</h3>
        <p className="text-white/70 text-sm mb-3">
          You'll start earning 5% commission on bookings from your videos. As you grow, unlock higher tiers:
        </p>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-white/60">
            <span>→ Active (8%)</span>
            <span>10+ videos OR 50+ bookings</span>
          </div>
          <div className="flex justify-between text-white/60">
            <span>→ Top (12%)</span>
            <span>200+ bookings OR $1K earned</span>
          </div>
          <div className="flex justify-between text-white/60">
            <span>→ Elite (15%)</span>
            <span>1K+ bookings OR $5K earned</span>
          </div>
        </div>
      </div>
    </form>
  )
}
