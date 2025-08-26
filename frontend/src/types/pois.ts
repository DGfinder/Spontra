// Points of Interest (POI) types for destination management

export type ThemeType = 'vibe' | 'adventure' | 'discover' | 'indulge' | 'nature'

export type POIStatus = 'active' | 'inactive' | 'draft' | 'pending_review'

export type POIDifficulty = 'easy' | 'moderate' | 'challenging' | 'extreme'

export type POIPriceLevel = 'free' | 'budget' | 'moderate' | 'expensive' | 'luxury'

// POI Categories organized by theme
export interface POICategory {
  id: string
  name: string
  theme: ThemeType
  description: string
  icon: string
  color: string
  sortOrder: number
}

// Core POI interface
export interface PointOfInterest {
  id: string
  destinationId: string
  name: string
  description: string
  shortDescription?: string
  
  // Location & Contact
  coordinates: {
    lat: number
    lng: number
  }
  address?: string
  website?: string
  phone?: string
  
  // Categorization
  theme: ThemeType
  categoryId: string
  subcategory?: string
  tags: string[]
  
  // Media & Visuals
  images: POIImage[]
  featuredImage?: string
  videoUrl?: string
  
  // Ratings & Reviews
  rating: number
  reviewCount: number
  popularityScore: number
  
  // Practical Information
  priceLevel: POIPriceLevel
  priceRange?: {
    min: number
    max: number
    currency: string
  }
  duration?: {
    min: number // minutes
    max: number
    unit: 'minutes' | 'hours' | 'days'
  }
  difficulty?: POIDifficulty
  
  // Availability & Access
  openingHours: OpeningHours[]
  seasonality: string[]
  accessibility: AccessibilityInfo
  
  // Business Information
  isIndoor: boolean
  isOutdoor: boolean
  requiresBooking: boolean
  bookingUrl?: string
  ageRestrictions?: {
    minAge?: number
    maxAge?: number
    description?: string
  }
  
  // Administrative
  status: POIStatus
  isPromoted: boolean
  isFeatured: boolean
  sortOrder: number
  
  // Metadata
  createdAt: string
  updatedAt: string
  createdBy: string
  lastModifiedBy: string
  
  // Analytics Fields
  analytics?: POIAnalytics
}

export interface POIImage {
  id: string
  url: string
  alt: string
  caption?: string
  isMain?: boolean
  sortOrder: number
  uploadedAt: string
  photographer?: string
  license?: string
}

export interface OpeningHours {
  dayOfWeek: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'
  isOpen: boolean
  openTime?: string // HH:mm format
  closeTime?: string // HH:mm format
  notes?: string
}

export interface AccessibilityInfo {
  wheelchairAccessible: boolean
  visuallyImpairedFriendly: boolean
  hearingImpairedFriendly: boolean
  mobilityAssistanceAvailable: boolean
  notes?: string
}

// Analytics and Performance Tracking
export interface POIAnalytics {
  // View & Interaction Metrics
  totalViews: number
  uniqueViews: number
  clickThroughRate: number
  timeSpentViewing: number // average seconds
  
  // Engagement Metrics
  bookingsGenerated: number
  revenueGenerated: number
  conversionRate: number
  shareCount: number
  saveCount: number
  
  // Rating & Review Metrics
  averageRating: number
  totalReviews: number
  ratingDistribution: {
    1: number
    2: number
    3: number
    4: number
    5: number
  }
  
  // Time-based Analytics
  monthlyViews: MonthlyMetric[]
  seasonalTrends: SeasonalTrend[]
  peakTimes: PeakTimeInfo[]
  
  // Comparative Metrics
  rankInCategory: number
  rankInTheme: number
  rankInDestination: number
  
  // User Behavior
  mostCommonVisitorAge: string
  mostCommonVisitorType: string
  averageGroupSize: number
  
  // Performance Indicators
  trendingScore: number
  qualityScore: number
  contentCompleteness: number
  lastAnalyzedAt: string
}

export interface MonthlyMetric {
  month: string // YYYY-MM
  views: number
  bookings: number
  revenue: number
  rating: number
}

export interface SeasonalTrend {
  season: 'spring' | 'summer' | 'autumn' | 'winter'
  popularityMultiplier: number
  averageRating: number
  notes?: string
}

export interface PeakTimeInfo {
  dayOfWeek: string
  timeOfDay: string
  popularityScore: number
  crowdLevel: 'low' | 'medium' | 'high' | 'very_high'
}

// POI Management & CRUD Operations
export interface CreatePOIRequest {
  name: string
  description: string
  shortDescription?: string
  coordinates: {
    lat: number
    lng: number
  }
  theme: ThemeType
  categoryId: string
  tags: string[]
  priceLevel: POIPriceLevel
  isIndoor: boolean
  isOutdoor: boolean
  status: POIStatus
}

export interface UpdatePOIRequest extends Partial<CreatePOIRequest> {
  id: string
}

