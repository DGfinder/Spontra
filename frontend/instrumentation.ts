/**
 * Next.js 15 Instrumentation Hook (Stable)
 * Automatically initializes OpenTelemetry when the application starts
 * This instrumentation hook is now stable in Next.js 15
 */

export async function register() {
  // Initialize Sentry for server and edge runtimes (Next.js 15 best practice)
  if (process.env.NEXT_RUNTIME === 'nodejs' || process.env.NEXT_RUNTIME === 'edge') {
    console.log(`🔧 Initializing Sentry for ${process.env.NEXT_RUNTIME} runtime...`)
    
    try {
      const Sentry = await import('@sentry/nextjs')
      
      if (process.env.NEXT_RUNTIME === 'edge') {
        // Edge runtime configuration
        Sentry.init({
          dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
          tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
          debug: process.env.NODE_ENV === 'development',
          
          beforeSend(event, hint) {
            if (process.env.NODE_ENV === 'development' && !process.env.SENTRY_ENABLED) {
              return null
            }
            
            event.tags = {
              ...event.tags,
              component: 'edge',
              environment: process.env.NODE_ENV,
            }
            
            return event
          },
          
          initialScope: {
            tags: {
              component: 'edge',
              environment: process.env.NODE_ENV,
            },
          },
        })
        
        console.log('✅ Sentry edge runtime initialized')
      } else {
        // Node.js server runtime configuration
        Sentry.init({
          dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
          tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
          debug: process.env.NODE_ENV === 'development',
          
          integrations: [
            Sentry.nodeContextIntegration(),
            Sentry.localVariablesIntegration(),
            Sentry.prismaIntegration(),
          ],
          
          profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
          
          beforeSend(event, hint) {
            if (process.env.NODE_ENV === 'development' && !process.env.SENTRY_ENABLED) {
              return null
            }
            
            // Filter out database connection errors in development
            if (process.env.NODE_ENV === 'development' && event.exception) {
              const error = hint.originalException
              if (error instanceof Error && 
                  (error.message.includes('ECONNREFUSED') || 
                   error.message.includes('database') ||
                   error.message.includes('Prisma'))) {
                return null
              }
            }
            
            event.tags = {
              ...event.tags,
              component: 'backend',
              environment: process.env.NODE_ENV,
            }
            
            return event
          },
          
          captureUnhandledRejections: true,
          
          initialScope: {
            tags: {
              component: 'server',
              environment: process.env.NODE_ENV,
            },
          },
        })
        
        console.log('✅ Sentry server runtime initialized')
      }
    } catch (error) {
      console.error('❌ Failed to initialize Sentry:', error)
    }
  }

  // Initialize OpenTelemetry only for Node.js runtime
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