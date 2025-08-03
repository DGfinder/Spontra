package services

import (
	"fmt"
	"log"
	"time"

	"spontra/pricing-service/internal/cache"
	"spontra/pricing-service/internal/models"
	"spontra/pricing-service/internal/repository"
	"github.com/google/uuid"
	"github.com/shopspring/decimal"
)

// AlertService handles price alerts and notifications
type AlertService struct {
	alertRepo       *repository.AlertRepository
	priceRepo       *repository.PriceRepository
	cache           *cache.RedisClient
	cacheKeyBuilder *cache.CacheKeyBuilder
	maxAlertsPerUser int
}

// NewAlertService creates a new alert service
func NewAlertService(
	alertRepo *repository.AlertRepository,
	priceRepo *repository.PriceRepository,
	redisClient *cache.RedisClient,
	maxAlertsPerUser int,
) *AlertService {
	return &AlertService{
		alertRepo:        alertRepo,
		priceRepo:        priceRepo,
		cache:            redisClient,
		cacheKeyBuilder:  cache.NewCacheKeyBuilder("alerts"),
		maxAlertsPerUser: maxAlertsPerUser,
	}
}

// CreatePriceAlert creates a new price alert
func (s *AlertService) CreatePriceAlert(userID uuid.UUID, req *models.PriceAlertRequest) (*models.PriceAlert, error) {
	// Check user's current alert count
	currentAlerts, err := s.alertRepo.GetUserAlertCount(userID)
	if err != nil {
		return nil, fmt.Errorf("failed to check user alert count: %w", err)
	}
	
	if currentAlerts >= s.maxAlertsPerUser {
		return nil, fmt.Errorf("maximum number of alerts reached (%d)", s.maxAlertsPerUser)
	}
	
	// Create alert
	alert := &models.PriceAlert{
		ID:                 uuid.New(),
		UserID:             userID,
		OriginAirport:      req.OriginAirport,
		DestinationAirport: req.DestinationAirport,
		DepartureDate:      req.DepartureDate,
		ReturnDate:         req.ReturnDate,
		MaxPrice:           req.MaxPrice,
		Currency:           req.Currency,
		TripType:           req.TripType,
		PassengerCount:     req.PassengerCount,
		CabinClass:         req.CabinClass,
		IsActive:           true,
		NotificationEmail:  req.NotificationEmail,
		TriggerCount:       0,
		ExpiresAt:          time.Now().AddDate(0, 0, req.ExpiryDays),
	}
	
	if err := s.alertRepo.CreatePriceAlert(alert); err != nil {
		return nil, fmt.Errorf("failed to create price alert: %w", err)
	}
	
	// Clear user alerts cache
	cacheKey := s.cacheKeyBuilder.UserAlerts(userID.String())
	s.cache.Delete(cacheKey)
	
	log.Printf("Created price alert %s for user %s", alert.ID, userID)
	
	return alert, nil
}

// GetUserPriceAlerts retrieves all price alerts for a user
func (s *AlertService) GetUserPriceAlerts(userID uuid.UUID) ([]models.PriceAlert, error) {
	// Try cache first
	cacheKey := s.cacheKeyBuilder.UserAlerts(userID.String())
	var cachedAlerts []models.PriceAlert
	if err := s.cache.Get(cacheKey, &cachedAlerts); err == nil {
		return cachedAlerts, nil
	}
	
	// Get from database
	alerts, err := s.alertRepo.GetUserPriceAlerts(userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user price alerts: %w", err)
	}
	
	// Cache for 1 hour
	if err := s.cache.Set(cacheKey, alerts, time.Hour); err != nil {
		log.Printf("Failed to cache user alerts: %v", err)
	}
	
	return alerts, nil
}

// UpdatePriceAlert updates an existing price alert
func (s *AlertService) UpdatePriceAlert(alertID, userID uuid.UUID, updates *models.PriceAlert) error {
	// Get existing alert to verify ownership
	existingAlert, err := s.alertRepo.GetPriceAlertByID(alertID)
	if err != nil {
		return fmt.Errorf("failed to get price alert: %w", err)
	}
	
	if existingAlert.UserID != userID {
		return fmt.Errorf("unauthorized: alert belongs to different user")
	}
	
	// Update the alert
	if err := s.alertRepo.UpdatePriceAlert(alertID, updates); err != nil {
		return fmt.Errorf("failed to update price alert: %w", err)
	}
	
	// Clear user alerts cache
	cacheKey := s.cacheKeyBuilder.UserAlerts(userID.String())
	s.cache.Delete(cacheKey)
	
	log.Printf("Updated price alert %s for user %s", alertID, userID)
	
	return nil
}

// DeletePriceAlert deletes a price alert
func (s *AlertService) DeletePriceAlert(alertID, userID uuid.UUID) error {
	if err := s.alertRepo.DeletePriceAlert(alertID, userID); err != nil {
		return fmt.Errorf("failed to delete price alert: %w", err)
	}
	
	// Clear user alerts cache
	cacheKey := s.cacheKeyBuilder.UserAlerts(userID.String())
	s.cache.Delete(cacheKey)
	
	log.Printf("Deleted price alert %s for user %s", alertID, userID)
	
	return nil
}

