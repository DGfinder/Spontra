// Server Component for static theme data and background rendering
export async function ThemeBackgroundServer() {
  // Pre-generate theme data server-side for better SEO and performance
  const themes = [
    { 
      id: 'adventure', 
      label: 'Adventure', 
      background: '/adventure-background.jpg',
      color: 'adventure'
    },
    { 
      id: 'nature', 
      label: 'Nature', 
      background: '/nature-background.jpg',
      color: 'nature'
    },
    { 
      id: 'indulge', 
      label: 'Indulge', 
      background: '/indulge-background.jpg',
      color: 'indulge'
    },
    { 
      id: 'vibe', 
      label: 'Vibe', 
      background: '/vibe-background.jpg',
      color: 'vibe'
    },
    { 
      id: 'discover', 
      label: 'Discover', 
      background: '/discover-background.jpg',
      color: 'discover'
    }
  ]

  return (
    <>
      {/* Preload theme images for performance */}
      {themes.map((theme) => (
        <link
          key={theme.id}
          rel="preload"
          as="image"
          href={theme.background}
        />
      ))}
      
      {/* Theme metadata for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            "name": "Spontra Travel Themes",
            "description": "AI-powered travel destination discovery based on adventure, nature, indulgence, vibe, and cultural discovery themes",
            "serviceType": "Travel Planning",
            "availableChannel": themes.map(theme => ({
              "@type": "ServiceChannel",
              "name": theme.label,
              "description": `${theme.label} themed travel destinations`
            }))
          })
        }}
      />
    </>
  )
}

// Export theme data for client components
export const THEMES_DATA = [
  {
    id: 'adventure',
    label: 'Adventure',
    background: '/adventure-background.jpg',
    color: 'adventure'
  },
  {
    id: 'nature',
    label: 'Nature',
    background: '/nature-background.jpg',
    color: 'nature'
  },
  {
    id: 'indulge',
    label: 'Indulge',
    background: '/indulge-background.jpg',
    color: 'indulge'
  },
  {
    id: 'vibe',
    label: 'Vibe',
    background: '/vibe-background.jpg',
    color: 'vibe'
  },
  {
    id: 'discover',
    label: 'Discover',
    background: '/discover-background.jpg',
    color: 'discover'
  }
]