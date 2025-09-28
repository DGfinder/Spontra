/**
 * Next.js Instrumentation File
 * Automatically initializes OpenTelemetry when the application starts
 * This file is automatically loaded by Next.js in both server and edge environments
 */

import { initializeTelemetry } from './src/lib/telemetry'

export async function register() {
  // Only initialize in Node.js environment (not in browser or edge runtime)
  if (typeof window === 'undefined' && process.env.EDGE_RUNTIME !== 'edge') {
    console.log('🔧 Initializing OpenTelemetry instrumentation...')
    
    try {
      const sdk = initializeTelemetry()
      
      if (sdk) {
        console.log('✅ OpenTelemetry instrumentation initialized successfully')
        
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