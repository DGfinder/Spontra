/**
 * Central app config — all env vars funnelled through here.
 * Import from this file instead of accessing process.env directly in components.
 */

export const config = {
  appUrl:    process.env.NEXT_PUBLIC_APP_URL    || 'https://spontra.vercel.app',
  baseUrl:   process.env.NEXT_PUBLIC_BASE_URL   || process.env.NEXT_PUBLIC_APP_URL || 'https://spontra.vercel.app',
  appName:   process.env.NEXT_PUBLIC_APP_NAME   || 'Spontra',
  appEnv:    process.env.NEXT_PUBLIC_APP_ENV    || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',

  // iOS App Store link (update once live)
  appStoreUrl: 'https://apps.apple.com/app/spontra/id0000000000',
  iosBundleId: 'com.spontra.app',

  // Support
  supportEmail: 'hello@spontra.app',
} as const

export type AppConfig = typeof config
