#!/usr/bin/env tsx

import { sentryHelpers, APIError, DatabaseError, ValidationError, checkSentryConfig } from '../src/lib/sentry'

async function testSentryIntegration() {
  console.log('🔍 Testing Sentry Error Tracking Integration...\n')

  // Check configuration
  console.log('1. Checking Sentry configuration...')
  const config = checkSentryConfig()
  console.log(`   Configured: ${config.configured ? '✅' : '❌'}`)
  console.log(`   Environment: ${config.environment}`)
  console.log(`   Message: ${config.message}\n`)

  if (!config.configured) {
    console.log('❌ Sentry is not properly configured. Please check your environment variables:')
    console.log('   - NEXT_PUBLIC_SENTRY_DSN')
    console.log('   - SENTRY_ORG (optional, for source maps)')
    console.log('   - SENTRY_PROJECT (optional, for source maps)')
    console.log('   - SENTRY_AUTH_TOKEN (optional, for source maps)')
    console.log('\n💡 Set SENTRY_ENABLED=true in development to test error reporting.')
    return
  }

  console.log('📝 Testing different error types...\n')

  // Test custom error types
  console.log('2. Testing custom error types...')
  
  try {
    throw new APIError('Test API error', 500, '/api/test')
  } catch (error) {
    sentryHelpers.captureError(error as Error, 'error', {
      test: true,
      errorType: 'api'
    })
    console.log('   ✅ API Error captured')
  }

  try {
    throw new DatabaseError('Test database error', 'SELECT', 'users')
  } catch (error) {
    sentryHelpers.captureError(error as Error, 'error', {
      test: true,
      errorType: 'database'
    })
    console.log('   ✅ Database Error captured')
  }

  try {
    throw new ValidationError('Test validation error', 'email', 'invalid@')
  } catch (error) {
    sentryHelpers.captureError(error as Error, 'warning', {
      test: true,
      errorType: 'validation'
    })
    console.log('   ✅ Validation Error captured')
  }

  // Test breadcrumbs
  console.log('\n3. Testing breadcrumbs...')
  sentryHelpers.addBreadcrumb('User started test', 'test', 'info', { userId: 'test-user' })
  sentryHelpers.addBreadcrumb('Test parameters set', 'test', 'debug', { params: { test: true } })
  sentryHelpers.addBreadcrumb('About to capture message', 'test', 'info')
  
  sentryHelpers.captureMessage('Test message with breadcrumbs', 'info', {
    test: true,
    messageType: 'breadcrumb_test'
  })
  console.log('   ✅ Breadcrumbs and message captured')

  // Test user context
  console.log('\n4. Testing user context...')
  sentryHelpers.setUser({
    id: 'test-user-123',
    email: 'test@spontra.com',
    username: 'testuser'
  })
  
  sentryHelpers.captureMessage('Test message with user context', 'info', {
    test: true,
    messageType: 'user_context_test'
  })
  console.log('   ✅ User context set and message captured')

  // Test performance monitoring
  console.log('\n5. Testing performance monitoring...')
  const transaction = sentryHelpers.startTransaction('test-operation', 'test')
  
  // Simulate some work
  await new Promise(resolve => setTimeout(resolve, 100))
  
  transaction.setTag('test', 'performance')
  transaction.setData('duration', 100)
  transaction.finish()
  console.log('   ✅ Performance transaction captured')

  // Test API error handling
  console.log('\n6. Testing API error handling...')
  try {
    throw new Error('Simulated API failure')
  } catch (error) {
    const handledError = sentryHelpers.handleAPIError(
      error,
      '/api/test-endpoint',
      'POST',
      'test-user-123'
    )
    console.log(`   ✅ API error handled: ${handledError.message}`)
  }

  // Test database monitoring
  console.log('\n7. Testing database monitoring...')
  try {
    await sentryHelpers.monitorDatabaseOperation(
      'test-query',
      'test_table',
      async () => {
        // Simulate database operation
        await new Promise(resolve => setTimeout(resolve, 50))
        return { success: true }
      }
    )
    console.log('   ✅ Database operation monitored successfully')
  } catch (error) {
    console.log('   ❌ Database monitoring failed (expected for test)')
  }

  // Test metrics
  console.log('\n8. Testing metrics...')
  sentryHelpers.captureMetric('test.counter', 1, 'none', { test: 'true' })
  sentryHelpers.captureMetric('test.duration', 100, 'millisecond', { operation: 'test' })
  console.log('   ✅ Custom metrics captured')

  // Clear user context
  sentryHelpers.clearUser()
  console.log('\n9. User context cleared')

  console.log('\n🎉 Sentry integration testing completed!')
  
  if (process.env.NODE_ENV === 'development' && !process.env.SENTRY_ENABLED) {
    console.log('\n💡 Note: Events are not sent to Sentry in development unless SENTRY_ENABLED=true')
    console.log('   To test actual error reporting, set SENTRY_ENABLED=true in your .env file')
  } else {
    console.log('\n📊 Check your Sentry dashboard to see the captured events:')
    console.log('   - Error events with custom context')
    console.log('   - Performance transactions')
    console.log('   - Custom metrics')
    console.log('   - Breadcrumb trails')
  }
}

// Run the test
testSentryIntegration().catch((error) => {
  console.error('❌ Sentry integration test failed:', error)
  process.exit(1)
})