package services

import (
	"fmt"
	"log"
	"time"

	"github.com/gin-gonic/gin"
	"spontra/data-ingestion-service/internal/cache"
	"spontra/data-ingestion-service/internal/models"
)

// CacheService handles caching operations for the data ingestion service
type CacheService struct {
	redis           *cache.RedisClient
	cacheKeyBuilder *cache.CacheKeyBuilder
	
	// Cache TTL configurations
	amadeusFlightsTTL    time.Duration
	amadeusAirportsTTL   time.Duration
	destinationDataTTL   time.Duration
	weatherDataTTL       time.Duration
	exchangeRatesTTL     time.Duration
	ugcContentTTL        time.Duration
	hotelDataTTL         time.Duration
	statsTTL             time.Duration
}

// NewCacheService creates a new cache service for data ingestion
func NewCacheService(redisClient *cache.RedisClient) *CacheService {
	return &CacheService{
		redis:           redisClient,
		cacheKeyBuilder: cache.NewCacheKeyBuilder("ingestion"),
		
		// Default TTL values optimized for travel data
		amadeusFlightsTTL:    15 * time.Minute,  // Flight data changes frequently
		amadeusAirportsTTL:   24 * time.Hour,    // Airport data is relatively static
		destinationDataTTL:   6 * time.Hour,     // Destination info changes occasionally
		weatherDataTTL:       2 * time.Hour,     // Weather updates every few hours
		exchangeRatesTTL:     1 * time.Hour,     // Exchange rates change regularly
		ugcContentTTL:        30 * time.Minute,  // UGC content should be relatively fresh
		hotelDataTTL:         4 * time.Hour,     // Hotel availability changes throughout day
		statsTTL:             5 * time.Minute,   // Stats for dashboards
	}
}

// Amadeus Flight Data Caching

// CacheAmadeusFlightSearch stores Amadeus flight search results
func (c *CacheService) CacheAmadeusFlightSearch(origin, destination, date string, passengers int, flightData interface{}) error {
	key := c.cacheKeyBuilder.AmadeusFlightSearch(origin, destination, date, passengers)
	return c.redis.Set(key, flightData, c.amadeusFlightsTTL)
}

// GetCachedAmadeusFlightSearch retrieves cached Amadeus flight search results
func (c *CacheService) GetCachedAmadeusFlightSearch(origin, destination, date string, passengers int) (interface{}, error) {
	key := c.cacheKeyBuilder.AmadeusFlightSearch(origin, destination, date, passengers)
	var flightData interface{}
	err := c.redis.Get(key, &flightData)
	return flightData, err
}

// CacheAmadeusAirportSuggestions stores Amadeus airport suggestions
func (c *CacheService) CacheAmadeusAirportSuggestions(query string, suggestions interface{}) error {
	key := c.cacheKeyBuilder.AmadeusAirportSuggestions(query)
	return c.redis.Set(key, suggestions, c.amadeusAirportsTTL)
}

// GetCachedAmadeusAirportSuggestions retrieves cached Amadeus airport suggestions
func (c *CacheService) GetCachedAmadeusAirportSuggestions(query string) (interface{}, error) {
	key := c.cacheKeyBuilder.AmadeusAirportSuggestions(query)
	var suggestions interface{}
	err := c.redis.Get(key, &suggestions)
	return suggestions, err
}

// Destination Data Caching

// CacheDestinationData stores destination information
func (c *CacheService) CacheDestinationData(airportCode string, data *models.DestinationData) error {
	key := c.cacheKeyBuilder.DestinationData(airportCode)
	return c.redis.Set(key, data, c.destinationDataTTL)
}

// GetCachedDestinationData retrieves cached destination information
func (c *CacheService) GetCachedDestinationData(airportCode string) (*models.DestinationData, error) {
	key := c.cacheKeyBuilder.DestinationData(airportCode)
	var data models.DestinationData
	err := c.redis.Get(key, &data)
	if err != nil {
		return nil, err
	}
	return &data, nil
}

// CacheDestinationInsights stores destination insights
func (c *CacheService) CacheDestinationInsights(airportCode string, insights interface{}) error {
	key := c.cacheKeyBuilder.DestinationInsights(airportCode)
	return c.redis.Set(key, insights, c.destinationDataTTL)
}

// GetCachedDestinationInsights retrieves cached destination insights
func (c *CacheService) GetCachedDestinationInsights(airportCode string) (interface{}, error) {
	key := c.cacheKeyBuilder.DestinationInsights(airportCode)
	var insights interface{}
	err := c.redis.Get(key, &insights)
	return insights, err
}

