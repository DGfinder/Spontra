import dynamic from 'next/dynamic'

// Zustand uses useRef — must be client-only, no SSR
const SavedFeedClient = dynamic(() => import('./SavedFeedClient'), { ssr: false })

export default function SavedFeedPage() {
  return <SavedFeedClient />
}
