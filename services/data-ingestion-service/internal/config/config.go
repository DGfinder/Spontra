package config

import (
	"os"
	"strconv"
	"time"
)

// Config represents the application configuration
type Config struct {
	Server   ServerConfig   `json:"server"`
	Database DatabaseConfig `json:"database"`
	Amadeus  AmadeusConfig  `json:"amadeus"`
	Kafka    KafkaConfig    `json:"kafka"`
	Redis    RedisConfig    `json:"redis"`
	Elasticsearch ElasticsearchConfig `json:"elasticsearch"`
	Cassandra CassandraConfig `json:"cassandra"`
}

// ServerConfig represents server configuration
type ServerConfig struct {
	Port           string        `json:"port"`
	ReadTimeout    time.Duration `json:"read_timeout"`
	WriteTimeout   time.Duration `json:"write_timeout"`
	IdleTimeout    time.Duration `json:"idle_timeout"`
	MaxHeaderBytes int           `json:"max_header_bytes"`
}

// DatabaseConfig represents database configuration
type DatabaseConfig struct {
	Host     string `json:"host"`
	Port     string `json:"port"`
	Username string `json:"username"`
	Password string `json:"password"`
	Database string `json:"database"`
	SSLMode  string `json:"ssl_mode"`
}

// AmadeusConfig represents Amadeus API configuration
type AmadeusConfig struct {
	BaseURL      string        `json:"base_url"`
	ClientID     string        `json:"client_id"`
	ClientSecret string        `json:"client_secret"`
	Timeout      time.Duration `json:"timeout"`
	MaxRetries   int           `json:"max_retries"`
	RetryDelay   time.Duration `json:"retry_delay"`
	RateLimit    RateLimit     `json:"rate_limit"`
}

// RateLimit represents rate limiting configuration
type RateLimit struct {
	RequestsPerSecond int           `json:"requests_per_second"`
	BurstSize         int           `json:"burst_size"`
	WaitTime          time.Duration `json:"wait_time"`
}

// KafkaConfig represents Kafka configuration
type KafkaConfig struct {
	Brokers       []string      `json:"brokers"`
	GroupID       string        `json:"group_id"`
	Topics        KafkaTopics   `json:"topics"`
	RetryAttempts int           `json:"retry_attempts"`
	RetryDelay    time.Duration `json:"retry_delay"`
	BatchSize     int           `json:"batch_size"`
	BatchTimeout  time.Duration `json:"batch_timeout"`
}

// KafkaTopics represents Kafka topic configuration
type KafkaTopics struct {
	FlightSearchRequests  string `json:"flight_search_requests"`
	FlightSearchResponses string `json:"flight_search_responses"`
	FlightOffers          string `json:"flight_offers"`
	PriceUpdates          string `json:"price_updates"`
	FlightUpdates         string `json:"flight_updates"`
	ErrorEvents           string `json:"error_events"`
}

// RedisConfig represents Redis configuration
type RedisConfig struct {
	Host     string `json:"host"`
	Port     string `json:"port"`
	Password string `json:"password"`
	Database int    `json:"database"`
	PoolSize int    `json:"pool_size"`
}

// ElasticsearchConfig represents Elasticsearch configuration
type ElasticsearchConfig struct {
	URLs      []string `json:"urls"`
	Username  string   `json:"username"`
	Password  string   `json:"password"`
	Index     string   `json:"index"`
	BatchSize int      `json:"batch_size"`
}

// CassandraConfig represents Cassandra configuration
type CassandraConfig struct {
	Hosts     []string `json:"hosts"`
	Keyspace  string   `json:"keyspace"`
	Username  string   `json:"username"`
	Password  string   `json:"password"`
	BatchSize int      `json:"batch_size"`
}

