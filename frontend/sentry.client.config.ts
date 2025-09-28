import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: process.env.NODE_ENV === 'development',
  
  replaysOnErrorSampleRate: 1.0,
  
  // This sets the sample rate to be 10%. You may want this to be 100% while in development and sample at a lower rate in production
  replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0.1,
  
  // You can remove this option if you're not planning to use the Sentry Session Replay feature:
  integrations: [
    Sentry.replayIntegration({
      // Additional Replay configuration goes in here, for example:
      maskAllText: true,
      blockAllMedia: true,
    }),
    Sentry.browserTracingIntegration(),
  ],
  
  // Performance monitoring
  profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Set sample rate for profiling - this is relative to tracesSampleRate
  beforeSend(event, hint) {
    // Don't send events in development unless explicitly enabled
    if (process.env.NODE_ENV === 'development' && !process.env.SENTRY_ENABLED) {
      return null
    }
    
    // Filter out non-critical errors
    if (event.exception) {
      const error = hint.originalException
      
      // Skip network errors and aborted requests
      if (error instanceof Error) {
        if (error.name === 'AbortError' || 
            error.message.includes('fetch') ||
            error.message.includes('NetworkError') ||
            error.message.includes('Failed to fetch')) {
          return null
        }
      }
    }
    
    return event
  },
  
  // Set context tags
  initialScope: {
    tags: {
      component: 'frontend',
      environment: process.env.NODE_ENV,
    },
  },
})