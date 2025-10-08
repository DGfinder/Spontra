'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

interface RejectionModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (reason: string) => void
  videoTitle: string
}

const PREDEFINED_REASONS = [
  'Inappropriate content',
  'Poor video quality',
  'Wrong destination or POI',
  'Duplicate content',
  'Copyright violation',
  'Misleading information',
  'Does not meet quality standards',
  'Custom reason (specify below)'
]

export function RejectionModal({ isOpen, onClose, onConfirm, videoTitle }: RejectionModalProps) {
  const [selectedReason, setSelectedReason] = useState(PREDEFINED_REASONS[0])
  const [customReason, setCustomReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const reason = selectedReason === 'Custom reason (specify below)'
      ? customReason
      : selectedReason

    if (!reason.trim()) {
      return
    }

    setIsSubmitting(true)
    await onConfirm(reason)
    setIsSubmitting(false)

    // Reset form
    setSelectedReason(PREDEFINED_REASONS[0])
    setCustomReason('')
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedReason(PREDEFINED_REASONS[0])
      setCustomReason('')
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-white">Reject Video</h2>
            <p className="text-sm text-white/60 mt-1">{videoTitle}</p>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-white/60 hover:text-white transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Reason Selection */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Rejection Reason <span className="text-red-400">*</span>
            </label>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40 transition-colors disabled:opacity-50"
            >
              {PREDEFINED_REASONS.map((reason) => (
                <option key={reason} value={reason} className="bg-gray-900">
                  {reason}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Reason Input */}
          {selectedReason === 'Custom reason (specify below)' && (
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Specify Reason <span className="text-red-400">*</span>
              </label>
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-colors resize-y disabled:opacity-50"
                rows={4}
                placeholder="Please provide a detailed reason for rejection..."
                maxLength={500}
                required
              />
              <p className="text-xs text-white/50 mt-1">
                {customReason.length}/500 characters
              </p>
            </div>
          )}

          {/* Info */}
          <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-3">
            <p className="text-xs text-blue-200">
              The creator will be notified of the rejection reason via email.
              Please be clear and constructive to help them improve future submissions.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (selectedReason === 'Custom reason (specify below)' && !customReason.trim())}
              className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Rejecting...' : 'Confirm Rejection'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
