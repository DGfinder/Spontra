/**
 * Next.js 15 Instrumentation Hook (Stable)
 * Automatically initializes OpenTelemetry when the application starts
 * This instrumentation hook is now stable in Next.js 15
 */

export async function register() {
  // Only initialize in Node.js runtime (Next.js 15 check)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('🔧 Initializing OpenTelemetry instrumentation via Next.js 15 hook...')
    
    try {
      // Dynamic import to prevent bundling issues
      const { initializeTelemetry } = await import('./src/lib/telemetry')
      const sdk = initializeTelemetry()
      
      if (sdk) {
        console.log('✅ OpenTelemetry instrumentation initialized successfully with Next.js 15')
        
        // Add process-level event handlers for graceful shutdown
        process.on('SIGTERM', async () => {
          console.log('🛑 SIGTERM received, shutting down OpenTelemetry...')
          try {
            await sdk.shutdown()
            console.log('✅ OpenTelemetry shutdown complete')
          } catch (error) {
            console.error('❌ Error during OpenTelemetry shutdown:', error)
          }
        })

        process.on('SIGINT', async () => {
          console.log('🛑 SIGINT received, shutting down OpenTelemetry...')
          try {
            await sdk.shutdown()
            console.log('✅ OpenTelemetry shutdown complete')
          } catch (error) {
            console.error('❌ Error during OpenTelemetry shutdown:', error)
          }
        })
      } else {
        console.log('⚠️ OpenTelemetry instrumentation skipped')
      }
    } catch (error) {
      console.error('❌ Failed to initialize OpenTelemetry:', error)
    }
  }
}