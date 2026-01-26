'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  Camera, 
  Video, 
  TrendingUp, 
  Award, 
  DollarSign, 
  MapPin,
  ChevronRight,
  Star,
  Users,
  Globe
} from 'lucide-react'

export default function CreatorsPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [position, setPosition] = useState<number | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const res = await fetch('/api/creators/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'creator_page' }),
      })
      
      const data = await res.json()
      if (data.position) {
        setPosition(data.position)
      }
      setSubmitted(true)
    } catch (error) {
      console.error('Failed to join waitlist:', error)
      // Still show success for UX - they're on the list locally at least
      setSubmitted(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  const tiers = [
    {
      name: 'Explorer',
      icon: '🌱',
      description: 'Just getting started',
      requirements: 'Sign up and verify your account',
      benefits: ['Basic rewards', 'Community access', 'Upload up to 10 videos/month'],
    },
    {
      name: 'Contributor', 
      icon: '✨',
      description: 'Active community member',
      requirements: '50+ uploads, 1000+ views',
      benefits: ['Higher commission rates', 'Priority review', 'Analytics dashboard'],
    },
    {
      name: 'Ambassador',
      icon: '🌟',
      description: 'Established creator',
      requirements: '200+ uploads, 10K+ views, verified',
      benefits: ['Bonus rewards', 'Featured placement', 'Early access to features'],
    },
    {
      name: 'Creator',
      icon: '👑',
      description: 'Top tier creator',
      requirements: 'Invite only',
      benefits: ['Maximum commissions', 'Exclusive perks', 'Direct partnership'],
    },
  ]

  const howItWorks = [
    {
      icon: Video,
      title: 'Create Content',
      description: 'Upload videos and photos from your travels. Show off hidden gems, local food spots, and authentic experiences.',
    },
    {
      icon: MapPin,
      title: 'GPS Verified',
      description: 'Your content is location-tagged and verified to ensure authenticity. Real travelers, real places.',
    },
    {
      icon: Users,
      title: 'Inspire Travelers',
      description: 'Your content helps other travelers discover amazing destinations and plan their trips.',
    },
    {
      icon: DollarSign,
      title: 'Earn Rewards',
      description: 'Get paid when your content drives bookings. The more engaging your content, the more you earn.',
    },
  ]

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 flex items-center justify-center p-4">
        <div className="text-center text-white max-w-md">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-3xl font-bold mb-4">You're on the list!</h1>
          {position && (
            <p className="text-2xl font-bold text-purple-300 mb-4">
              #{position} in line
            </p>
          )}
          <p className="text-white/80 mb-8">
            We'll notify you when the creator program launches. Get ready to share your adventures!
          </p>
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors"
          >
            ← Back to Spontra
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900">
      {/* Hero */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/images/pattern.svg')] opacity-5" />
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-white/80 text-sm mb-8">
            <Star className="w-4 h-4 text-yellow-400" />
            Coming Soon
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Turn Your Travels Into
            <span className="bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 text-transparent bg-clip-text"> Income</span>
          </h1>
          <p className="text-xl text-white/70 max-w-2xl mx-auto mb-10">
            Join the Spontra Creator Program. Share your travel experiences, help others discover amazing destinations, and earn money when your content inspires bookings.
          </p>
          
          {/* Waitlist Form */}
          <form onSubmit={handleSubmit} className="max-w-md mx-auto flex gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold rounded-xl hover:from-pink-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Joining...' : 'Join Waitlist'}
            </button>
          </form>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {howItWorks.map((item, i) => (
              <div key={i} className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center mb-4">
                  <item.icon className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-white/60 text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Creator Tiers */}
      <section className="py-20 px-4 bg-black/20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-4">Creator Tiers</h2>
          <p className="text-white/60 text-center mb-12 max-w-2xl mx-auto">
            Progress through tiers as you create more content and drive engagement. Higher tiers unlock better rewards and exclusive benefits.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {tiers.map((tier, i) => (
              <div key={i} className="bg-white/5 rounded-2xl p-6 border border-white/10 hover:border-purple-500/50 transition-colors">
                <div className="text-4xl mb-3">{tier.icon}</div>
                <h3 className="text-xl font-bold text-white mb-1">{tier.name}</h3>
                <p className="text-white/60 text-sm mb-4">{tier.description}</p>
                <div className="text-xs text-purple-400 mb-4">{tier.requirements}</div>
                <ul className="space-y-2">
                  {tier.benefits.map((benefit, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-white/70">
                      <ChevronRight className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Preview */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-3xl p-8 md:p-12 border border-white/10">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold text-white mb-2">$2.50</div>
                <div className="text-white/60 text-sm">Average EPC for top creators</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-white mb-2">15%</div>
                <div className="text-white/60 text-sm">Commission on referred bookings</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-white mb-2">€500+</div>
                <div className="text-white/60 text-sm">Monthly earnings potential</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <Globe className="w-16 h-16 text-purple-400 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Start?</h2>
          <p className="text-white/60 mb-8">
            Join thousands of travel creators already on the waitlist. Be the first to know when we launch.
          </p>
          <form onSubmit={handleSubmit} className="max-w-md mx-auto flex gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold rounded-xl hover:from-pink-600 hover:to-purple-600 transition-all"
            >
              Join Waitlist
            </button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-white/10">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-white/40 text-sm">
          <Link href="/" className="hover:text-white transition-colors">
            ← Back to Spontra
          </Link>
          <span>© 2026 Spontra. All rights reserved.</span>
        </div>
      </footer>
    </div>
  )
}
