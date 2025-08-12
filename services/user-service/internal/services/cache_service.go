package services

import (
	"fmt"
	"log"
	"time"

	"spontra/user-service/internal/cache"
	"spontra/user-service/internal/models"
	"github.com/google/uuid"
)

// CacheService handles caching operations for the user service
type CacheService struct {
	redis           *cache.RedisClient
	cacheKeyBuilder *cache.CacheKeyBuilder
	
	// Cache TTL configurations
	userProfileTTL     time.Duration
	userPreferencesTTL time.Duration
	authTokenTTL       time.Duration
	refreshTokenTTL    time.Duration
	sessionTTL         time.Duration
	statsTTL           time.Duration
}

// NewCacheService creates a new cache service
func NewCacheService(redisClient *cache.RedisClient) *CacheService {
	return &CacheService{
		redis:           redisClient,
		cacheKeyBuilder: cache.NewCacheKeyBuilder("user"),
		
		// Default TTL values
		userProfileTTL:     30 * time.Minute,
		userPreferencesTTL: 1 * time.Hour,
		authTokenTTL:       15 * time.Minute,
		refreshTokenTTL:    24 * time.Hour,
		sessionTTL:         24 * time.Hour,
		statsTTL:           5 * time.Minute,
	}
}

// User Profile Caching

// CacheUserProfile stores user profile in cache
func (c *CacheService) CacheUserProfile(user *models.User) error {
	key := c.cacheKeyBuilder.UserProfile(user.ID.String())
	return c.redis.Set(key, user, c.userProfileTTL)
}

// GetCachedUserProfile retrieves user profile from cache
func (c *CacheService) GetCachedUserProfile(userID uuid.UUID) (*models.User, error) {
	key := c.cacheKeyBuilder.UserProfile(userID.String())
	var user models.User
	err := c.redis.Get(key, &user)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// InvalidateUserProfile removes user profile from cache
func (c *CacheService) InvalidateUserProfile(userID uuid.UUID) error {
	key := c.cacheKeyBuilder.UserProfile(userID.String())
	return c.redis.Delete(key)
}

// User Preferences Caching

// CacheUserPreferences stores user preferences in cache
func (c *CacheService) CacheUserPreferences(userID uuid.UUID, preferences *models.UserPreferences) error {
	key := c.cacheKeyBuilder.UserPreferences(userID.String())
	return c.redis.Set(key, preferences, c.userPreferencesTTL)
}

// GetCachedUserPreferences retrieves user preferences from cache
func (c *CacheService) GetCachedUserPreferences(userID uuid.UUID) (*models.UserPreferences, error) {
	key := c.cacheKeyBuilder.UserPreferences(userID.String())
	var preferences models.UserPreferences
	err := c.redis.Get(key, &preferences)
	if err != nil {
		return nil, err
	}
	return &preferences, nil
}

// InvalidateUserPreferences removes user preferences from cache
func (c *CacheService) InvalidateUserPreferences(userID uuid.UUID) error {
	key := c.cacheKeyBuilder.UserPreferences(userID.String())
	return c.redis.Delete(key)
}

// Authentication Token Caching

// CacheAuthToken stores authentication token data
func (c *CacheService) CacheAuthToken(token string, userID uuid.UUID) error {
	key := c.cacheKeyBuilder.AuthToken(token)
	tokenData := map[string]interface{}{
		"user_id":    userID.String(),
		"created_at": time.Now().Unix(),
	}
	return c.redis.Set(key, tokenData, c.authTokenTTL)
}

// GetCachedAuthToken retrieves authentication token data
func (c *CacheService) GetCachedAuthToken(token string) (uuid.UUID, error) {
	key := c.cacheKeyBuilder.AuthToken(token)
	var tokenData map[string]interface{}
	err := c.redis.Get(key, &tokenData)
	if err != nil {
		return uuid.Nil, err
	}
	
	userIDStr, ok := tokenData["user_id"].(string)
	if !ok {
		return uuid.Nil, fmt.Errorf("invalid token data")
	}
	
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return uuid.Nil, fmt.Errorf("invalid user ID in token: %w", err)
	}
	
	return userID, nil
}

