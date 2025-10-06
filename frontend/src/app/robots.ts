import { MetadataRoute } from 'next'

/**
 * Robots.txt Configuration
 *
 * Tells search engines which pages to crawl and which to avoid.
 * Automatically served at /robots.txt by Next.js
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://spontra.com'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',           // API endpoints (no SEO value)
          '/admin/',         // Admin panel (private)
          '/_next/',         // Next.js internal files
          '/verify-email',   // Email verification (private, tokenized)
          '/reset-password', // Password reset (private, tokenized)
        ],
      },
      // Google-specific (allow all)
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/api/', '/admin/', '/_next/', '/verify-email', '/reset-password'],
      },
      // Bing-specific (allow all)
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: ['/api/', '/admin/', '/_next/', '/verify-email', '/reset-password'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
