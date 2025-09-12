import { NextRequest, NextResponse } from 'next/server'
import { cacheGet, cacheSet } from '@/lib/cacheServer'

function requireAdmin(req: NextRequest): boolean {
  const auth = req.headers.get('authorization') || req.headers.get('Authorization')
  if (!auth || !auth.startsWith('Bearer ')) return false
  // Full JWT validation is enforced by middleware; here we just check presence
  return true
}

export async function GET(request: NextRequest) {
  try {
    if (!requireAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Try to load saved settings from Redis/cache
    const raw = await cacheGet('admin:settings:general').catch(() => null)
    if (raw) {
      return NextResponse.json(JSON.parse(raw))
    }

    // Defaults when nothing saved yet
    const systemSettings = {
      general: {
        siteName: '',
        siteUrl: '',
        description: '',
        logoUrl: '',
        timezone: 'UTC',
        language: 'en',
        currency: 'EUR',
        dateFormat: 'MM/DD/YYYY'
      },
      company: {
        name: '',
        address: '',
        city: '',
        country: '',
        phone: '',
        email: '',
        taxId: ''
      },
      notifications: {
        emailEnabled: false,
        pushEnabled: false,
        smsEnabled: false,
        webhooksEnabled: false
      },
      features: {
        maintenanceMode: false,
        registrationOpen: false,
        bookingEnabled: true,
        reviewsEnabled: false,
        searchEnabled: true,
        analyticsEnabled: true,
        backendExploreEnabled: process.env.NEXT_PUBLIC_BACKEND_ENABLED === 'true',
        durationEnrichmentEnabled: true,
        destinationCacheTTLSeconds: 120
      },
      configured: false,
      error: undefined
    }

    return NextResponse.json(systemSettings)

  } catch (error) {
    console.error('Settings API error:', error)
    return NextResponse.json(
      { 
        configured: false,
        error: 'Settings service unavailable',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 503 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!requireAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const settingsData = await request.json()
    await cacheSet('admin:settings:general', JSON.stringify(settingsData), { ttlSeconds: 24 * 60 * 60 }).catch(() => {})
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Settings save error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to save settings', details: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    )
  }
}
