import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: process.env.NODE_ENV === 'development',
  
  integrations: [
    Sentry.nodeContextIntegration(),
    Sentry.localVariablesIntegration(),
    Sentry.prismaIntegration(),
  ],
  
  // Performance monitoring
  profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  beforeSend(event, hint) {
    // Don't send events in development unless explicitly enabled
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
    
    // Add additional context
    event.tags = {
      ...event.tags,
      component: 'backend',
      environment: process.env.NODE_ENV,
    }
    
    return event
  },
  
  // Capture unhandled promise rejections
  captureUnhandledRejections: true,
  
  // Set context
  initialScope: {
    tags: {
      component: 'server',
      environment: process.env.NODE_ENV,
    },
  },
})