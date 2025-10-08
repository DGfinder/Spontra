import { redirect } from 'next/navigation'
import { getUserId } from '@/lib/session'
import { getCreatorByUserId, getCreatorEarnings } from '@/actions/creatorActions'
import { CreatorDashboard } from '@/components/creator/CreatorDashboard'

export default async function CreatorDashboardPage() {
  // Check if user is logged in
  const userId = await getUserId()

  if (!userId) {
    redirect('/login?return=/dashboard/creator')
  }

  // Get creator profile
  const creatorResult = await getCreatorByUserId(userId)

  if (!creatorResult.success || !creatorResult.data) {
    // Not a creator yet, redirect to onboarding
    redirect('/become-creator')
  }

  const creator = creatorResult.data

  // Get earnings data
  const earningsResult = await getCreatorEarnings(creator.id)

  const earnings = earningsResult.success && earningsResult.data ? earningsResult.data : {
    lifetime: { total: 0, bookings: 0 },
    thisMonth: { total: 0, bookings: 0 },
    topVideos: []
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <CreatorDashboard creator={creator} earnings={earnings} />
      </div>
    </div>
  )
}
