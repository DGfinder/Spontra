import { LandingPageForm } from '@/components/LandingPageForm'

export default function HomePage() {
  return (
    <main className="min-h-screen w-full overflow-hidden" style={{ height: '100vh' }}>
      {/* Single Full-Screen Landing Page - No Scrolling */}
      <LandingPageForm />
    </main>
  )
}