import { getThemeGradient, type ThemeKey } from '@/lib/theme'

interface ThemeBlurbServerProps {
  selectedTheme: string
  isPending?: boolean
  isSubmitting?: boolean
}

const BLURBS: Record<ThemeKey, { title: string; description: string }> = {
  adventure: {
    title: 'Thrilling Adventures Await',
    description:
      'From mountain treks to hidden canyons, uncover destinations packed with adrenaline and breathtaking views. Find trips that match your sense of adventure.'
  },
  nature: {
    title: 'Reconnect With Nature',
    description:
      'Seek out serene forests, coastal escapes, and national parks. We\'ll help you find peaceful places immersed in greenery and fresh air.'
  },
  indulge: {
    title: 'Indulge in Luxury & Wellness',
    description:
      'Luxury shopping, spa retreats, and premium experiences. Discover destinations where you can pamper yourself and enjoy the finer things.'
  },
  vibe: {
    title: 'Feel The Social Energy',
    description:
      'Find cities with buzzing bars, festivals, and vibrant social scenes. Plan a getaway where the energy and connections are unforgettable.'
  },
  discover: {
    title: 'Discover Culture & Cuisine',
    description:
      'Museums, local markets, and authentic culinary experiences. Explore places that inspire curiosity and expand your cultural horizons.'
  }
}

// Server Component for theme blurb - pre-rendered for SEO and performance
export async function ThemeBlurbServer({ 
  selectedTheme, 
  isPending = false, 
  isSubmitting = false 
}: ThemeBlurbServerProps) {
  const themeKey = selectedTheme as ThemeKey
  const blurb = BLURBS[themeKey] || {
    title: 'Discover Amazing Destinations',
    description: 'Find your perfect getaway based on your interests and travel style. From adventure-packed destinations to cultural experiences, we\'ll help you discover places that match your mood.'
  }

  return (
    <div
      className="hidden md:flex"
      style={{ position: 'relative' }}
    >
      <div
        className="absolute top-16 md:top-20 lg:top-28 w-[min(560px,44vw)] bg-black/55 backdrop-blur-sm border border-white/10 rounded-xl p-5 md:p-6 lg:p-7 shadow-2xl"
        style={{ right: '5vw' }}
      >
        <div className="text-white font-muli">
          <div className="flex items-center gap-3 mb-3">
            <span
              className="inline-block h-1.5 w-8 rounded"
              aria-hidden="true"
              style={{ background: getThemeGradient(themeKey) }}
            ></span>
            <h3 className="font-extrabold tracking-tight text-xl md:text-2xl">
              {blurb.title}
            </h3>
          </div>
          <p className="opacity-90 text-sm md:text-base leading-relaxed">
            {blurb.description}
          </p>
          
          {/* Modern loading indicator with React 19 state */}
          {(isPending || isSubmitting) && (
            <div className="mt-4 flex items-center gap-2 text-sm opacity-75">
              <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full"></div>
              <span>Searching destinations with AI...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}