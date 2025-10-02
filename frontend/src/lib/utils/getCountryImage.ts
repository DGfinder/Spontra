import { CountryImageResolution } from '@/types/country'

/**
 * Client-safe country image resolver
 * Resolves country image with priority cascade:
 * 1. Admin-uploaded image (from DB)
 * 2. Manual curated image from /public/countries/{code}.jpg
 * 3. Gradient fallback with flag SVG
 *
 * Note: We try /countries/{code}.jpg and fallback to gradient on 404
 */
export function getCountryImageClient(
  countryCode: string,
  dbImageUrl?: string | null
): CountryImageResolution {
  // Priority 1: Admin-uploaded image exists in DB
  if (dbImageUrl) {
    return {
      url: dbImageUrl,
      type: 'custom'
    }
  }

  // Priority 2/3: Try default image, component will fallback to gradient if 404
  return {
    url: `/countries/${countryCode}.jpg`,
    type: 'default'
  }
}

/**
 * Get theme color gradient for fallback
 */
export function getCountryGradient(theme: string): string {
  const gradients: Record<string, string> = {
    adventure: 'linear-gradient(135deg, #ffbd0a 0%, #ff8c00 100%)',
    nature: 'linear-gradient(135deg, #02c06d 0%, #00875a 100%)',
    indulge: 'linear-gradient(135deg, #e52b00 0%, #b22200 100%)',
    vibe: 'linear-gradient(135deg, #eb5b25 0%, #d84315 100%)',
    discover: 'linear-gradient(135deg, #7f6ae4 0%, #5e35b1 100%)',
    default: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)'
  }

  return gradients[theme] || gradients.default
}
