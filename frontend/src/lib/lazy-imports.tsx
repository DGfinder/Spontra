import dynamic from "next/dynamic"
import React, { ComponentType } from "react"

function skeleton(className: string, text?: string) {
  return () => React.createElement("div", { className }, text ?? null)
}

function spinnerFallback() {
  return React.createElement(
    "div",
    { className: "flex items-center justify-center min-h-screen" },
    React.createElement("div", {
      className: "animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600",
    })
  )
}

// Lazy load heavy components for better performance
export const LazyComponents = {
  // Admin components (only load when needed)
  AdminDashboard: dynamic(
    () => import("@/app/admin/(panel)/dashboard/page"),
    {
      loading: skeleton("animate-pulse h-96 bg-gray-200 rounded"),
      ssr: false,
    }
  ),

  AdminShell: dynamic(() => import("@/components/admin/AdminShell"), {
    loading: skeleton("animate-pulse h-screen bg-gray-100"),
    ssr: false,
  }),

  // Map components (heavy leaflet/mapbox dependencies)
  Map: dynamic(() => import("@/components/Map"), {
    loading: skeleton(
      "animate-pulse h-96 bg-gray-200 rounded flex items-center justify-center",
      "Loading map..."
    ),
    ssr: false,
  }),

  // Chart components
  Charts: dynamic(() => import("@/components/Charts"), {
    loading: skeleton("animate-pulse h-64 bg-gray-200 rounded"),
    ssr: false,
  }),

  // Heavy form components
  BookingForm: dynamic(() => import("@/components/BookingForm"), {
    loading: skeleton("animate-pulse h-96 bg-gray-200 rounded"),
  }),

  // Analytics components
  AnalyticsDashboard: dynamic(
    () => import("@/components/AnalyticsDashboard"),
    {
      loading: skeleton("animate-pulse h-96 bg-gray-200 rounded"),
      ssr: false,
    }
  ),

  // Social media embeds
  TwitterEmbed: dynamic(() => import("@/components/TwitterEmbed"), {
    loading: skeleton("animate-pulse h-64 bg-gray-200 rounded"),
    ssr: false,
  }),

  // Video player components
  VideoPlayer: dynamic(() => import("@/components/VideoPlayer"), {
    loading: skeleton(
      "animate-pulse h-64 bg-gray-200 rounded flex items-center justify-center",
      "Loading video..."
    ),
    ssr: false,
  }),

  // Complex data tables
  DataTable: dynamic(() => import("@/components/DataTable"), {
    loading: skeleton("animate-pulse h-96 bg-gray-200 rounded"),
    ssr: false,
  }),

  // PDF viewer
  PDFViewer: dynamic(() => import("@/components/PDFViewer"), {
    loading: skeleton(
      "animate-pulse h-96 bg-gray-200 rounded flex items-center justify-center",
      "Loading PDF..."
    ),
    ssr: false,
  }),

  // Calendar components
  Calendar: dynamic(() => import("@/components/Calendar"), {
    loading: skeleton("animate-pulse h-96 bg-gray-200 rounded"),
    ssr: false,
  }),

  // Rich text editor
  RichTextEditor: dynamic(() => import("@/components/RichTextEditor"), {
    loading: skeleton("animate-pulse h-64 bg-gray-200 rounded"),
    ssr: false,
  }),
} as const

// Lazy load utility libraries
export const LazyUtils = {
  // Date utilities (moment.js, date-fns, etc.)
  DateUtils: () => import("date-fns"),

  // Chart libraries
  ChartJS: () => import("chart.js"),

  // Lodash utilities
  Lodash: () => import("lodash"),

  // Crypto utilities
  CryptoJS: () => import("crypto-js"),

  // PDF generation
  JSPDF: () => import("jspdf"),

  // Excel export
  XLSX: () => import("xlsx"),

  // Image processing
  Sharp: () => import("sharp"),

  // QR code generation
  QRCode: () => import("qrcode"),
} as const

// Route-based code splitting helper
export function createLazyRoute<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: ComponentType
) {
  return dynamic(importFn, {
    loading: fallback ?? spinnerFallback,
  })
}

// Preload critical components for better UX
export function preloadCriticalComponents() {
  if (typeof window === "undefined") {
    return
  }

  setTimeout(() => {
    LazyComponents.BookingForm.preload?.()
    LazyUtils.DateUtils()
  }, 2000)

  if (window.location.pathname.startsWith("/admin")) {
    LazyComponents.AdminShell.preload?.()
    LazyComponents.AdminDashboard.preload?.()
  }
}

// Bundle splitting configuration
export const BundleSplits = {
  vendor: {
    react: ["react", "react-dom"],
    ui: ["@headlessui/react", "@heroicons/react", "lucide-react"],
    forms: ["react-hook-form", "@hookform/resolvers", "zod"],
    http: ["axios", "swr"],
    auth: ["jose", "bcryptjs"],
    email: ["@react-email/components", "resend"],
    analytics: ["@vercel/analytics", "@vercel/speed-insights", "@sentry/nextjs"],
  },
  features: {
    admin: ["/admin"],
    booking: ["/booking", "/checkout"],
    search: ["/search", "/flights"],
    profile: ["/profile", "/settings"],
  },
} as const

export default LazyComponents
