package config

import (
	"os"
	"strconv"
	"time"
)

// Config holds all configuration for the analytics service
type Config struct {
	// Server configuration
	Port        string `json:"port"`
	Environment string `json:"environment"`

	// Database configuration
	DatabaseURL string `json:"database_url"`

	// Redis configuration
	RedisURL      string `json:"redis_url"`
	RedisPassword string `json:"redis_password"`
	RedisDB       int    `json:"redis_db"`

	// Kafka configuration
	KafkaBootstrapServers string `json:"kafka_bootstrap_servers"`
	KafkaEventsTopic      string `json:"kafka_events_topic"`
	KafkaGroupID          string `json:"kafka_group_id"`

	// ClickHouse configuration (for analytics data warehouse)
	ClickHouseURL      string `json:"clickhouse_url"`
	ClickHouseDatabase string `json:"clickhouse_database"`
	ClickHouseUsername string `json:"clickhouse_username"`
	ClickHousePassword string `json:"clickhouse_password"`

	// Processing configuration
	BatchSize           int           `json:"batch_size"`
	BatchTimeout        time.Duration `json:"batch_timeout"`
	MaxRetries          int           `json:"max_retries"`
	RetryDelay          time.Duration `json:"retry_delay"`
	WorkerCount         int           `json:"worker_count"`

	// Cache configuration
	CacheTimeout        time.Duration `json:"cache_timeout"`
	MetricsCacheTimeout time.Duration `json:"metrics_cache_timeout"`

	// Security configuration
	JWTSecret           string   `json:"jwt_secret"`
	AllowedOrigins      []string `json:"allowed_origins"`
	APIRateLimit        int      `json:"api_rate_limit"`
	APIRateLimitWindow  time.Duration `json:"api_rate_limit_window"`

	// Feature flags
	EnableRealTimeProcessing bool `json:"enable_real_time_processing"`
	EnableCohortAnalysis     bool `json:"enable_cohort_analysis"`
	EnableFunnelAnalysis     bool `json:"enable_funnel_analysis"`
	EnableABTesting          bool `json:"enable_ab_testing"`
	EnableDataExport         bool `json:"enable_data_export"`

	// External integrations
	SlackWebhookURL     string `json:"slack_webhook_url"`
	EmailServiceURL     string `json:"email_service_url"`
	NotificationService string `json:"notification_service"`

	// Data retention
	EventRetentionDays   int `json:"event_retention_days"`
	MetricRetentionDays  int `json:"metric_retention_days"`
	JourneyRetentionDays int `json:"journey_retention_days"`

	// Privacy and compliance
	EnableDataAnonymization bool     `json:"enable_data_anonymization"`
	PiiFields              []string `json:"pii_fields"`
	GDPRCompliant          bool     `json:"gdpr_compliant"`
	DataProcessingRegion   string   `json:"data_processing_region"`
}

