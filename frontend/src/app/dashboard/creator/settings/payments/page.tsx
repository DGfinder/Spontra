'use client'

import { useEffect, useState } from 'react'
import {
  createStripeConnectAccount,
  createStripeOnboardingLink,
  getStripeAccountStatus,
  calculateCreatorEarnings,
  getCreatorPayouts
} from '@/app/actions/stripe'

export default function CreatorPaymentSettings() {
  const [loading, setLoading] = useState(false)
  const [accountStatus, setAccountStatus] = useState<any>(null)
  const [earnings, setEarnings] = useState<any>(null)
  const [payouts, setPayouts] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  // TODO: Replace with actual creator ID from auth context
  const creatorId = 'temp-creator-id'

  useEffect(() => {
    loadAccountData()
  }, [])

  async function loadAccountData() {
    setLoading(true)

    // Load account status
    const statusResult = await getStripeAccountStatus(creatorId)
    setAccountStatus(statusResult)

    // Load earnings
    const earningsResult = await calculateCreatorEarnings(creatorId)
    setEarnings(earningsResult)

    // Load payout history
    const payoutsResult = await getCreatorPayouts(creatorId)
    setPayouts(payoutsResult)

    setLoading(false)
  }

  async function handleConnectStripe() {
    setLoading(true)
    setError(null)

    // Create account if doesn't exist
    const createResult = await createStripeConnectAccount(creatorId)

    if (!createResult.success) {
      // Account already exists, get onboarding link
      if (createResult.accountId) {
        const linkResult = await createStripeOnboardingLink(creatorId)
        if (linkResult.success && linkResult.url) {
          window.location.href = linkResult.url
          return
        }
        setError(linkResult.error || 'Failed to create onboarding link')
      } else {
        setError(createResult.error || 'Failed to create account')
      }
      setLoading(false)
      return
    }

    // Get onboarding link for new account
    const linkResult = await createStripeOnboardingLink(creatorId)

    if (linkResult.success && linkResult.url) {
      window.location.href = linkResult.url
    } else {
      setError(linkResult.error || 'Failed to create onboarding link')
      setLoading(false)
    }
  }

  if (loading && !accountStatus) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20">
            <p className="text-white text-center">Loading payment settings...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
          <h1 className="text-3xl font-bold text-white mb-2">Payment Settings</h1>
          <p className="text-white/70">
            Connect your Stripe account to receive creator payouts
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/20 backdrop-blur-xl rounded-2xl p-6 border border-red-500/50">
            <p className="text-red-200 font-semibold">Error:</p>
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {/* Stripe Connection Status */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-4">Stripe Connect</h2>

          {accountStatus?.status === 'not_connected' ? (
            <div className="space-y-4">
              <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4">
                <p className="text-yellow-200 font-semibold">Not Connected</p>
                <p className="text-yellow-200/80 text-sm mt-2">
                  Connect your Stripe account to receive monthly payouts
                </p>
              </div>

              <button
                onClick={handleConnectStripe}
                disabled={loading}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                {loading ? 'Connecting...' : 'Connect Stripe Account'}
              </button>

              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-white font-semibold mb-2">How it works:</p>
                <ol className="text-white/70 text-sm space-y-2 list-decimal list-inside">
                  <li>Click "Connect Stripe Account"</li>
                  <li>Complete Stripe's 2-minute onboarding</li>
                  <li>Receive monthly payouts in USD (or your local currency)</li>
                  <li>Minimum payout: $25 USD</li>
                  <li>60-day hold period for fraud protection</li>
                </ol>
              </div>
            </div>
          ) : accountStatus?.status === 'pending' ? (
            <div className="space-y-4">
              <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4">
                <p className="text-yellow-200 font-semibold">⏳ Onboarding Pending</p>
                <p className="text-yellow-200/80 text-sm mt-2">
                  Complete your Stripe onboarding to activate payouts
                </p>
              </div>

              {accountStatus.requiresAction && (
                <div className="bg-white/5 rounded-lg p-4">
                  <p className="text-white font-semibold mb-2">
                    Missing Information:
                  </p>
                  <ul className="text-white/70 text-sm space-y-1 list-disc list-inside">
                    {accountStatus.requirements?.map((req: string) => (
                      <li key={req}>{req.replace(/_/g, ' ')}</li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                onClick={handleConnectStripe}
                disabled={loading}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                {loading ? 'Loading...' : 'Continue Onboarding'}
              </button>
            </div>
          ) : accountStatus?.status === 'active' ? (
            <div className="space-y-4">
              <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4">
                <p className="text-green-200 font-semibold">✅ Connected & Active</p>
                <p className="text-green-200/80 text-sm mt-2">
                  Your account is ready to receive payouts
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-lg p-4">
                  <p className="text-white/70 text-sm">Charges</p>
                  <p className="text-white font-semibold text-lg">
                    {accountStatus.chargesEnabled ? '✅ Enabled' : '❌ Disabled'}
                  </p>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <p className="text-white/70 text-sm">Payouts</p>
                  <p className="text-white font-semibold text-lg">
                    {accountStatus.payoutsEnabled ? '✅ Enabled' : '❌ Disabled'}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Earnings Summary */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-4">Available Earnings</h2>

          {earnings?.success ? (
            <div className="space-y-4">
              <div className="bg-white/5 rounded-lg p-6">
                <p className="text-white/70 text-sm mb-2">Ready for Payout</p>
                <p className="text-white font-bold text-4xl">
                  ${earnings.totalAmount?.toFixed(2) || '0.00'} USD
                </p>
                <p className="text-white/50 text-sm mt-2">
                  From {earnings.earningsCount || 0} bookings (60-day hold complete)
                </p>
              </div>

              {earnings.totalAmount >= 25 ? (
                <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4">
                  <p className="text-green-200 text-sm">
                    ✅ Meets $25 minimum - will be included in next monthly payout
                  </p>
                </div>
              ) : (
                <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4">
                  <p className="text-yellow-200 text-sm">
                    ⏳ Need ${(25 - (earnings.totalAmount || 0)).toFixed(2)} more to reach $25 minimum
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-white/70">No earnings available yet</p>
          )}
        </div>

        {/* Payout History */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-4">Payout History</h2>

          {payouts?.success && payouts.payouts?.length > 0 ? (
            <div className="space-y-3">
              {payouts.payouts.map((payout: any) => (
                <div
                  key={payout.id}
                  className="bg-white/5 rounded-lg p-4 flex items-center justify-between"
                >
                  <div>
                    <p className="text-white font-semibold">
                      ${payout.amount} {payout.currency}
                    </p>
                    <p className="text-white/70 text-sm">
                      {new Date(payout.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        payout.status === 'completed'
                          ? 'bg-green-500/20 text-green-200'
                          : payout.status === 'pending'
                          ? 'bg-yellow-500/20 text-yellow-200'
                          : 'bg-red-500/20 text-red-200'
                      }`}
                    >
                      {payout.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-white/70">No payouts yet</p>
          )}
        </div>

        {/* FAQ */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-4">Frequently Asked Questions</h2>

          <div className="space-y-4">
            <div className="bg-white/5 rounded-lg p-4">
              <p className="text-white font-semibold mb-2">
                When will I receive payouts?
              </p>
              <p className="text-white/70 text-sm">
                Payouts are processed monthly on the 1st. Earnings must pass a 60-day
                hold period for fraud protection and meet the $25 USD minimum.
              </p>
            </div>

            <div className="bg-white/5 rounded-lg p-4">
              <p className="text-white font-semibold mb-2">
                What currency will I receive?
              </p>
              <p className="text-white/70 text-sm">
                Stripe automatically converts USD to your local currency based on your
                bank account. You can also receive in USD if you prefer.
              </p>
            </div>

            <div className="bg-white/5 rounded-lg p-4">
              <p className="text-white font-semibold mb-2">Are there any fees?</p>
              <p className="text-white/70 text-sm">
                Stripe charges ~3% for currency conversion and payouts. You receive the
                net amount after fees.
              </p>
            </div>

            <div className="bg-white/5 rounded-lg p-4">
              <p className="text-white font-semibold mb-2">
                What if I don't meet the $25 minimum?
              </p>
              <p className="text-white/70 text-sm">
                Your earnings roll over to the next month until you reach $25 USD.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
