import { MetadataRoute } from 'next'
import { db } from '@/lib/db'

/**
 * Dynamic Sitemap Generation
 *
 * Generates sitemap.xml with all public pages including:
 * - Static pages (home, legal, auth)
 * - Dynamic destination pages
 *
 * Automatically served at /sitemap.xml by Next.js
 * Updates automatically when destinations are added/updated
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://spontra.com'

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/signup`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/forgot-password`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/cookies`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/affiliate-disclosure`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
  ]

  // Fetch all destinations from database
  let destinationPages: MetadataRoute.Sitemap = []

  try {
    const destinations = await db.destination.findMany({
      select: {
        slug: true,
        updatedAt: true,
      },
      where: {
        slug: {
          not: null, // Only include destinations with slugs
        },
      },
      orderBy: {
        popularityScore: 'desc', // Most popular destinations first (better crawl priority)
      },
    })

    destinationPages = destinations.map((destination) => ({
      url: `${baseUrl}/destinations/${destination.slug}`,
      lastModified: destination.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8, // High priority for destination pages (main content)
    }))

    console.log(`[Sitemap] Generated sitemap with ${destinations.length} destinations`)
  } catch (error) {
    console.error('[Sitemap] Error fetching destinations:', error)
    // Continue with static pages only if database fails
  }

  // Combine static and dynamic pages
  return [...staticPages, ...destinationPages]
}