// CacheSimilarDestinations stores similar destinations data
func (c *CacheService) CacheSimilarDestinations(origin, destination string, similarDests interface{}) error {
	key := c.cacheKeyBuilder.SimilarDestinations(origin, destination)
	return c.redis.Set(key, similarDests, c.destinationDataTTL)
}

// GetCachedSimilarDestinations retrieves cached similar destinations
func (c *CacheService) GetCachedSimilarDestinations(origin, destination string) (interface{}, error) {
	key := c.cacheKeyBuilder.SimilarDestinations(origin, destination)
	var similarDests interface{}
	err := c.redis.Get(key, &similarDests)
	return similarDests, err
}

// UGC Content Caching

// CacheUGCContent stores user-generated content for a location
func (c *CacheService) CacheUGCContent(location string, content interface{}) error {
	key := c.cacheKeyBuilder.UGCContent(location)
	return c.redis.Set(key, content, c.ugcContentTTL)
}

// GetCachedUGCContent retrieves cached UGC content
func (c *CacheService) GetCachedUGCContent(location string) (interface{}, error) {
	key := c.cacheKeyBuilder.UGCContent(location)
	var content interface{}
	err := c.redis.Get(key, &content)
	return content, err
}

// InvalidateUGCContent removes UGC content from cache (when new content is added)
func (c *CacheService) InvalidateUGCContent(location string) error {
	key := c.cacheKeyBuilder.UGCContent(location)
	return c.redis.Delete(key)
}

// Weather Data Caching

// CacheWeatherData stores weather information
func (c *CacheService) CacheWeatherData(location string, weather interface{}) error {
	key := c.cacheKeyBuilder.WeatherData(location)
	return c.redis.Set(key, weather, c.weatherDataTTL)
}

// GetCachedWeatherData retrieves cached weather information
func (c *CacheService) GetCachedWeatherData(location string) (interface{}, error) {
	key := c.cacheKeyBuilder.WeatherData(location)
	var weather interface{}
	err := c.redis.Get(key, &weather)
	return weather, err
}

// Exchange Rates Caching

// CacheExchangeRates stores currency exchange rates
func (c *CacheService) CacheExchangeRates(baseCurrency string, rates map[string]float64) error {
	key := c.cacheKeyBuilder.ExchangeRates(baseCurrency)
	return c.redis.Set(key, rates, c.exchangeRatesTTL)
}

// GetCachedExchangeRates retrieves cached exchange rates
func (c *CacheService) GetCachedExchangeRates(baseCurrency string) (map[string]float64, error) {
	key := c.cacheKeyBuilder.ExchangeRates(baseCurrency)
	var rates map[string]float64
	err := c.redis.Get(key, &rates)
	return rates, err
}

// Hotel Data Caching

// CacheHotelData stores hotel search results
func (c *CacheService) CacheHotelData(location, checkIn, checkOut string, hotels interface{}) error {
	key := c.cacheKeyBuilder.HotelData(location, checkIn, checkOut)
	return c.redis.Set(key, hotels, c.hotelDataTTL)
}

// GetCachedHotelData retrieves cached hotel data
func (c *CacheService) GetCachedHotelData(location, checkIn, checkOut string) (interface{}, error) {
	key := c.cacheKeyBuilder.HotelData(location, checkIn, checkOut)
	var hotels interface{}
	err := c.redis.Get(key, &hotels)
	return hotels, err
}

// Popular Destinations Caching

// CachePopularDestinations stores popular destinations from an origin
func (c *CacheService) CachePopularDestinations(origin string, destinations interface{}) error {
	key := c.cacheKeyBuilder.PopularDestinations(origin)
	return c.redis.Set(key, destinations, c.destinationDataTTL)
}

// GetCachedPopularDestinations retrieves cached popular destinations
func (c *CacheService) GetCachedPopularDestinations(origin string) (interface{}, error) {
	key := c.cacheKeyBuilder.PopularDestinations(origin)
	var destinations interface{}
	err := c.redis.Get(key, &destinations)
	return destinations, err
}

// Price History Caching

// CacheFlightPriceHistory stores flight price history
func (c *CacheService) CacheFlightPriceHistory(route string, history interface{}) error {
	key := c.cacheKeyBuilder.FlightPriceHistory(route)
	return c.redis.Set(key, history, c.destinationDataTTL)
}

// GetCachedFlightPriceHistory retrieves cached flight price history
func (c *CacheService) GetCachedFlightPriceHistory(route string) (interface{}, error) {
	key := c.cacheKeyBuilder.FlightPriceHistory(route)
	var history interface{}
	err := c.redis.Get(key, &history)
	return history, err
}

