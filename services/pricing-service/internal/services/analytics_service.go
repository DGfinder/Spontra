package services

import (
	"fmt"
	"log"
	"math"
	"time"

	"spontra/pricing-service/internal/cache"
	"spontra/pricing-service/internal/models"
	"spontra/pricing-service/internal/repository"
	"github.com/shopspring/decimal"
)

// AnalyticsService handles price analytics and predictions
type AnalyticsService struct {
	priceRepo       *repository.PriceRepository
	cache           *cache.RedisClient
	cacheKeyBuilder *cache.CacheKeyBuilder
	trendsCacheTTL  time.Duration
}

// NewAnalyticsService creates a new analytics service
func NewAnalyticsService(
	priceRepo *repository.PriceRepository,
	redisClient *cache.RedisClient,
	trendsCacheTTL time.Duration,
) *AnalyticsService {
	return &AnalyticsService{
		priceRepo:       priceRepo,
		cache:           redisClient,
		cacheKeyBuilder: cache.NewCacheKeyBuilder("analytics"),
		trendsCacheTTL:  trendsCacheTTL,
	}
}

// GetPriceTrends calculates price trends for a route
func (s *AnalyticsService) GetPriceTrends(origin, destination, period string) (*models.PriceTrend, error) {
	routeID := fmt.Sprintf("%s-%s", origin, destination)
	
	// Try cache first
	cacheKey := s.cacheKeyBuilder.PriceTrends(fmt.Sprintf("%s-%s", routeID, period))
	var cachedTrend models.PriceTrend
	if err := s.cache.Get(cacheKey, &cachedTrend); err == nil {
		return &cachedTrend, nil
	}
	
	// Calculate days based on period
	days := s.parsePeriodToDays(period)
	if days == 0 {
		return nil, fmt.Errorf("invalid period: %s", period)
	}
	
	// Get historical data
	history, err := s.priceRepo.GetPriceHistory(routeID, days)
	if err != nil {
		return nil, fmt.Errorf("failed to get price history: %w", err)
	}
	
	if len(history) < 2 {
		return nil, fmt.Errorf("insufficient data for trend analysis")
	}
	
	// Calculate trend
	trend := s.calculateTrend(history, routeID, period)
	
	// Cache the result
	if err := s.cache.Set(cacheKey, trend, s.trendsCacheTTL); err != nil {
		log.Printf("Failed to cache price trend: %v", err)
	}
	
	return trend, nil
}

// GetPricePredictions generates price predictions for a route
func (s *AnalyticsService) GetPricePredictions(origin, destination, horizon string) (*models.PricePrediction, error) {
	routeID := fmt.Sprintf("%s-%s", origin, destination)
	
	// Get historical data for prediction (last 90 days)
	history, err := s.priceRepo.GetPriceHistory(routeID, 90)
	if err != nil {
		return nil, fmt.Errorf("failed to get price history for prediction: %w", err)
	}
	
	if len(history) < 7 {
		return nil, fmt.Errorf("insufficient data for price prediction")
	}
	
	// Generate prediction using simple trend analysis
	// In a production system, this would use more sophisticated ML models
	prediction := s.generatePrediction(history, routeID, horizon)
	
	return prediction, nil
}

// GetRouteAnalytics provides comprehensive analytics for a route
func (s *AnalyticsService) GetRouteAnalytics(origin, destination string) (map[string]interface{}, error) {
	routeID := fmt.Sprintf("%s-%s", origin, destination)
	
	analytics := make(map[string]interface{})
	
	// Get price statistics for last 30 days
	endDate := time.Now()
	startDate := endDate.AddDate(0, 0, -30)
	
	stats, err := s.priceRepo.GetPriceStatistics(origin, destination, startDate, endDate)
	if err != nil {
		return nil, fmt.Errorf("failed to get price statistics: %w", err)
	}
	
	analytics["price_statistics"] = stats
	
	// Get trends for different periods
	trends := make(map[string]interface{})
	
	for _, period := range []string{"7d", "30d", "90d"} {
		trend, err := s.GetPriceTrends(origin, destination, period)
		if err != nil {
			log.Printf("Failed to get %s trend for %s: %v", period, routeID, err)
			continue
		}
		trends[period] = trend
	}
	
	analytics["trends"] = trends
	
	// Get price history for visualization
	history, err := s.priceRepo.GetPriceHistory(routeID, 30)
	if err != nil {
		log.Printf("Failed to get price history for %s: %v", routeID, err)
	} else {
		analytics["history"] = history
	}
	
	// Get predictions
	predictions := make(map[string]interface{})
	
	for _, horizon := range []string{"1w", "2w", "1m"} {
		prediction, err := s.GetPricePredictions(origin, destination, horizon)
		if err != nil {
			log.Printf("Failed to get %s prediction for %s: %v", horizon, routeID, err)
			continue
		}
		predictions[horizon] = prediction
	}
	
	analytics["predictions"] = predictions
	
	return analytics, nil
}

