package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"
)

// Config holds all configuration for the search service
type Config struct {
	Port        string
	DatabaseURL string
	RedisURL    string
	ElasticsearchURL string
	Environment string
	
	// External service URLs
	DataIngestionServiceURL string
	PricingServiceURL       string
	UserServiceURL          string
	
	// Search configuration
	DefaultMaxResults    int
	MaxResultsLimit      int
	SearchTimeout        time.Duration
	CacheTimeout         time.Duration
	SessionTimeout       time.Duration
	
	// Elasticsearch configuration
	ESIndexPrefix       string
	ESFlightIndex       string
	ESAirportIndex      string
	ESShards           int
	ESReplicas         int
	
	// Cache configuration
	CacheTTL                time.Duration
	SearchResultsCacheTTL   time.Duration
	AirportCacheTTL         time.Duration
	
	// Rate limiting
	RateLimitRequests int
	RateLimitWindow   time.Duration
	
	// Provider configuration
	EnabledProviders     []string
	ProviderTimeout      time.Duration
	MaxRetries          int
	
	// Analytics
	EnableAnalytics     bool
	AnalyticsBuffer     int
	AnalyticsFlushInterval time.Duration
	
	// Monitoring
	MetricsEnabled bool
	LogLevel       string
	
	// Flight search specific
	FlexibleDatesMaxRange  int
	DefaultFlexibleRange   int
	MaxFlightDuration      int // hours
	MinFlightDuration      int // hours
}

// Load loads configuration from environment variables
func Load() (*Config, error) {
	config := &Config{
		Port:        getEnv("PORT", "8081"),
		DatabaseURL: getEnv("DATABASE_URL", "postgres://postgres:password@localhost/spontra_search?sslmode=disable"),
		RedisURL:    getEnv("REDIS_URL", "redis://localhost:6379"),
		ElasticsearchURL: getEnv("ELASTICSEARCH_URL", "http://localhost:9200"),
		Environment: getEnv("ENVIRONMENT", "development"),
		
		// External services
		DataIngestionServiceURL: getEnv("DATA_INGESTION_SERVICE_URL", "http://localhost:8083"),
		PricingServiceURL:       getEnv("PRICING_SERVICE_URL", "http://localhost:8082"),
		UserServiceURL:          getEnv("USER_SERVICE_URL", "http://localhost:8080"),
		
		// Search settings
		DefaultMaxResults: getEnvAsInt("DEFAULT_MAX_RESULTS", 50),
		MaxResultsLimit:   getEnvAsInt("MAX_RESULTS_LIMIT", 200),
		SearchTimeout:     time.Second * time.Duration(getEnvAsInt("SEARCH_TIMEOUT_SECONDS", 30)),
		CacheTimeout:      time.Minute * time.Duration(getEnvAsInt("CACHE_TIMEOUT_MINUTES", 15)),
		SessionTimeout:    time.Hour * time.Duration(getEnvAsInt("SESSION_TIMEOUT_HOURS", 24)),
		
		// Elasticsearch
		ESIndexPrefix:  getEnv("ES_INDEX_PREFIX", "spontra"),
		ESFlightIndex:  getEnv("ES_FLIGHT_INDEX", "flights"),
		ESAirportIndex: getEnv("ES_AIRPORT_INDEX", "airports"),
		ESShards:       getEnvAsInt("ES_SHARDS", 2),
		ESReplicas:     getEnvAsInt("ES_REPLICAS", 1),
		
		// Cache
		CacheTTL:               time.Minute * time.Duration(getEnvAsInt("CACHE_TTL_MINUTES", 30)),
		SearchResultsCacheTTL:  time.Minute * time.Duration(getEnvAsInt("SEARCH_RESULTS_CACHE_TTL_MINUTES", 15)),
		AirportCacheTTL:        time.Hour * time.Duration(getEnvAsInt("AIRPORT_CACHE_TTL_HOURS", 24)),
		
		// Rate limiting
		RateLimitRequests: getEnvAsInt("RATE_LIMIT_REQUESTS", 100),
		RateLimitWindow:   time.Minute * time.Duration(getEnvAsInt("RATE_LIMIT_WINDOW_MINUTES", 1)),
		
		// Providers
		EnabledProviders: parseStringSlice(getEnv("ENABLED_PROVIDERS", "amadeus,data-ingestion")),
		ProviderTimeout:  time.Second * time.Duration(getEnvAsInt("PROVIDER_TIMEOUT_SECONDS", 20)),
		MaxRetries:       getEnvAsInt("MAX_RETRIES", 3),
		
		// Analytics
		EnableAnalytics:        getEnvAsBool("ENABLE_ANALYTICS", true),
		AnalyticsBuffer:        getEnvAsInt("ANALYTICS_BUFFER", 1000),
		AnalyticsFlushInterval: time.Minute * time.Duration(getEnvAsInt("ANALYTICS_FLUSH_INTERVAL_MINUTES", 5)),
		
		// Monitoring
		MetricsEnabled: getEnvAsBool("METRICS_ENABLED", true),
		LogLevel:       getEnv("LOG_LEVEL", "info"),
		
		// Flight search
		FlexibleDatesMaxRange: getEnvAsInt("FLEXIBLE_DATES_MAX_RANGE", 7),
		DefaultFlexibleRange:  getEnvAsInt("DEFAULT_FLEXIBLE_RANGE", 3),
		MaxFlightDuration:     getEnvAsInt("MAX_FLIGHT_DURATION_HOURS", 24),
		MinFlightDuration:     getEnvAsInt("MIN_FLIGHT_DURATION_HOURS", 0),
	}
	
	// Validate configuration
	if config.Environment == "production" {
		if config.ElasticsearchURL == "http://localhost:9200" {
			return nil, fmt.Errorf("ELASTICSEARCH_URL must be set in production")
		}
		if config.DataIngestionServiceURL == "http://localhost:8083" {
			return nil, fmt.Errorf("DATA_INGESTION_SERVICE_URL must be set in production")
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

// parseStringSlice parses a comma-separated string into a slice
func parseStringSlice(s string) []string {
	if s == "" {
		return []string{}
	}
	
	var result []string
	for _, item := range strings.Split(s, ",") {
		if trimmed := strings.TrimSpace(item); trimmed != "" {
			result = append(result, trimmed)
		}
	}
	return result
}