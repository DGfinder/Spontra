package models

import (
	"time"
	"github.com/google/uuid"
	"github.com/shopspring/decimal"
)

// FlightSearchRequest represents a flight search request
type FlightSearchRequest struct {
	ID                     uuid.UUID  `json:"id"`
	UserID                 *uuid.UUID `json:"user_id,omitempty"`
	OriginAirport          string     `json:"origin_airport" binding:"required"`
	DestinationAirport     string     `json:"destination_airport" binding:"required"`
	DepartureDate          time.Time  `json:"departure_date" binding:"required"`
	ReturnDate             *time.Time `json:"return_date,omitempty"`
	PassengerCount         int        `json:"passenger_count" binding:"min=1,max=9"`
	CabinClass             string     `json:"cabin_class"`
	TripType               string     `json:"trip_type" binding:"required"` // "oneway", "return"
	FlexibleDates          bool       `json:"flexible_dates"`
	FlexibleDatesRange     int        `json:"flexible_dates_range"` // days
	MaxResults             int        `json:"max_results"`
	SortBy                 string     `json:"sort_by"` // "price", "duration", "departure_time"
	SortOrder              string     `json:"sort_order"` // "asc", "desc"
	MinFlightDurationHours *int       `json:"min_flight_duration_hours,omitempty"`
	MaxFlightDurationHours *int       `json:"max_flight_duration_hours,omitempty"`
	PreferredActivities    []string   `json:"preferred_activities,omitempty"`
	BudgetLevel            string     `json:"budget_level,omitempty"`
	DirectFlightsOnly      bool       `json:"direct_flights_only"`
	MaxStops               *int       `json:"max_stops,omitempty"`
	PreferredAirlines      []string   `json:"preferred_airlines,omitempty"`
	ExcludedAirlines       []string   `json:"excluded_airlines,omitempty"`
	CreatedAt              time.Time  `json:"created_at"`
	SearchSessionID        string     `json:"search_session_id"`
}

// FlightSearchResponse represents the search response
type FlightSearchResponse struct {
	SearchID        uuid.UUID     `json:"search_id"`
	RequestID       string        `json:"request_id"`
	SearchRequest   FlightSearchRequest `json:"search_request"`
	Flights         []Flight      `json:"flights"`
	SearchMetadata  SearchMetadata `json:"search_metadata"`
	CreatedAt       time.Time     `json:"created_at"`
	ExpiresAt       time.Time     `json:"expires_at"`
}

// Flight represents a flight option
type Flight struct {
	ID              uuid.UUID       `json:"id"`
	Provider        string          `json:"provider"`
	OriginAirport   string          `json:"origin_airport"`
	DestinationAirport string       `json:"destination_airport"`
	DepartureTime   time.Time       `json:"departure_time"`
	ArrivalTime     time.Time       `json:"arrival_time"`
	Duration        int             `json:"duration_minutes"`
	Price           decimal.Decimal `json:"price"`
	Currency        string          `json:"currency"`
	CabinClass      string          `json:"cabin_class"`
	Airline         string          `json:"airline"`
	FlightNumber    string          `json:"flight_number"`
	Aircraft        string          `json:"aircraft,omitempty"`
	Stops           int             `json:"stops"`
	StopDetails     []Stop          `json:"stop_details,omitempty"`
	IsRefundable    bool            `json:"is_refundable"`
	BaggageIncluded bool            `json:"baggage_included"`
	BookingURL      string          `json:"booking_url"`
	BookingDeepLink string          `json:"booking_deep_link,omitempty"`
	ValidUntil      time.Time       `json:"valid_until"`
	SeatsAvailable  *int            `json:"seats_available,omitempty"`
	PriceBreakdown  PriceBreakdown  `json:"price_breakdown,omitempty"`
	ReturnFlight    *Flight         `json:"return_flight,omitempty"`
	RelevanceScore  float64         `json:"relevance_score"`
	ActivityMatch   float64         `json:"activity_match,omitempty"`
}

