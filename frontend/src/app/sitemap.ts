import { MetadataRoute } from 'next'
import { config } from '@/lib/config'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = config.baseUrl

  return [
    { url: base,                  lastModified: new Date(), changeFrequency: 'daily',  priority: 1 },
    { url: `${base}/flights`,     lastModified: new Date(), changeFrequency: 'daily',  priority: 0.9 },
    { url: `${base}/creators`,    lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/dashboard`,   lastModified: new Date(), changeFrequency: 'weekly', priority: 0.5 },
  ]
}