// Seasonal Data Caching

// CacheSeasonalData stores seasonal travel information
func (c *CacheService) CacheSeasonalData(destination string, seasonalData interface{}) error {
	key := c.cacheKeyBuilder.SeasonalData(destination)
	return c.redis.Set(key, seasonalData, 24*time.Hour) // Seasonal data changes daily
}

// GetCachedSeasonalData retrieves cached seasonal data
func (c *CacheService) GetCachedSeasonalData(destination string) (interface{}, error) {
	key := c.cacheKeyBuilder.SeasonalData(destination)
	var seasonalData interface{}
	err := c.redis.Get(key, &seasonalData)
	return seasonalData, err
}

// Activity Recommendations Caching

// CacheActivityRecommendations stores activity recommendations
func (c *CacheService) CacheActivityRecommendations(location string, activities interface{}) error {
	key := c.cacheKeyBuilder.ActivityRecommendations(location)
	return c.redis.Set(key, activities, c.destinationDataTTL)
}

// GetCachedActivityRecommendations retrieves cached activity recommendations
func (c *CacheService) GetCachedActivityRecommendations(location string) (interface{}, error) {
	key := c.cacheKeyBuilder.ActivityRecommendations(location)
	var activities interface{}
	err := c.redis.Get(key, &activities)
	return activities, err
}

// Rate Limiting

// CheckAPIRateLimit checks and updates rate limit for external API calls
func (c *CacheService) CheckAPIRateLimit(provider, identifier string, limit int, window time.Duration) (bool, int, error) {
	key := c.cacheKeyBuilder.APIRateLimit(provider, identifier)
	
	// Get current count
	current, err := c.redis.Increment(key)
	if err != nil {
		return false, 0, fmt.Errorf("failed to increment rate limit counter: %w", err)
	}
	
	// Set expiration on first increment
	if current == 1 {
		if err := c.redis.SetExpiration(key, window); err != nil {
			log.Printf("Failed to set API rate limit expiration: %v", err)
		}
	}
	
	remaining := limit - int(current)
	if remaining < 0 {
		remaining = 0
	}
	
	return current <= int64(limit), remaining, nil
}

// Data Freshness Tracking

// SetDataFreshness marks when data was last updated
func (c *CacheService) SetDataFreshness(dataType string) error {
	key := c.cacheKeyBuilder.DataFreshness(dataType)
	return c.redis.Set(key, time.Now().Unix(), 24*time.Hour)
}

// GetDataFreshness retrieves when data was last updated
func (c *CacheService) GetDataFreshness(dataType string) (time.Time, error) {
	key := c.cacheKeyBuilder.DataFreshness(dataType)
	var timestamp int64
	err := c.redis.Get(key, &timestamp)
	if err != nil {
		return time.Time{}, err
	}
	return time.Unix(timestamp, 0), nil
}

// IsDataStale checks if data is older than the specified duration
func (c *CacheService) IsDataStale(dataType string, maxAge time.Duration) (bool, error) {
	lastUpdate, err := c.GetDataFreshness(dataType)
	if err != nil {
		return true, err // If we can't determine freshness, assume stale
	}
	return time.Since(lastUpdate) > maxAge, nil
}

// Statistics Caching

// CacheGlobalStats stores global statistics
func (c *CacheService) CacheGlobalStats(stats map[string]interface{}) error {
	key := c.cacheKeyBuilder.GlobalStats()
	return c.redis.Set(key, stats, c.statsTTL)
}

// GetCachedGlobalStats retrieves cached global statistics
func (c *CacheService) GetCachedGlobalStats() (map[string]interface{}, error) {
	key := c.cacheKeyBuilder.GlobalStats()
	var stats map[string]interface{}
	err := c.redis.Get(key, &stats)
	return stats, err
}

// CacheProviderStats stores provider-specific statistics
func (c *CacheService) CacheProviderStats(provider string, stats map[string]interface{}) error {
	key := c.cacheKeyBuilder.ProviderStats(provider)
	return c.redis.Set(key, stats, c.statsTTL)
}

// GetCachedProviderStats retrieves cached provider statistics
func (c *CacheService) GetCachedProviderStats(provider string) (map[string]interface{}, error) {
	key := c.cacheKeyBuilder.ProviderStats(provider)
	var stats map[string]interface{}
	err := c.redis.Get(key, &stats)
	return stats, err
}

// Cache Management