// Stop represents a flight stop/layover
type Stop struct {
	Airport       string        `json:"airport"`
	City          string        `json:"city"`
	Country       string        `json:"country"`
	ArrivalTime   time.Time     `json:"arrival_time"`
	DepartureTime time.Time     `json:"departure_time"`
	Duration      int           `json:"duration_minutes"`
	Terminal      string        `json:"terminal,omitempty"`
}

// PriceBreakdown represents detailed price information
type PriceBreakdown struct {
	BaseFare    decimal.Decimal `json:"base_fare"`
	Taxes       decimal.Decimal `json:"taxes"`
	Fees        decimal.Decimal `json:"fees"`
	Total       decimal.Decimal `json:"total"`
	Currency    string          `json:"currency"`
	PricePerPax decimal.Decimal `json:"price_per_passenger"`
}

// SearchMetadata contains search statistics and metadata
type SearchMetadata struct {
	TotalResults    int           `json:"total_results"`
	ResultsReturned int           `json:"results_returned"`
	SearchTime      time.Duration `json:"search_time_ms"`
	ProvidersQueried []string     `json:"providers_queried"`
	ProvidersSuccessful []string  `json:"providers_successful"`
	ProvidersErrors map[string]string `json:"providers_errors,omitempty"`
	CacheHit        bool          `json:"cache_hit"`
	FromCache       bool          `json:"from_cache"`
	Currency        string        `json:"currency"`
	PriceRange      PriceRange    `json:"price_range"`
	DurationRange   DurationRange `json:"duration_range"`
	FilterCriteria  FilterCriteria `json:"filter_criteria"`
}

// PriceRange represents the price range of search results
type PriceRange struct {
	MinPrice decimal.Decimal `json:"min_price"`
	MaxPrice decimal.Decimal `json:"max_price"`
	AvgPrice decimal.Decimal `json:"avg_price"`
	Currency string          `json:"currency"`
}

// DurationRange represents the duration range of search results
type DurationRange struct {
	MinDuration int `json:"min_duration_minutes"`
	MaxDuration int `json:"max_duration_minutes"`
	AvgDuration int `json:"avg_duration_minutes"`
}

// FilterCriteria represents applied filters
type FilterCriteria struct {
	MaxPrice       *decimal.Decimal `json:"max_price,omitempty"`
	MinPrice       *decimal.Decimal `json:"min_price,omitempty"`
	MaxDuration    *int             `json:"max_duration,omitempty"`
	MinDuration    *int             `json:"min_duration,omitempty"`
	Airlines       []string         `json:"airlines,omitempty"`
	Stops          *int             `json:"stops,omitempty"`
	DepartureTime  *TimeRange       `json:"departure_time,omitempty"`
	ArrivalTime    *TimeRange       `json:"arrival_time,omitempty"`
	DirectOnly     bool             `json:"direct_only"`
}

// TimeRange represents a time range filter
type TimeRange struct {
	Start time.Time `json:"start"`
	End   time.Time `json:"end"`
}

// SearchFilter represents search result filters
type SearchFilter struct {
	MaxPrice          *decimal.Decimal `json:"max_price,omitempty"`
	MinPrice          *decimal.Decimal `json:"min_price,omitempty"`
	MaxDuration       *int             `json:"max_duration_minutes,omitempty"`
	MinDuration       *int             `json:"min_duration_minutes,omitempty"`
	Airlines          []string         `json:"airlines,omitempty"`
	MaxStops          *int             `json:"max_stops,omitempty"`
	DirectFlightsOnly bool             `json:"direct_flights_only"`
	DepartureTimeFrom *time.Time       `json:"departure_time_from,omitempty"`
	DepartureTimeTo   *time.Time       `json:"departure_time_to,omitempty"`
	ArrivalTimeFrom   *time.Time       `json:"arrival_time_from,omitempty"`
	ArrivalTimeTo     *time.Time       `json:"arrival_time_to,omitempty"`
	SortBy            string           `json:"sort_by"` // "price", "duration", "departure_time", "relevance"
	SortOrder         string           `json:"sort_order"` // "asc", "desc"
	Limit             int              `json:"limit"`
	Offset            int              `json:"offset"`
}

