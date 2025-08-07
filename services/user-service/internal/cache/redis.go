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

	log.Println("Redis connection established")

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

// IncrementBy increments a numeric value by a specific amount
func (r *RedisClient) IncrementBy(key string, value int64) (int64, error) {
	return r.client.IncrBy(r.ctx, key, value).Result()
}

// SetExpiration sets expiration for an existing key
func (r *RedisClient) SetExpiration(key string, expiration time.Duration) error {
	return r.client.Expire(r.ctx, key, expiration).Err()
}

// HSet sets a field in a hash
func (r *RedisClient) HSet(key, field string, value interface{}) error {
	data, err := json.Marshal(value)
	if err != nil {
		return fmt.Errorf("failed to marshal value: %w", err)
	}

	return r.client.HSet(r.ctx, key, field, data).Err()
}

// HGet gets a field from a hash
func (r *RedisClient) HGet(key, field string, dest interface{}) error {
	data, err := r.client.HGet(r.ctx, key, field).Result()
	if err != nil {
		if err == redis.Nil {
			return fmt.Errorf("field not found")
		}
		return fmt.Errorf("failed to get hash field: %w", err)
	}

	return json.Unmarshal([]byte(data), dest)
}

// HDelete deletes fields from a hash
func (r *RedisClient) HDelete(key string, fields ...string) error {
	return r.client.HDel(r.ctx, key, fields...).Err()
}

// GetKeys returns keys matching a pattern
func (r *RedisClient) GetKeys(pattern string) ([]string, error) {
	return r.client.Keys(r.ctx, pattern).Result()
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

// UserProfile builds a cache key for user profiles
func (c *CacheKeyBuilder) UserProfile(userID string) string {
	return fmt.Sprintf("%s:user:profile:%s", c.prefix, userID)
}

// UserPreferences builds a cache key for user preferences
func (c *CacheKeyBuilder) UserPreferences(userID string) string {
	return fmt.Sprintf("%s:user:preferences:%s", c.prefix, userID)
}

// UserSessions builds a cache key for user sessions
func (c *CacheKeyBuilder) UserSessions(userID string) string {
	return fmt.Sprintf("%s:user:sessions:%s", c.prefix, userID)
}

// AuthToken builds a cache key for authentication tokens
func (c *CacheKeyBuilder) AuthToken(token string) string {
	return fmt.Sprintf("%s:auth:token:%s", c.prefix, token)
}

// RefreshToken builds a cache key for refresh tokens
func (c *CacheKeyBuilder) RefreshToken(token string) string {
	return fmt.Sprintf("%s:auth:refresh:%s", c.prefix, token)
}

// UserEmail builds a cache key for email lookups
func (c *CacheKeyBuilder) UserEmail(email string) string {
	return fmt.Sprintf("%s:user:email:%s", c.prefix, email)
}

// UserStats builds a cache key for user statistics
func (c *CacheKeyBuilder) UserStats(userID string) string {
	return fmt.Sprintf("%s:user:stats:%s", c.prefix, userID)
}

// GlobalStats builds a cache key for global statistics
func (c *CacheKeyBuilder) GlobalStats() string {
	return fmt.Sprintf("%s:stats:global", c.prefix)
}

// RateLimiter builds a cache key for rate limiting
func (c *CacheKeyBuilder) RateLimiter(identifier string) string {
	return fmt.Sprintf("%s:ratelimit:%s", c.prefix, identifier)
}

// SessionData builds a cache key for session data
func (c *CacheKeyBuilder) SessionData(sessionID string) string {
	return fmt.Sprintf("%s:session:data:%s", c.prefix, sessionID)
}

// UserActivity builds a cache key for user activity tracking
func (c *CacheKeyBuilder) UserActivity(userID string) string {
	return fmt.Sprintf("%s:user:activity:%s", c.prefix, userID)
}

// EmailVerification builds a cache key for email verification codes
func (c *CacheKeyBuilder) EmailVerification(email string) string {
	return fmt.Sprintf("%s:verify:email:%s", c.prefix, email)
}

// PasswordReset builds a cache key for password reset tokens
func (c *CacheKeyBuilder) PasswordReset(token string) string {
	return fmt.Sprintf("%s:reset:password:%s", c.prefix, token)
}