// InvalidateAuthToken removes authentication token from cache
func (c *CacheService) InvalidateAuthToken(token string) error {
	key := c.cacheKeyBuilder.AuthToken(token)
	return c.redis.Delete(key)
}

// Refresh Token Caching

// CacheRefreshToken stores refresh token data
func (c *CacheService) CacheRefreshToken(token string, userID uuid.UUID) error {
	key := c.cacheKeyBuilder.RefreshToken(token)
	tokenData := map[string]interface{}{
		"user_id":    userID.String(),
		"created_at": time.Now().Unix(),
	}
	return c.redis.Set(key, tokenData, c.refreshTokenTTL)
}

// GetCachedRefreshToken retrieves refresh token data
func (c *CacheService) GetCachedRefreshToken(token string) (uuid.UUID, error) {
	key := c.cacheKeyBuilder.RefreshToken(token)
	var tokenData map[string]interface{}
	err := c.redis.Get(key, &tokenData)
	if err != nil {
		return uuid.Nil, err
	}
	
	userIDStr, ok := tokenData["user_id"].(string)
	if !ok {
		return uuid.Nil, fmt.Errorf("invalid refresh token data")
	}
	
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return uuid.Nil, fmt.Errorf("invalid user ID in refresh token: %w", err)
	}
	
	return userID, nil
}

// InvalidateRefreshToken removes refresh token from cache
func (c *CacheService) InvalidateRefreshToken(token string) error {
	key := c.cacheKeyBuilder.RefreshToken(token)
	return c.redis.Delete(key)
}

// Session Caching

// CacheUserSessions stores user sessions in cache
func (c *CacheService) CacheUserSessions(userID uuid.UUID, sessions []models.UserSession) error {
	key := c.cacheKeyBuilder.UserSessions(userID.String())
	return c.redis.Set(key, sessions, c.sessionTTL)
}

// GetCachedUserSessions retrieves user sessions from cache
func (c *CacheService) GetCachedUserSessions(userID uuid.UUID) ([]models.UserSession, error) {
	key := c.cacheKeyBuilder.UserSessions(userID.String())
	var sessions []models.UserSession
	err := c.redis.Get(key, &sessions)
	if err != nil {
		return nil, err
	}
	return sessions, nil
}

// InvalidateUserSessions removes user sessions from cache
func (c *CacheService) InvalidateUserSessions(userID uuid.UUID) error {
	key := c.cacheKeyBuilder.UserSessions(userID.String())
	return c.redis.Delete(key)
}

// Email-to-UserID Caching

// CacheEmailToUserID stores email to user ID mapping
func (c *CacheService) CacheEmailToUserID(email string, userID uuid.UUID) error {
	key := c.cacheKeyBuilder.UserEmail(email)
	return c.redis.Set(key, userID.String(), c.userProfileTTL)
}

// GetCachedUserIDByEmail retrieves user ID by email from cache
func (c *CacheService) GetCachedUserIDByEmail(email string) (uuid.UUID, error) {
	key := c.cacheKeyBuilder.UserEmail(email)
	var userIDStr string
	err := c.redis.Get(key, &userIDStr)
	if err != nil {
		return uuid.Nil, err
	}
	
	return uuid.Parse(userIDStr)
}

// InvalidateEmailToUserID removes email to user ID mapping from cache
func (c *CacheService) InvalidateEmailToUserID(email string) error {
	key := c.cacheKeyBuilder.UserEmail(email)
	return c.redis.Delete(key)
}

// Statistics Caching

