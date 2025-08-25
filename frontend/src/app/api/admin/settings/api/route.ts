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

    // This would fetch API integration settings from secure storage
    // Return empty state when API management is not configured
    const apiSettings = {
      integrations: [
        {
          id: 'amadeus',
          name: 'Amadeus Travel API',
          category: 'travel',
          description: 'Flight search and booking data',
          status: 'disconnected',
          apiKey: null,
          endpoint: 'https://api.amadeus.com/v1',
          lastSync: null,
          config: {},
          required: true
        },
        {
          id: 'stripe',
          name: 'Stripe Payments',
          category: 'payment',
          description: 'Payment processing and billing',
          status: 'disconnected',
          apiKey: null,
          endpoint: 'https://api.stripe.com/v1',
          lastSync: null,
          config: {},
          required: true
        },
        {
          id: 'google_analytics',
          name: 'Google Analytics',
          category: 'analytics',
          description: 'Website analytics and tracking',
          status: 'disconnected',
          apiKey: null,
          endpoint: 'https://analyticsdata.googleapis.com/v1beta',
          lastSync: null,
          config: {},
          required: false
        },
        {
          id: 'google_maps',
          name: 'Google Maps API',
          category: 'maps',
          description: 'Maps, geocoding, and place data',
          status: 'disconnected',
          apiKey: null,
          endpoint: 'https://maps.googleapis.com/maps/api',
          lastSync: null,
          config: {},
          required: true
        },
        {
          id: 'sendgrid',
          name: 'SendGrid Email',
          category: 'email',
          description: 'Transactional email delivery',
          status: 'disconnected',
          apiKey: null,
          endpoint: 'https://api.sendgrid.com/v3',
          lastSync: null,
          config: {},
          required: false
        },
        {
          id: 'cloudinary',
          name: 'Cloudinary Media',
          category: 'storage',
          description: 'Image and video management',
          status: 'disconnected',
          apiKey: null,
          endpoint: 'https://api.cloudinary.com/v1_1',
          lastSync: null,
          config: {},
          required: false
        },
        {
          id: 'instagram',
          name: 'Instagram Basic Display',
          category: 'social',
          description: 'Instagram content integration',
          status: 'disconnected',
          apiKey: null,
          endpoint: 'https://graph.instagram.com',
          lastSync: null,
          config: {},
          required: false
        },
        {
          id: 'facebook',
          name: 'Facebook Graph API',
          category: 'social',
          description: 'Facebook social media integration',
          status: 'disconnected',
          apiKey: null,
          endpoint: 'https://graph.facebook.com/v18.0',
          lastSync: null,
          config: {},
          required: false
        }
      ],
      webhooks: [],
      rateLimits: {
        requestsPerMinute: 0,
        requestsPerHour: 0,
        requestsPerDay: 0
      },
      configured: false,
      error: 'API integration management not configured'
    }

    return NextResponse.json(apiSettings)

  } catch (error) {
    console.error('API settings API error:', error)
    return NextResponse.json(
      { 
        integrations: [],
        webhooks: [],
        configured: false,
        error: 'API management service unavailable',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 503 }
    )
  }
}

export async function POST(request: NextRequest) {
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

    const integrationData = await request.json()

    // This would create or update an API integration
    // For now, return success but indicate service not configured
    return NextResponse.json({ 
      success: false,
      error: 'API integration management not configured - changes not saved'
    })

  } catch (error) {
    console.error('API integration save error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to save API integration',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}