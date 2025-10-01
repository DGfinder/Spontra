import { withSentryConfig } from '@sentry/nextjs'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Enable standalone output for Docker production builds
  output: 'standalone',
  
  // Bundle optimization for Next.js 15
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
  },
  
  // Performance optimizations - swcMinify is now default in Next.js 15
  
  // Image optimization with aggressive caching
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 31536000, // 1 year for production
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // Compression and caching
  compress: true,
  
  // Production optimizations
  poweredByHeader: false,
  reactStrictMode: true,
  
  // Caching headers for static assets
  async headers() {
    return [
      {
        source: '/favicon.ico',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400', // 1 day
          },
        ],
      },
      {
        source: '/images/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=604800', // 1 week
          },
        ],
      },
      {
        source: '/(.*).webp',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=2592000', // 30 days
          },
        ],
      },
      {
        source: '/(.*).avif',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=2592000', // 30 days
          },
        ],
      },
    ]
  },
  
  // Server components external packages (moved from experimental in Next.js 15)
  serverExternalPackages: [
    'cassandra-driver', 
    '@opentelemetry/exporter-trace-otlp-http',
    '@opentelemetry/exporter-metrics-otlp-http'
  ],

  // Turbopack configuration (moved from experimental.turbo in Next.js 15)
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },

  experimental: {
    // Modern bundling optimizations
    optimizePackageImports: [
      '@heroicons/react',
      '@headlessui/react', 
      'lucide-react',
      '@react-email/components',
    ],
  },
  
  webpack: (config, { isServer, dev }) => {
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
        'ansi-color': false,
        'bufrw': false,
        'thriftrw': false,
        'jaeger-client': false,
      }
    }
    
    // Don't bundle native dependencies on server side, but allow them to be required
    if (isServer) {
      config.externals = config.externals || []
      config.externals.push({
        'cassandra-driver': 'commonjs cassandra-driver'
      })
    }

    // Bundle analyzer (only in development with ANALYZE=true)
    if (!dev && process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          openAnalyzer: false,
          reportFilename: isServer ? '../analyze/server.html' : './analyze/client.html',
        })
      )
    }

    // Enhanced React 19 and Next.js 15 optimizations
    if (!dev) {
      // Enhanced split chunks optimization for React 19
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          minSize: 20000,
          maxSize: 244000,
          cacheGroups: {
            // React and React DOM
            react: {
              test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
              name: 'react',
              priority: 20,
              enforce: true,
            },
            // UI Libraries
            ui: {
              test: /[\\/]node_modules[\\/](@headlessui|@heroicons|lucide-react)[\\/]/,
              name: 'ui-libs',
              priority: 15,
              enforce: true,
            },
            // Forms and validation
            forms: {
              test: /[\\/]node_modules[\\/](react-hook-form|@hookform|zod)[\\/]/,
              name: 'forms',
              priority: 14,
              enforce: true,
            },
            // Zustand and state management
            state: {
              test: /[\\/]node_modules[\\/](zustand)[\\/]/,
              name: 'state',
              priority: 13,
              enforce: true,
            },
            // Date utilities
            date: {
              test: /[\\/]node_modules[\\/](date-fns)[\\/]/,
              name: 'date-utils',
              priority: 12,
              enforce: true,
            },
            // Server Actions and utilities
            server: {
              test: /[\\/](actions|lib)[\\/]/,
              name: 'server-utils',
              priority: 11,
              minChunks: 2,
            },
            // Other vendor libraries
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              priority: 10,
              enforce: true,
            },
            // Common application code
            common: {
              name: 'common',
              minChunks: 2,
              priority: 5,
              reuseExistingChunk: true,
            },
          },
        },
        // Enhanced module concatenation for React 19
        usedExports: true,
        sideEffects: false,
      }

      // React 19 specific optimizations - JSX runtime handled automatically by Next.js 15
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

// Sentry configuration for Sentry 8.x
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

export default process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(nextConfig, sentryConfig)
  : nextConfig

