import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Discover | Spontra',
  description: 'Swipe through destinations and find your next trip.',
}

export default function FeedLayout({ children }: { children: React.ReactNode }) {
  return children
}
