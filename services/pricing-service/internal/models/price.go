package models

import (
	"time"
	"github.com/google/uuid"
	"github.com/shopspring/decimal"
)

// FlightPrice represents a flight price from a provider
type FlightPrice struct {
	ID               uuid.UUID       `json:"id" db:"id"`
	ProviderName     string          `json:"provider_name" db:"provider_name"`
	OriginAirport    string          `json:"origin_airport" db:"origin_airport"`
	DestinationAirport string        `json:"destination_airport" db:"destination_airport"`
	DepartureDate    time.Time       `json:"departure_date" db:"departure_date"`
	ReturnDate       *time.Time      `json:"return_date,omitempty" db:"return_date"`
	Price            decimal.Decimal `json:"price" db:"price"`
	Currency         string          `json:"currency" db:"currency"`
	TripType         string          `json:"trip_type" db:"trip_type"` // "oneway", "return"
	PassengerCount   int             `json:"passenger_count" db:"passenger_count"`
	CabinClass       string          `json:"cabin_class" db:"cabin_class"` // "economy", "premium", "business", "first"
	IsRefundable     bool            `json:"is_refundable" db:"is_refundable"`
	BaggageIncluded  bool            `json:"baggage_included" db:"baggage_included"`
	DirectFlight     bool            `json:"direct_flight" db:"direct_flight"`
	Duration         int             `json:"duration_minutes" db:"duration_minutes"`
	BookingURL       string          `json:"booking_url" db:"booking_url"`
	ValidUntil       time.Time       `json:"valid_until" db:"valid_until"`
	CreatedAt        time.Time       `json:"created_at" db:"created_at"`
	UpdatedAt        time.Time       `json:"updated_at" db:"updated_at"`
}

// PriceHistory represents historical price data for analytics
type PriceHistory struct {
	ID                 uuid.UUID       `json:"id" db:"id"`
	RouteID            string          `json:"route_id" db:"route_id"` // "LHR-BCN"
	OriginAirport      string          `json:"origin_airport" db:"origin_airport"`
	DestinationAirport string          `json:"destination_airport" db:"destination_airport"`
	Date               time.Time       `json:"date" db:"date"`
	AveragePrice       decimal.Decimal `json:"average_price" db:"average_price"`
	MinPrice           decimal.Decimal `json:"min_price" db:"min_price"`
	MaxPrice           decimal.Decimal `json:"max_price" db:"max_price"`
	PriceCount         int             `json:"price_count" db:"price_count"`
	Currency           string          `json:"currency" db:"currency"`
	CreatedAt          time.Time       `json:"created_at" db:"created_at"`
}

// PriceAlert represents user price alerts
type PriceAlert struct {
	ID                 uuid.UUID       `json:"id" db:"id"`
	UserID             uuid.UUID       `json:"user_id" db:"user_id"`
	OriginAirport      string          `json:"origin_airport" db:"origin_airport"`
	DestinationAirport string          `json:"destination_airport" db:"destination_airport"`
	DepartureDate      time.Time       `json:"departure_date" db:"departure_date"`
	ReturnDate         *time.Time      `json:"return_date,omitempty" db:"return_date"`
	MaxPrice           decimal.Decimal `json:"max_price" db:"max_price"`
	Currency           string          `json:"currency" db:"currency"`
	TripType           string          `json:"trip_type" db:"trip_type"`
	PassengerCount     int             `json:"passenger_count" db:"passenger_count"`
	CabinClass         string          `json:"cabin_class" db:"cabin_class"`
	IsActive           bool            `json:"is_active" db:"is_active"`
	NotificationEmail  string          `json:"notification_email" db:"notification_email"`
	LastTriggered      *time.Time      `json:"last_triggered,omitempty" db:"last_triggered"`
	TriggerCount       int             `json:"trigger_count" db:"trigger_count"`
	CreatedAt          time.Time       `json:"created_at" db:"created_at"`
	UpdatedAt          time.Time       `json:"updated_at" db:"updated_at"`
	ExpiresAt          time.Time       `json:"expires_at" db:"expires_at"`
}

// PriceTracking represents active price tracking
type PriceTracking struct {
	ID                 uuid.UUID `json:"id" db:"id"`
	UserID             uuid.UUID `json:"user_id" db:"user_id"`
	RouteID            string    `json:"route_id" db:"route_id"`
	OriginAirport      string    `json:"origin_airport" db:"origin_airport"`
	DestinationAirport string    `json:"destination_airport" db:"destination_airport"`
	DepartureDate      time.Time `json:"departure_date" db:"departure_date"`
	ReturnDate         *time.Time `json:"return_date,omitempty" db:"return_date"`
	TripType           string    `json:"trip_type" db:"trip_type"`
	PassengerCount     int       `json:"passenger_count" db:"passenger_count"`
	CabinClass         string    `json:"cabin_class" db:"cabin_class"`
	IsActive           bool      `json:"is_active" db:"is_active"`
	CreatedAt          time.Time `json:"created_at" db:"created_at"`
	UpdatedAt          time.Time `json:"updated_at" db:"updated_at"`
}

