'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, DollarSign, X } from 'lucide-react'
import { confirmBooking, getPendingBookings } from '@/actions/bookingAttributionActions'
import { useSessionTracking } from '@/hooks/useSessionTracking'
import { toast } from 'react-toastify'

export function BookingConfirmButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [bookingAmount, setBookingAmount] = useState('')
  const [hasPendingBooking, setHasPendingBooking] = useState(false)
  const { sessionId } = useSessionTracking()

  useEffect(() => {
    // Check if user has clicked an affiliate link recently
    const lastClickId = localStorage.getItem('last_affiliate_click_id')
    setHasPendingBooking(!!lastClickId)
  }, [])

  async function handleConfirm() {
    const clickId = localStorage.getItem('last_affiliate_click_id')

    if (!clickId || !sessionId) {
      toast.error('No pending booking found')
      return
    }

    const amount = parseFloat(bookingAmount)
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid booking amount')
      return
    }

    setIsSubmitting(true)

    try {
      const result = await confirmBooking({
        clickId,
        sessionId,
        bookingAmount: amount
      })

      if (result.success) {
        toast.success(
          `Booking confirmed! ${result.data?.creatorsEarned || 0} creator(s) earned $${result.data?.totalPaid?.toFixed(2) || '0.00'}`
        )

        // Clear the stored click ID
        localStorage.removeItem('last_affiliate_click_id')
        setHasPendingBooking(false)
        setIsOpen(false)
        setBookingAmount('')
      } else {
        toast.error(result.error || 'Failed to confirm booking')
      }
    } catch (error) {
      console.error('[Booking Confirm] Error:', error)
      toast.error('An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!hasPendingBooking) {
    return null
  }

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 font-medium transition-all hover:scale-105"
      >
        <CheckCircle className="w-5 h-5" />
        Booked a Flight?
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 max-w-md w-full p-6">
            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
              className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="mb-6">
              <div className="bg-green-500/20 p-3 rounded-full w-fit mb-4">
                <CheckCircle className="w-8 h-8 text-green-300" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Confirm Your Booking
              </h2>
              <p className="text-white/70 text-sm">
                Help support travel creators by confirming your booking! This helps us attribute earnings to creators whose videos helped you discover this destination.
              </p>
            </div>

            {/* Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Booking Amount (USD)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={bookingAmount}
                    onChange={(e) => setBookingAmount(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-colors disabled:opacity-50"
                    placeholder="e.g. 450.00"
                    required
                  />
                </div>
                <p className="text-xs text-white/50 mt-1">
                  Total amount you paid for your flight (approximate is fine)
                </p>
              </div>

              {/* Info Box */}
              <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-3">
                <p className="text-xs text-blue-200">
                  <strong>How it works:</strong> We'll calculate a commission based on your booking amount and distribute earnings to creators whose videos you watched. You won't be charged anything extra!
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setIsOpen(false)}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isSubmitting || !bookingAmount}
                  className="flex-1 px-4 py-3 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Confirm Booking
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
