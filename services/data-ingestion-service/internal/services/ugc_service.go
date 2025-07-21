package services

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/gocql/gocql"
	"github.com/spontra/data-ingestion-service/internal/models"
)

type UGCService struct {
	session *gocql.Session
}

func NewUGCService(session *gocql.Session) *UGCService {
	return &UGCService{
		session: session,
	}
}

// SubmitContent handles new user-generated content submissions
func (s *UGCService) SubmitContent(ctx context.Context, content *models.UserGeneratedContent) error {
	// Generate ID and set timestamps
	content.ID = gocql.TimeUUID()
	content.CreatedAt = time.Now()
	content.UpdatedAt = time.Now()
	content.ModerationStatus = "pending"
	content.QualityScore = s.calculateInitialQualityScore(content)

	// Validate GPS location
	if err := s.validateGPSLocation(content); err != nil {
		return fmt.Errorf("GPS validation failed: %w", err)
	}

	// Insert into database
	query := `
		INSERT INTO user_generated_content (
			id, user_id, activity_id, destination_code, video_url, thumbnail_url,
			title, description, duration, gps_location, created_at, updated_at,
			moderation_status, quality_score, view_count, like_count, booking_count,
			is_verified, verification_data, earnings_generated, reward_points
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`

	err := s.session.Query(query,
		content.ID, content.UserID, content.ActivityID, content.DestinationCode,
		content.VideoURL, content.ThumbnailURL, content.Title, content.Description,
		content.Duration, content.GPSLocation, content.CreatedAt, content.UpdatedAt,
		content.ModerationStatus, content.QualityScore, content.ViewCount,
		content.LikeCount, content.BookingCount, content.IsVerified,
		content.VerificationData, content.EarningsGenerated, content.RewardPoints,
	).WithContext(ctx).Exec()

	if err != nil {
		return fmt.Errorf("failed to insert UGC: %w", err)
	}

	// Queue for moderation review
	go s.queueForModeration(content.ID)

	// Award initial submission points
	go s.awardSubmissionReward(content.UserID, content.ID)

	return nil
}

// GetContentForActivity retrieves UGC for a specific activity and destination
func (s *UGCService) GetContentForActivity(ctx context.Context, request models.UGCSearchRequest) (*models.UGCSearchResponse, error) {
	var content []models.UserGeneratedContent
	
	// Build query based on search parameters
	query := `
		SELECT id, user_id, activity_id, destination_code, video_url, thumbnail_url,
			   title, description, duration, gps_location, created_at, updated_at,
			   moderation_status, quality_score, view_count, like_count, booking_count,
			   is_verified, verification_data, earnings_generated, reward_points
		FROM user_generated_content 
		WHERE activity_id = ? AND destination_code = ? AND moderation_status = 'approved'
	`
	
	args := []interface{}{request.ActivityID, request.DestinationCode}
	
	// Add quality filter if specified
	if request.MinQualityScore > 0 {
		query += " AND quality_score >= ?"
		args = append(args, request.MinQualityScore)
	}

	// Add verified filter if specified
	if request.OnlyVerified {
		query += " AND is_verified = true"
	}

	// Add sorting
	switch request.SortBy {
	case "quality":
		query += " ORDER BY quality_score DESC"
	case "views":
		query += " ORDER BY view_count DESC"
	case "bookings":
		query += " ORDER BY booking_count DESC"
	default:
		query += " ORDER BY created_at DESC"
	}

	// Add limit
	maxResults := request.MaxResults
	if maxResults == 0 {
		maxResults = 10
	}
	query += " LIMIT ?"
	args = append(args, maxResults)

	iter := s.session.Query(query, args...).WithContext(ctx).Iter()
	
	var ugcItem models.UserGeneratedContent
	for iter.Scan(
		&ugcItem.ID, &ugcItem.UserID, &ugcItem.ActivityID, &ugcItem.DestinationCode,
		&ugcItem.VideoURL, &ugcItem.ThumbnailURL, &ugcItem.Title, &ugcItem.Description,
		&ugcItem.Duration, &ugcItem.GPSLocation, &ugcItem.CreatedAt, &ugcItem.UpdatedAt,
		&ugcItem.ModerationStatus, &ugcItem.QualityScore, &ugcItem.ViewCount,
		&ugcItem.LikeCount, &ugcItem.BookingCount, &ugcItem.IsVerified,
		&ugcItem.VerificationData, &ugcItem.EarningsGenerated, &ugcItem.RewardPoints,
	) {
		content = append(content, ugcItem)
	}

	if err := iter.Close(); err != nil {
		return nil, fmt.Errorf("failed to retrieve UGC: %w", err)
	}

	return &models.UGCSearchResponse{
		Content:    content,
		TotalCount: len(content),
		HasMore:    len(content) == maxResults,
		QualityMix: s.determineQualityMix(content),
	}, nil
}