// AirportSuggestion represents an airport suggestion
type AirportSuggestion struct {
	Code        string  `json:"code"`
	Name        string  `json:"name"`
	City        string  `json:"city"`
	Country     string  `json:"country"`
	CountryCode string  `json:"country_code"`
	Relevance   float64 `json:"relevance"`
	Type        string  `json:"type"` // "airport", "city", "country"
}

// SearchSession represents a user's search session
type SearchSession struct {
	ID        uuid.UUID `json:"id" db:"id"`
	UserID    *uuid.UUID `json:"user_id,omitempty" db:"user_id"`
	SessionID string    `json:"session_id" db:"session_id"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	ExpiresAt time.Time `json:"expires_at" db:"expires_at"`
	IsActive  bool      `json:"is_active" db:"is_active"`
	SearchCount int     `json:"search_count" db:"search_count"`
	LastSearchAt *time.Time `json:"last_search_at,omitempty" db:"last_search_at"`
	IPAddress    *string    `json:"ip_address,omitempty" db:"ip_address"`
	UserAgent    *string    `json:"user_agent,omitempty" db:"user_agent"`
}

// SearchHistory represents stored search results
type SearchHistory struct {
	ID          uuid.UUID `json:"id" db:"id"`
	SearchID    uuid.UUID `json:"search_id" db:"search_id"`
	UserID      *uuid.UUID `json:"user_id,omitempty" db:"user_id"`
	SessionID   string    `json:"session_id" db:"session_id"`
	Request     FlightSearchRequest `json:"request" db:"request"`
	ResultCount int       `json:"result_count" db:"result_count"`
	BestPrice   *decimal.Decimal `json:"best_price,omitempty" db:"best_price"`
	Currency    string    `json:"currency" db:"currency"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	ExpiresAt   time.Time `json:"expires_at" db:"expires_at"`
}

// CacheStats represents cache statistics
type CacheStats struct {
	TotalKeys       int64   `json:"total_keys"`
	HitRate         float64 `json:"hit_rate"`
	MissRate        float64 `json:"miss_rate"`
	MemoryUsage     string  `json:"memory_usage"`
	ExpirationInfo  map[string]int `json:"expiration_info"`
	TopSearchRoutes []RouteStats   `json:"top_search_routes"`
}

// RouteStats represents statistics for a route
type RouteStats struct {
	Route       string `json:"route"`
	SearchCount int    `json:"search_count"`
	LastSearched time.Time `json:"last_searched"`
}

// SearchAnalytics represents search analytics
type SearchAnalytics struct {
	TotalSearches     int64            `json:"total_searches"`
	UniqueUsers       int64            `json:"unique_users"`
	PopularRoutes     []RouteStats     `json:"popular_routes"`
	AverageResultCount float64         `json:"average_result_count"`
	AverageSearchTime  time.Duration   `json:"average_search_time"`
	ConversionRate     float64         `json:"conversion_rate"`
	PeakSearchTimes    []PeakTime      `json:"peak_search_times"`
}

// PeakTime represents peak search times
type PeakTime struct {
	Hour        int `json:"hour"`
	SearchCount int `json:"search_count"`
}

// DurationValidation represents flight duration validation result
type DurationValidation struct {
	IsValid           bool              `json:"is_valid"`
	Message           string            `json:"message"`
	ExpectedDuration  int               `json:"expected_duration,omitempty"`
	RequestedDuration int               `json:"requested_duration,omitempty"`
	Suggested         *FlightSuggestion `json:"suggested,omitempty"`
}

// FlightSuggestion represents a flight suggestion based on duration data
type FlightSuggestion struct {
	OriginAirport      string `json:"origin_airport"`
	DestinationAirport string `json:"destination_airport"`
	DurationMinutes    int    `json:"duration_minutes"`
	DistanceKM         int    `json:"distance_km"`
	IsDirect           bool   `json:"is_direct"`
	TypicalStops       int    `json:"typical_stops"`
}