// PriceTrend represents price trend analytics
type PriceTrend struct {
	RouteID       string          `json:"route_id"`
	Period        string          `json:"period"` // "7d", "30d", "90d"
	AveragePrice  decimal.Decimal `json:"average_price"`
	MinPrice      decimal.Decimal `json:"min_price"`
	MaxPrice      decimal.Decimal `json:"max_price"`
	PriceChange   decimal.Decimal `json:"price_change"`
	ChangePercent decimal.Decimal `json:"change_percent"`
	Trend         string          `json:"trend"` // "up", "down", "stable"
	Confidence    float64         `json:"confidence"`
	Currency      string          `json:"currency"`
	DataPoints    int             `json:"data_points"`
	LastUpdated   time.Time       `json:"last_updated"`
}

// PricePrediction represents ML-based price predictions
type PricePrediction struct {
	RouteID           string          `json:"route_id"`
	PredictedPrice    decimal.Decimal `json:"predicted_price"`
	Confidence        float64         `json:"confidence"`
	PredictionHorizon string          `json:"prediction_horizon"` // "1w", "2w", "1m"
	Factors           []string        `json:"factors"`
	Recommendation    string          `json:"recommendation"` // "buy_now", "wait", "monitor"
	Currency          string          `json:"currency"`
	CreatedAt         time.Time       `json:"created_at"`
}

// Request/Response Models

// PriceComparisonRequest represents a price comparison request
type PriceComparisonRequest struct {
	OriginAirport      string     `json:"origin_airport" binding:"required"`
	DestinationAirport string     `json:"destination_airport" binding:"required"`
	DepartureDate      time.Time  `json:"departure_date" binding:"required"`
	ReturnDate         *time.Time `json:"return_date,omitempty"`
	PassengerCount     int        `json:"passenger_count" binding:"min=1,max=9"`
	CabinClass         string     `json:"cabin_class"`
	TripType           string     `json:"trip_type" binding:"required"`
	Providers          []string   `json:"providers,omitempty"`
	MaxResults         int        `json:"max_results,omitempty"`
}

// PriceComparisonResponse represents the response with compared prices
type PriceComparisonResponse struct {
	RequestID     string        `json:"request_id"`
	Prices        []FlightPrice `json:"prices"`
	BestPrice     *FlightPrice  `json:"best_price,omitempty"`
	AveragePrice  decimal.Decimal `json:"average_price"`
	PriceSpread   decimal.Decimal `json:"price_spread"`
	ProviderCount int           `json:"provider_count"`
	Currency      string        `json:"currency"`
	SearchTime    time.Time     `json:"search_time"`
	CacheHit      bool          `json:"cache_hit"`
}

// PriceAlertRequest represents a price alert creation request
type PriceAlertRequest struct {
	OriginAirport      string          `json:"origin_airport" binding:"required"`
	DestinationAirport string          `json:"destination_airport" binding:"required"`
	DepartureDate      time.Time       `json:"departure_date" binding:"required"`
	ReturnDate         *time.Time      `json:"return_date,omitempty"`
	MaxPrice           decimal.Decimal `json:"max_price" binding:"required"`
	Currency           string          `json:"currency" binding:"required"`
	TripType           string          `json:"trip_type" binding:"required"`
	PassengerCount     int             `json:"passenger_count" binding:"min=1,max=9"`
	CabinClass         string          `json:"cabin_class"`
	NotificationEmail  string          `json:"notification_email" binding:"required,email"`
	ExpiryDays         int             `json:"expiry_days" binding:"min=1,max=365"`
}

// PriceTrackingRequest represents a price tracking request
type PriceTrackingRequest struct {
	OriginAirport      string     `json:"origin_airport" binding:"required"`
	DestinationAirport string     `json:"destination_airport" binding:"required"`
	DepartureDate      time.Time  `json:"departure_date" binding:"required"`
	ReturnDate         *time.Time `json:"return_date,omitempty"`
	TripType           string     `json:"trip_type" binding:"required"`
	PassengerCount     int        `json:"passenger_count" binding:"min=1,max=9"`
	CabinClass         string     `json:"cabin_class"`
}

// ProviderConfig represents configuration for price providers
type ProviderConfig struct {
	Name     string `json:"name"`
	Enabled  bool   `json:"enabled"`
	Priority int    `json:"priority"`
	Timeout  int    `json:"timeout_seconds"`
	APIKey   string `json:"api_key,omitempty"`
}

// CacheConfig represents caching configuration
type CacheConfig struct {
	TTL                time.Duration `json:"ttl"`
	PriceComparisonTTL time.Duration `json:"price_comparison_ttl"`
	TrendsTTL          time.Duration `json:"trends_ttl"`
}