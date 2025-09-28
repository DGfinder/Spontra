#!/usr/bin/env tsx

/**
 * Complete User Flow Test Script
 * Tests the entire booking flow from landing to redirect
 */

interface TestResult {
  step: string
  success: boolean
  error?: string
  data?: any
  timing?: number
}

interface UserFlowTest {
  results: TestResult[]
  summary: {
    totalSteps: number
    passed: number
    failed: number
    overallSuccess: boolean
  }
}

async function testStep(
  stepName: string, 
  testFunction: () => Promise<any>
): Promise<TestResult> {
  console.log(`🧪 Testing: ${stepName}`)
  const startTime = Date.now()
  
  try {
    const data = await testFunction()
    const timing = Date.now() - startTime
    console.log(`✅ ${stepName} - Success (${timing}ms)`)
    return {
      step: stepName,
      success: true,
      data,
      timing
    }
  } catch (error) {
    const timing = Date.now() - startTime
    console.log(`❌ ${stepName} - Failed (${timing}ms):`, error instanceof Error ? error.message : error)
    return {
      step: stepName,
      success: false,
      error: error instanceof Error ? error.message : String(error),
      timing
    }
  }
}

async function runUserFlowTest(): Promise<UserFlowTest> {
  console.log('🚀 Starting Complete User Flow Test\n')
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  console.log(`🌐 Testing against: ${baseUrl}\n`)
  
  const results: TestResult[] = []

  // Step 1: Test landing page loads
  results.push(await testStep('Landing page loads', async () => {
    const response = await fetch(baseUrl)
    if (!response.ok) {
      throw new Error(`Landing page failed: ${response.status}`)
    }
    const html = await response.text()
    if (!html.includes('SPONTRA')) {
      throw new Error('Landing page missing expected content')
    }
    return { status: response.status, hasContent: true }
  }))

  // Step 2: Test environment configuration
  results.push(await testStep('Environment variables configured', async () => {
    const healthResponse = await fetch(`${baseUrl}/api/health/services`)
    if (!healthResponse.ok) {
      throw new Error(`Health check failed: ${healthResponse.status}`)
    }
    const health = await healthResponse.json()
    
    const amadeusService = health.services?.find((s: any) => s.service === 'amadeus')
    if (!amadeusService) {
      throw new Error('Amadeus service not found in health check')
    }
    
    if (amadeusService.status === 'unknown' && amadeusService.error?.includes('credentials not configured')) {
      throw new Error('Amadeus credentials not configured in environment')
    }
    
    return { amadeusStatus: amadeusService.status, error: amadeusService.error }
  }))

  // Step 3: Test airport search API
  results.push(await testStep('Airport search works', async () => {
    const response = await fetch(`${baseUrl}/api/airports/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'London' })
    })
    
    if (!response.ok) {
      throw new Error(`Airport search failed: ${response.status}`)
    }
    
    const data = await response.json()
    if (!data.success || !Array.isArray(data.airports) || data.airports.length === 0) {
      throw new Error('Airport search returned no results')
    }
    
    return { airportCount: data.airports.length, firstAirport: data.airports[0]?.iata_code }
  }))

  // Step 4: Test flight search API (the critical test)
  results.push(await testStep('Flight search API works', async () => {
    const response = await fetch(`${baseUrl}/api/amadeus/flights`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        origin: 'LHR',
        destination: 'BCN', 
        departureDate: '2025-10-01',
        passengers: 1,
        travelClass: 'ECONOMY',
        nonStop: false
      })
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(`Flight search failed: ${response.status} - ${data.error || 'Unknown error'}`)
    }
    
    if (!data.ok) {
      throw new Error(`Flight search returned error: ${data.error}`)
    }
    
    if (!Array.isArray(data.data)) {
      throw new Error('Flight search did not return flight array')
    }
    
    return { 
      flightCount: data.data.length, 
      dataSource: data.meta?.dataSource,
      firstFlight: data.data[0] ? {
        price: data.data[0].price,
        carrier: data.data[0].carrierCode,
        duration: data.data[0].duration
      } : null
    }
  }))

  // Step 5: Test flight redirect service
  results.push(await testStep('Flight redirect service works', async () => {
    const response = await fetch(`${baseUrl}/api/redirect/flight`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        itineraryId: 'test-itinerary-123',
        origin: 'LHR',
        destination: 'BCN',
        departureDate: '2025-10-01',
        adults: 1,
        cabinClass: 'ECONOMY',
        carrierCode: 'BA',
        flightNumber: '123',
        stops: 0,
        price: 299,
        currency: 'EUR'
      })
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(`Flight redirect failed: ${response.status} - ${data.error || 'Unknown error'}`)
    }
    
    if (!data.ok || !data.url) {
      throw new Error(`Flight redirect did not return booking URL: ${data.error || 'No URL'}`)
    }
    
    return { 
      provider: data.provider, 
      url: data.url,
      urlValid: data.url.startsWith('http')
    }
  }))

  // Step 6: Test analytics tracking
  results.push(await testStep('Analytics tracking works', async () => {
    const clickData = {
      id: 'test-click-' + Date.now(),
      partnerId: 'kayak',
      flightId: 'test-flight-123',
      bookingValue: 299,
      currency: 'EUR',
      origin: 'LHR',
      destination: 'BCN',
      departureDate: '2025-10-01',
      passengers: 1,
      cabinClass: 'ECONOMY',
      deviceType: 'desktop' as const,
      sessionId: 'test-session-123',
      userAgent: 'Test User Agent',
      referrer: '',
      utm: {},
      timestamp: new Date().toISOString()
    }
    
    const response = await fetch(`${baseUrl}/api/analytics/click`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(clickData)
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(`Analytics tracking failed: ${response.status} - ${data.error || 'Unknown error'}`)
    }
    
    if (!data.success) {
      throw new Error(`Analytics tracking returned error: ${data.error}`)
    }
    
    return { clickId: data.clickId, message: data.message }
  }))

  // Calculate summary
  const passed = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length
  const overallSuccess = failed === 0

  const summary = {
    totalSteps: results.length,
    passed,
    failed,
    overallSuccess
  }

  return { results, summary }
}

async function main() {
  try {
    const testResults = await runUserFlowTest()
    
    console.log('\n📊 Test Results Summary:')
    console.log('─'.repeat(50))
    console.log(`Total Steps: ${testResults.summary.totalSteps}`)
    console.log(`✅ Passed: ${testResults.summary.passed}`)
    console.log(`❌ Failed: ${testResults.summary.failed}`)
    console.log(`Overall: ${testResults.summary.overallSuccess ? '✅ SUCCESS' : '❌ FAILED'}`)
    
    if (!testResults.summary.overallSuccess) {
      console.log('\n🔍 Failed Steps:')
      testResults.results
        .filter(r => !r.success)
        .forEach(result => {
          console.log(`  ❌ ${result.step}: ${result.error}`)
        })
    }
    
    console.log('\n📝 Detailed Results:')
    testResults.results.forEach(result => {
      console.log(`  ${result.success ? '✅' : '❌'} ${result.step} (${result.timing}ms)`)
      if (result.data && Object.keys(result.data).length > 0) {
        console.log(`     Data:`, JSON.stringify(result.data, null, 2).split('\n').map(line => `     ${line}`).join('\n'))
      }
      if (result.error) {
        console.log(`     Error: ${result.error}`)
      }
    })
    
    console.log('\n🎯 User Flow Status:')
    if (testResults.summary.overallSuccess) {
      console.log('✅ Users CAN complete bookings end-to-end')
      console.log('✅ All critical systems are functional')
      console.log('✅ Spontra is ready for production traffic')
    } else {
      console.log('❌ Users CANNOT complete bookings')
      console.log('❌ Critical issues must be resolved before production')
      console.log('⚠️  See failed steps above for required fixes')
    }
    
    // Exit with appropriate code
    process.exit(testResults.summary.overallSuccess ? 0 : 1)
    
  } catch (error) {
    console.error('💥 Test script failed:', error)
    process.exit(1)
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  main()
}

export { runUserFlowTest, type UserFlowTest, type TestResult }