// CacheUserStats stores user statistics in cache
func (c *CacheService) CacheUserStats(userID uuid.UUID, stats map[string]interface{}) error {
	key := c.cacheKeyBuilder.UserStats(userID.String())
	return c.redis.Set(key, stats, c.statsTTL)
}

// GetCachedUserStats retrieves user statistics from cache
func (c *CacheService) GetCachedUserStats(userID uuid.UUID) (map[string]interface{}, error) {
	key := c.cacheKeyBuilder.UserStats(userID.String())
	var stats map[string]interface{}
	err := c.redis.Get(key, &stats)
	if err != nil {
		return nil, err
	}
	return stats, nil
}

// CacheGlobalStats stores global statistics in cache
func (c *CacheService) CacheGlobalStats(stats map[string]interface{}) error {
	key := c.cacheKeyBuilder.GlobalStats()
	return c.redis.Set(key, stats, c.statsTTL)
}

// GetCachedGlobalStats retrieves global statistics from cache
func (c *CacheService) GetCachedGlobalStats() (map[string]interface{}, error) {
	key := c.cacheKeyBuilder.GlobalStats()
	var stats map[string]interface{}
	err := c.redis.Get(key, &stats)
	if err != nil {
		return nil, err
	}
	return stats, nil
}

// Rate Limiting

// CheckRateLimit checks and updates rate limit for an identifier
func (c *CacheService) CheckRateLimit(identifier string, limit int, window time.Duration) (bool, int, error) {
	key := c.cacheKeyBuilder.RateLimiter(identifier)
	
	// Get current count
	current, err := c.redis.Increment(key)
	if err != nil {
		return false, 0, fmt.Errorf("failed to increment rate limit counter: %w", err)
	}
	
	// Set expiration on first increment
	if current == 1 {
		if err := c.redis.SetExpiration(key, window); err != nil {
			log.Printf("Failed to set rate limit expiration: %v", err)
		}
	}
	
	remaining := limit - int(current)
	if remaining < 0 {
		remaining = 0
	}
	
	return current <= int64(limit), remaining, nil
}

// Session Data Caching

// CacheSessionData stores arbitrary session data
func (c *CacheService) CacheSessionData(sessionID string, data interface{}) error {
	key := c.cacheKeyBuilder.SessionData(sessionID)
	return c.redis.Set(key, data, c.sessionTTL)
}

// GetCachedSessionData retrieves session data
func (c *CacheService) GetCachedSessionData(sessionID string, dest interface{}) error {
	key := c.cacheKeyBuilder.SessionData(sessionID)
	return c.redis.Get(key, dest)
}

// InvalidateSessionData removes session data from cache
func (c *CacheService) InvalidateSessionData(sessionID string) error {
	key := c.cacheKeyBuilder.SessionData(sessionID)
	return c.redis.Delete(key)
}

// User Activity Tracking

// TrackUserActivity records user activity with timestamp
func (c *CacheService) TrackUserActivity(userID uuid.UUID, activity string) error {
	key := c.cacheKeyBuilder.UserActivity(userID.String())
	
	activityData := map[string]interface{}{
		"activity":  activity,
		"timestamp": time.Now().Unix(),
	}
	
	// Store as hash field with current timestamp as field name
	fieldName := fmt.Sprintf("%d", time.Now().Unix())
	return c.redis.HSet(key, fieldName, activityData)
}

// GetUserActivity retrieves recent user activity
func (c *CacheService) GetUserActivity(userID uuid.UUID) ([]map[string]interface{}, error) {
	key := c.cacheKeyBuilder.UserActivity(userID.String())
	
	// Get all fields from the hash
	fields, err := c.redis.GetKeys(key + ":*")
	if err != nil {
		return nil, err
	}
	
	var activities []map[string]interface{}
	for _, field := range fields {
		var activity map[string]interface{}
		if err := c.redis.HGet(key, field, &activity); err == nil {
			activities = append(activities, activity)
		}
	}
	
	return activities, nil
}

// Email Verification

