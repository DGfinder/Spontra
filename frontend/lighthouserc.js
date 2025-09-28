module.exports = {
  ci: {
    collect: {
      // URLs to test - adjust based on your deployment
      url: [
        'http://localhost:3000/',
        'http://localhost:3000/flights',
        'http://localhost:3000/flights?origin=LHR&destination=BCN&departureDate=2025-12-01&passengers=2',
      ],
      startServerCommand: 'npm run build && npm start',
      startServerReadyPattern: 'Ready on',
      startServerReadyTimeout: 30000,
      numberOfRuns: 3,
      settings: {
        // Chrome flags for consistent testing
        chromeFlags: [
          '--disable-gpu',
          '--no-sandbox',
          '--disable-dev-shm-usage',
          '--disable-background-timer-throttling',
          '--disable-renderer-backgrounding',
          '--disable-backgrounding-occluded-windows',
        ],
        // Lighthouse configuration
        preset: 'desktop', // or 'mobile'
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1,
          requestLatencyMs: 0,
          downloadThroughputKbps: 0,
          uploadThroughputKbps: 0,
        },
        // Emulated device (mobile)
        emulatedFormFactor: 'mobile',
        // Skip PWA audits since we're not a PWA
        skipAudits: [
          'is-on-https',
          'service-worker',
          'works-offline',
          'installable-manifest',
          'splash-screen',
          'themed-omnibox',
          'maskable-icon',
        ],
      },
    },
    assert: {
      // Performance budgets per page type
      assertions: {
        // Homepage budgets
        'http://localhost:3000/': [
          // Core Web Vitals thresholds
          ['largest-contentful-paint', 'error', { maxNumericValue: 2500 }],
          ['cumulative-layout-shift', 'error', { maxNumericValue: 0.1 }],
          ['total-blocking-time', 'error', { maxNumericValue: 200 }],
          
          // Loading performance
          ['first-contentful-paint', 'error', { maxNumericValue: 1800 }],
          ['speed-index', 'error', { maxNumericValue: 3000 }],
          ['interactive', 'error', { maxNumericValue: 3800 }],
          
          // Resource budgets
          ['resource-summary:script:size', 'error', { maxNumericValue: 120000 }], // 120kb JS
          ['resource-summary:stylesheet:size', 'error', { maxNumericValue: 40000 }], // 40kb CSS
          ['resource-summary:total:size', 'error', { maxNumericValue: 1000000 }], // 1MB total
          
          // Best practices
          ['uses-text-compression', 'error'],
          ['uses-optimized-images', 'warn'],
          ['modern-image-formats', 'warn'],
          ['efficient-animated-content', 'warn'],
          
          // SEO
          ['meta-description', 'error'],
          ['document-title', 'error'],
          ['crawlable-anchors', 'error'],
        ],
        
        // Flights page budgets (search results)
        'http://localhost:3000/flights': [
          // Slightly more lenient for dynamic content
          ['largest-contentful-paint', 'error', { maxNumericValue: 3000 }],
          ['cumulative-layout-shift', 'error', { maxNumericValue: 0.15 }],
          ['total-blocking-time', 'error', { maxNumericValue: 300 }],
          
          // Resource budgets
          ['resource-summary:script:size', 'error', { maxNumericValue: 150000 }], // 150kb JS
          ['resource-summary:stylesheet:size', 'error', { maxNumericValue: 45000 }], // 45kb CSS
        ],
        
        // Booking/offer page budgets
        'http://localhost:3000/flights?origin=LHR&destination=BCN&departureDate=2025-12-01&passengers=2': [
          // Most lenient for complex booking flows
          ['largest-contentful-paint', 'error', { maxNumericValue: 3500 }],
          ['cumulative-layout-shift', 'error', { maxNumericValue: 0.2 }],
          ['total-blocking-time', 'error', { maxNumericValue: 400 }],
          
          // Resource budgets
          ['resource-summary:script:size', 'error', { maxNumericValue: 180000 }], // 180kb JS
          ['resource-summary:stylesheet:size', 'error', { maxNumericValue: 50000 }], // 50kb CSS
        ],
      },
    },
    upload: {
      // Configure if you want to use Lighthouse CI server
      // target: 'lhci',
      // serverBaseUrl: 'https://your-lhci-server.com',
      // token: process.env.LHCI_TOKEN,
      
      // For now, just store reports locally and in GitHub Actions
      target: 'filesystem',
      outputDir: './lighthouse-reports',
    },
  },
}