// Admin Dashboard Types and Interfaces

export interface AdminUser {
  id: string
  email: string
  username: string
  fullName: string
  role: AdminRole
  permissions: AdminPermission[]
  profilePicture?: string
  createdAt: string
  lastLoginAt: string
  isActive: boolean
  mfaEnabled: boolean
  // Security fields (for internal use only, not exposed in API responses)
  failedLoginAttempts?: number
  lastFailedLogin?: string | null
  accountLockedUntil?: string | null
}

export type AdminRole = 'super_admin' | 'content_moderator' | 'analytics_manager' | 'customer_service' | 'business_manager'

export type AdminPermission = 
  // Content Management
  | 'content.view' | 'content.moderate' | 'content.delete' | 'content.featured'
  // Creator Management  
  | 'creators.view' | 'creators.manage' | 'creators.payouts' | 'creators.suspend'
  // Analytics
  | 'analytics.view' | 'analytics.export' | 'analytics.configure'
  // Destination Management
  | 'destinations.view' | 'destinations.edit' | 'destinations.create'
  // System Administration
  | 'system.monitor' | 'system.configure' | 'system.users' | 'system.logs'
  // Financial
  | 'finance.view' | 'finance.manage' | 'finance.payouts'
  // Support
  | 'support.view' | 'support.manage' | 'support.escalate'

export interface AdminSession {
  user: AdminUser
  token: string
  expiresAt: string
  lastActivity: string
  ipAddress: string
  userAgent: string
}

// Content Moderation Types
export interface ModerationQueue {
  id: string
  contentId: string
  contentType: 'video' | 'image' | 'text'
  submittedAt: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'in_review' | 'approved' | 'rejected'
  flags: ModerationFlag[]
  creator: {
    id: string
    username: string
    tier: string
    trustScore: number
  }
  content: {
    title: string
    description: string
    videoUrl?: string
    thumbnailUrl?: string
    duration?: number
    destination: string
    activity: string
    gpsVerified: boolean
  }
}

export interface ModerationFlag {
  id: string
  type: 'ai_generated' | 'inappropriate_content' | 'location_mismatch' | 'quality_low' | 'spam' | 'copyright'
  confidence: number
  description: string
  source: 'ai' | 'user_report' | 'admin_manual'
}

export interface ModerationAction {
  contentId: string
  action: 'approve' | 'reject' | 'request_changes' | 'escalate'
  reason?: string
  qualityScore?: number
  notes?: string
  feedbackToCreator?: string
}

// Analytics Types
export interface BusinessMetrics {
  revenue: {
    total: number
    growth: number
    byPeriod: RevenueByPeriod[]
    bySource: RevenueSource[]
  }
  users: {
    total: number
    active: number
    new: number
    retention: number
    byTier: UsersByTier[]
  }
  content: {
    totalVideos: number
    pendingApproval: number
    approvedToday: number
    averageQuality: number
    topPerforming: TopContent[]
  }
  bookings: {
    total: number
    conversionRate: number
    averageValue: number
    byDestination: BookingsByDestination[]
  }
}

export interface RevenueByPeriod {
  period: string
  amount: number
  bookings: number
  growth: number
}

export interface RevenueSource {
  source: string
  amount: number
  percentage: number
}

export interface UsersByTier {
  tier: string
  count: number
  revenue: number
}

export interface TopContent {
  id: string
  title: string
  creator: string
  views: number
  bookings: number
  revenue: number
}

export interface BookingsByDestination {
  destination: string
  bookings: number
  revenue: number
  growth: number
}

// Creator Management Types
export interface CreatorDashboard {
  id: string
  username: string
  email: string
  tier: 'explorer' | 'contributor' | 'ambassador' | 'creator'
  joinedAt: string
  lastActive: string
  metrics: {
    totalUploads: number
    totalViews: number
    totalBookings: number
    totalEarnings: number
    averageQuality: number
    engagementRate: number
  }
  currentMonthMetrics: {
    uploads: number
    views: number
    earnings: number
    bookings: number
  }
  payoutInfo: {
    pendingAmount: number
    lastPayoutDate: string
    paymentMethod: string
    taxInfo: boolean
  }
  status: {
    isActive: boolean
    isVerified: boolean
    hasWarnings: boolean
    restrictionLevel: 'none' | 'warning' | 'limited' | 'suspended'
  }
}

export interface PayoutRequest {
  id: string
  creatorId: string
  creator: {
    username: string
    email: string
    tier: 'explorer' | 'contributor' | 'ambassador' | 'creator'
    totalEarnings: number
  }
  amount: number
  currency: string
  status: 'pending' | 'requires_review' | 'processing' | 'processed' | 'failed' | 'cancelled'
  paymentMethod: {
    type: 'bank_transfer' | 'paypal'
    details: Record<string, any>
  }
  requestedAt: string
  scheduledFor: string
  processedAt?: string
  metadata: {
    period: string
    bookingsCount: number
    commissionsEarned: number
    taxesWithheld: number
    fees: number
  }
  notes?: string | null
  rejectionReason?: string
}

