package cache

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/go-redis/redis/v8"
)

// RedisClient wraps the Redis client
type RedisClient struct {
	client *redis.Client
	ctx    context.Context
}

// NewRedisClient creates a new Redis client
func NewRedisClient(redisURL string) (*RedisClient, error) {
	opts, err := redis.ParseURL(redisURL)
	if err != nil {
		return nil, fmt.Errorf("failed to parse Redis URL: %w", err)
	}

	client := redis.NewClient(opts)
	ctx := context.Background()

	// Test the connection
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
	jsonData, err := json.Marshal(value)
	if err != nil {
		return fmt.Errorf("failed to marshal data: %w", err)
	}

	err = r.client.Set(r.ctx, key, jsonData, expiration).Err()
	if err != nil {
		return fmt.Errorf("failed to set key %s: %w", key, err)
	}

	return nil
}

// Get retrieves a value from Redis
func (r *RedisClient) Get(key string, dest interface{}) error {
	val, err := r.client.Get(r.ctx, key).Result()
	if err != nil {
		if err == redis.Nil {
			return fmt.Errorf("key %s not found", key)
		}
		return fmt.Errorf("failed to get key %s: %w", key, err)
	}

	err = json.Unmarshal([]byte(val), dest)
	if err != nil {
		return fmt.Errorf("failed to unmarshal data for key %s: %w", key, err)
	}

	return nil
}

// Delete removes a key from Redis
func (r *RedisClient) Delete(key string) error {
	err := r.client.Del(r.ctx, key).Err()
	if err != nil {
		return fmt.Errorf("failed to delete key %s: %w", key, err)
	}
	return nil
}

// Exists checks if a key exists in Redis
func (r *RedisClient) Exists(key string) (bool, error) {
	result, err := r.client.Exists(r.ctx, key).Result()
	if err != nil {
		return false, fmt.Errorf("failed to check existence of key %s: %w", key, err)
	}
	return result > 0, nil
}

// SetNX sets a key only if it doesn't exist (useful for locking)
func (r *RedisClient) SetNX(key string, value interface{}, expiration time.Duration) (bool, error) {
	jsonData, err := json.Marshal(value)
	if err != nil {
		return false, fmt.Errorf("failed to marshal data: %w", err)
	}

	result, err := r.client.SetNX(r.ctx, key, jsonData, expiration).Result()
	if err != nil {
		return false, fmt.Errorf("failed to set key %s with NX: %w", key, err)
	}

	return result, nil
}

// HSet sets a field in a hash
func (r *RedisClient) HSet(key, field string, value interface{}) error {
	jsonData, err := json.Marshal(value)
	if err != nil {
		return fmt.Errorf("failed to marshal data: %w", err)
	}

	err = r.client.HSet(r.ctx, key, field, jsonData).Err()
	if err != nil {
		return fmt.Errorf("failed to set hash field %s:%s: %w", key, field, err)
	}

	return nil
}

// HGet gets a field from a hash
func (r *RedisClient) HGet(key, field string, dest interface{}) error {
	val, err := r.client.HGet(r.ctx, key, field).Result()
	if err != nil {
		if err == redis.Nil {
			return fmt.Errorf("hash field %s:%s not found", key, field)
		}
		return fmt.Errorf("failed to get hash field %s:%s: %w", key, field, err)
	}

	err = json.Unmarshal([]byte(val), dest)
	if err != nil {
		return fmt.Errorf("failed to unmarshal data for hash field %s:%s: %w", key, field, err)
	}

	return nil
}

// HGetAll gets all fields from a hash
func (r *RedisClient) HGetAll(key string) (map[string]string, error) {
	result, err := r.client.HGetAll(r.ctx, key).Result()
	if err != nil {
		return nil, fmt.Errorf("failed to get all hash fields for %s: %w", key, err)
	}
	return result, nil
}