// CreateCreator registers a new creator in the program
func (s *UGCService) CreateCreator(ctx context.Context, creator *models.SpontraCreator) error {
	creator.UserID = gocql.TimeUUID()
	creator.CreatedAt = time.Now()
	creator.LastActiveAt = time.Now()
	creator.CreatorTier = "explorer" // Starting tier
	creator.IsActive = true

	query := `
		INSERT INTO spontra_creators (
			user_id, email, username, full_name, profile_picture, created_at, last_active_at,
			creator_tier, total_uploads, total_views, total_bookings, total_earnings,
			reward_points, achievements, countries_visited, activities_created,
			is_verified, is_active, notification_prefs
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`

	err := s.session.Query(query,
		creator.UserID, creator.Email, creator.Username, creator.FullName,
		creator.ProfilePicture, creator.CreatedAt, creator.LastActiveAt,
		creator.CreatorTier, creator.TotalUploads, creator.TotalViews,
		creator.TotalBookings, creator.TotalEarnings, creator.RewardPoints,
		creator.Achievements, creator.CountriesVisited, creator.ActivitiesCreated,
		creator.IsVerified, creator.IsActive, creator.NotificationPrefs,
	).WithContext(ctx).Exec()

	if err != nil {
		return fmt.Errorf("failed to create creator: %w", err)
	}

	return nil
}

// UpdateCreatorStats updates creator performance metrics
func (s *UGCService) UpdateCreatorStats(ctx context.Context, userID gocql.UUID) error {
	// Calculate aggregate stats from content
	query := `
		SELECT COUNT(*), SUM(view_count), SUM(booking_count), SUM(earnings_generated)
		FROM user_generated_content 
		WHERE user_id = ? AND moderation_status = 'approved'
	`

	var totalUploads int
	var totalViews, totalBookings int64
	var totalEarnings float64

	err := s.session.Query(query, userID).WithContext(ctx).
		Scan(&totalUploads, &totalViews, &totalBookings, &totalEarnings)
	
	if err != nil {
		return fmt.Errorf("failed to calculate creator stats: %w", err)
	}

	// Determine new creator tier
	newTier := s.calculateCreatorTier(totalUploads, totalBookings, totalEarnings)

	// Update creator record
	updateQuery := `
		UPDATE spontra_creators 
		SET total_uploads = ?, total_views = ?, total_bookings = ?, 
			total_earnings = ?, creator_tier = ?, last_active_at = ?
		WHERE user_id = ?
	`

	err = s.session.Query(updateQuery,
		totalUploads, totalViews, totalBookings, totalEarnings, 
		newTier, time.Now(), userID,
	).WithContext(ctx).Exec()

	if err != nil {
		return fmt.Errorf("failed to update creator stats: %w", err)
	}

	return nil
}

// RecordBookingConversion tracks when UGC leads to a booking
func (s *UGCService) RecordBookingConversion(ctx context.Context, contentID gocql.UUID, bookingValue float64) error {
	// Update content booking count and earnings
	updateQuery := `
		UPDATE user_generated_content 
		SET booking_count = booking_count + 1, 
			earnings_generated = earnings_generated + ?
		WHERE id = ?
	`

	rewardAmount := bookingValue * 0.05 // 5% commission for creators
	err := s.session.Query(updateQuery, rewardAmount, contentID).WithContext(ctx).Exec()
	
	if err != nil {
		return fmt.Errorf("failed to record booking conversion: %w", err)
	}

	// Award creator reward points
	go s.awardBookingReward(contentID, rewardAmount)

	return nil
}

