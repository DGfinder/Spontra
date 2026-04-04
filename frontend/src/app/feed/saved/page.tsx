'use client'

import dynamic from 'next/dynamic'

const SavedFeedClient = dynamic(() => import('./SavedFeedClient'), { ssr: false })

export default function SavedFeedPage() {
  return <SavedFeedClient />
}
