package models

import (
	"time"

	"github.com/google/uuid"
)

// ActivityType represents different types of activities available at destinations
type ActivityType string

const (
	ActivityTypeActivities   ActivityType = "activities"
	ActivityTypeShopping     ActivityType = "shopping"
	ActivityTypeRestaurants  ActivityType = "restaurants"
	ActivityTypeNature       ActivityType = "nature"
	ActivityTypeCulture      ActivityType = "culture"
	ActivityTypeNightlife    ActivityType = "nightlife"
	ActivityTypeBeaches      ActivityType = "beaches"
	ActivityTypeSightseeing  ActivityType = "sightseeing"
	ActivityTypeAdventure    ActivityType = "adventure"
	ActivityTypeRelaxation   ActivityType = "relaxation"
)

// Destination represents a travel destination with activity information
type Destination struct {
	ID              string                   `json:"id"`
	AirportCode     string                   `json:"airport_code" validate:"required,len=3"`
	CityName        string                   `json:"city_name" validate:"required"`
	CountryName     string                   `json:"country_name" validate:"required"`
	CountryCode     string                   `json:"country_code" validate:"required,len=2"`
	Description     string                   `json:"description"`
	ImageURL        string                   `json:"image_url"`
	Activities      []ActivityInfo           `json:"activities"`
	PopularityScore float64                  `json:"popularity_score"` // 0-100 rating
	ClimateInfo     ClimateInfo              `json:"climate_info"`
	BestTimeToVisit []string                 `json:"best_time_to_visit"` // Month names
	Budget          BudgetInfo               `json:"budget"`
	TimeZone        string                   `json:"timezone"`
	Language        []string                 `json:"language"`
	Currency        string                   `json:"currency"`
	VisaRequired    bool                     `json:"visa_required"`
	CreatedAt       time.Time                `json:"created_at"`
	UpdatedAt       time.Time                `json:"updated_at"`
}

// ActivityInfo represents detailed information about an activity type at a destination
type ActivityInfo struct {
	Type            ActivityType `json:"type"`
	Score           float64      `json:"score"` // 0-10 rating for this activity type
	Description     string       `json:"description"`
	PopularSpots    []string     `json:"popular_spots"`
	AveragePrice    string       `json:"average_price"` // e.g., "€20-50", "Free", "€100+"
	RecommendedDays int          `json:"recommended_days"`
}

// ClimateInfo represents climate information for a destination
type ClimateInfo struct {
	AverageTemperature string `json:"average_temperature"` // e.g., "15-25°C"
	RainyMonths        []string `json:"rainy_months"`
	SunnyMonths        []string `json:"sunny_months"`
	ClimateType        string `json:"climate_type"` // e.g., "Mediterranean", "Continental"
}

// BudgetInfo represents budget information for a destination
type BudgetInfo struct {
	Level            string `json:"level"` // "budget", "mid-range", "luxury"
	DailyBudgetRange string `json:"daily_budget_range"` // e.g., "€50-100"
	Currency         string `json:"currency"`
}

// FlightRoute represents a flight route with duration information from the CSV
type FlightRoute struct {
	ID                   string    `json:"id"`
	OriginAirportCode    string    `json:"origin_airport_code" validate:"required,len=3"`
	DestinationAirportCode string  `json:"destination_airport_code" validate:"required,len=3"`
	EstimatedDurationHours int     `json:"estimated_duration_hours"`
	EstimatedDurationMinutes int   `json:"estimated_duration_minutes"`
	TotalDurationMinutes   int     `json:"total_duration_minutes"` // Calculated field
	CreatedAt            time.Time `json:"created_at"`
	UpdatedAt            time.Time `json:"updated_at"`
}

// DestinationExploreRequest represents a new type of search request for destination discovery
type DestinationExploreRequest struct {
	ID                     string         `json:"id"`
	OriginAirportCode      string         `json:"origin_airport_code" validate:"required,len=3"`
	MinFlightDurationHours int            `json:"min_flight_duration_hours" validate:"min=0,max=24"`
	MaxFlightDurationHours int            `json:"max_flight_duration_hours" validate:"min=0,max=24"`
	PreferredActivities    []ActivityType `json:"preferred_activities"`
	BudgetLevel            string         `json:"budget_level"` // "budget", "mid-range", "luxury", "any"
	TravelDates            *TravelDates   `json:"travel_dates,omitempty"`
	MaxResults             int            `json:"max_results" validate:"min=1,max=50"`
	IncludeVisaRequired    bool           `json:"include_visa_required"`
	CreatedAt              time.Time      `json:"created_at"`
}

// TravelDates represents flexible travel date preferences
type TravelDates struct {
	FlexibleDates   bool       `json:"flexible_dates"`
	DepartureStart  *time.Time `json:"departure_start,omitempty"`
	DepartureEnd    *time.Time `json:"departure_end,omitempty"`
	TripDurationDays int       `json:"trip_duration_days"` // Preferred trip length
}