// Private helper methods

func (s *UGCService) calculateInitialQualityScore(content *models.UserGeneratedContent) float64 {
	score := 50.0 // Base score

	// Title quality (max 20 points)
	if len(content.Title) > 10 && len(content.Title) < 100 {
		score += 15
	}

	// Description quality (max 15 points)
	if len(content.Description) > 50 && len(content.Description) < 500 {
		score += 15
	}

	// Duration preference (max 15 points)
	if content.Duration >= 30 && content.Duration <= 90 {
		score += 15 // Sweet spot for shorts
	} else if content.Duration <= 180 {
		score += 10
	}

	return score
}

func (s *UGCService) validateGPSLocation(content *models.UserGeneratedContent) error {
	// Basic GPS validation - in production, this would verify against destination boundaries
	if content.GPSLocation.Latitude == 0 && content.GPSLocation.Longitude == 0 {
		return fmt.Errorf("invalid GPS coordinates")
	}

	// Check GPS accuracy
	if content.GPSLocation.Accuracy > 100 { // More than 100m accuracy
		log.Printf("Warning: Low GPS accuracy for content %s: %.2fm", 
			content.ID, content.GPSLocation.Accuracy)
	}

	return nil
}

func (s *UGCService) calculateCreatorTier(uploads int, bookings int64, earnings float64) string {
	if uploads >= 100 && bookings >= 50 {
		return "creator"
	} else if uploads >= 20 && bookings >= 10 {
		return "ambassador"
	} else if uploads >= 5 {
		return "contributor"
	}
	return "explorer"
}

func (s *UGCService) determineQualityMix(content []models.UserGeneratedContent) string {
	if len(content) == 0 {
		return "mixed"
	}

	avgQuality := 0.0
	for _, item := range content {
		avgQuality += item.QualityScore
	}
	avgQuality /= float64(len(content))

	if avgQuality >= 80 {
		return "high"
	} else if avgQuality >= 60 {
		return "mixed"
	}
	return "ugc_priority"
}

func (s *UGCService) queueForModeration(contentID gocql.UUID) {
	// In production, this would add to a moderation queue
	log.Printf("Content %s queued for moderation", contentID)
}

func (s *UGCService) awardSubmissionReward(userID gocql.UUID, contentID gocql.UUID) {
	// Award 10 points for content submission
	transaction := &models.RewardTransaction{
		ID:              gocql.TimeUUID(),
		UserID:          userID,
		ContentID:       &contentID,
		TransactionType: "earn",
		PointsAmount:    10,
		EuroAmount:      1.0, // €1 travel credit
		Description:     "Content submission reward",
		CreatedAt:       time.Now(),
		Status:          "processed",
	}

	s.recordRewardTransaction(transaction)
}

func (s *UGCService) awardBookingReward(contentID gocql.UUID, amount float64) {
	// This would lookup the content's user and award booking commission
	log.Printf("Awarding €%.2f booking reward for content %s", amount, contentID)
}

func (s *UGCService) recordRewardTransaction(transaction *models.RewardTransaction) {
	query := `
		INSERT INTO reward_transactions (
			id, user_id, content_id, transaction_type, points_amount, euro_amount,
			description, reference_id, created_at, processed_at, status
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`

	err := s.session.Query(query,
		transaction.ID, transaction.UserID, transaction.ContentID,
		transaction.TransactionType, transaction.PointsAmount, transaction.EuroAmount,
		transaction.Description, transaction.ReferenceID, transaction.CreatedAt,
		transaction.ProcessedAt, transaction.Status,
	).Exec()

	if err != nil {
		log.Printf("Failed to record reward transaction: %v", err)
	}
}