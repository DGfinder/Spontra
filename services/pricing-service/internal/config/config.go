package config

import (
	"fmt"
	"os"
	"strconv"
	"time"
)

// Config holds all configuration for the pricing service
type Config struct {
	Port        string
	DatabaseURL string
	RedisURL    string
	Environment string
	
	// External API keys
	AmadeusAPIKey    string
	SkyscannerAPIKey string
	KayakAPIKey      string
	
	// Service endpoints
	DataIngestionServiceURL string
	UserServiceURL          string
	
	// Caching configuration
	CacheTTL              time.Duration
	PriceComparisonTTL    time.Duration
	TrendsCacheTTL        time.Duration
	
	// Price tracking configuration
	TrackingInterval      time.Duration
	MaxTrackingPerUser    int
	MaxAlertsPerUser      int
	
	// Analytics configuration
	TrendCalculationInterval time.Duration
	PredictionModelEnabled   bool
	
	// Rate limiting
	RateLimitRequests int
	RateLimitWindow   time.Duration
	
	// Monitoring
	MetricsEnabled bool
	LogLevel       string
	
	// Email notifications (for price alerts)
	SMTPHost     string
	SMTPPort     int
	SMTPUsername string
	SMTPPassword string
	FromEmail    string
}

// Load loads configuration from environment variables
func Load() (*Config, error) {
	config := &Config{
		Port:        getEnv("PORT", "8082"),
		DatabaseURL: getEnv("DATABASE_URL", "postgres://postgres:password@localhost/spontra_pricing?sslmode=disable"),
		RedisURL:    getEnv("REDIS_URL", "redis://localhost:6379"),
		Environment: getEnv("ENVIRONMENT", "development"),
		
		// External APIs
		AmadeusAPIKey:    getEnv("AMADEUS_API_KEY", ""),
		SkyscannerAPIKey: getEnv("SKYSCANNER_API_KEY", ""),
		KayakAPIKey:      getEnv("KAYAK_API_KEY", ""),
		
		// Service endpoints
		DataIngestionServiceURL: getEnv("DATA_INGESTION_SERVICE_URL", "http://localhost:8083"),
		UserServiceURL:          getEnv("USER_SERVICE_URL", "http://localhost:8080"),
		
		// Caching
		CacheTTL:           time.Minute * time.Duration(getEnvAsInt("CACHE_TTL_MINUTES", 15)),
		PriceComparisonTTL: time.Minute * time.Duration(getEnvAsInt("PRICE_COMPARISON_TTL_MINUTES", 30)),
		TrendsCacheTTL:     time.Hour * time.Duration(getEnvAsInt("TRENDS_CACHE_TTL_HOURS", 6)),
		
		// Price tracking
		TrackingInterval:   time.Hour * time.Duration(getEnvAsInt("TRACKING_INTERVAL_HOURS", 4)),
		MaxTrackingPerUser: getEnvAsInt("MAX_TRACKING_PER_USER", 10),
		MaxAlertsPerUser:   getEnvAsInt("MAX_ALERTS_PER_USER", 5),
		
		// Analytics
		TrendCalculationInterval: time.Hour * time.Duration(getEnvAsInt("TREND_CALCULATION_INTERVAL_HOURS", 12)),
		PredictionModelEnabled:   getEnvAsBool("PREDICTION_MODEL_ENABLED", false),
		
		// Rate limiting
		RateLimitRequests: getEnvAsInt("RATE_LIMIT_REQUESTS", 200),
		RateLimitWindow:   time.Minute * time.Duration(getEnvAsInt("RATE_LIMIT_WINDOW_MINUTES", 1)),
		
		// Monitoring
		MetricsEnabled: getEnvAsBool("METRICS_ENABLED", true),
		LogLevel:       getEnv("LOG_LEVEL", "info"),
		
		// Email
		SMTPHost:     getEnv("SMTP_HOST", "smtp.gmail.com"),
		SMTPPort:     getEnvAsInt("SMTP_PORT", 587),
		SMTPUsername: getEnv("SMTP_USERNAME", ""),
		SMTPPassword: getEnv("SMTP_PASSWORD", ""),
		FromEmail:    getEnv("FROM_EMAIL", "noreply@spontra.com"),
	}
	
	// Validate required configuration
	if config.Environment == "production" {
		if config.AmadeusAPIKey == "" {
			return nil, fmt.Errorf("AMADEUS_API_KEY is required in production")
		}
		if config.SMTPUsername == "" || config.SMTPPassword == "" {
			return nil, fmt.Errorf("SMTP credentials are required in production for price alerts")
		}
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

// getEnvAsBool gets an environment variable as a boolean or returns a fallback value
func getEnvAsBool(key string, fallback bool) bool {
	if valueStr, exists := os.LookupEnv(key); exists {
		if value, err := strconv.ParseBool(valueStr); err == nil {
			return value
		}
	}
	return fallback
}