// ZAdd adds a member to a sorted set
func (r *RedisClient) ZAdd(key string, score float64, member interface{}) error {
	jsonData, err := json.Marshal(member)
	if err != nil {
		return fmt.Errorf("failed to marshal data: %w", err)
	}

	err = r.client.ZAdd(r.ctx, key, &redis.Z{
		Score:  score,
		Member: jsonData,
	}).Err()
	if err != nil {
		return fmt.Errorf("failed to add to sorted set %s: %w", key, err)
	}

	return nil
}

// ZRevRange gets members from a sorted set in descending order
func (r *RedisClient) ZRevRange(key string, start, stop int64) ([]string, error) {
	result, err := r.client.ZRevRange(r.ctx, key, start, stop).Result()
	if err != nil {
		return nil, fmt.Errorf("failed to get sorted set range for %s: %w", key, err)
	}
	return result, nil
}

// Expire sets expiration for a key
func (r *RedisClient) Expire(key string, expiration time.Duration) error {
	err := r.client.Expire(r.ctx, key, expiration).Err()
	if err != nil {
		return fmt.Errorf("failed to set expiration for key %s: %w", key, err)
	}
	return nil
}

// TTL gets the time to live for a key
func (r *RedisClient) TTL(key string) (time.Duration, error) {
	duration, err := r.client.TTL(r.ctx, key).Result()
	if err != nil {
		return 0, fmt.Errorf("failed to get TTL for key %s: %w", key, err)
	}
	return duration, nil
}

// Close closes the Redis connection
func (r *RedisClient) Close() error {
	return r.client.Close()
}

// HealthCheck checks if Redis is healthy
func (r *RedisClient) HealthCheck() error {
	return r.client.Ping(r.ctx).Err()
}

// FlushAll clears all keys (use with caution!)
func (r *RedisClient) FlushAll() error {
	return r.client.FlushAll(r.ctx).Err()
}

// GetStats returns Redis statistics
func (r *RedisClient) GetStats() (map[string]string, error) {
	info, err := r.client.Info(r.ctx).Result()
	if err != nil {
		return nil, fmt.Errorf("failed to get Redis info: %w", err)
	}

	stats := make(map[string]string)
	stats["info"] = info

	// Get memory usage
	memInfo, err := r.client.Info(r.ctx, "memory").Result()
	if err == nil {
		stats["memory"] = memInfo
	}

	// Get keyspace info
	keyspaceInfo, err := r.client.Info(r.ctx, "keyspace").Result()
	if err == nil {
		stats["keyspace"] = keyspaceInfo
	}

	return stats, nil
}

// CacheKeyBuilder helps build consistent cache keys
type CacheKeyBuilder struct {
	prefix string
}

// NewCacheKeyBuilder creates a new cache key builder
func NewCacheKeyBuilder(prefix string) *CacheKeyBuilder {
	return &CacheKeyBuilder{prefix: prefix}
}

// PriceComparison builds a cache key for price comparison
func (ckb *CacheKeyBuilder) PriceComparison(origin, destination, departureDate, tripType string, passengers int) string {
	return fmt.Sprintf("%s:price_comparison:%s-%s:%s:%s:%d", 
		ckb.prefix, origin, destination, departureDate, tripType, passengers)
}

// PriceHistory builds a cache key for price history
func (ckb *CacheKeyBuilder) PriceHistory(routeID string, period string) string {
	return fmt.Sprintf("%s:price_history:%s:%s", ckb.prefix, routeID, period)
}

// PriceTrends builds a cache key for price trends
func (ckb *CacheKeyBuilder) PriceTrends(routeID string) string {
	return fmt.Sprintf("%s:price_trends:%s", ckb.prefix, routeID)
}

// UserAlerts builds a cache key for user alerts
func (ckb *CacheKeyBuilder) UserAlerts(userID string) string {
	return fmt.Sprintf("%s:user_alerts:%s", ckb.prefix, userID)
}

// UserTracking builds a cache key for user tracking
func (ckb *CacheKeyBuilder) UserTracking(userID string) string {
	return fmt.Sprintf("%s:user_tracking:%s", ckb.prefix, userID)
}