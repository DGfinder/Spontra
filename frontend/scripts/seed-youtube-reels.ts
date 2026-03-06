import { PrismaClient } from '@prisma/client'

const p = new PrismaClient()

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY!
const THEME_QUERIES: Record<string, string> = {
  adventure:  'travel adventure destination cinematic',
  nature:     'nature travel destination beautiful scenery',
  vibe:       'nightlife travel destination city vibes',
  indulge:    'luxury travel hotel fine dining destination',
  discover:   'hidden gem travel destination culture explore',
}

// Destinations that have flight_routes in DB — cover the most origin airports
const TARGETS = [
  // High-value destinations not yet well covered
  { iata: 'NRT', city: 'Tokyo' },
  { iata: 'ICN', city: 'Seoul' },
  { iata: 'TYO', city: 'Tokyo' },
  { iata: 'BCN', city: 'Barcelona' },
  { iata: 'LIS', city: 'Lisbon' },
  { iata: 'FCO', city: 'Rome' },
  { iata: 'MAD', city: 'Madrid' },
  { iata: 'CDG', city: 'Paris' },
  { iata: 'AMS', city: 'Amsterdam' },
  { iata: 'DUB', city: 'Dublin' },
  { iata: 'BRU', city: 'Brussels' },
  { iata: 'HKG', city: 'Hong Kong' },
  { iata: 'BKK', city: 'Bangkok' },
  { iata: 'SGN', city: 'Ho Chi Minh City' },
  { iata: 'HKT', city: 'Phuket' },
  { iata: 'KUL', city: 'Kuala Lumpur' },
  { iata: 'SIN', city: 'Singapore' },
  { iata: 'DPS', city: 'Bali' },
  { iata: 'MNL', city: 'Manila' },
  { iata: 'CGK', city: 'Jakarta' },
  { iata: 'MEL', city: 'Melbourne' },
  { iata: 'SYD', city: 'Sydney' },
  { iata: 'BNE', city: 'Brisbane' },
  { iata: 'PER', city: 'Perth' },
  { iata: 'AKL', city: 'Auckland' },
  { iata: 'ZQN', city: 'Queenstown' },
  { iata: 'DXB', city: 'Dubai' },
  { iata: 'IST', city: 'Istanbul' },
  { iata: 'ATH', city: 'Athens' },
  { iata: 'LHR', city: 'London' },
]

// One theme per destination to avoid hammering the API (10k quota/day)
// Spread themes across destinations
const THEME_ROTATION = ['adventure', 'nature', 'vibe', 'indulge', 'discover']

async function searchYouTube(query: string): Promise<{ videoId: string; title: string; thumbnail: string } | null> {
  const url = new URL('https://www.googleapis.com/youtube/v3/search')
  url.searchParams.set('part', 'snippet')
  url.searchParams.set('q', query)
  url.searchParams.set('type', 'video')
  url.searchParams.set('maxResults', '3')
  url.searchParams.set('videoDuration', 'short')
  url.searchParams.set('relevanceLanguage', 'en')
  url.searchParams.set('key', YOUTUBE_API_KEY)

  const res = await fetch(url.toString())
  if (!res.ok) { console.error('YouTube API error:', res.status, await res.text()); return null }

  const data: any = await res.json()
  const item = data.items?.[0]
  if (!item) return null

  return {
    videoId: item.id.videoId,
    title: item.snippet.title,
    thumbnail: item.snippet.thumbnails.maxres?.url || item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium.url,
  }
}

async function run() {
  if (!YOUTUBE_API_KEY) { console.error('Missing YOUTUBE_API_KEY'); process.exit(1) }

  console.log(`Seeding YouTube reels for ${TARGETS.length} destinations...\n`)
  let created = 0
  let skipped = 0

  for (let i = 0; i < TARGETS.length; i++) {
    const { iata, city } = TARGETS[i]
    const theme = THEME_ROTATION[i % THEME_ROTATION.length]

    // Skip if already exists
    const existing: any[] = await p.$queryRaw`SELECT id FROM "Reel" WHERE iata = ${iata} AND "themeSlug" = ${theme} LIMIT 1`
    if (existing.length > 0) { process.stdout.write('·'); skipped++; continue }

    const query = `${city} ${THEME_QUERIES[theme]}`
    const video = await searchYouTube(query)
    if (!video) { process.stdout.write('✗'); continue }

    const reel: any[] = await p.$queryRaw`
      INSERT INTO "Reel" (iata, "themeSlug", title, caption, language, "isActive", "sortOrder", "updatedAt")
      VALUES (${iata}, ${theme}, ${video.title}, ${`Discover ${city} — ${theme} awaits`}, 'en', true, 0, NOW())
      RETURNING id`

    // Store YouTube embed URL + thumbnail
    const youtubeUrl = `https://www.youtube.com/embed/${video.videoId}?autoplay=1&mute=1&loop=1&playlist=${video.videoId}&controls=0`
    await p.$queryRaw`INSERT INTO "ReelMedia" ("reelId", kind, "sourceUrl", credit, "sortOrder", "isActive") VALUES (${reel[0].id}, 'video', ${youtubeUrl}, 'YouTube', 1, true)`
    // Also add thumbnail as fallback image
    await p.$queryRaw`INSERT INTO "ReelMedia" ("reelId", kind, "sourceUrl", credit, "sortOrder", "isActive") VALUES (${reel[0].id}, 'image', ${video.thumbnail}, 'YouTube', 2, true)`

    process.stdout.write('✓')
    created++

    // Small delay to respect rate limits
    await new Promise(r => setTimeout(r, 200))
  }

  const total: any[] = await p.$queryRaw`SELECT COUNT(*)::int as n FROM "Reel"`
  console.log(`\n\n✅ ${created} new | ${skipped} skipped | Total reels: ${total[0].n}`)
}

run().catch(console.error).finally(() => p.$disconnect())
