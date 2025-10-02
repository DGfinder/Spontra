import type { NextConfig } from 'next'
import path from 'node:path'

const nextConfig: NextConfig = {
  // Enable standalone output for Docker production builds
  output: 'standalone',

  // Fix monorepo lockfile warning (moved to top-level in Next.js 15)
  outputFileTracingRoot: path.join(__dirname, '..'),

  // Disable ESLint during build (for MVP - re-enable in Phase 2)
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Bundle optimization for Next.js 15
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
  },

  // Image optimization with modern formats
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 86400, // 1 day
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },

  // Modern optimizations
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@heroicons/react',
    ],
  },
  
  // Production optimizations
  poweredByHeader: false,
  reactStrictMode: true,
  
  // Environment variables
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || '',
  },
}

export default nextConfig