// CacheEmailVerificationCode stores email verification code
func (c *CacheService) CacheEmailVerificationCode(email, code string) error {
	key := c.cacheKeyBuilder.EmailVerification(email)
	return c.redis.Set(key, code, 15*time.Minute) // 15 minute expiration
}

// GetCachedEmailVerificationCode retrieves email verification code
func (c *CacheService) GetCachedEmailVerificationCode(email string) (string, error) {
	key := c.cacheKeyBuilder.EmailVerification(email)
	var code string
	err := c.redis.Get(key, &code)
	return code, err
}

// InvalidateEmailVerificationCode removes email verification code
func (c *CacheService) InvalidateEmailVerificationCode(email string) error {
	key := c.cacheKeyBuilder.EmailVerification(email)
	return c.redis.Delete(key)
}

// Password Reset

// CachePasswordResetToken stores password reset token
func (c *CacheService) CachePasswordResetToken(token string, userID uuid.UUID) error {
	key := c.cacheKeyBuilder.PasswordReset(token)
	tokenData := map[string]interface{}{
		"user_id":    userID.String(),
		"created_at": time.Now().Unix(),
	}
	return c.redis.Set(key, tokenData, 1*time.Hour) // 1 hour expiration
}

// GetCachedPasswordResetToken retrieves password reset token data
func (c *CacheService) GetCachedPasswordResetToken(token string) (uuid.UUID, error) {
	key := c.cacheKeyBuilder.PasswordReset(token)
	var tokenData map[string]interface{}
	err := c.redis.Get(key, &tokenData)
	if err != nil {
		return uuid.Nil, err
	}
	
	userIDStr, ok := tokenData["user_id"].(string)
	if !ok {
		return uuid.Nil, fmt.Errorf("invalid password reset token data")
	}
	
	return uuid.Parse(userIDStr)
}

// InvalidatePasswordResetToken removes password reset token
func (c *CacheService) InvalidatePasswordResetToken(token string) error {
	key := c.cacheKeyBuilder.PasswordReset(token)
	return c.redis.Delete(key)
}

// Cache Management

// ClearUserCache removes all cached data for a user
func (c *CacheService) ClearUserCache(userID uuid.UUID) error {
	keys := []string{
		c.cacheKeyBuilder.UserProfile(userID.String()),
		c.cacheKeyBuilder.UserPreferences(userID.String()),
		c.cacheKeyBuilder.UserSessions(userID.String()),
		c.cacheKeyBuilder.UserStats(userID.String()),
		c.cacheKeyBuilder.UserActivity(userID.String()),
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
	userKeys, _ := c.redis.GetKeys("user:*")
	authKeys, _ := c.redis.GetKeys("auth:*")
	sessionKeys, _ := c.redis.GetKeys("session:*")
	
	serviceStats := map[string]interface{}{
		"user_cache_keys":    len(userKeys),
		"auth_cache_keys":    len(authKeys),
		"session_cache_keys": len(sessionKeys),
		"total_service_keys": len(userKeys) + len(authKeys) + len(sessionKeys),
	}
	
	// Merge with Redis stats
	for k, v := range serviceStats {
		stats[k] = v
	}
	
	return stats, nil
}

// WarmCache pre-loads frequently accessed data
func (c *CacheService) WarmCache(userID uuid.UUID, user *models.User, preferences *models.UserPreferences) {
	// Cache user profile
	if user != nil {
		if err := c.CacheUserProfile(user); err != nil {
			log.Printf("Failed to warm user profile cache: %v", err)
		}
		
		// Cache email mapping
		if err := c.CacheEmailToUserID(user.Email, userID); err != nil {
			log.Printf("Failed to warm email cache: %v", err)
		}
	}
	
	// Cache preferences
	if preferences != nil {
		if err := c.CacheUserPreferences(userID, preferences); err != nil {
			log.Printf("Failed to warm preferences cache: %v", err)
		}
	}
}