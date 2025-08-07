package services

import (
	"fmt"
	"log"
	"time"

	"spontra/pricing-service/internal/cache"
	"spontra/pricing-service/internal/models"
	"spontra/pricing-service/internal/repository"
	"github.com/google/uuid"
)

// TrackingService handles price tracking functionality
type TrackingService struct {
	trackingRepo      *repository.TrackingRepository
	priceRepo         *repository.PriceRepository
	cache             *cache.RedisClient
	cacheKeyBuilder   *cache.CacheKeyBuilder
	maxTrackingPerUser int
}

// NewTrackingService creates a new tracking service
func NewTrackingService(
	trackingRepo *repository.TrackingRepository,
	priceRepo *repository.PriceRepository,
	redisClient *cache.RedisClient,
	maxTrackingPerUser int,
) *TrackingService {
	return &TrackingService{
		trackingRepo:       trackingRepo,
		priceRepo:          priceRepo,
		cache:              redisClient,
		cacheKeyBuilder:    cache.NewCacheKeyBuilder("tracking"),
		maxTrackingPerUser: maxTrackingPerUser,
	}
}

// CreatePriceTracking creates a new price tracking record
func (s *TrackingService) CreatePriceTracking(userID uuid.UUID, req *models.PriceTrackingRequest) (*models.PriceTracking, error) {
	// Check user's current tracking count
	currentTracking, err := s.trackingRepo.GetUserTrackingCount(userID)
	if err != nil {
		return nil, fmt.Errorf("failed to check user tracking count: %w", err)
	}
	
	if currentTracking >= s.maxTrackingPerUser {
		return nil, fmt.Errorf("maximum number of tracking records reached (%d)", s.maxTrackingPerUser)
	}
	
	// Generate route ID
	routeID := fmt.Sprintf("%s-%s", req.OriginAirport, req.DestinationAirport)
	
	// Check if user already has tracking for this route
	exists, err := s.trackingRepo.CheckExistingTracking(userID, routeID)
	if err != nil {
		return nil, fmt.Errorf("failed to check existing tracking: %w", err)
	}
	
	if exists {
		return nil, fmt.Errorf("tracking already exists for this route")
	}
	
	// Create tracking record
	tracking := &models.PriceTracking{
		ID:                 uuid.New(),
		UserID:             userID,
		RouteID:            routeID,
		OriginAirport:      req.OriginAirport,
		DestinationAirport: req.DestinationAirport,
		DepartureDate:      req.DepartureDate,
		ReturnDate:         req.ReturnDate,
		TripType:           req.TripType,
		PassengerCount:     req.PassengerCount,
		CabinClass:         req.CabinClass,
		IsActive:           true,
	}
	
	if err := s.trackingRepo.CreatePriceTracking(tracking); err != nil {
		return nil, fmt.Errorf("failed to create price tracking: %w", err)
	}
	
	// Clear user tracking cache
	cacheKey := s.cacheKeyBuilder.UserTracking(userID.String())
	s.cache.Delete(cacheKey)
	
	log.Printf("Created price tracking %s for user %s on route %s", tracking.ID, userID, routeID)
	
	return tracking, nil
}

// GetUserPriceTracking retrieves all price tracking records for a user
func (s *TrackingService) GetUserPriceTracking(userID uuid.UUID) ([]models.PriceTracking, error) {
	// Try cache first
	cacheKey := s.cacheKeyBuilder.UserTracking(userID.String())
	var cachedTracking []models.PriceTracking
	if err := s.cache.Get(cacheKey, &cachedTracking); err == nil {
		return cachedTracking, nil
	}
	
	// Get from database
	tracking, err := s.trackingRepo.GetUserPriceTracking(userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user price tracking: %w", err)
	}
	
	// Cache for 1 hour
	if err := s.cache.Set(cacheKey, tracking, time.Hour); err != nil {
		log.Printf("Failed to cache user tracking: %v", err)
	}
	
	return tracking, nil
}

// GetPriceTrackingWithPrices retrieves tracking records with current price data
func (s *TrackingService) GetPriceTrackingWithPrices(userID uuid.UUID) ([]map[string]interface{}, error) {
	// Get user's tracking records
	trackingRecords, err := s.GetUserPriceTracking(userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user tracking: %w", err)
	}
	
	var results []map[string]interface{}
	
	for _, tracking := range trackingRecords {
		result := map[string]interface{}{
			"tracking": tracking,
		}
		
		// Get current price for this route
		req := &models.PriceComparisonRequest{
			OriginAirport:      tracking.OriginAirport,
			DestinationAirport: tracking.DestinationAirport,
			DepartureDate:      tracking.DepartureDate,
			ReturnDate:         tracking.ReturnDate,
			PassengerCount:     tracking.PassengerCount,
			CabinClass:         tracking.CabinClass,
			TripType:           tracking.TripType,
			MaxResults:         5,
		}
		
		prices, err := s.priceRepo.GetFlightPrices(req)
		if err != nil {
			log.Printf("Failed to get prices for tracking %s: %v", tracking.ID, err)
			result["current_prices"] = []models.FlightPrice{}
		} else {
			result["current_prices"] = prices
		}
		
		// Get price history for this route
		history, err := s.priceRepo.GetPriceHistory(tracking.RouteID, 30)
		if err != nil {
			log.Printf("Failed to get price history for tracking %s: %v", tracking.ID, err)
			result["price_history"] = []models.PriceHistory{}
		} else {
			result["price_history"] = history
		}
		
		results = append(results, result)
	}
	
	return results, nil
}

