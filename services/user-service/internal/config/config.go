package config

import (
	"fmt"
	"os"
	"strconv"
	"time"
)

// Config holds all configuration for the user service
type Config struct {
	Port        string
	DatabaseURL string
	JWTSecret   string
	JWTExpiry   time.Duration
	Environment string
	
	// CORS settings
	AllowedOrigins []string
	
	// Rate limiting
	RateLimitRequests int
	RateLimitWindow   time.Duration
	
	// Email settings (for future email verification)
	SMTPHost     string
	SMTPPort     int
	SMTPUsername string
	SMTPPassword string
	FromEmail    string
	
	// Redis settings (for session storage)
	RedisURL string
}

// Load loads configuration from environment variables
func Load() (*Config, error) {
	config := &Config{
		Port:        getEnv("PORT", "8080"),
		DatabaseURL: getEnv("DATABASE_URL", "postgres://postgres:password@localhost/spontra_users?sslmode=disable"),
		JWTSecret:   getEnv("JWT_SECRET", "your-super-secret-jwt-key-change-this-in-production"),
		Environment: getEnv("ENVIRONMENT", "development"),
		
		// CORS
		AllowedOrigins: []string{
			getEnv("FRONTEND_URL", "http://localhost:3000"),
			"https://spontra.com",
			"https://app.spontra.com",
		},
		
		// Rate limiting
		RateLimitRequests: getEnvAsInt("RATE_LIMIT_REQUESTS", 100),
		RateLimitWindow:   time.Minute * time.Duration(getEnvAsInt("RATE_LIMIT_WINDOW_MINUTES", 1)),
		
		// Email settings
		SMTPHost:     getEnv("SMTP_HOST", "smtp.gmail.com"),
		SMTPPort:     getEnvAsInt("SMTP_PORT", 587),
		SMTPUsername: getEnv("SMTP_USERNAME", ""),
		SMTPPassword: getEnv("SMTP_PASSWORD", ""),
		FromEmail:    getEnv("FROM_EMAIL", "noreply@spontra.com"),
		
		// Redis
		RedisURL: getEnv("REDIS_URL", "redis://localhost:6379"),
	}
	
	// JWT expiry
	jwtExpiryHours := getEnvAsInt("JWT_EXPIRY_HOURS", 24)
	config.JWTExpiry = time.Hour * time.Duration(jwtExpiryHours)
	
	// Validate required config
	if config.JWTSecret == "your-super-secret-jwt-key-change-this-in-production" && config.Environment == "production" {
		return nil, fmt.Errorf("JWT_SECRET must be set in production environment")
	}
	
	return config, nil
}

// getEnv gets an environment variable or returns a fallback value
func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}

// getEnvAsInt gets an environment variable as an integer or returns a fallback value
func getEnvAsInt(key string, fallback int) int {
	if valueStr, exists := os.LookupEnv(key); exists {
		if value, err := strconv.Atoi(valueStr); err == nil {
			return value
		}
	}
	return fallback
}