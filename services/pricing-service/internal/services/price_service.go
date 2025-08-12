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

// PriceService handles price comparison and management
type PriceService struct {
	priceRepo   *repository.PriceRepository
	cache       *cache.RedisClient
	cacheKeyBuilder *cache.CacheKeyBuilder
	cacheTTL    time.Duration
}

// NewPriceService creates a new price service
func NewPriceService(
	priceRepo *repository.PriceRepository,
	redisClient *cache.RedisClient,
	cacheTTL time.Duration,
) *PriceService {
	return &PriceService{
		priceRepo:       priceRepo,
		cache:           redisClient,
		cacheKeyBuilder: cache.NewCacheKeyBuilder("pricing"),
		cacheTTL:        cacheTTL,
	}
}

// ComparePrices compares prices from multiple providers
func (s *PriceService) ComparePrices(req *models.PriceComparisonRequest) (*models.PriceComparisonResponse, error) {
	requestID := uuid.New().String()
	
	// Generate cache key
	cacheKey := s.cacheKeyBuilder.PriceComparison(
		req.OriginAirport,
		req.DestinationAirport,
		req.DepartureDate.Format("2006-01-02"),
		req.TripType,
		req.PassengerCount,
	)
	
	// Try to get from cache first
	var cachedResponse models.PriceComparisonResponse
	cacheHit := false
	if err := s.cache.Get(cacheKey, &cachedResponse); err == nil {
		cachedResponse.RequestID = requestID
		cachedResponse.CacheHit = true
		log.Printf("Price comparison cache hit for key: %s", cacheKey)
		return &cachedResponse, nil
	}
	
	// Get prices from database
	prices, err := s.priceRepo.GetFlightPrices(req)
	if err != nil {
		return nil, fmt.Errorf("failed to get flight prices: %w", err)
	}
	
	// Calculate statistics
	response := &models.PriceComparisonResponse{
		RequestID:     requestID,
		Prices:        prices,
		ProviderCount: len(s.getUniqueProviders(prices)),
		Currency:      "EUR", // Default currency
		SearchTime:    time.Now(),
		CacheHit:      cacheHit,
	}
	
	if len(prices) > 0 {
		response.BestPrice = &prices[0] // Prices are ordered by price ASC
		response.AveragePrice = s.calculateAveragePrice(prices)
		response.PriceSpread = s.calculatePriceSpread(prices)
		response.Currency = prices[0].Currency
	}
	
	// Cache the response
	if err := s.cache.Set(cacheKey, response, s.cacheTTL); err != nil {
		log.Printf("Failed to cache price comparison: %v", err)
	}
	
	return response, nil
}

// StorePrices stores new price data from external providers
func (s *PriceService) StorePrices(prices []models.FlightPrice) error {
	for _, price := range prices {
		if price.ID == uuid.Nil {
			price.ID = uuid.New()
		}
		
		if err := s.priceRepo.CreateFlightPrice(&price); err != nil {
			log.Printf("Failed to store price from %s: %v", price.ProviderName, err)
			// Continue with other prices instead of failing completely
			continue
		}
	}
	
	return nil
}

// GetPriceHistory retrieves historical price data for a route
func (s *PriceService) GetPriceHistory(origin, destination string, days int) ([]models.PriceHistory, error) {
	routeID := fmt.Sprintf("%s-%s", origin, destination)
	
	// Try cache first
	cacheKey := s.cacheKeyBuilder.PriceHistory(routeID, fmt.Sprintf("%dd", days))
	var cachedHistory []models.PriceHistory
	if err := s.cache.Get(cacheKey, &cachedHistory); err == nil {
		return cachedHistory, nil
	}
	
	// Get from database
	history, err := s.priceRepo.GetPriceHistory(routeID, days)
	if err != nil {
		return nil, fmt.Errorf("failed to get price history: %w", err)
	}
	
	// Cache for 6 hours
	if err := s.cache.Set(cacheKey, history, 6*time.Hour); err != nil {
		log.Printf("Failed to cache price history: %v", err)
	}
	
	return history, nil
}

// GetBestPrice returns the best price for given criteria
func (s *PriceService) GetBestPrice(req *models.PriceComparisonRequest) (*models.FlightPrice, error) {
	bestPrice, err := s.priceRepo.GetBestPrice(req)
	if err != nil {
		return nil, fmt.Errorf("failed to get best price: %w", err)
	}
	
	return bestPrice, nil
}

// GetPriceStatistics returns price statistics for a route
func (s *PriceService) GetPriceStatistics(origin, destination string, startDate, endDate time.Time) (map[string]interface{}, error) {
	return s.priceRepo.GetPriceStatistics(origin, destination, startDate, endDate)
}

// GetPopularRoutes returns the most popular routes based on search volume
func (s *PriceService) GetPopularRoutes(limit int) ([]map[string]interface{}, error) {
	return s.priceRepo.GetPopularRoutes(limit)
}

// UpdatePriceHistory updates daily price history records
func (s *PriceService) UpdatePriceHistory() error {
	// This would typically be called by a scheduled job
	// Get all unique routes from recent prices
	// Calculate daily statistics and store in price_history table
	
	log.Println("Updating price history records...")
	
	// For now, this is a placeholder implementation
	// In a real system, you would:
	// 1. Get all unique routes from the last 24 hours
	// 2. Calculate daily statistics (avg, min, max, count)
	// 3. Store or update records in price_history table
	
	return nil
}

// CleanupExpiredPrices removes old price records
func (s *PriceService) CleanupExpiredPrices() error {
	rowsDeleted, err := s.priceRepo.DeleteExpiredPrices()
	if err != nil {
		return fmt.Errorf("failed to cleanup expired prices: %w", err)
	}
	
	if rowsDeleted > 0 {
		log.Printf("Cleaned up %d expired price records", rowsDeleted)
	}
	
	return nil
}

// Helper methods

func (s *PriceService) getUniqueProviders(prices []models.FlightPrice) []string {
	providerMap := make(map[string]bool)
	for _, price := range prices {
		providerMap[price.ProviderName] = true
	}
	
	providers := make([]string, 0, len(providerMap))
	for provider := range providerMap {
		providers = append(providers, provider)
	}
	
	return providers
}

func (s *PriceService) calculateAveragePrice(prices []models.FlightPrice) decimal.Decimal {
	if len(prices) == 0 {
		return decimal.Zero
	}
	
	total := decimal.Zero
	for _, price := range prices {
		total = total.Add(price.Price)
	}
	
	return total.Div(decimal.NewFromInt(int64(len(prices))))
}

func (s *PriceService) calculatePriceSpread(prices []models.FlightPrice) decimal.Decimal {
	if len(prices) < 2 {
		return decimal.Zero
	}
	
	// Prices are already sorted, so first is min, last is max
	minPrice := prices[0].Price
	maxPrice := prices[len(prices)-1].Price
	
	return maxPrice.Sub(minPrice)
}

// ValidateSearchRequest validates a price comparison request
func (s *PriceService) ValidateSearchRequest(req *models.PriceComparisonRequest) error {
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
	
	if req.MaxResults < 0 || req.MaxResults > 100 {
		return fmt.Errorf("max results must be between 0 and 100")
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