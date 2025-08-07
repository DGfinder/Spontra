package middleware

import (
	"crypto/rand"
	"encoding/hex"
	"time"

	"github.com/gin-gonic/gin"
)

// RequestIDConfig configures the request ID middleware
type RequestIDConfig struct {
	Header    string // Header name for request ID
	Generator func() string // Function to generate request IDs
}

// DefaultRequestIDConfig returns default request ID middleware configuration
func DefaultRequestIDConfig() *RequestIDConfig {
	return &RequestIDConfig{
		Header:    "X-Request-ID",
		Generator: DefaultRequestIDGenerator,
	}
}

// RequestIDMiddleware adds a unique request ID to each request
func RequestIDMiddleware(config *RequestIDConfig) gin.HandlerFunc {
	if config == nil {
		config = DefaultRequestIDConfig()
	}

	return func(c *gin.Context) {
		// Check if request ID already exists in headers
		requestID := c.GetHeader(config.Header)
		
		// Generate new request ID if not provided
		if requestID == "" {
			requestID = config.Generator()
		}

		// Set request ID in context for use by other middlewares/handlers
		c.Set("request_id", requestID)
		
		// Set response header
		c.Header(config.Header, requestID)
		
		c.Next()
	}
}

// DefaultRequestIDGenerator generates a request ID using timestamp and random bytes
func DefaultRequestIDGenerator() string {
	// Format: YYYYMMDDHHMMSS-XXXXXXXX (timestamp + 8 random hex chars)
	timestamp := time.Now().Format("20060102150405")
	
	// Generate 4 random bytes (8 hex characters)
	randomBytes := make([]byte, 4)
	rand.Read(randomBytes)
	randomHex := hex.EncodeToString(randomBytes)
	
	return timestamp + "-" + randomHex
}

// UUIDRequestIDGenerator generates a UUID-like request ID
func UUIDRequestIDGenerator() string {
	// Generate 16 random bytes
	bytes := make([]byte, 16)
	rand.Read(bytes)
	
	// Set version (4) and variant bits
	bytes[6] = (bytes[6] & 0x0f) | 0x40 // Version 4
	bytes[8] = (bytes[8] & 0x3f) | 0x80 // Variant 10
	
	// Format as UUID
	return hex.EncodeToString(bytes[0:4]) + "-" +
		   hex.EncodeToString(bytes[4:6]) + "-" +
		   hex.EncodeToString(bytes[6:8]) + "-" +
		   hex.EncodeToString(bytes[8:10]) + "-" +
		   hex.EncodeToString(bytes[10:16])
}

// ShortRequestIDGenerator generates a shorter request ID
func ShortRequestIDGenerator() string {
	// Generate 6 random bytes (12 hex characters)
	bytes := make([]byte, 6)
	rand.Read(bytes)
	return hex.EncodeToString(bytes)
}

// GetRequestID extracts the request ID from the Gin context
func GetRequestID(c *gin.Context) string {
	if requestID, exists := c.Get("request_id"); exists {
		if id, ok := requestID.(string); ok {
			return id
		}
	}
	
	// Fallback to header
	return c.GetHeader("X-Request-ID")
}