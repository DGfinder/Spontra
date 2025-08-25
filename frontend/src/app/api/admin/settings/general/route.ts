import { NextRequest, NextResponse } from 'next/server'
import { adminAuthService } from '@/services/adminAuthService'

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const isValid = await adminAuthService.verifyToken(token)
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // This would fetch system settings from database
    // Return default empty values when settings service is not configured
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
        bookingEnabled: false,
        reviewsEnabled: false,
        searchEnabled: false,
        analyticsEnabled: false
      },
      configured: false,
      error: 'Settings management service not configured'
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
    // Verify admin authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const isValid = await adminAuthService.verifyToken(token)
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const settingsData = await request.json()

    // This would save settings to database
    // For now, return success but indicate service not configured
    return NextResponse.json({ 
      success: false,
      error: 'Settings management service not configured - changes not persisted'
    })

  } catch (error) {
    console.error('Settings save error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to save settings',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}