export interface POIFilterOptions {
  theme?: ThemeType
  categoryId?: string
  status?: POIStatus
  priceLevel?: POIPriceLevel
  difficulty?: POIDifficulty
  rating?: {
    min: number
    max: number
  }
  isPromoted?: boolean
  isFeatured?: boolean
  searchQuery?: string
  sortBy?: 'name' | 'rating' | 'popularity' | 'created_at' | 'updated_at'
  sortOrder?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

export interface POIListResponse {
  pois: PointOfInterest[]
  total: number
  filtered: number
  categories: POICategory[]
  analytics: POIListAnalytics
}

export interface POIListAnalytics {
  totalPOIs: number
  activeCount: number
  averageRating: number
  totalViews: number
  totalBookings: number
  totalRevenue: number
  themeDistribution: Record<ThemeType, number>
  categoryDistribution: Record<string, number>
}

// POI Bulk Operations
export interface BulkPOIOperation {
  type: 'update_status' | 'update_theme' | 'update_category' | 'delete'
  poiIds: string[]
  data?: {
    status?: POIStatus
    theme?: ThemeType
    categoryId?: string
    isPromoted?: boolean
    isFeatured?: boolean
  }
}

export interface BulkPOIResult {
  successful: string[]
  failed: Array<{
    poiId: string
    error: string
  }>
  totalProcessed: number
}

// POI Templates for quick creation
export interface POITemplate {
  id: string
  name: string
  description: string
  theme: ThemeType
  categoryId: string
  tags: string[]
  priceLevel: POIPriceLevel
  defaultValues: Partial<PointOfInterest>
  isPopular: boolean
}

// Integration with existing destination types
export interface EnhancedDestinationWithPOIs {
  destination: {
    iataCode: string
    cityName: string
    countryName: string
    countryCode: string
    continent: string
    coordinates: { lat: number; lng: number }
    isActive: boolean
    isPopular: boolean
    themeScores: Record<ThemeType, number>
    description: string
    highlights: string[]
    supportedActivities: string[]
    lastUpdated: string
  }
  pois: PointOfInterest[]
  poiCategories: POICategory[]
  poiAnalytics: POIListAnalytics
}

// API Response types
export interface POIApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    message: string
    code: string
    details?: any
  }
  pagination?: {
    total: number
    page: number
    limit: number
    hasMore: boolean
  }
  metadata?: {
    timestamp: string
    version: string
    source: string
  }
}

// Default POI categories by theme
export const DEFAULT_POI_CATEGORIES: Record<ThemeType, POICategory[]> = {
  vibe: [
    {
      id: 'nightlife',
      name: 'Nightlife',
      theme: 'vibe',
      description: 'Bars, clubs, and evening entertainment',
      icon: 'music',
      color: 'purple',
      sortOrder: 1
    },
    {
      id: 'entertainment',
      name: 'Entertainment',
      theme: 'vibe',
      description: 'Shows, concerts, and live performances',
      icon: 'theater',
      color: 'purple',
      sortOrder: 2
    },
    {
      id: 'social_spots',
      name: 'Social Spots',
      theme: 'vibe',
      description: 'Cafes, co-working spaces, and social venues',
      icon: 'coffee',
      color: 'purple',
      sortOrder: 3
    }
  ],
  adventure: [
    {
      id: 'outdoor_activities',
      name: 'Outdoor Activities',
      theme: 'adventure',
      description: 'Hiking, biking, and outdoor adventures',
      icon: 'mountain',
      color: 'orange',
      sortOrder: 1
    },
    {
      id: 'water_sports',
      name: 'Water Sports',
      theme: 'adventure',
      description: 'Swimming, surfing, and water activities',
      icon: 'waves',
      color: 'orange',
      sortOrder: 2
    },
    {
      id: 'extreme_sports',
      name: 'Extreme Sports',
      theme: 'adventure',
      description: 'Skydiving, bungee jumping, and extreme activities',
      icon: 'zap',
      color: 'orange',
      sortOrder: 3
    }
  ],
  discover: [
    {
      id: 'historical_sites',
      name: 'Historical Sites',
      theme: 'discover',
      description: 'Museums, monuments, and historical landmarks',
      icon: 'landmark',
      color: 'blue',
      sortOrder: 1
    },
    {
      id: 'cultural_experiences',
      name: 'Cultural Experiences',
      theme: 'discover',
      description: 'Local traditions, festivals, and cultural activities',
      icon: 'globe',
      color: 'blue',
      sortOrder: 2
    },
    {
      id: 'art_galleries',
      name: 'Art & Galleries',
      theme: 'discover',
      description: 'Art museums, galleries, and creative spaces',
      icon: 'palette',
      color: 'blue',
      sortOrder: 3
    }
  ],
  indulge: [
    {
      id: 'fine_dining',
      name: 'Fine Dining',
      theme: 'indulge',
      description: 'High-end restaurants and culinary experiences',
      icon: 'utensils',
      color: 'amber',
      sortOrder: 1
    },
    {
      id: 'luxury_shopping',
      name: 'Luxury Shopping',
      theme: 'indulge',
      description: 'Designer boutiques and luxury shopping',
      icon: 'shopping-bag',
      color: 'amber',
      sortOrder: 2
    },
    {
      id: 'spa_wellness',
      name: 'Spa & Wellness',
      theme: 'indulge',
      description: 'Spas, wellness centers, and relaxation',
      icon: 'heart',
      color: 'amber',
      sortOrder: 3
    }
  ],
  nature: [
    {
      id: 'parks_gardens',
      name: 'Parks & Gardens',
      theme: 'nature',
      description: 'Public parks, botanical gardens, and green spaces',
      icon: 'tree',
      color: 'green',
      sortOrder: 1
    },
    {
      id: 'beaches',
      name: 'Beaches',
      theme: 'nature',
      description: 'Beaches, coastlines, and waterfront areas',
      icon: 'sun',
      color: 'green',
      sortOrder: 2
    },
    {
      id: 'scenic_viewpoints',
      name: 'Scenic Viewpoints',
      theme: 'nature',
      description: 'Lookouts, viewpoints, and scenic spots',
      icon: 'eye',
      color: 'green',
      sortOrder: 3
    }
  ]
}