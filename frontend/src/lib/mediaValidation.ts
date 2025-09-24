const ALLOWED_HOSTS = [
  'cdn.spontra.com',
  'images.spontra.com',
  'video.spontra.com',
  'res.cloudinary.com',
  'youtube.com',
  'www.youtube.com',
  'youtu.be',
  'vimeo.com',
  'player.vimeo.com',
  'stream.mux.com',
  'cloudflarestream.com',
  'videodelivery.net',
]

export function validateMediaUrl(input: string) {
  try {
    const url = new URL(input)
    if (!['https:', 'http:'].includes(url.protocol)) {
      return { ok: false as const, error: 'Media URL must be http or https' }
    }

    const host = url.hostname.toLowerCase()
    const allowed = ALLOWED_HOSTS.some((allowedHost) => host === allowedHost || host.endsWith(`.${allowedHost}`))
    if (!allowed) {
      return {
        ok: false as const,
        error: `Host ${host} is not permitted for media uploads`,
      }
    }

    return { ok: true as const, url: url.toString() }
  } catch (error) {
    return { ok: false as const, error: 'Invalid media URL' }
  }
}

export function normaliseMediaUrls(rawUrls: string[]) {
  const cleaned: string[] = []
  for (const candidate of rawUrls) {
    const trimmed = candidate.trim()
    if (!trimmed) continue
    const result = validateMediaUrl(trimmed)
    if (!result.ok || !result.url) {
      return { ok: false as const, error: result.error }
    }
    cleaned.push(result.url)
  }

  if (cleaned.length === 0) {
    return { ok: false as const, error: 'No valid media URLs provided' }
  }

  return { ok: true as const, urls: cleaned }
}
