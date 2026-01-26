import { NextRequest, NextResponse } from 'next/server'
import { sentryHelpers, APIError, DatabaseError, ValidationError } from '@/lib/sentry'

// Test endpoint for Sentry error tracking - REMOVE IN PRODUCTION
export async function GET(request: NextRequest): Promise<NextResponse> {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 })
  }

  const { searchParams } = new URL(request.url)
  const errorType = searchParams.get('type') || 'generic'

  try {
    switch (errorType) {
      case 'api':
        throw new APIError('Test API error', 500, '/api/test-error')
      
      case 'database':
        throw new DatabaseError('Test database error', 'SELECT', 'users')
      
      case 'validation':
        throw new ValidationError('Test validation error', 'email', 'invalid-email')
      
      case 'async':
        // Test unhandled promise rejection
        setTimeout(() => {
          throw new Error('Test async error')
        }, 100)
        return NextResponse.json({ message: 'Async error thrown' })
      
      case 'performance':
        // Test performance monitoring (Sentry 8.x)
        await sentryHelpers.startSpan('test-operation', 'test', async () => {
          // Simulate slow operation
          await new Promise(resolve => setTimeout(resolve, 1000))
          return { success: true }
        })
        return NextResponse.json({ message: 'Performance test completed' })
      
      case 'breadcrumb':
        sentryHelpers.addBreadcrumb('Test breadcrumb', 'test', 'info', { test: true })
        sentryHelpers.captureMessage('Test message with breadcrumb', 'info')
        return NextResponse.json({ message: 'Breadcrumb test completed' })
      
      default:
        throw new Error(`Test error of type: ${errorType}`)
    }
  } catch (error) {
    // Test error handling
    const handledError = sentryHelpers.handleAPIError(
      error,
      '/api/test-error',
      'GET',
      'test-user'
    )
    
    return NextResponse.json(
      { 
        error: 'Test error captured',
        type: errorType,
        message: handledError.message 
      },
      { status: 500 }
    )
  }
}

// Only support GET for testing
export async function POST(): Promise<NextResponse> {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

export async function PUT(): Promise<NextResponse> {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

export async function DELETE(): Promise<NextResponse> {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}