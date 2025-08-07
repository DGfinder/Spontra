package cache

import (
	"context"
	"encoding/json"
	"fmt"
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

// SetExpiration sets expiration for an existing key
func (r *RedisClient) SetExpiration(key string, expiration time.Duration) error {
	return r.client.Expire(r.ctx, key, expiration).Err()
}

// GetStats returns Redis statistics
func (r *RedisClient) GetStats() (map[string]interface{}, error) {
	info, err := r.client.Info(r.ctx, "memory", "stats").Result()
	if err != nil {
		return nil, fmt.Errorf("failed to get Redis stats: %w", err)
	}

	// Get key count
	dbSize, err := r.client.DBSize(r.ctx).Result()
	if err != nil {
		return nil, fmt.Errorf("failed to get DB size: %w", err)
	}

	return map[string]interface{}{
		"info":     info,
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

// SearchResults builds a cache key for search results
func (c *CacheKeyBuilder) SearchResults(origin, destination, date string, passengers int) string {
	return fmt.Sprintf("%s:search:%s-%s:%s:pax%d", c.prefix, origin, destination, date, passengers)
}

// SearchSession builds a cache key for search sessions
func (c *CacheKeyBuilder) SearchSession(sessionID string) string {
	return fmt.Sprintf("%s:session:%s", c.prefix, sessionID)
}

// UserSearch builds a cache key for user search history
func (c *CacheKeyBuilder) UserSearch(userID string) string {
	return fmt.Sprintf("%s:user:%s:searches", c.prefix, userID)
}

// AirportSuggestions builds a cache key for airport suggestions
func (c *CacheKeyBuilder) AirportSuggestions(query string) string {
	return fmt.Sprintf("%s:airports:suggest:%s", c.prefix, query)
}

// FlightDuration builds a cache key for flight durations
func (c *CacheKeyBuilder) FlightDuration(origin, destination string) string {
	return fmt.Sprintf("%s:duration:%s-%s", c.prefix, origin, destination)
}

// RouteStats builds a cache key for route statistics
func (c *CacheKeyBuilder) RouteStats(route string) string {
	return fmt.Sprintf("%s:stats:route:%s", c.prefix, route)
}

// GlobalStats builds a cache key for global statistics
func (c *CacheKeyBuilder) GlobalStats() string {
	return fmt.Sprintf("%s:stats:global", c.prefix)
}