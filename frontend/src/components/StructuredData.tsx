/**
 * Structured Data (JSON-LD) Component
 *
 * Adds schema.org markup for rich snippets in Google search results
 * Improves SEO and provides better search result display
 */

interface DestinationStructuredDataProps {
  destination: {
    cityName: string
    countryName?: string
    description?: string
    imageUrl?: string
    latitude?: number
    longitude?: number
  }
  url: string
}

/**
 * Destination Structured Data
 *
 * Adds Place schema for destination pages
 * Helps Google show rich snippets with photos, ratings, location
 */
export function DestinationStructuredData({ destination, url }: DestinationStructuredDataProps) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'TouristDestination',
    name: destination.cityName,
    description: destination.description || `Discover ${destination.cityName} - Find flights, travel inspiration, and destination guides`,
    url: url,
    ...(destination.imageUrl && {
      image: destination.imageUrl,
    }),
    ...(destination.countryName && {
      address: {
        '@type': 'PostalAddress',
        addressCountry: destination.countryName,
        addressLocality: destination.cityName,
      },
    }),
    ...(destination.latitude && destination.longitude && {
      geo: {
        '@type': 'GeoCoordinates',
        latitude: destination.latitude,
        longitude: destination.longitude,
      },
    }),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}

interface FlightSearchStructuredDataProps {
  origin: string
  destination: string
  departureDate?: string
  returnDate?: string
}

/**
 * Flight Search Structured Data
 *
 * Adds TravelAction schema for flight search functionality
 * Helps Google understand this is a flight search/booking site
 */
export function FlightSearchStructuredData({
  origin,
  destination,
  departureDate,
  returnDate,
}: FlightSearchStructuredDataProps) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${process.env.NEXT_PUBLIC_APP_URL || 'https://spontra.com'}/?origin=${origin}&destination=${destination}${departureDate ? `&departure=${departureDate}` : ''}${returnDate ? `&return=${returnDate}` : ''}`,
    },
    'query-input': [
      {
        '@type': 'PropertyValueSpecification',
        valueName: 'origin',
        description: 'Origin airport code',
      },
      {
        '@type': 'PropertyValueSpecification',
        valueName: 'destination',
        description: 'Destination airport code',
      },
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}

/**
 * Organization Structured Data
 *
 * Adds Organization schema for Spontra brand
 * Include on home page for brand recognition
 */
export function OrganizationStructuredData() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Spontra',
    description: 'Discover your next adventure - Find destinations based on flight time and travel style',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://spontra.com',
    logo: `${process.env.NEXT_PUBLIC_APP_URL || 'https://spontra.com'}/logo.png`,
    sameAs: [
      // TODO: Add social media URLs when available
      // 'https://twitter.com/spontra',
      // 'https://www.facebook.com/spontra',
      // 'https://www.instagram.com/spontra',
      // 'https://www.linkedin.com/company/spontra',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'hello@spontra.com',
      contactType: 'Customer Service',
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}

/**
 * Breadcrumb Structured Data
 *
 * Adds BreadcrumbList schema for navigation hierarchy
 * Helps Google show breadcrumbs in search results
 */
interface BreadcrumbStructuredDataProps {
  items: Array<{
    name: string
    url: string
  }>
}

export function BreadcrumbStructuredData({ items }: BreadcrumbStructuredDataProps) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}

/**
 * FAQ Structured Data
 *
 * Adds FAQPage schema for FAQ sections
 * Helps Google show FAQ rich snippets
 */
interface FAQStructuredDataProps {
  faqs: Array<{
    question: string
    answer: string
  }>
}

export function FAQStructuredData({ faqs }: FAQStructuredDataProps) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}
