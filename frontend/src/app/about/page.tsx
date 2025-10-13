import type { Metadata } from 'next'
import { LegalPageTemplate } from '@/components/LegalPageTemplate'
import { Compass, Clock, Sparkles, Users } from 'lucide-react'

export const metadata: Metadata = {
  title: 'About Spontra | Discover Travel Differently',
  description: 'Learn about Spontra - the platform that helps you discover destinations by flight time and travel style.',
}

// ISR: Revalidate every 24 hours (static informational content)
export const revalidate = 86400

export default function AboutPage() {
  return (
    <LegalPageTemplate title="About Spontra">
      <section className="text-white/80 space-y-8">
        {/* Mission Statement */}
        <div className="text-center py-8">
          <h2 className="text-3xl font-bold text-white mb-4">
            Discover Travel Differently
          </h2>
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            Spontra transforms how you find your next destination by focusing on what matters:
            flight time, your interests, and spontaneous discovery.
          </p>
        </div>

        {/* What Makes Us Different */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
          <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
            <Clock className="w-8 h-8 text-brand-gold mb-3" />
            <h3 className="text-xl font-semibold text-white mb-2">Time-First Search</h3>
            <p className="text-white/70">
              Discover destinations by flight duration, not just location. Perfect for weekend getaways or long adventures.
            </p>
          </div>

          <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
            <Compass className="w-8 h-8 text-brand-gold mb-3" />
            <h3 className="text-xl font-semibold text-white mb-2">Theme-Based Discovery</h3>
            <p className="text-white/70">
              Find places that match your vibe: adventure, nature, indulgence, culture, or nightlife.
            </p>
          </div>

          <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
            <Sparkles className="w-8 h-8 text-brand-gold mb-3" />
            <h3 className="text-xl font-semibold text-white mb-2">Visual Inspiration</h3>
            <p className="text-white/70">
              Watch real traveler videos and see authentic experiences before you book.
            </p>
          </div>

          <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
            <Users className="w-8 h-8 text-brand-gold mb-3" />
            <h3 className="text-xl font-semibold text-white mb-2">Best Price Guarantee</h3>
            <p className="text-white/70">
              Compare prices across airlines and booking sites to find the best deals.
            </p>
          </div>
        </div>

        {/* Our Story */}
        <div className="mt-12 space-y-4">
          <h2 className="text-2xl font-semibold text-white">Our Story</h2>
          <p>
            Spontra was born from a simple frustration: traditional flight search is broken.
            You know you want to travel, you know how much time you have, but you don't
            know <em>where</em> to go.
          </p>
          <p>
            Instead of searching city-by-city, we flip the script. Tell us your departure
            airport, how long you want to fly, and what experiences you're looking for.
            We'll show you a constellation of possibilities you never knew existed.
          </p>
          <p>
            From a 2-hour beach escape to a 10-hour cultural adventure, Spontra makes
            spontaneous travel feel intentional.
          </p>
        </div>

        {/* Our Vision */}
        <div className="mt-12 space-y-4">
          <h2 className="text-2xl font-semibold text-white">Our Vision</h2>
          <p>
            We believe travel should be about exploration, not exhaustive planning.
            Spontra is building the future of travel discovery—powered by real experiences,
            visual storytelling, and intelligent recommendations.
          </p>
          <p>
            Our goal: Make every traveler feel like an explorer again.
          </p>
        </div>

        {/* Contact CTA */}
        <div className="mt-12 p-8 bg-gradient-to-r from-brand-purple/20 to-brand-blue/20 rounded-2xl border border-white/20 text-center">
          <h3 className="text-2xl font-semibold text-white mb-3">Join the Journey</h3>
          <p className="text-white/70 mb-6">
            Have questions, feedback, or want to partner with us?
          </p>
          <a
            href="mailto:hello@spontra.com"
            className="inline-block px-6 py-3 bg-brand-gold text-[#1A1A1A] font-semibold rounded-full
                     hover:bg-brand-gold/90 transition-colors"
          >
            Get in Touch
          </a>
        </div>
      </section>
    </LegalPageTemplate>
  )
}
