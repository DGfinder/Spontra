import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Become a Creator | Spontra',
  description: 'Join the Spontra Creator Program. Share your travel experiences, help others discover amazing destinations, and earn money when your content inspires bookings.',
  openGraph: {
    title: 'Become a Creator | Spontra',
    description: 'Turn your travels into income. Join the Spontra Creator Program.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Become a Creator | Spontra',
    description: 'Turn your travels into income. Join the Spontra Creator Program.',
  },
}

export default function CreatorsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