// NewConfig creates a new configuration from environment variables
func NewConfig() *Config {
	return &Config{
		Server: ServerConfig{
			Port:           getEnv("PORT", "8083"),
			ReadTimeout:    getDurationEnv("READ_TIMEOUT", 30*time.Second),
			WriteTimeout:   getDurationEnv("WRITE_TIMEOUT", 30*time.Second),
			IdleTimeout:    getDurationEnv("IDLE_TIMEOUT", 120*time.Second),
			MaxHeaderBytes: getIntEnv("MAX_HEADER_BYTES", 1<<20),
		},
		Database: DatabaseConfig{
			Host:     getEnv("DB_HOST", "localhost"),
			Port:     getEnv("DB_PORT", "5432"),
			Username: getEnv("DB_USER", "spontra"),
			Password: getEnv("DB_PASSWORD", "development"),
			Database: getEnv("DB_NAME", "spontra"),
			SSLMode:  getEnv("DB_SSL_MODE", "disable"),
		},
		Amadeus: AmadeusConfig{
			BaseURL:      getEnv("AMADEUS_BASE_URL", "https://test.api.amadeus.com"),
			ClientID:     getEnv("AMADEUS_CLIENT_ID", ""),
			ClientSecret: getEnv("AMADEUS_CLIENT_SECRET", ""),
			Timeout:      getDurationEnv("AMADEUS_TIMEOUT", 30*time.Second),
			MaxRetries:   getIntEnv("AMADEUS_MAX_RETRIES", 3),
			RetryDelay:   getDurationEnv("AMADEUS_RETRY_DELAY", 1*time.Second),
			RateLimit: RateLimit{
				RequestsPerSecond: getIntEnv("AMADEUS_REQUESTS_PER_SECOND", 10),
				BurstSize:         getIntEnv("AMADEUS_BURST_SIZE", 20),
				WaitTime:          getDurationEnv("AMADEUS_WAIT_TIME", 100*time.Millisecond),
			},
		},
		Kafka: KafkaConfig{
			Brokers:       getSliceEnv("KAFKA_BROKERS", []string{"localhost:9092"}),
			GroupID:       getEnv("KAFKA_GROUP_ID", "spontra-data-ingestion"),
			RetryAttempts: getIntEnv("KAFKA_RETRY_ATTEMPTS", 3),
			RetryDelay:    getDurationEnv("KAFKA_RETRY_DELAY", 1*time.Second),
			BatchSize:     getIntEnv("KAFKA_BATCH_SIZE", 100),
			BatchTimeout:  getDurationEnv("KAFKA_BATCH_TIMEOUT", 5*time.Second),
			Topics: KafkaTopics{
				FlightSearchRequests:  getEnv("KAFKA_TOPIC_FLIGHT_SEARCH_REQUESTS", "flight-search-requests"),
				FlightSearchResponses: getEnv("KAFKA_TOPIC_FLIGHT_SEARCH_RESPONSES", "flight-search-responses"),
				FlightOffers:          getEnv("KAFKA_TOPIC_FLIGHT_OFFERS", "flight-offers"),
				PriceUpdates:          getEnv("KAFKA_TOPIC_PRICE_UPDATES", "price-updates"),
				FlightUpdates:         getEnv("KAFKA_TOPIC_FLIGHT_UPDATES", "flight-updates"),
				ErrorEvents:           getEnv("KAFKA_TOPIC_ERROR_EVENTS", "error-events"),
			},
		},
		Redis: RedisConfig{
			Host:     getEnv("REDIS_HOST", "localhost"),
			Port:     getEnv("REDIS_PORT", "6379"),
			Password: getEnv("REDIS_PASSWORD", ""),
			Database: getIntEnv("REDIS_DB", 0),
			PoolSize: getIntEnv("REDIS_POOL_SIZE", 10),
		},
		Elasticsearch: ElasticsearchConfig{
			URLs:      getSliceEnv("ELASTICSEARCH_URLS", []string{"http://localhost:9200"}),
			Username:  getEnv("ELASTICSEARCH_USERNAME", ""),
			Password:  getEnv("ELASTICSEARCH_PASSWORD", ""),
			Index:     getEnv("ELASTICSEARCH_INDEX", "spontra-flights"),
			BatchSize: getIntEnv("ELASTICSEARCH_BATCH_SIZE", 100),
		},
		Cassandra: CassandraConfig{
			Hosts:     getSliceEnv("CASSANDRA_HOSTS", []string{"localhost:9042"}),
			Keyspace:  getEnv("CASSANDRA_KEYSPACE", "spontra"),
			Username:  getEnv("CASSANDRA_USERNAME", ""),
			Password:  getEnv("CASSANDRA_PASSWORD", ""),
			BatchSize: getIntEnv("CASSANDRA_BATCH_SIZE", 100),
		},
	}
}

// Validate validates the configuration
func (c *Config) Validate() error {
	if c.Amadeus.ClientID == "" {
		return fmt.Errorf("AMADEUS_CLIENT_ID is required")
	}
	if c.Amadeus.ClientSecret == "" {
		return fmt.Errorf("AMADEUS_CLIENT_SECRET is required")
	}
	if len(c.Kafka.Brokers) == 0 {
		return fmt.Errorf("KAFKA_BROKERS is required")
	}
	if len(c.Elasticsearch.URLs) == 0 {
		return fmt.Errorf("ELASTICSEARCH_URLS is required")
	}
	if len(c.Cassandra.Hosts) == 0 {
		return fmt.Errorf("CASSANDRA_HOSTS is required")
	}
	return nil
}

// Helper functions for environment variable parsing
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getIntEnv(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return defaultValue
}

func getDurationEnv(key string, defaultValue time.Duration) time.Duration {
	if value := os.Getenv(key); value != "" {
		if duration, err := time.ParseDuration(value); err == nil {
			return duration
		}
	}
	return defaultValue
}

func getSliceEnv(key string, defaultValue []string) []string {
	if value := os.Getenv(key); value != "" {
		return strings.Split(value, ",")
	}
	return defaultValue
}

import (
	"fmt"
	"strings"
)