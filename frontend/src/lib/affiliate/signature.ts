import crypto from 'crypto'

/**
 * Generate MD5 signature for Travelpayouts v1 flight search API
 *
 * Per documentation, signature is generated from:
 * MD5(token:marker:key1:value1:key2:value2:...)
 * Keys must be alphabetically sorted
 *
 * @example
 * generateSearchSignature({
 *   marker: '464800',
 *   host: 'spontra.com',
 *   user_ip: '127.0.0.1',
 *   locale: 'en',
 *   trip_class: 'Y',
 *   passengers: { adults: 1, children: 0, infants: 0 },
 *   segments: [
 *     { origin: 'LAX', destination: 'JFK', date: '2025-12-01' }
 *   ]
 * })
 */
export function generateSearchSignature(params: {
  marker: string
  host: string
  user_ip: string
  locale: string
  trip_class: string
  passengers: {
    adults: number
    children: number
    infants: number
  }
  segments: Array<{
    origin: string
    destination: string
    date: string
  }>
}): string {
  const token = process.env.TRAVELPAYOUTS_TOKEN

  if (!token) {
    throw new Error('TRAVELPAYOUTS_TOKEN not configured')
  }

  /**
   * Per Travelpayouts documentation, signature format is:
   * token:value1:value2:value3... (VALUES ONLY, alphabetically sorted)
   *
   * Alphabetical order (case-sensitive):
   * 1. host
   * 2. locale
   * 3. marker
   * 4. passengers (adults, children, infants - sorted separately)
   * 5. segments (each segment: date, destination, origin - sorted separately)
   * 6. trip_class
   * 7. user_ip
   */

  // Build value-only string in alphabetical order
  const values: string[] = []

  // 1. host
  values.push(params.host)

  // 2. locale
  values.push(params.locale)

  // 3. marker
  values.push(params.marker)

  // 4. passengers (nested object, sorted alphabetically: adults, children, infants)
  values.push(String(params.passengers.adults))
  values.push(String(params.passengers.children))
  values.push(String(params.passengers.infants))

  // 5. segments (array of objects, each sorted: date, destination, origin)
  params.segments.forEach((segment) => {
    values.push(segment.date)
    values.push(segment.destination)
    values.push(segment.origin)
  })

  // 6. trip_class
  values.push(params.trip_class)

  // 7. user_ip
  values.push(params.user_ip)

  // Build signature string: token:value1:value2:value3...
  const signatureString = `${token}:${values.join(':')}`

  console.log('[Signature] String to hash:', signatureString)
  console.log('[Signature] Values array:', values)

  // Generate MD5 hash
  const signature = crypto
    .createHash('md5')
    .update(signatureString)
    .digest('hex')

  console.log('[Signature] Generated MD5:', signature)

  return signature
}

/**
 * Validate required params for search signature
 */
export function validateSignatureParams(params: {
  marker?: string
  host?: string
  user_ip?: string
  locale?: string
  trip_class?: string
  passengers?: any
  segments?: any[]
}): { valid: boolean; error?: string } {
  if (!params.marker) {
    return { valid: false, error: 'Marker is required' }
  }

  if (!params.host) {
    return { valid: false, error: 'Host is required' }
  }

  if (!params.user_ip) {
    return { valid: false, error: 'User IP is required' }
  }

  if (!params.locale) {
    return { valid: false, error: 'Locale is required' }
  }

  if (!params.trip_class) {
    return { valid: false, error: 'Trip class is required' }
  }

  if (!params.passengers) {
    return { valid: false, error: 'Passengers is required' }
  }

  if (!params.segments || params.segments.length === 0) {
    return { valid: false, error: 'At least one segment is required' }
  }

  return { valid: true }
}