// DestinationExploreResponse represents the response for destination discovery
type DestinationExploreResponse struct {
	ID                   string                      `json:"id"`
	ExploreRequestID     string                      `json:"explore_request_id"`
	RecommendedDestinations []DestinationRecommendation `json:"recommended_destinations"`
	TotalResults         int                         `json:"total_results"`
	SearchedAt           time.Time                   `json:"searched_at"`
	ProcessingTimeMs     int                         `json:"processing_time_ms"`
}

// DestinationRecommendation represents a recommended destination with routing info
type DestinationRecommendation struct {
	Destination        Destination `json:"destination"`
	FlightRoute        FlightRoute `json:"flight_route"`
	MatchScore         float64     `json:"match_score"` // 0-100 based on user preferences
	ActivityMatches    []ActivityType `json:"activity_matches"`
	ReasonForRecommendation string   `json:"reason_for_recommendation"`
	EstimatedFlightPrice   string   `json:"estimated_flight_price,omitempty"`
}

// NewDestination creates a new destination with default values
func NewDestination(airportCode, cityName, countryName, countryCode string) *Destination {
	return &Destination{
		ID:              uuid.New().String(),
		AirportCode:     airportCode,
		CityName:        cityName,
		CountryName:     countryName,
		CountryCode:     countryCode,
		Activities:      []ActivityInfo{},
		PopularityScore: 0.0,
		BestTimeToVisit: []string{},
		Language:        []string{},
		VisaRequired:    false,
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
	}
}

// NewFlightRoute creates a new flight route from CSV data
func NewFlightRoute(origin, destination string, hours, minutes int) *FlightRoute {
	totalMinutes := hours*60 + minutes
	return &FlightRoute{
		ID:                     uuid.New().String(),
		OriginAirportCode:      origin,
		DestinationAirportCode: destination,
		EstimatedDurationHours: hours,
		EstimatedDurationMinutes: minutes,
		TotalDurationMinutes:   totalMinutes,
		CreatedAt:              time.Now(),
		UpdatedAt:              time.Now(),
	}
}

// NewDestinationExploreRequest creates a new destination explore request
func NewDestinationExploreRequest(origin string, minHours, maxHours int, activities []ActivityType) *DestinationExploreRequest {
	return &DestinationExploreRequest{
		ID:                     uuid.New().String(),
		OriginAirportCode:      origin,
		MinFlightDurationHours: minHours,
		MaxFlightDurationHours: maxHours,
		PreferredActivities:    activities,
		BudgetLevel:            "any",
		MaxResults:             20,
		IncludeVisaRequired:    false,
		CreatedAt:              time.Now(),
	}
}

// GetTotalDurationHours returns the total flight duration in hours as a float
func (r *FlightRoute) GetTotalDurationHours() float64 {
	return float64(r.TotalDurationMinutes) / 60.0
}

// MatchesPreferences calculates how well a destination matches the explore request preferences
func (d *Destination) MatchesPreferences(req *DestinationExploreRequest) float64 {
	score := 0.0
	maxScore := 0.0

	// Activity preference matching (60% of score)
	if len(req.PreferredActivities) > 0 {
		activityScore := 0.0
		for _, prefActivity := range req.PreferredActivities {
			for _, destActivity := range d.Activities {
				if destActivity.Type == prefActivity {
					activityScore += destActivity.Score
					break
				}
			}
		}
		score += (activityScore / float64(len(req.PreferredActivities))) * 6.0
		maxScore += 6.0
	}

	// Budget level matching (20% of score)
	if req.BudgetLevel != "any" && d.Budget.Level == req.BudgetLevel {
		score += 2.0
	}
	maxScore += 2.0

	// Visa requirement consideration (10% of score)
	if !req.IncludeVisaRequired && !d.VisaRequired {
		score += 1.0
	} else if req.IncludeVisaRequired {
		score += 1.0
	}
	maxScore += 1.0

	// Popularity score (10% of score)
	score += (d.PopularityScore / 100.0) * 1.0
	maxScore += 1.0

	if maxScore == 0 {
		return 0
	}
	return (score / maxScore) * 100.0
}

// HasActivity checks if the destination offers a specific activity type
func (d *Destination) HasActivity(activityType ActivityType) bool {
	for _, activity := range d.Activities {
		if activity.Type == activityType {
			return true
		}
	}
	return false
}

// GetActivityScore returns the score for a specific activity type (0 if not available)
func (d *Destination) GetActivityScore(activityType ActivityType) float64 {
	for _, activity := range d.Activities {
		if activity.Type == activityType {
			return activity.Score
		}
	}
	return 0.0
}

// IsWithinFlightDuration checks if the flight route matches the duration preferences
func (r *FlightRoute) IsWithinFlightDuration(minHours, maxHours int) bool {
	durationHours := r.GetTotalDurationHours()
	return durationHours >= float64(minHours) && durationHours <= float64(maxHours)
}

// GetMatchingActivities returns activity types that match the request preferences
func (d *Destination) GetMatchingActivities(preferredActivities []ActivityType) []ActivityType {
	var matches []ActivityType
	for _, prefActivity := range preferredActivities {
		if d.HasActivity(prefActivity) {
			matches = append(matches, prefActivity)
		}
	}
	return matches
}