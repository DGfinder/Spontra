import { Client } from 'pg'
import Redis from 'ioredis'

const THEMES = ['vibe', 'adventure', 'discover', 'indulge', 'nature'] as const
const STORE_KEY = 'admin:dest:preferences'

type ThemeSlug = (typeof THEMES)[number]

type ThemeVideoMap = Partial<Record<string, any>>

interface PreferenceEntry {
  iataCode?: string
  whitelisted?: boolean
  themeScores?: Record<string, number>
}

function detectMediaKind(url: string): 'video' | 'image' {
  const lower = url.toLowerCase()
  if (
    lower.endsWith('.jpg') ||
    lower.endsWith('.jpeg') ||
    lower.endsWith('.png') ||
    lower.endsWith('.gif') ||
    lower.endsWith('.webp') ||
    lower.endsWith('.avif')
  ) {
    return 'image'
  }
  return 'video'
}

function coerceTheme(key: string): ThemeSlug | null {
  const lower = key.toLowerCase()
  return THEMES.includes(lower as ThemeSlug) ? (lower as ThemeSlug) : null
}

async function migrateVideoJson(client: Client) {
  const summary = {
    destinationsProcessed: 0,
    reelsCreated: 0,
    mediaCreated: 0,
    skippedThemes: 0,
  }

  const rows = await client.query<{ airport_code: string; videos: ThemeVideoMap }>(
    SELECT airport_code, videos
       FROM destinations_enhanced
      WHERE videos IS NOT NULL
        AND videos::text <> '{}'
  )

  for (const row of rows.rows) {
    const { airport_code: iata, videos } = row
    if (!videos || typeof videos !== 'object') {
      continue
    }

    await client.query('BEGIN')
    try {
      summary.destinationsProcessed += 1

      for (const [rawTheme, rawValue] of Object.entries(videos)) {
        const themeSlug = coerceTheme(rawTheme)
        if (!themeSlug || !Array.isArray(rawValue) || rawValue.length === 0) {
          summary.skippedThemes += 1
          continue
        }

        const urls = Array.from(new Set(rawValue.filter((url): url is string => typeof url === 'string' && url.trim().length > 0)))
        if (urls.length === 0) {
          summary.skippedThemes += 1
          continue
        }

        const atLeastOneThemeRow = await client.query(
          'SELECT 1 FROM "CityTheme" WHERE iata =  AND "themeSlug" = ',
          [iata, themeSlug]
        )
        if (atLeastOneThemeRow.rowCount === 0) {
          await client.query(
            'INSERT INTO "CityTheme" (iata, "themeSlug") VALUES (, ) ON CONFLICT DO NOTHING',
            [iata, themeSlug]
          )
        }

        const sortBase = await client.query(
          'SELECT COALESCE(MAX("sortOrder"), 0) AS max_sort FROM "Reel" WHERE iata =  AND "themeSlug" = ',
          [iata, themeSlug]
        )
        let nextSort = Number(sortBase.rows[0]?.max_sort ?? 0) + 1

        for (const url of urls) {
          const reelInsert = await client.query(
            INSERT INTO "Reel" (iata, "themeSlug", title, caption, language, "sortOrder")
             VALUES (, , NULL, NULL, 'en', )
             RETURNING id,
            [iata, themeSlug, nextSort]
          )
          const reelId = reelInsert.rows[0].id as number

          await client.query(
            INSERT INTO "ReelMedia" ("reelId", kind, "sourceUrl")
             VALUES (, , ),
            [reelId, detectMediaKind(url), url]
          )

          summary.reelsCreated += 1
          summary.mediaCreated += 1
          nextSort += 1
        }
      }

      await client.query(
        'UPDATE destinations_enhanced SET videos = ()::jsonb WHERE airport_code = ',
        ['{}', iata]
      )

      await client.query('COMMIT')
    } catch (error) {
      await client.query('ROLLBACK')
      console.error(Failed to migrate videos for :, error)
    }
  }

  return summary
}

async function migrateRedisPreferences(client: Client) {
  const redisUrl = process.env.REDIS_URL || process.env.NEXT_PUBLIC_REDIS_URL
  if (!redisUrl) {
    return { processed: 0, enabled: 0, skipped: 0 }
  }

  const redis = new Redis(redisUrl)
  try {
    const raw = await redis.get(STORE_KEY)
    if (!raw) {
      return { processed: 0, enabled: 0, skipped: 0 }
    }

    const map = JSON.parse(raw) as Record<string, PreferenceEntry>
    let processed = 0
    let enabled = 0
    let skipped = 0

    for (const [key, entry] of Object.entries(map)) {
      processed += 1
      if (!entry || !entry.themeScores) {
        skipped += 1
        continue
      }

      const iata = (entry.iataCode || key || '').toUpperCase()
      if (!iata || iata.length !== 3) {
        skipped += 1
        continue
      }

      for (const [theme, score] of Object.entries(entry.themeScores)) {
        const themeSlug = coerceTheme(theme)
        if (!themeSlug) continue
        if ((score ?? 0) > 0) {
          await client.query(
            'UPDATE "CityTheme" SET "isEnabled" = true WHERE iata =  AND "themeSlug" = ',
            [iata, themeSlug]
          )
          enabled += 1
        }
      }
    }

    await redis.del(STORE_KEY)
    return { processed, enabled, skipped }
  } finally {
    await redis.quit()
  }
}

async function main() {
  const connectionString = process.env.SEARCH_DATABASE_URL || process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL or SEARCH_DATABASE_URL must be set for migration')
  }

  const client = new Client({ connectionString })
  await client.connect()

  try {
    const videoReport = await migrateVideoJson(client)
    const redisReport = await migrateRedisPreferences(client)

    console.info(
      JSON.stringify({
        component: 'migration',
        event: 'theme_media_migration.complete',
        videoReport,
        redisReport,
      })
    )
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error('Migration failed:', error)
  process.exit(1)
})
