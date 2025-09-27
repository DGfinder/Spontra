import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: process.env.NODE_ENV === 'development',
  
  beforeSend(event, hint) {
    // Don't send events in development unless explicitly enabled
    if (process.env.NODE_ENV === 'development' && !process.env.SENTRY_ENABLED) {
      return null
    }
    
    // Add edge runtime context
    event.tags = {
      ...event.tags,
      component: 'edge',
      environment: process.env.NODE_ENV,
    }
    
    return event
  },
  
  // Set context
  initialScope: {
    tags: {
      component: 'edge',
      environment: process.env.NODE_ENV,
    },
  },
})