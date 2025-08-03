package cache

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/go-redis/redis/v8"
)

// RedisClient wraps the Redis client with application-specific methods
type RedisClient struct {
	client *redis.Client
	ctx    context.Context
}

// NewRedisClient creates a new Redis client
func NewRedisClient(redisURL string) (*RedisClient, error) {
	opt, err := redis.ParseURL(redisURL)
	if err != nil {
		return nil, fmt.Errorf("failed to parse Redis URL: %w", err)
	}

	client := redis.NewClient(opt)
	ctx := context.Background()

	// Test connection
	if err := client.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("failed to connect to Redis: %w", err)
	}

	log.Println("Redis connection established for data ingestion service")

	return &RedisClient{
		client: client,
		ctx:    ctx,
	}, nil
}

// Set stores a value in Redis with expiration
func (r *RedisClient) Set(key string, value interface{}, expiration time.Duration) error {
	data, err := json.Marshal(value)
	if err != nil {
		return fmt.Errorf("failed to marshal value: %w", err)
	}

	return r.client.Set(r.ctx, key, data, expiration).Err()
}

// Get retrieves a value from Redis
func (r *RedisClient) Get(key string, dest interface{}) error {
	data, err := r.client.Get(r.ctx, key).Result()
	if err != nil {
		if err == redis.Nil {
			return fmt.Errorf("key not found")
		}
		return fmt.Errorf("failed to get value: %w", err)
	}

	return json.Unmarshal([]byte(data), dest)
}

// Delete removes a key from Redis
func (r *RedisClient) Delete(key string) error {
	return r.client.Del(r.ctx, key).Err()
}

// Exists checks if a key exists in Redis
func (r *RedisClient) Exists(key string) (bool, error) {
	count, err := r.client.Exists(r.ctx, key).Result()
	return count > 0, err
}

// SetWithNX sets a key only if it doesn't exist (atomic operation)
func (r *RedisClient) SetWithNX(key string, value interface{}, expiration time.Duration) (bool, error) {
	data, err := json.Marshal(value)
	if err != nil {
		return false, fmt.Errorf("failed to marshal value: %w", err)
	}

	return r.client.SetNX(r.ctx, key, data, expiration).Result()
}

// Increment increments a numeric value
func (r *RedisClient) Increment(key string) (int64, error) {
	return r.client.Incr(r.ctx, key).Result()
}

// GetStats returns Redis statistics
func (r *RedisClient) GetStats() (map[string]interface{}, error) {
	info, err := r.client.Info(r.ctx, "memory", "stats", "keyspace").Result()
	if err != nil {
		return nil, fmt.Errorf("failed to get Redis stats: %w", err)
	}

	// Get key count
	dbSize, err := r.client.DBSize(r.ctx).Result()
	if err != nil {
		return nil, fmt.Errorf("failed to get DB size: %w", err)
	}

	return map[string]interface{}{
		"info":      info,
		"key_count": dbSize,
	}, nil
}

// FlushDB clears all keys in the current database
func (r *RedisClient) FlushDB() error {
	return r.client.FlushDB(r.ctx).Err()
}

// Close closes the Redis connection
func (r *RedisClient) Close() error {
	return r.client.Close()
}

// CacheKeyBuilder provides methods to build consistent cache keys
type CacheKeyBuilder struct {
	prefix string
}

// NewCacheKeyBuilder creates a new cache key builder
func NewCacheKeyBuilder(prefix string) *CacheKeyBuilder {
	return &CacheKeyBuilder{prefix: prefix}
}

// AmadeusFlightSearch builds a cache key for Amadeus flight search results
func (c *CacheKeyBuilder) AmadeusFlightSearch(origin, destination, date string, passengers int) string {
	return fmt.Sprintf("%s:amadeus:flights:%s-%s:%s:pax%d", c.prefix, origin, destination, date, passengers)
}

// AmadeusAirportSuggestions builds a cache key for Amadeus airport suggestions
func (c *CacheKeyBuilder) AmadeusAirportSuggestions(query string) string {
	return fmt.Sprintf("%s:amadeus:airports:%s", c.prefix, query)
}

// DestinationData builds a cache key for destination data
func (c *CacheKeyBuilder) DestinationData(airportCode string) string {
	return fmt.Sprintf("%s:destination:data:%s", c.prefix, airportCode)
}

// DestinationInsights builds a cache key for destination insights
func (c *CacheKeyBuilder) DestinationInsights(airportCode string) string {
	return fmt.Sprintf("%s:destination:insights:%s", c.prefix, airportCode)
}

// SimilarDestinations builds a cache key for similar destinations
func (c *CacheKeyBuilder) SimilarDestinations(origin, destination string) string {
	return fmt.Sprintf("%s:similar:%s-%s", c.prefix, origin, destination)
}

// UGCContent builds a cache key for UGC content by location
func (c *CacheKeyBuilder) UGCContent(location string) string {
	return fmt.Sprintf("%s:ugc:location:%s", c.prefix, location)
}

// WeatherData builds a cache key for weather data
func (c *CacheKeyBuilder) WeatherData(location string) string {
	return fmt.Sprintf("%s:weather:%s", c.prefix, location)
}

// ExchangeRates builds a cache key for currency exchange rates
func (c *CacheKeyBuilder) ExchangeRates(baseCurrency string) string {
	return fmt.Sprintf("%s:rates:%s", c.prefix, baseCurrency)
}

// APIRateLimit builds a cache key for API rate limiting
func (c *CacheKeyBuilder) APIRateLimit(provider, identifier string) string {
	return fmt.Sprintf("%s:ratelimit:%s:%s", c.prefix, provider, identifier)
}

// DataFreshness builds a cache key for tracking data freshness
func (c *CacheKeyBuilder) DataFreshness(dataType string) string {
	return fmt.Sprintf("%s:freshness:%s", c.prefix, dataType)
}

// PopularDestinations builds a cache key for popular destinations
func (c *CacheKeyBuilder) PopularDestinations(origin string) string {
	return fmt.Sprintf("%s:popular:%s", c.prefix, origin)
}

// FlightPriceHistory builds a cache key for flight price history
func (c *CacheKeyBuilder) FlightPriceHistory(route string) string {
	return fmt.Sprintf("%s:price:history:%s", c.prefix, route)
}

// SeasonalData builds a cache key for seasonal travel data
func (c *CacheKeyBuilder) SeasonalData(destination string) string {
	return fmt.Sprintf("%s:seasonal:%s", c.prefix, destination)
}

// ActivityRecommendations builds a cache key for activity recommendations
func (c *CacheKeyBuilder) ActivityRecommendations(location string) string {
	return fmt.Sprintf("%s:activities:%s", c.prefix, location)
}

// HotelData builds a cache key for hotel data
func (c *CacheKeyBuilder) HotelData(location, checkIn, checkOut string) string {
	return fmt.Sprintf("%s:hotels:%s:%s-%s", c.prefix, location, checkIn, checkOut)
}

// GlobalStats builds a cache key for global statistics
func (c *CacheKeyBuilder) GlobalStats() string {
	return fmt.Sprintf("%s:stats:global", c.prefix)
}

// ProviderStats builds a cache key for provider-specific statistics
func (c *CacheKeyBuilder) ProviderStats(provider string) string {
	return fmt.Sprintf("%s:stats:provider:%s", c.prefix, provider)
}