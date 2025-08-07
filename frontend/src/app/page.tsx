import { LandingPageForm } from '@/components/LandingPageForm'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Spontra - Flight Comparison Platform',
  description: 'Find and compare the best flight deals across multiple airlines and booking platforms.',
  keywords: 'flights, travel, booking, comparison, cheap flights, airline tickets',
}

export default function HomePage() {
  return (
    <main className="min-h-screen w-full overflow-hidden" style={{ height: '100vh' }}>
      {/* Single Full-Screen Landing Page - No Scrolling */}
      <LandingPageForm />
    </main>
  )
}