// Load loads configuration from environment variables
func Load() (*Config, error) {
	config := &Config{
		// Server defaults
		Port:        getEnv("PORT", "8080"),
		Environment: getEnv("ENVIRONMENT", "development"),

		// Database defaults
		DatabaseURL: getEnv("DATABASE_URL", "postgres://postgres:password@localhost:5432/spontra_analytics?sslmode=disable"),

		// Redis defaults
		RedisURL:      getEnv("REDIS_URL", "localhost:6379"),
		RedisPassword: getEnv("REDIS_PASSWORD", ""),
		RedisDB:       getEnvInt("REDIS_DB", 2), // Use database 2 for analytics

		// Kafka defaults
		KafkaBootstrapServers: getEnv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092"),
		KafkaEventsTopic:      getEnv("KAFKA_EVENTS_TOPIC", "spontra-events"),
		KafkaGroupID:          getEnv("KAFKA_GROUP_ID", "analytics-service"),

		// ClickHouse defaults
		ClickHouseURL:      getEnv("CLICKHOUSE_URL", "http://localhost:8123"),
		ClickHouseDatabase: getEnv("CLICKHOUSE_DATABASE", "spontra_analytics"),
		ClickHouseUsername: getEnv("CLICKHOUSE_USERNAME", "default"),
		ClickHousePassword: getEnv("CLICKHOUSE_PASSWORD", ""),

		// Processing defaults
		BatchSize:    getEnvInt("BATCH_SIZE", 1000),
		BatchTimeout: getEnvDuration("BATCH_TIMEOUT", 30*time.Second),
		MaxRetries:   getEnvInt("MAX_RETRIES", 3),
		RetryDelay:   getEnvDuration("RETRY_DELAY", 5*time.Second),
		WorkerCount:  getEnvInt("WORKER_COUNT", 4),

		// Cache defaults
		CacheTimeout:        getEnvDuration("CACHE_TIMEOUT", 15*time.Minute),
		MetricsCacheTimeout: getEnvDuration("METRICS_CACHE_TIMEOUT", 5*time.Minute),

		// Security defaults
		JWTSecret:          getEnv("JWT_SECRET", "your-secret-key"),
		AllowedOrigins:     getEnvSlice("ALLOWED_ORIGINS", []string{"http://localhost:3000"}),
		APIRateLimit:       getEnvInt("API_RATE_LIMIT", 1000),
		APIRateLimitWindow: getEnvDuration("API_RATE_LIMIT_WINDOW", time.Hour),

		// Feature flags defaults
		EnableRealTimeProcessing: getEnvBool("ENABLE_REAL_TIME_PROCESSING", true),
		EnableCohortAnalysis:     getEnvBool("ENABLE_COHORT_ANALYSIS", true),
		EnableFunnelAnalysis:     getEnvBool("ENABLE_FUNNEL_ANALYSIS", true),
		EnableABTesting:          getEnvBool("ENABLE_AB_TESTING", true),
		EnableDataExport:         getEnvBool("ENABLE_DATA_EXPORT", true),

		// External integrations
		SlackWebhookURL:     getEnv("SLACK_WEBHOOK_URL", ""),
		EmailServiceURL:     getEnv("EMAIL_SERVICE_URL", ""),
		NotificationService: getEnv("NOTIFICATION_SERVICE", ""),

		// Data retention defaults
		EventRetentionDays:   getEnvInt("EVENT_RETENTION_DAYS", 365),
		MetricRetentionDays:  getEnvInt("METRIC_RETENTION_DAYS", 730),
		JourneyRetentionDays: getEnvInt("JOURNEY_RETENTION_DAYS", 180),

		// Privacy and compliance defaults
		EnableDataAnonymization: getEnvBool("ENABLE_DATA_ANONYMIZATION", true),
		PiiFields:              getEnvSlice("PII_FIELDS", []string{"email", "first_name", "last_name", "ip_address"}),
		GDPRCompliant:          getEnvBool("GDPR_COMPLIANT", true),
		DataProcessingRegion:   getEnv("DATA_PROCESSING_REGION", "EU"),
	}

	return config, nil
}

// Helper functions to get environment variables with defaults

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return defaultValue
}

func getEnvBool(key string, defaultValue bool) bool {
	if value := os.Getenv(key); value != "" {
		if boolValue, err := strconv.ParseBool(value); err == nil {
			return boolValue
		}
	}
	return defaultValue
}

func getEnvDuration(key string, defaultValue time.Duration) time.Duration {
	if value := os.Getenv(key); value != "" {
		if duration, err := time.ParseDuration(value); err == nil {
			return duration
		}
	}
	return defaultValue
}

func getEnvSlice(key string, defaultValue []string) []string {
	if value := os.Getenv(key); value != "" {
		// Simple implementation - in production, you might want to use a proper CSV parser
		return []string{value}
	}
	return defaultValue
}

// Validate validates the configuration
func (c *Config) Validate() error {
	if c.Port == "" {
		return fmt.Errorf("port is required")
	}
	if c.DatabaseURL == "" {
		return fmt.Errorf("database URL is required")
	}
	if c.JWTSecret == "" {
		return fmt.Errorf("JWT secret is required")
	}
	if c.BatchSize <= 0 {
		return fmt.Errorf("batch size must be positive")
	}
	if c.WorkerCount <= 0 {
		return fmt.Errorf("worker count must be positive")
	}
	return nil
}

// IsProduction returns true if running in production environment
func (c *Config) IsProduction() bool {
	return c.Environment == "production"
}

// IsDevelopment returns true if running in development environment
func (c *Config) IsDevelopment() bool {
	return c.Environment == "development"
}

// GetClickHouseDSN returns the ClickHouse connection string
func (c *Config) GetClickHouseDSN() string {
	if c.ClickHousePassword != "" {
		return fmt.Sprintf("http://%s:%s@%s/%s", 
			c.ClickHouseUsername, c.ClickHousePassword, c.ClickHouseURL[7:], c.ClickHouseDatabase)
	}
	return fmt.Sprintf("%s/%s", c.ClickHouseURL, c.ClickHouseDatabase)
}

// GetKafkaConfig returns Kafka configuration
func (c *Config) GetKafkaConfig() map[string]interface{} {
	return map[string]interface{}{
		"bootstrap.servers": c.KafkaBootstrapServers,
		"group.id":         c.KafkaGroupID,
		"auto.offset.reset": "latest",
		"enable.auto.commit": false,
	}
}