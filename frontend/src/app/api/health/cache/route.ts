import { NextRequest, NextResponse } from 'next/server'
import { checkKVHealth, cache } from '@/lib/cache'

export interface CacheHealthResponse {
  status: 'healthy' | 'unhealthy'
  timestamp: string
  kvStore: {
    success: boolean
    message: string
    responseTime: number
  }
  operations?: {
    set: boolean
    get: boolean
    delete: boolean
    exists: boolean
  }
  error?: string
}

async function testCacheOperations(): Promise<{
  set: boolean
  get: boolean
  delete: boolean
  exists: boolean
}> {
  const testKey = `health-test-${Date.now()}`
  const testValue = { test: true, timestamp: Date.now() }
  
  try {
    // Test SET operation
    const setResult = await cache.set(testKey, testValue, { ex: 30 })
    
    // Test GET operation
    const getValue = await cache.get(testKey)
    const getResult = getValue !== null && getValue.test === true
    
    // Test EXISTS operation
    const existsResult = await cache.exists(testKey)
    
    // Test DELETE operation
    const deleteResult = await cache.del(testKey)
    
    return {
      set: setResult,
      get: getResult,
      delete: deleteResult,
      exists: existsResult
    }
  } catch (error) {
    console.error('Cache operations test failed:', error)
    return {
      set: false,
      get: false,
      delete: false,
      exists: false
    }
  }
}

export async function GET(request: NextRequest): Promise<NextResponse<CacheHealthResponse>> {
  const startTime = Date.now()
  
  try {
    // Test basic KV health
    const kvResult = await checkKVHealth()
    const responseTime = Date.now() - startTime
    
    let operations
    try {
      // Test detailed cache operations
      operations = await testCacheOperations()
    } catch (error) {
      console.warn('Could not test cache operations:', error)
    }

    const response: CacheHealthResponse = {
      status: kvResult.success ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      kvStore: {
        success: kvResult.success,
        message: kvResult.message,
        responseTime
      }
    }

    if (operations) {
      response.operations = operations
    }

    const httpStatus = kvResult.success ? 200 : 503

    return NextResponse.json(response, { 
      status: httpStatus,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

  } catch (error) {
    const responseTime = Date.now() - startTime
    
    const errorResponse: CacheHealthResponse = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      kvStore: {
        success: false,
        message: 'Cache health check failed',
        responseTime
      },
      error: error instanceof Error ? error.message : 'Unknown error'
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