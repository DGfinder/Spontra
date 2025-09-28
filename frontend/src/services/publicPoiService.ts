export interface PublicPOI {
  id: string
  name: string
  description?: string
  theme?: string
  categoryId?: string
  rating?: number
}

class PublicPoiService {
  async list(destinationId: string, opts?: { theme?: string; limit?: number }): Promise<PublicPOI[]> {
    const params = new URLSearchParams()
    if (opts?.theme) params.set('theme', opts.theme)
    if (opts?.limit) params.set('limit', String(opts.limit))
    const url = `/api/pois/${encodeURIComponent(destinationId)}${params.toString() ? `?${params.toString()}` : ''}`
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return []
    const json = await res.json()
    const arr = json?.data?.pois || json?.data || []
    return Array.isArray(arr) ? arr : []
  }
}

export const publicPoiService = new PublicPoiService()