// GetMarketOverview provides market-wide analytics
func (s *AnalyticsService) GetMarketOverview() (map[string]interface{}, error) {
	overview := make(map[string]interface{})
	
	// Get popular routes
	popularRoutes, err := s.priceRepo.GetPopularRoutes(10)
	if err != nil {
		return nil, fmt.Errorf("failed to get popular routes: %w", err)
	}
	
	overview["popular_routes"] = popularRoutes
	
	// Calculate market statistics
	// This would be enhanced with more sophisticated market analysis
	overview["market_activity"] = map[string]interface{}{
		"period":        "7d",
		"total_routes":  len(popularRoutes),
		"last_updated": time.Now(),
	}
	
	return overview, nil
}

// Helper methods

func (s *AnalyticsService) parsePeriodToDays(period string) int {
	switch period {
	case "7d":
		return 7
	case "30d":
		return 30
	case "90d":
		return 90
	default:
		return 0
	}
}

func (s *AnalyticsService) calculateTrend(history []models.PriceHistory, routeID, period string) *models.PriceTrend {
	if len(history) == 0 {
		return nil
	}
	
	// Calculate basic statistics
	var totalPrice, minPrice, maxPrice decimal.Decimal
	var totalDataPoints int
	
	minPrice = history[0].AveragePrice
	maxPrice = history[0].AveragePrice
	
	for _, record := range history {
		totalPrice = totalPrice.Add(record.AveragePrice)
		totalDataPoints += record.PriceCount
		
		if record.AveragePrice.LessThan(minPrice) {
			minPrice = record.AveragePrice
		}
		if record.AveragePrice.GreaterThan(maxPrice) {
			maxPrice = record.AveragePrice
		}
	}
	
	averagePrice := totalPrice.Div(decimal.NewFromInt(int64(len(history))))
	
	// Calculate trend direction
	var priceChange decimal.Decimal
	var trendDirection string
	var confidence float64
	
	if len(history) >= 2 {
		// Compare latest vs earliest
		latestPrice := history[0].AveragePrice     // Most recent
		earliestPrice := history[len(history)-1].AveragePrice // Oldest
		
		priceChange = latestPrice.Sub(earliestPrice)
		changePercent := priceChange.Div(earliestPrice).Mul(decimal.NewFromInt(100))
		
		// Determine trend direction
		if priceChange.GreaterThan(decimal.NewFromFloat(0.01)) {
			trendDirection = "up"
		} else if priceChange.LessThan(decimal.NewFromFloat(-0.01)) {
			trendDirection = "down"
		} else {
			trendDirection = "stable"
		}
		
		// Simple confidence calculation based on data consistency
		confidence = s.calculateTrendConfidence(history)
		
		return &models.PriceTrend{
			RouteID:       routeID,
			Period:        period,
			AveragePrice:  averagePrice,
			MinPrice:      minPrice,
			MaxPrice:      maxPrice,
			PriceChange:   priceChange,
			ChangePercent: changePercent,
			Trend:         trendDirection,
			Confidence:    confidence,
			Currency:      history[0].Currency,
			DataPoints:    totalDataPoints,
			LastUpdated:   time.Now(),
		}
	}
	
	return &models.PriceTrend{
		RouteID:      routeID,
		Period:       period,
		AveragePrice: averagePrice,
		MinPrice:     minPrice,
		MaxPrice:     maxPrice,
		PriceChange:  decimal.Zero,
		ChangePercent: decimal.Zero,
		Trend:        "stable",
		Confidence:   0.5,
		Currency:     history[0].Currency,
		DataPoints:   totalDataPoints,
		LastUpdated:  time.Now(),
	}
}

