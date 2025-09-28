import dynamic from 'next/dynamic'
import { ComponentType } from 'react'

// Lazy load heavy components for better performance
export const LazyComponents = {
  // Admin components (only load when needed)
  AdminDashboard: dynamic(() => import('@/app/admin/(panel)/dashboard/page'), {
    loading: () => <div className="animate-pulse h-96 bg-gray-200 rounded"></div>,
    ssr: false,
  }),

  AdminShell: dynamic(() => import('@/components/admin/AdminShell'), {
    loading: () => <div className="animate-pulse h-screen bg-gray-100"></div>,
    ssr: false,
  }),

  // Map components (heavy leaflet/mapbox dependencies)
  Map: dynamic(() => import('@/components/Map'), {
    loading: () => <div className="animate-pulse h-96 bg-gray-200 rounded flex items-center justify-center">Loading map...</div>,
    ssr: false,
  }),

  // Chart components
  Charts: dynamic(() => import('@/components/Charts'), {
    loading: () => <div className="animate-pulse h-64 bg-gray-200 rounded"></div>,
    ssr: false,
  }),

  // Heavy form components
  BookingForm: dynamic(() => import('@/components/BookingForm'), {
    loading: () => <div className="animate-pulse h-96 bg-gray-200 rounded"></div>,
  }),

  // Analytics components
  AnalyticsDashboard: dynamic(() => import('@/components/AnalyticsDashboard'), {
    loading: () => <div className="animate-pulse h-96 bg-gray-200 rounded"></div>,
    ssr: false,
  }),

  // Social media embeds
  TwitterEmbed: dynamic(() => import('@/components/TwitterEmbed'), {
    loading: () => <div className="animate-pulse h-64 bg-gray-200 rounded"></div>,
    ssr: false,
  }),

  // Video player components
  VideoPlayer: dynamic(() => import('@/components/VideoPlayer'), {
    loading: () => <div className="animate-pulse h-64 bg-gray-200 rounded flex items-center justify-center">Loading video...</div>,
    ssr: false,
  }),

  // Complex data tables
  DataTable: dynamic(() => import('@/components/DataTable'), {
    loading: () => <div className="animate-pulse h-96 bg-gray-200 rounded"></div>,
    ssr: false,
  }),

  // PDF viewer
  PDFViewer: dynamic(() => import('@/components/PDFViewer'), {
    loading: () => <div className="animate-pulse h-96 bg-gray-200 rounded flex items-center justify-center">Loading PDF...</div>,
    ssr: false,
  }),

  // Calendar components
  Calendar: dynamic(() => import('@/components/Calendar'), {
    loading: () => <div className="animate-pulse h-96 bg-gray-200 rounded"></div>,
    ssr: false,
  }),

  // Rich text editor
  RichTextEditor: dynamic(() => import('@/components/RichTextEditor'), {
    loading: () => <div className="animate-pulse h-64 bg-gray-200 rounded"></div>,
    ssr: false,
  }),
} as const

// Lazy load utility libraries
export const LazyUtils = {
  // Date utilities (moment.js, date-fns, etc.)
  DateUtils: () => import('date-fns'),
  
  // Chart libraries
  ChartJS: () => import('chart.js'),
  
  // Lodash utilities
  Lodash: () => import('lodash'),
  
  // Crypto utilities
  CryptoJS: () => import('crypto-js'),
  
  // PDF generation
  JSPDF: () => import('jspdf'),
  
  // Excel export
  XLSX: () => import('xlsx'),
  
  // Image processing
  Sharp: () => import('sharp'),
  
  // QR code generation
  QRCode: () => import('qrcode'),
} as const

// Route-based code splitting helper
export function createLazyRoute<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: ComponentType
) {
  return dynamic(importFn, {
    loading: fallback ? fallback : () => (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    ),
  })
}

// Preload critical components for better UX
export function preloadCriticalComponents() {
  // Preload components that are likely to be used soon
  if (typeof window !== 'undefined') {
    // Preload on user interaction or after initial load
    setTimeout(() => {
      LazyComponents.BookingForm.preload?.()
      LazyUtils.DateUtils()
    }, 2000)

    // Preload admin components on admin routes
    if (window.location.pathname.startsWith('/admin')) {
      LazyComponents.AdminShell.preload?.()
      LazyComponents.AdminDashboard.preload?.()
    }
  }
}

// Bundle splitting configuration
export const BundleSplits = {
  // Vendor chunks
  vendor: {
    react: ['react', 'react-dom'],
    ui: ['@headlessui/react', '@heroicons/react', 'lucide-react'],
    forms: ['react-hook-form', '@hookform/resolvers', 'zod'],
    http: ['axios', 'swr'],
    auth: ['jose', 'bcryptjs'],
    email: ['@react-email/components', 'resend'],
    analytics: ['@vercel/analytics', '@vercel/speed-insights', '@sentry/nextjs'],
  },
  
  // Feature chunks
  features: {
    admin: ['/admin'],
    booking: ['/booking', '/checkout'],
    search: ['/search', '/flights'],
    profile: ['/profile', '/settings'],
  },
} as const

export default LazyComponents