// ============================================================================
// DESTINATION MANAGEMENT
// ============================================================================

export interface AdminDestination {
  iataCode: string
  cityName: string
  countryName: string
  countryCode: string
  continent: string
  coordinates: {
    lat: number
    lng: number
  }
  isActive: boolean
  isPopular: boolean
  highlights: string[]
  themeScores: {
    vibe: number         // Social & Entertainment (was: nightlife + romance)
    adventure: number    // Active & Outdoor (unchanged)
    discover: number     // Cultural & Creative (was: culture + food)
    indulge: number      // Luxury & Indulgent (was: shopping + relaxation)
    nature: number       // Nature & Relaxation (unchanged)
  }
  supportedActivities: string[]
  metrics: {
    totalBookings: number
    totalRevenue: number
    averageStay: number
    popularityScore: number
    contentCount: number
    creatorCount: number
  }
  description?: string
  imageUrl?: string
  lastUpdated: string
  // Additional properties from legacy interface (optional for compatibility)
  averageFlightTime?: number
  priceRange?: 'budget' | 'mid-range' | 'luxury'
  bestMonths?: string[]
}

// ============================================================================
// SYSTEM MONITORING TYPES
// ============================================================================
export interface SystemHealth {
  overall: 'healthy' | 'warning' | 'critical'
  services: ServiceStatus[]
  performance: PerformanceMetrics
  alerts: SystemAlert[]
  lastUpdated: string
}

export interface ServiceStatus {
  name: string
  status: 'up' | 'down' | 'degraded'
  responseTime: number
  uptime: number
  version: string
  endpoints: EndpointHealth[]
}

export interface EndpointHealth {
  path: string
  method: string
  status: number
  responseTime: number
  lastChecked: string
}

export interface PerformanceMetrics {
  cpu: number
  memory: number
  disk: number
  database: {
    connections: number
    queryTime: number
    errorRate: number
  }
  cache: {
    hitRate: number
    memoryUsage: number
  }
  api: {
    requestsPerSecond: number
    averageResponseTime: number
    errorRate: number
  }
}

export interface SystemAlert {
  id: string
  level: 'info' | 'warning' | 'error' | 'critical'
  message: string
  service: string
  timestamp: string
  acknowledged: boolean
  resolvedAt?: string
}

// Legacy Destination Profile (renamed to avoid conflicts)
export interface DestinationProfile {
  iataCode: string
  cityName: string
  countryName: string
  countryCode: string
  themeScores: {
    party: number
    adventure: number
    learn: number
    shopping: number
    beach: number
  }
  highlights: string[]
  averageFlightTime: number
  priceRange: 'budget' | 'mid-range' | 'luxury'
  bestMonths: string[]
  description: string
  isActive: boolean
  lastUpdated: string
  metrics: {
    totalBookings: number
    averageRating: number
    contentCount: number
    revenue: number
    growth: number
  }
}

// Support Types
export interface SupportTicket {
  id: string
  ticketNumber: string
  userId: string
  userEmail: string
  subject: string
  description: string
  category: 'booking' | 'payment' | 'content' | 'account' | 'technical' | 'other'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  assignedTo?: string
  createdAt: string
  updatedAt: string
  resolvedAt?: string
  responses: SupportResponse[]
  tags: string[]
}

export interface SupportResponse {
  id: string
  author: 'user' | 'admin'
  authorName: string
  message: string
  timestamp: string
  attachments?: string[]
  isInternal: boolean
}

// API Response Types
export interface AdminApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  meta?: {
    total?: number
    page?: number
    limit?: number
    hasMore?: boolean
  }
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

// Dashboard Widget Types
export type DashboardWidget = 
  | 'revenue_overview'
  | 'user_metrics' 
  | 'content_moderation'
  | 'system_health'
  | 'creator_leaderboard'
  | 'recent_bookings'
  | 'performance_metrics'
  | 'support_queue'

export interface DashboardLayout {
  userId: string
  widgets: {
    id: DashboardWidget
    position: { x: number, y: number }
    size: { width: number, height: number }
    config?: Record<string, any>
  }[]
  lastUpdated: string
}

// Form Types for Admin Operations
export interface CreateDestinationForm {
  iataCode: string
  cityName: string
  countryName: string
  countryCode: string
  themeScores: {
    party: number
    adventure: number
    learn: number
    shopping: number
    beach: number
  }
  highlights: string[]
  averageFlightTime: number
  priceRange: 'budget' | 'mid-range' | 'luxury'
  bestMonths: string[]
  description: string
}

export interface BulkModerationForm {
  contentIds: string[]
  action: 'approve' | 'reject'
  reason?: string
  qualityScore?: number
  feedbackToCreators?: string
}