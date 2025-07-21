/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: [],
  },
  env: {
    // Set these environment variables in Vercel dashboard when backend services are deployed
    API_BASE_URL: process.env.API_BASE_URL || '',
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