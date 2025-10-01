'use client'

import { Mountain, Trees, Music, Sparkles, Users, ShoppingBag } from 'lucide-react'

interface ThemeSelectorProps {
  value: string
  onChange: (value: 'adventure' | 'culture' | 'nightlife' | 'relaxation' | 'shopping' | 'nature') => void
}

const themes = [
  {
    id: 'adventure' as const,
    label: 'Adventure',
    icon: Mountain,
    description: 'Thrills & outdoor activities'
  },
  {
    id: 'culture' as const,
    label: 'Culture',
    icon: Users,
    description: 'Museums, art & history'
  },
  {
    id: 'nightlife' as const,
    label: 'Nightlife',
    icon: Music,
    description: 'Bars, clubs & entertainment'
  },
  {
    id: 'relaxation' as const,
    label: 'Relaxation',
    icon: Sparkles,
    description: 'Spas, beaches & wellness'
  },
  {
    id: 'shopping' as const,
    label: 'Shopping',
    icon: ShoppingBag,
    description: 'Markets, malls & boutiques'
  },
  {
    id: 'nature' as const,
    label: 'Nature',
    icon: Trees,
    description: 'Parks, wildlife & landscapes'
  }
]

export function ThemeSelector({ value, onChange }: ThemeSelectorProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {themes.map((theme) => {
        const Icon = theme.icon
        const isSelected = value === theme.id
        
        return (
          <button
            key={theme.id}
            onClick={() => onChange(theme.id)}
            className={`p-4 rounded-lg border transition-all ${
              isSelected
                ? 'bg-white/30 border-white/50 text-white'
                : 'bg-white/10 border-white/20 text-white/80 hover:bg-white/20'
            }`}
          >
            <Icon className="w-6 h-6 mx-auto mb-2" />
            <div className="text-sm font-medium">{theme.label}</div>
            <div className="text-xs opacity-75 mt-1">{theme.description}</div>
          </button>
        )
      })}
    </div>
  )
}