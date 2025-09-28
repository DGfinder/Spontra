import { NextRequest, NextResponse } from 'next/server'

export interface ExternalServiceHealth {
  service: string
  status: 'healthy' | 'unhealthy' | 'unknown'
  responseTime?: number
  error?: string
  endpoint?: string
}

export interface ServicesHealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  services: ExternalServiceHealth[]
}

async function checkAmadeusHealth(): Promise<ExternalServiceHealth> {
  const startTime = Date.now()
  
  try {
    if (!process.env.AMADEUS_CLIENT_ID || !process.env.AMADEUS_CLIENT_SECRET) {
      return {
        service: 'amadeus',
        status: 'unknown',
        error: 'Amadeus credentials not configured'
      }
    }

    // For now, just verify credentials are configured
    // In production, you might want to make a test API call
    const responseTime = Date.now() - startTime
    
    return {
      service: 'amadeus',
      status: 'healthy',
      responseTime,
      endpoint: process.env.AMADEUS_ENVIRONMENT === 'test' ? 'test.api.amadeus.com' : 'api.amadeus.com'
    }
  } catch (error) {
    const responseTime = Date.now() - startTime
    
    return {
      service: 'amadeus',
      status: 'unhealthy',
      responseTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

async function checkBackendServices(): Promise<ExternalServiceHealth[]> {
  const services = [
    {
      name: 'search-service',
      url: process.env.NEXT_PUBLIC_API_BASE_URL
    },
    {
      name: 'data-ingestion-service', 
      url: process.env.NEXT_PUBLIC_DATA_INGESTION_URL
    }
  ]

  const healthChecks = await Promise.all(
    services.map(async (service): Promise<ExternalServiceHealth> => {
      const startTime = Date.now()
      
      if (!service.url) {
        return {
          service: service.name,
          status: 'unknown',
          error: 'Service URL not configured'
        }
      }

      try {
        // Simple connectivity check - in production you'd hit their health endpoints
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout
        
        const response = await fetch(`${service.url}/health`, {
          method: 'GET',
          signal: controller.signal,
          headers: {
            'User-Agent': 'Spontra-Frontend-HealthCheck'
          }
        })
        
        clearTimeout(timeoutId)
        const responseTime = Date.now() - startTime
        
        return {
          service: service.name,
          status: response.ok ? 'healthy' : 'unhealthy',
          responseTime,
          endpoint: service.url,
          error: response.ok ? undefined : `HTTP ${response.status}`
        }
      } catch (error) {
        const responseTime = Date.now() - startTime
        
        return {
          service: service.name,
          status: 'unhealthy',
          responseTime,
          endpoint: service.url,
          error: error instanceof Error ? error.message : 'Connection failed'
        }
      }
    })
  )

  return healthChecks
}

export async function GET(request: NextRequest): Promise<NextResponse<ServicesHealthResponse>> {
  try {
    // Check all external services
    const [amadeusHealth, ...backendServices] = await Promise.all([
      checkAmadeusHealth(),
      ...await checkBackendServices()
    ])

    const allServices = [amadeusHealth, ...backendServices]

    // Determine overall status
    const unhealthyServices = allServices.filter(s => s.status === 'unhealthy')
    const unknownServices = allServices.filter(s => s.status === 'unknown')
    
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy'
    
    if (unhealthyServices.length > 0) {
      overallStatus = 'unhealthy'
    } else if (unknownServices.length > 0) {
      overallStatus = 'degraded'
    } else {
      overallStatus = 'healthy'
    }

    const response: ServicesHealthResponse = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      services: allServices
    }

    const httpStatus = overallStatus === 'unhealthy' ? 503 : 200

    return NextResponse.json(response, { 
      status: httpStatus,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

  } catch (error) {
    const errorResponse: ServicesHealthResponse = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      services: [{
        service: 'health-endpoint',
        status: 'unhealthy',
        error: `Service health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }]
    }

    return NextResponse.json(errorResponse, { 
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  }
}

// Only support GET for health checks
export async function POST(): Promise<NextResponse> {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

export async function PUT(): Promise<NextResponse> {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

export async function DELETE(): Promise<NextResponse> {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}