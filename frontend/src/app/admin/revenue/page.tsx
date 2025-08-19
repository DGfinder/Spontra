'use client'

import { RevenueDashboard } from '@/components/RevenueDashboard'

export default function AdminRevenuePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-white text-3xl font-bold mb-2">Affiliate Revenue Dashboard</h1>
          <p className="text-white/60">
            Monitor commission tracking, conversion rates, and partner performance
          </p>
        </div>

        {/* Revenue Dashboard */}
        <RevenueDashboard />
        
        {/* Additional Information */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-black/20 backdrop-blur-sm rounded-xl border border-white/20 p-6">
            <h3 className="text-white font-semibold text-lg mb-4">Integration Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white/80">Click Tracking</span>
                <span className="text-green-400 text-sm">✓ Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/80">Conversion Webhooks</span>
                <span className="text-green-400 text-sm">✓ Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/80">Affiliate URLs</span>
                <span className="text-green-400 text-sm">✓ Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/80">Commission Calculation</span>
                <span className="text-green-400 text-sm">✓ Active</span>
              </div>
            </div>
          </div>

          <div className="bg-black/20 backdrop-blur-sm rounded-xl border border-white/20 p-6">
            <h3 className="text-white font-semibold text-lg mb-4">Active Partners</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/80">Expedia</span>
                <span className="text-yellow-400">4.2% commission</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/80">Booking.com</span>
                <span className="text-yellow-400">3.8% commission</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/80">Kayak</span>
                <span className="text-yellow-400">2.1% commission</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/80">Skyscanner</span>
                <span className="text-yellow-400">1.8% commission</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/80">Airlines Direct</span>
                <span className="text-yellow-400">1.2-1.5% commission</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}