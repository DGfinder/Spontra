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
    description: 'Discover adrenaline-pumping experiences and unforgettable outdoor activities that will get your heart racing.',
    gradient: 'from-yellow-500/20 to-orange-600/20'
  },
  {
    value: 'nature',
    label: 'Nature',
    emoji: '🌲',
    icon: Trees,
    color: '#02c06d',
    background: '/backgrounds/nature-background.webp',
    title: 'Nature\'s Wonders',
    description: 'Explore breathtaking natural landscapes, serene parks, and pristine wilderness destinations.',
    gradient: 'from-green-500/20 to-emerald-600/20'
  },
  {
    value: 'vibe',
    label: 'Vibe',
    emoji: '🎭',
    icon: Music,
    color: '#eb5b25',
    background: '/backgrounds/vibe-background.webp',
    title: 'Feel the Vibe',
    description: 'Experience vibrant nightlife, cultural hotspots, and the electric energy of urban entertainment.',
    gradient: 'from-orange-500/20 to-red-600/20'
  },
  {
    value: 'indulge',
    label: 'Indulge',
    emoji: '🍷',
    icon: Wine,
    color: '#e52b00',
    background: '/backgrounds/indulge-background.webp',
    title: 'Indulge Your Senses',
    description: 'Savor exquisite dining, luxury experiences, and refined pleasures that satisfy your sophisticated tastes.',
    gradient: 'from-red-500/20 to-pink-600/20'
  },
  {
    value: 'discover',
    label: 'Discover',
    emoji: '🔍',
    icon: Globe,
    color: '#8b5cf6',
    background: '/backgrounds/discover-background.webp',
    title: 'Discover Hidden Gems',
    description: 'Uncover unique attractions, local secrets, and off-the-beaten-path treasures waiting to be explored.',
    gradient: 'from-purple-500/20 to-indigo-600/20'
  }
]

export function getThemeConfig(themeValue: string): ThemeConfig {
  return THEME_CONFIGS.find(t => t.value === themeValue) || THEME_CONFIGS[0]
}