// InvalidateDestinationCache removes all cached data for a destination
func (c *CacheService) InvalidateDestinationCache(airportCode string) error {
	keys := []string{
		c.cacheKeyBuilder.DestinationData(airportCode),
		c.cacheKeyBuilder.DestinationInsights(airportCode),
		c.cacheKeyBuilder.WeatherData(airportCode),
		c.cacheKeyBuilder.SeasonalData(airportCode),
		c.cacheKeyBuilder.ActivityRecommendations(airportCode),
		c.cacheKeyBuilder.UGCContent(airportCode),
	}
	
	for _, key := range keys {
		if err := c.redis.Delete(key); err != nil {
			log.Printf("Failed to delete cache key %s: %v", key, err)
		}
	}
	
	return nil
}

// GetCacheStats returns cache usage statistics
func (c *CacheService) GetCacheStats() (map[string]interface{}, error) {
	stats, err := c.redis.GetStats()
	if err != nil {
		return nil, err
	}
	
	// Add service-specific cache information
	amadeusKeys, _ := c.redis.GetKeys("ingestion:amadeus:*")
	destinationKeys, _ := c.redis.GetKeys("ingestion:destination:*")
	weatherKeys, _ := c.redis.GetKeys("ingestion:weather:*")
	ugcKeys, _ := c.redis.GetKeys("ingestion:ugc:*")
	
	serviceStats := map[string]interface{}{
		"amadeus_cache_keys":     len(amadeusKeys),
		"destination_cache_keys": len(destinationKeys),
		"weather_cache_keys":     len(weatherKeys),
		"ugc_cache_keys":         len(ugcKeys),
		"total_service_keys":     len(amadeusKeys) + len(destinationKeys) + len(weatherKeys) + len(ugcKeys),
	}
	
	// Merge with Redis stats
	for k, v := range serviceStats {
		stats[k] = v
	}
	
	return stats, nil
}

// Cache Middleware for Gin

// CacheMiddleware creates a middleware for caching HTTP responses
func (c *CacheService) CacheMiddleware(duration time.Duration) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		// Only cache GET requests
		if ctx.Request.Method != "GET" {
			ctx.Next()
			return
		}
		
		// Build cache key from request path and query
		cacheKey := fmt.Sprintf("http_cache:%s?%s", ctx.Request.URL.Path, ctx.Request.URL.RawQuery)
		
		// Try to get cached response
		var cachedResponse map[string]interface{}
		if err := c.redis.Get(cacheKey, &cachedResponse); err == nil {
			// Return cached response
			if data, ok := cachedResponse["data"]; ok {
				if statusCode, ok := cachedResponse["status_code"].(float64); ok {
					ctx.JSON(int(statusCode), data)
					ctx.Header("X-Cache", "HIT")
					ctx.Abort()
					return
				}
			}
		}
		
		// Capture response
		writer := &responseWriter{ResponseWriter: ctx.Writer, ctx: ctx}
		ctx.Writer = writer
		
		ctx.Next()
		
		// Cache successful responses
		if writer.statusCode >= 200 && writer.statusCode < 300 && len(writer.body) > 0 {
			response := map[string]interface{}{
				"data":        writer.body,
				"status_code": writer.statusCode,
			}
			
			if err := c.redis.Set(cacheKey, response, duration); err != nil {
				log.Printf("Failed to cache response: %v", err)
			}
		}
		
		ctx.Header("X-Cache", "MISS")
	}
}

// responseWriter captures response data for caching
type responseWriter struct {
	gin.ResponseWriter
	ctx        *gin.Context
	body       interface{}
	statusCode int
}

func (w *responseWriter) WriteHeader(statusCode int) {
	w.statusCode = statusCode
	w.ResponseWriter.WriteHeader(statusCode)
}

func (w *responseWriter) Write(data []byte) (int, error) {
	// Try to unmarshal JSON response
	if err := json.Unmarshal(data, &w.body); err != nil {
		w.body = string(data)
	}
	return w.ResponseWriter.Write(data)
}

// WarmCache pre-loads frequently accessed data
func (c *CacheService) WarmCache() {
	log.Println("Starting cache warming for data ingestion service...")
	
	// Pre-load popular destinations (this would be implemented based on analytics)
	popularOrigins := []string{"LHR", "CDG", "FRA", "AMS", "MAD", "FCO", "BCN"}
	
	for _, origin := range popularOrigins {
		// This would typically call the actual data fetching methods
		// and populate the cache proactively
		log.Printf("Warming cache for origin: %s", origin)
	}
	
	log.Println("Cache warming completed")
}