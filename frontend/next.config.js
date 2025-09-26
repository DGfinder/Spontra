/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['cassandra-driver'],
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

module.exports = nextConfig