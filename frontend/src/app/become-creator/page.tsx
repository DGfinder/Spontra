import { redirect } from 'next/navigation'
import { getUserId } from '@/lib/session'
import { getCreatorByUserId } from '@/actions/creatorActions'
import { CreatorOnboardingForm } from '@/components/creator/CreatorOnboardingForm'

export default async function BecomeCreatorPage() {
  // Check if user is logged in
  const userId = await getUserId()

  if (!userId) {
    // TODO: Redirect to login with return URL
    redirect('/login?return=/become-creator')
  }

  // Check if user already has creator profile
  const result = await getCreatorByUserId(userId)

  if (result.success && result.data) {
    // Already a creator, redirect to dashboard
    redirect('/dashboard/creator')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Become a Spontra Creator
          </h1>
          <p className="text-xl text-white/80 mb-6">
            Turn your travel content into passive income
          </p>

          {/* Value Props */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
              <div className="text-3xl mb-2">💰</div>
              <h3 className="text-white font-semibold mb-2">Earn Commissions</h3>
              <p className="text-white/70 text-sm">
                5-15% of flight bookings from your videos
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
              <div className="text-3xl mb-2">🎬</div>
              <h3 className="text-white font-semibold mb-2">Reuse Content</h3>
              <p className="text-white/70 text-sm">
                Post existing Instagram/TikTok videos
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
              <div className="text-3xl mb-2">🚀</div>
              <h3 className="text-white font-semibold mb-2">Passive Income</h3>
              <p className="text-white/70 text-sm">
                Videos earn forever, not just first month
              </p>
            </div>
          </div>

          {/* How It Works */}
          <div className="mt-12 text-left bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-6">How It Works</h2>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h3 className="text-white font-semibold">Create Your Profile</h3>
                  <p className="text-white/70 text-sm">
                    Tell us about yourself and link your social accounts
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h3 className="text-white font-semibold">Upload Your Videos</h3>
                  <p className="text-white/70 text-sm">
                    Paste links to your existing travel content (no exclusivity required)
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h3 className="text-white font-semibold">Earn Passive Income</h3>
                  <p className="text-white/70 text-sm">
                    When users book trips inspired by your videos, you get paid automatically
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Onboarding Form */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-6">Create Your Profile</h2>
          <CreatorOnboardingForm userId={userId} />
        </div>

        {/* FAQ */}
        <div className="mt-12 bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
          <h2 className="text-2xl font-bold text-white mb-6">FAQs</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-white font-semibold mb-2">How much can I earn?</h3>
              <p className="text-white/70 text-sm">
                You earn 5-15% of flight booking commissions (based on your tier). Start at 5%, unlock up to 15% as you grow.
              </p>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-2">Is my content exclusive?</h3>
              <p className="text-white/70 text-sm">
                No! Post your videos on TikTok, Instagram, YouTube AND Spontra. This is bonus income on top of what you already make.
              </p>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-2">When do I get paid?</h3>
              <p className="text-white/70 text-sm">
                Monthly payouts when you reach $25 minimum. We support PayPal, Stripe, and bank transfers.
              </p>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-2">What content performs best?</h3>
              <p className="text-white/70 text-sm">
                Authentic travel experiences! Hidden gems, local food spots, unique activities, and beautiful scenery all convert well.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