// StopPriceTracking deactivates a price tracking record
func (s *TrackingService) StopPriceTracking(trackingID, userID uuid.UUID) error {
	if err := s.trackingRepo.DeactivatePriceTracking(trackingID, userID); err != nil {
		return fmt.Errorf("failed to stop price tracking: %w", err)
	}
	
	// Clear user tracking cache
	cacheKey := s.cacheKeyBuilder.UserTracking(userID.String())
	s.cache.Delete(cacheKey)
	
	log.Printf("Stopped price tracking %s for user %s", trackingID, userID)
	
	return nil
}

// DeletePriceTracking removes a price tracking record
func (s *TrackingService) DeletePriceTracking(trackingID, userID uuid.UUID) error {
	if err := s.trackingRepo.DeletePriceTracking(trackingID, userID); err != nil {
		return fmt.Errorf("failed to delete price tracking: %w", err)
	}
	
	// Clear user tracking cache
	cacheKey := s.cacheKeyBuilder.UserTracking(userID.String())
	s.cache.Delete(cacheKey)
	
	log.Printf("Deleted price tracking %s for user %s", trackingID, userID)
	
	return nil
}

// GetTrackingStats returns tracking statistics
func (s *TrackingService) GetTrackingStats() (map[string]interface{}, error) {
	return s.trackingRepo.GetTrackingStats()
}

// ProcessActiveTracking processes all active tracking records
func (s *TrackingService) ProcessActiveTracking() error {
	// Get all active tracking records
	trackingRecords, err := s.trackingRepo.GetActivePriceTracking()
	if err != nil {
		return fmt.Errorf("failed to get active tracking records: %w", err)
	}
	
	log.Printf("Processing %d active tracking records", len(trackingRecords))
	
	for _, tracking := range trackingRecords {
		if err := s.processTrackingRecord(&tracking); err != nil {
			log.Printf("Failed to process tracking record %s: %v", tracking.ID, err)
			continue
		}
	}
	
	return nil
}

// GetPopularTrackedRoutes returns the most tracked routes
func (s *TrackingService) GetPopularTrackedRoutes(limit int) ([]map[string]interface{}, error) {
	// This is a placeholder implementation
	// In a real system, you would query the database for route popularity
	
	stats, err := s.trackingRepo.GetTrackingStats()
	if err != nil {
		return nil, fmt.Errorf("failed to get tracking stats: %w", err)
	}
	
	// Return basic stats for now
	// In production, you'd implement a proper query for popular routes
	results := []map[string]interface{}{
		{
			"route_id":       "LHR-CDG",
			"tracking_count": 15,
			"avg_price":      "€89",
		},
		{
			"route_id":       "BCN-MAD",
			"tracking_count": 12,
			"avg_price":      "€65",
		},
	}
	
	// Limit results
	if limit > 0 && limit < len(results) {
		results = results[:limit]
	}
	
	// Add overall stats
	for i := range results {
		results[i]["total_active_tracking"] = stats["active_tracking"]
	}
	
	return results, nil
}

// Helper methods

func (s *TrackingService) processTrackingRecord(tracking *models.PriceTracking) error {
	// Get current prices for the tracked route
	req := &models.PriceComparisonRequest{
		OriginAirport:      tracking.OriginAirport,
		DestinationAirport: tracking.DestinationAirport,
		DepartureDate:      tracking.DepartureDate,
		ReturnDate:         tracking.ReturnDate,
		PassengerCount:     tracking.PassengerCount,
		CabinClass:         tracking.CabinClass,
		TripType:           tracking.TripType,
		MaxResults:         10,
	}
	
	prices, err := s.priceRepo.GetFlightPrices(req)
	if err != nil {
		return fmt.Errorf("failed to get prices for tracking: %w", err)
	}
	
	if len(prices) == 0 {
		// No prices available for this route
		return nil
	}
	
	// Update price history if needed
	// This is where you'd implement logic to:
	// 1. Store current price snapshot
	// 2. Calculate price changes
	// 3. Trigger notifications for significant changes
	
	log.Printf("Processed tracking %s: found %d prices", tracking.ID, len(prices))
	
	return nil
}

// ValidateTrackingRequest validates a price tracking request
func (s *TrackingService) ValidateTrackingRequest(req *models.PriceTrackingRequest) error {
	if req.OriginAirport == "" {
		return fmt.Errorf("origin airport is required")
	}
	
	if req.DestinationAirport == "" {
		return fmt.Errorf("destination airport is required")
	}
	
	if req.OriginAirport == req.DestinationAirport {
		return fmt.Errorf("origin and destination airports cannot be the same")
	}
	
	if req.DepartureDate.Before(time.Now().Truncate(24 * time.Hour)) {
		return fmt.Errorf("departure date cannot be in the past")
	}
	
	if req.TripType == "return" && req.ReturnDate == nil {
		return fmt.Errorf("return date is required for return trips")
	}
	
	if req.ReturnDate != nil && req.ReturnDate.Before(req.DepartureDate) {
		return fmt.Errorf("return date cannot be before departure date")
	}
	
	if req.PassengerCount < 1 || req.PassengerCount > 9 {
		return fmt.Errorf("passenger count must be between 1 and 9")
	}
	
	// Validate cabin class
	validCabinClasses := map[string]bool{
		"economy":  true,
		"premium":  true,
		"business": true,
		"first":    true,
	}
	
	if req.CabinClass != "" && !validCabinClasses[req.CabinClass] {
		return fmt.Errorf("invalid cabin class: %s", req.CabinClass)
	}
	
	// Validate trip type
	validTripTypes := map[string]bool{
		"oneway": true,
		"return": true,
	}
	
	if !validTripTypes[req.TripType] {
		return fmt.Errorf("invalid trip type: %s", req.TripType)
	}
	
	return nil
}