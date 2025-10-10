import { Compass, Trees, Wine, Music, Globe } from 'lucide-react'

export interface ThemeConfig {
  value: string
  label: string
  emoji: string
  icon: typeof Compass
  color: string
  background: string
  title: string
  description: string
  gradient: string
}

export const THEME_CONFIGS: ThemeConfig[] = [
  {
    value: 'adventure',
    label: 'Adventure',
    emoji: '🏔️',
    icon: Compass,
    color: '#ffbd0a',
    background: '/backgrounds/adventure-background.webp',
    title: 'Thrilling Adventures Await',
    description: 'From mountain treks to hidden canyons, uncover destinations packed with adrenaline and breathtaking views. Find trips that match your sense of adventure.',
    gradient: 'from-yellow-500/20 to-orange-600/20'
  },
  {
    value: 'nature',
    label: 'Nature',
    emoji: '🌲',
    icon: Trees,
    color: '#02c06d',
    background: '/backgrounds/nature-background.webp',
    title: 'Pristine Wilderness Calls',
    description: 'Discover untouched landscapes, national parks, and eco-lodges where nature takes center stage. Perfect for those seeking tranquility.',
    gradient: 'from-green-500/20 to-emerald-600/20'
  },
  {
    value: 'vibe',
    label: 'Vibe',
    emoji: '🎭',
    icon: Music,
    color: '#eb5b25',
    background: '/backgrounds/vibe-background.webp',
    title: 'Cultural Rhythms Beckon',
    description: 'Feel the pulse of local music, festivals, and nightlife. Immerse yourself in destinations where culture and energy collide.',
    gradient: 'from-orange-500/20 to-red-600/20'
  },
  {
    value: 'indulge',
    label: 'Indulge',
    emoji: '🍷',
    icon: Wine,
    color: '#e52b00',
    background: '/backgrounds/indulge-background.webp',
    title: 'Luxury Beyond Compare',
    description: 'Five-star resorts, Michelin dining, and exclusive experiences await. Treat yourself to the finest destinations and accommodations.',
    gradient: 'from-red-500/20 to-pink-600/20'
  },
  {
    value: 'discover',
    label: 'Discover',
    emoji: '🔍',
    icon: Globe,
    color: '#8b5cf6',
    background: '/backgrounds/discover-background.webp',
    title: 'Hidden Gems Unveiled',
    description: 'Explore lesser-known destinations and off-the-beaten-path wonders. For travelers who seek the unique and extraordinary.',
    gradient: 'from-purple-500/20 to-indigo-600/20'
  }
]

export function getThemeConfig(themeValue: string): ThemeConfig {
  return THEME_CONFIGS.find(t => t.value === themeValue) || THEME_CONFIGS[0]
}
