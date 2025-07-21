package models

import (
	"time"
	"github.com/gocql/gocql"
)

// UserGeneratedContent represents user-submitted videos for activities
type UserGeneratedContent struct {
	ID              gocql.UUID    `json:"id" cql:"id"`
	UserID          gocql.UUID    `json:"user_id" cql:"user_id"`
	ActivityID      string        `json:"activity_id" cql:"activity_id"`
	DestinationCode string        `json:"destination_code" cql:"destination_code"`
	VideoURL        string        `json:"video_url" cql:"video_url"`
	ThumbnailURL    string        `json:"thumbnail_url" cql:"thumbnail_url"`
	Title           string        `json:"title" cql:"title"`
	Description     string        `json:"description" cql:"description"`
	Duration        int           `json:"duration" cql:"duration"` // in seconds
	GPSLocation     GPSCoordinates `json:"gps_location" cql:"gps_location"`
	CreatedAt       time.Time     `json:"created_at" cql:"created_at"`
	UpdatedAt       time.Time     `json:"updated_at" cql:"updated_at"`
	
	// Moderation and quality fields
	ModerationStatus string        `json:"moderation_status" cql:"moderation_status"` // pending, approved, rejected
	QualityScore     float64       `json:"quality_score" cql:"quality_score"`
	ViewCount        int64         `json:"view_count" cql:"view_count"`
	LikeCount        int64         `json:"like_count" cql:"like_count"`
	BookingCount     int64         `json:"booking_count" cql:"booking_count"` // Bookings generated from this video
	
	// Content validation
	IsVerified       bool          `json:"is_verified" cql:"is_verified"`
	VerificationData VerificationData `json:"verification_data" cql:"verification_data"`
	
	// Creator reward tracking
	EarningsGenerated float64      `json:"earnings_generated" cql:"earnings_generated"`
	RewardPoints      int          `json:"reward_points" cql:"reward_points"`
}

// GPSCoordinates represents location data for content verification
type GPSCoordinates struct {
	Latitude  float64   `json:"latitude" cql:"latitude"`
	Longitude float64   `json:"longitude" cql:"longitude"`
	Accuracy  float64   `json:"accuracy" cql:"accuracy"` // in meters
	Timestamp time.Time `json:"timestamp" cql:"timestamp"`
}

// VerificationData holds additional verification information
type VerificationData struct {
	DeviceID       string            `json:"device_id" cql:"device_id"`
	IPAddress      string            `json:"ip_address" cql:"ip_address"`
	Metadata       map[string]string `json:"metadata" cql:"metadata"`
	BookingRefID   string            `json:"booking_ref_id" cql:"booking_ref_id"` // Link to actual booking
}

// SpontraCreator represents users in the creator program
type SpontraCreator struct {
	UserID          gocql.UUID    `json:"user_id" cql:"user_id"`
	Email           string        `json:"email" cql:"email"`
	Username        string        `json:"username" cql:"username"`
	FullName        string        `json:"full_name" cql:"full_name"`
	ProfilePicture  string        `json:"profile_picture" cql:"profile_picture"`
	CreatedAt       time.Time     `json:"created_at" cql:"created_at"`
	LastActiveAt    time.Time     `json:"last_active_at" cql:"last_active_at"`
	
	// Creator program status
	CreatorTier     string        `json:"creator_tier" cql:"creator_tier"` // explorer, contributor, ambassador, creator
	TotalUploads    int           `json:"total_uploads" cql:"total_uploads"`
	TotalViews      int64         `json:"total_views" cql:"total_views"`
	TotalBookings   int64         `json:"total_bookings" cql:"total_bookings"`
	TotalEarnings   float64       `json:"total_earnings" cql:"total_earnings"`
	RewardPoints    int           `json:"reward_points" cql:"reward_points"`
	
	// Achievements and badges
	Achievements    []string      `json:"achievements" cql:"achievements"`
	CountriesVisited []string     `json:"countries_visited" cql:"countries_visited"`
	ActivitiesCreated []string    `json:"activities_created" cql:"activities_created"`
	
	// Account settings
	IsVerified      bool          `json:"is_verified" cql:"is_verified"`
	IsActive        bool          `json:"is_active" cql:"is_active"`
	NotificationPrefs map[string]bool `json:"notification_prefs" cql:"notification_prefs"`
}