// CheckAndTriggerAlerts checks all active alerts against current prices
func (s *AlertService) CheckAndTriggerAlerts() error {
	// Get all active alerts
	alerts, err := s.alertRepo.GetActivePriceAlerts()
	if err != nil {
		return fmt.Errorf("failed to get active alerts: %w", err)
	}
	
	log.Printf("Checking %d active price alerts", len(alerts))
	
	for _, alert := range alerts {
		if err := s.checkSingleAlert(&alert); err != nil {
			log.Printf("Failed to check alert %s: %v", alert.ID, err)
			continue
		}
	}
	
	return nil
}

// CheckAlertsForRoute checks alerts for a specific route when new prices arrive
func (s *AlertService) CheckAlertsForRoute(origin, destination string, departureDate time.Time) error {
	// Get alerts for this specific route
	alerts, err := s.alertRepo.GetAlertsForPriceCheck(origin, destination, departureDate)
	if err != nil {
		return fmt.Errorf("failed to get alerts for route check: %w", err)
	}
	
	if len(alerts) == 0 {
		return nil // No alerts to check
	}
	
	log.Printf("Checking %d alerts for route %s-%s on %s", 
		len(alerts), origin, destination, departureDate.Format("2006-01-02"))
	
	for _, alert := range alerts {
		if err := s.checkSingleAlert(&alert); err != nil {
			log.Printf("Failed to check alert %s for route: %v", alert.ID, err)
			continue
		}
	}
	
	return nil
}

// CleanupExpiredAlerts deactivates expired alerts
func (s *AlertService) CleanupExpiredAlerts() error {
	rowsAffected, err := s.alertRepo.CleanupExpiredAlerts()
	if err != nil {
		return fmt.Errorf("failed to cleanup expired alerts: %w", err)
	}
	
	if rowsAffected > 0 {
		log.Printf("Deactivated %d expired price alerts", rowsAffected)
	}
	
	return nil
}

// Helper methods

func (s *AlertService) checkSingleAlert(alert *models.PriceAlert) error {
	// Create a price comparison request from the alert
	req := &models.PriceComparisonRequest{
		OriginAirport:      alert.OriginAirport,
		DestinationAirport: alert.DestinationAirport,
		DepartureDate:      alert.DepartureDate,
		ReturnDate:         alert.ReturnDate,
		PassengerCount:     alert.PassengerCount,
		CabinClass:         alert.CabinClass,
		TripType:           alert.TripType,
		MaxResults:         1, // We only need the best price
	}
	
	// Get the best current price
	bestPrice, err := s.priceRepo.GetBestPrice(req)
	if err != nil {
		// No prices available, skip this alert
		return nil
	}
	
	// Check if the price triggers the alert
	if bestPrice.Price.LessThanOrEqual(alert.MaxPrice) {
		return s.triggerAlert(alert, bestPrice)
	}
	
	return nil
}

func (s *AlertService) triggerAlert(alert *models.PriceAlert, triggeringPrice *models.FlightPrice) error {
	// Mark alert as triggered
	if err := s.alertRepo.TriggerAlert(alert.ID); err != nil {
		return fmt.Errorf("failed to mark alert as triggered: %w", err)
	}
	
	// Send notification (implement email service)
	if err := s.sendAlertNotification(alert, triggeringPrice); err != nil {
		log.Printf("Failed to send alert notification for %s: %v", alert.ID, err)
		// Don't return error here as the alert was successfully triggered
	}
	
	log.Printf("Triggered alert %s for user %s - price %s %s", 
		alert.ID, alert.UserID, triggeringPrice.Price, triggeringPrice.Currency)
	
	return nil
}

func (s *AlertService) sendAlertNotification(alert *models.PriceAlert, price *models.FlightPrice) error {
	// This is a placeholder for email notification
	// In a real implementation, you would integrate with an email service
	
	log.Printf("ALERT NOTIFICATION: Price %s %s found for %s→%s on %s (Alert ID: %s, Email: %s)",
		price.Price, price.Currency,
		alert.OriginAirport, alert.DestinationAirport,
		alert.DepartureDate.Format("2006-01-02"),
		alert.ID, alert.NotificationEmail)
	
	// TODO: Implement actual email sending
	// - Format email template
	// - Include flight details and booking link
	// - Send via SMTP or email service provider
	
	return nil
}

// ValidateAlertRequest validates a price alert request
func (s *AlertService) ValidateAlertRequest(req *models.PriceAlertRequest) error {
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
	
	if req.MaxPrice.LessThanOrEqual(decimal.Zero) {
		return fmt.Errorf("max price must be greater than zero")
	}
	
	if req.PassengerCount < 1 || req.PassengerCount > 9 {
		return fmt.Errorf("passenger count must be between 1 and 9")
	}
	
	if req.ExpiryDays < 1 || req.ExpiryDays > 365 {
		return fmt.Errorf("expiry days must be between 1 and 365")
	}
	
	if req.NotificationEmail == "" {
		return fmt.Errorf("notification email is required")
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
	
	// Validate currency
	validCurrencies := map[string]bool{
		"EUR": true,
		"USD": true,
		"GBP": true,
	}
	
	if !validCurrencies[req.Currency] {
		return fmt.Errorf("invalid currency: %s", req.Currency)
	}
	
	return nil
}