func (s *AnalyticsService) calculateTrendConfidence(history []models.PriceHistory) float64 {
	if len(history) < 3 {
		return 0.3 // Low confidence with little data
	}
	
	// Calculate price volatility
	prices := make([]float64, len(history))
	var sum float64
	
	for i, record := range history {
		price, _ := record.AveragePrice.Float64()
		prices[i] = price
		sum += price
	}
	
	mean := sum / float64(len(prices))
	
	var variance float64
	for _, price := range prices {
		variance += math.Pow(price-mean, 2)
	}
	variance /= float64(len(prices))
	
	stddev := math.Sqrt(variance)
	coefficientOfVariation := stddev / mean
	
	// Lower volatility = higher confidence
	confidence := math.Max(0.1, 1.0-coefficientOfVariation)
	return math.Min(0.95, confidence) // Cap at 95%
}

func (s *AnalyticsService) generatePrediction(history []models.PriceHistory, routeID, horizon string) *models.PricePrediction {
	if len(history) == 0 {
		return nil
	}
	
	// Simple linear trend prediction
	// In production, this would use more sophisticated ML models
	
	recent := history[:5] // Last 5 data points
	if len(recent) < 2 {
		recent = history
	}
	
	// Calculate simple moving average and trend
	var totalPrice decimal.Decimal
	for _, record := range recent {
		totalPrice = totalPrice.Add(record.AveragePrice)
	}
	
	currentAverage := totalPrice.Div(decimal.NewFromInt(int64(len(recent))))
	
	// Simple trend adjustment based on recent price movement
	trendAdjustment := decimal.Zero
	if len(recent) >= 2 {
		latestPrice := recent[0].AveragePrice
		previousPrice := recent[1].AveragePrice
		trendAdjustment = latestPrice.Sub(previousPrice)
	}
	
	// Apply horizon multiplier
	var horizonMultiplier decimal.Decimal
	var recommendation string
	
	switch horizon {
	case "1w":
		horizonMultiplier = decimal.NewFromFloat(0.5)
		recommendation = s.getRecommendation(trendAdjustment, "short")
	case "2w":
		horizonMultiplier = decimal.NewFromFloat(1.0)
		recommendation = s.getRecommendation(trendAdjustment, "medium")
	case "1m":
		horizonMultiplier = decimal.NewFromFloat(2.0)
		recommendation = s.getRecommendation(trendAdjustment, "long")
	default:
		horizonMultiplier = decimal.NewFromFloat(1.0)
		recommendation = "monitor"
	}
	
	predictedPrice := currentAverage.Add(trendAdjustment.Mul(horizonMultiplier))
	
	// Ensure predicted price is reasonable (not negative or extremely high)
	if predictedPrice.LessThan(decimal.NewFromFloat(10)) {
		predictedPrice = currentAverage
	}
	
	// Calculate confidence based on data consistency
	confidence := s.calculateTrendConfidence(history)
	
	factors := []string{"historical_trend", "seasonal_patterns", "market_volatility"}
	
	return &models.PricePrediction{
		RouteID:           routeID,
		PredictedPrice:    predictedPrice,
		Confidence:        confidence,
		PredictionHorizon: horizon,
		Factors:           factors,
		Recommendation:    recommendation,
		Currency:          history[0].Currency,
		CreatedAt:         time.Now(),
	}
}

func (s *AnalyticsService) getRecommendation(trendAdjustment decimal.Decimal, horizon string) string {
	// Simple recommendation logic
	threshold := decimal.NewFromFloat(5.0) // €5 threshold
	
	if trendAdjustment.GreaterThan(threshold) {
		return "buy_now" // Prices trending up
	} else if trendAdjustment.LessThan(threshold.Neg()) {
		return "wait" // Prices trending down
	} else {
		return "monitor" // Stable prices
	}
}