// ContentModeration represents moderation review records
type ContentModeration struct {
	ID              gocql.UUID    `json:"id" cql:"id"`
	ContentID       gocql.UUID    `json:"content_id" cql:"content_id"`
	ModeratorID     gocql.UUID    `json:"moderator_id" cql:"moderator_id"`
	ReviewedAt      time.Time     `json:"reviewed_at" cql:"reviewed_at"`
	Decision        string        `json:"decision" cql:"decision"` // approved, rejected, needs_review
	ReasonCode      string        `json:"reason_code" cql:"reason_code"`
	Notes           string        `json:"notes" cql:"notes"`
	QualityScore    float64       `json:"quality_score" cql:"quality_score"`
	AutoFlags       []string      `json:"auto_flags" cql:"auto_flags"` // AI-detected issues
}

// RewardTransaction represents point earnings and spending
type RewardTransaction struct {
	ID              gocql.UUID    `json:"id" cql:"id"`
	UserID          gocql.UUID    `json:"user_id" cql:"user_id"`
	ContentID       *gocql.UUID   `json:"content_id,omitempty" cql:"content_id"` // null for non-content rewards
	TransactionType string        `json:"transaction_type" cql:"transaction_type"` // earn, spend, bonus
	PointsAmount    int           `json:"points_amount" cql:"points_amount"`
	EuroAmount      float64       `json:"euro_amount" cql:"euro_amount"`
	Description     string        `json:"description" cql:"description"`
	ReferenceID     string        `json:"reference_id" cql:"reference_id"` // booking ID, achievement ID, etc.
	CreatedAt       time.Time     `json:"created_at" cql:"created_at"`
	ProcessedAt     *time.Time    `json:"processed_at,omitempty" cql:"processed_at"`
	Status          string        `json:"status" cql:"status"` // pending, processed, failed
}

// CreatorAnalytics represents performance metrics for creators
type CreatorAnalytics struct {
	UserID          gocql.UUID    `json:"user_id" cql:"user_id"`
	Period          string        `json:"period" cql:"period"` // daily, weekly, monthly
	PeriodStart     time.Time     `json:"period_start" cql:"period_start"`
	PeriodEnd       time.Time     `json:"period_end" cql:"period_end"`
	
	// Performance metrics
	VideoUploads    int           `json:"video_uploads" cql:"video_uploads"`
	TotalViews      int64         `json:"total_views" cql:"total_views"`
	UniqueViewers   int64         `json:"unique_viewers" cql:"unique_viewers"`
	EngagementRate  float64       `json:"engagement_rate" cql:"engagement_rate"`
	BookingsGenerated int64       `json:"bookings_generated" cql:"bookings_generated"`
	RevenueGenerated float64      `json:"revenue_generated" cql:"revenue_generated"`
	
	// Top performing content
	TopVideoID      *gocql.UUID   `json:"top_video_id,omitempty" cql:"top_video_id"`
	TopDestination  string        `json:"top_destination" cql:"top_destination"`
	TopActivity     string        `json:"top_activity" cql:"top_activity"`
	
	CreatedAt       time.Time     `json:"created_at" cql:"created_at"`
}

// UGCSearchRequest represents search parameters for user content
type UGCSearchRequest struct {
	ActivityID      string   `json:"activity_id"`
	DestinationCode string   `json:"destination_code"`
	CreatorTier     string   `json:"creator_tier,omitempty"`
	MinQualityScore float64  `json:"min_quality_score,omitempty"`
	MaxResults      int      `json:"max_results,omitempty"`
	SortBy          string   `json:"sort_by,omitempty"` // quality, views, recent, bookings
	OnlyVerified    bool     `json:"only_verified,omitempty"`
}

// UGCSearchResponse represents search results
type UGCSearchResponse struct {
	Content     []UserGeneratedContent `json:"content"`
	TotalCount  int                    `json:"total_count"`
	HasMore     bool                   `json:"has_more"`
	QualityMix  string                 `json:"quality_mix"` // high, mixed, ugc_priority
}