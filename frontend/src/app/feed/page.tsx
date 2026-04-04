import dynamic from 'next/dynamic'

export const metadata = { title: 'Discover | Spontra' }

// Zustand + useSearchParams — must be client-only, no SSR
const FeedPageClient = dynamic(
  () => import('./FeedPageClient').then(m => ({ default: m.FeedPageClient })),
  { ssr: false }
)

export default function FeedPage() {
  return (
    <div className="h-screen w-screen bg-black overflow-hidden">
      <FeedPageClient />
    </div>
  )
}
