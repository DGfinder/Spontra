/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: [],
  },
  env: {
    API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:8080',
    SEARCH_SERVICE_URL: process.env.SEARCH_SERVICE_URL || 'http://localhost:8081',
    PRICING_SERVICE_URL: process.env.PRICING_SERVICE_URL || 'http://localhost:8082',
  },
  async rewrites() {
    return [
      {
        source: '/api/users/:path*',
        destination: `${process.env.USER_SERVICE_URL || 'http://localhost:8080'}/api/v1/:path*`,
      },
      {
        source: '/api/search/:path*',
        destination: `${process.env.SEARCH_SERVICE_URL || 'http://localhost:8081'}/api/v1/:path*`,
      },
      {
        source: '/api/pricing/:path*',
        destination: `${process.env.PRICING_SERVICE_URL || 'http://localhost:8082'}/api/v1/:path*`,
      },
    ]
  },
}

module.exports = nextConfig