const { withSentryConfig } = require('@sentry/nextjs')

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Bundle optimization
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
  },
  
  // Performance optimizations
  swcMinify: true,
  
  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // Compression
  compress: true,
  
  // Power-up optimizations
  poweredByHeader: false,
  
  experimental: {
    serverComponentsExternalPackages: ['cassandra-driver'],
    // Modern bundling optimizations
    optimizePackageImports: [
      '@heroicons/react',
      '@headlessui/react',
      'lucide-react',
      '@react-email/components',
    ],
    // Turbo mode for faster builds
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  webpack: (config, { isServer }) => {
    config.resolve = config.resolve || {}
    config.resolve.alias = Object.assign({}, config.resolve.alias, {
      kerberos: false,
      '@mongodb-js/zstd': false,
    })
    
    // Handle database modules - only disable on client side
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'cassandra-driver': false,
        uuid: false,
      }
    }
    
    // Don't bundle native dependencies on server side, but allow them to be required
    if (isServer) {
      config.externals = config.externals || []
      config.externals.push({
        'cassandra-driver': 'commonjs cassandra-driver'
      })
    }
    
    return config
  },
  env: {
    // Set these environment variables in Vercel dashboard when backend services are deployed
    API_BASE_URL: process.env.API_BASE_URL || '',
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL || '',
    SEARCH_SERVICE_URL: process.env.SEARCH_SERVICE_URL || '',
    PRICING_SERVICE_URL: process.env.PRICING_SERVICE_URL || '',
  },
  // Rewrites disabled until backend services are deployed to production
  // Uncomment and configure when backend URLs are available
  /*
  async rewrites() {
    return [
      {
        source: '/api/users/:path*',
        destination: `${process.env.USER_SERVICE_URL}/api/v1/:path*`,
      },
      {
        source: '/api/search/:path*',
        destination: `${process.env.SEARCH_SERVICE_URL}/api/v1/:path*`,
      },
      {
        source: '/api/pricing/:path*',
        destination: `${process.env.PRICING_SERVICE_URL}/api/v1/:path*`,
      },
    ]
  },
  */
}

// Sentry configuration
const sentryConfig = {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  // Suppresses source map uploading logs during build
  silent: true,
  
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  
  // Only upload source maps in production
  uploadSourceMaps: process.env.NODE_ENV === 'production',
  
  // Automatically tree-shake Sentry logger statements to reduce bundle size
  widenClientFileUpload: true,
  
  // Routes browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  tunnelRoute: '/monitoring',
  
  // Hides source maps from generated client bundles
  hideSourceMaps: true,
  
  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,
  
  // Enables automatic instrumentation of Vercel Cron Monitors.
  automaticVercelMonitors: true,
}

module.exports = process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(nextConfig, sentryConfig)
  : nextConfig