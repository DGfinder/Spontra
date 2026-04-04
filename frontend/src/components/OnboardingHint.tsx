'use client'

import { useState, useEffect } from 'react'
import { Mountain, Plane, CalendarCheck, X } from 'lucide-react'

const STORAGE_KEY = 'spontra_onboarding_dismissed'

const STEPS = [
  {
    icon: Mountain,
    color: '#ee6d16',
    title: 'Pick your vibe',
    desc: 'Choose a theme — Adventure, Nature, Indulge, Vibe, or Discover.',
  },
  {
    icon: Plane,
    color: '#38bdf8',
    title: 'Search destinations',
    desc: 'Set your departure airport and how far you want to fly.',
  },
  {
    icon: CalendarCheck,
    color: '#22c55e',
    title: 'Compare & book',
    desc: 'See real-time flights, compare prices, and head straight to booking.',
  },
]

export function OnboardingHint() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Show only for first-time visitors
    try {
      const dismissed = localStorage.getItem(STORAGE_KEY)
      if (!dismissed) setVisible(true)
    } catch {
      // localStorage unavailable (SSR / private mode) — stay hidden
    }
  }, [])

  const dismiss = () => {
    setVisible(false)
    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch { /* ignore */ }
  }

  if (!visible) return null

  return (
    <div
      className="pointer-events-auto mt-4 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md p-4 text-white animate-fade-in-up"
      style={{ animationDelay: '600ms', animationFillMode: 'both' }}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-orange-400">How it works</p>
        <button
          onClick={dismiss}
          className="text-white/30 hover:text-white/60 transition-colors -mt-0.5 -mr-1 p-1"
          aria-label="Dismiss onboarding hint"
        >
          <X size={14} />
        </button>
      </div>
      <div className="flex gap-3">
        {STEPS.map((step, i) => {
          const Icon = step.icon
          return (
            <div key={i} className="flex-1 flex flex-col items-center text-center gap-1.5">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${step.color}22`, border: `1px solid ${step.color}44` }}
              >
                <Icon size={14} style={{ color: step.color }} />
              </div>
              <p className="text-[11px] font-semibold leading-tight">{step.title}</p>
              <p className="text-[10px] text-white/40 leading-tight hidden sm:block">{step.desc}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
