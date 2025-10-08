import { redirect } from 'next/navigation'
import { getUserId } from '@/lib/session'
import { getCreatorByUserId } from '@/actions/creatorActions'
import { getDestinationsForSelection } from '@/actions/videoSubmissionActions'
import { VideoUploadForm } from '@/components/creator/VideoUploadForm'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function VideoUploadPage() {
  const userId = await getUserId()

  if (!userId) {
    redirect('/login?return=/dashboard/creator/upload')
  }

  const creatorResult = await getCreatorByUserId(userId)

  if (!creatorResult.success || !creatorResult.data) {
    redirect('/become-creator')
  }

  const destinationsResult = await getDestinationsForSelection()

  const destinations = destinationsResult.success && destinationsResult.data ? destinationsResult.data : []

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard/creator"
            className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          <h1 className="text-4xl font-bold text-white mb-2">
            Upload Travel Video
          </h1>
          <p className="text-white/70">
            Share your existing travel content and start earning commissions
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-blue-500/20 border border-blue-500/30 rounded-2xl p-6 mb-8">
          <h2 className="text-white font-semibold mb-3">📝 Quick Tips</h2>
          <ul className="space-y-2 text-blue-200 text-sm">
            <li>• Currently supports YouTube Shorts URLs (Instagram/TikTok coming soon)</li>
            <li>• Choose the destination and theme that best matches your video</li>
            <li>• Add a caption to help users discover your content</li>
            <li>• Videos are approved within 24 hours</li>
          </ul>
        </div>

        {/* Upload Form */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20">
          <VideoUploadForm
            creatorId={creatorResult.data.id}
            destinations={destinations}
          />
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <h3 className="text-white font-semibold mb-3">What content works best?</h3>
            <ul className="space-y-2 text-white/70 text-sm">
              <li>• Hidden gems and local favorites</li>
              <li>• Unique activities and experiences</li>
              <li>• Beautiful scenery and photo spots</li>
              <li>• Food and culture highlights</li>
            </ul>
          </div>

          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <h3 className="text-white font-semibold mb-3">How attribution works</h3>
            <ul className="space-y-2 text-white/70 text-sm">
              <li>• You earn when users book the same day they watch</li>
              <li>• Single video = 100% of your tier rate</li>
              <li>• Multiple videos = Split equally (max 10)</li>
              <li>• Only destination-specific videos count</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
