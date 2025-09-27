package postgres

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"spontra/data-ingestion-service/internal/models"

	"github.com/google/uuid"
	"github.com/lib/pq"
	_ "github.com/lib/pq"
)

// Client represents a PostgreSQL client for unified Neon database
type Client struct {
	db *sql.DB
}

// NewClient creates a new PostgreSQL client
func NewClient(databaseURL string) (*Client, error) {
	db, err := sql.Open("postgres", databaseURL)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	// Configure connection pool
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(5 * time.Minute)

	// Test connection
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := db.PingContext(ctx); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	return &Client{db: db}, nil
}

// Close closes the database connection
func (c *Client) Close() error {
	if c.db != nil {
		return c.db.Close()
	}
	return nil
}

// HealthCheck checks if the database is accessible
func (c *Client) HealthCheck() error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	return c.db.PingContext(ctx)
}

// StoreFlightRoutes stores flight route data in batch
func (c *Client) StoreFlightRoutes(ctx context.Context, routes []models.FlightRoute) error {
	if len(routes) == 0 {
		return nil
	}

	tx, err := c.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	stmt, err := tx.PrepareContext(ctx, `
		INSERT INTO flight_routes (
			id, origin_airport_code, destination_airport_code,
			estimated_duration_hours, estimated_duration_minutes,
			total_duration_minutes, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		ON CONFLICT (id) DO UPDATE SET
			updated_at = EXCLUDED.updated_at
	`)
	if err != nil {
		return fmt.Errorf("failed to prepare statement: %w", err)
	}
	defer stmt.Close()

	for _, route := range routes {
		routeID := route.ID
		if routeID == "" {
			routeID = uuid.New().String()
		}

		_, err := stmt.ExecContext(ctx,
			routeID,
			route.OriginAirportCode,
			route.DestinationAirportCode,
			route.EstimatedDurationHours,
			route.EstimatedDurationMinutes,
			route.TotalDurationMinutes,
			route.CreatedAt,
			route.UpdatedAt,
		)
		if err != nil {
			return fmt.Errorf("failed to insert flight route: %w", err)
		}
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	log.Printf("Stored %d flight routes successfully", len(routes))
	return nil
}

// GetFlightRoutesByDuration retrieves flight routes within a duration range from an origin
func (c *Client) GetFlightRoutesByDuration(ctx context.Context, origin string, minDurationMinutes, maxDurationMinutes int) ([]models.FlightRoute, error) {
	query := `
		SELECT id, origin_airport_code, destination_airport_code,
			   estimated_duration_hours, estimated_duration_minutes,
			   total_duration_minutes, created_at, updated_at
		FROM flight_routes
		WHERE origin_airport_code = $1 
		  AND total_duration_minutes >= $2 
		  AND total_duration_minutes <= $3
		ORDER BY total_duration_minutes ASC
		LIMIT 100
	`

	rows, err := c.db.QueryContext(ctx, query, origin, minDurationMinutes, maxDurationMinutes)
	if err != nil {
		return nil, fmt.Errorf("failed to query flight routes by duration: %w", err)
	}
	defer rows.Close()

	var routes []models.FlightRoute
	for rows.Next() {
		var route models.FlightRoute
		err := rows.Scan(
			&route.ID,
			&route.OriginAirportCode,
			&route.DestinationAirportCode,
			&route.EstimatedDurationHours,
			&route.EstimatedDurationMinutes,
			&route.TotalDurationMinutes,
			&route.CreatedAt,
			&route.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan flight route: %w", err)
		}
		routes = append(routes, route)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating flight routes: %w", err)
	}

	return routes, nil
}

// GetFlightRoutesFromOrigin retrieves all flight routes from a specific origin
func (c *Client) GetFlightRoutesFromOrigin(ctx context.Context, origin string) ([]models.FlightRoute, error) {
	query := `
		SELECT id, origin_airport_code, destination_airport_code,
			   estimated_duration_hours, estimated_duration_minutes,
			   total_duration_minutes, created_at, updated_at
		FROM flight_routes
		WHERE origin_airport_code = $1
		ORDER BY destination_airport_code ASC
		LIMIT 500
	`

	rows, err := c.db.QueryContext(ctx, query, origin)
	if err != nil {
		return nil, fmt.Errorf("failed to query flight routes from origin: %w", err)
	}
	defer rows.Close()

	var routes []models.FlightRoute
	for rows.Next() {
		var route models.FlightRoute
		err := rows.Scan(
			&route.ID,
			&route.OriginAirportCode,
			&route.DestinationAirportCode,
			&route.EstimatedDurationHours,
			&route.EstimatedDurationMinutes,
			&route.TotalDurationMinutes,
			&route.CreatedAt,
			&route.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan flight route: %w", err)
		}
		routes = append(routes, route)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating flight routes: %w", err)
	}

	return routes, nil
}

// StoreDestination stores destination data
func (c *Client) StoreDestination(ctx context.Context, destination models.Destination) error {
	// Serialize complex fields to JSON
	activitiesJSON, err := json.Marshal(destination.Activities)
	if err != nil {
		return fmt.Errorf("failed to marshal activities: %w", err)
	}

	climateInfoJSON, err := json.Marshal(destination.ClimateInfo)
	if err != nil {
		return fmt.Errorf("failed to marshal climate info: %w", err)
	}

	bestTimeToVisitJSON, err := json.Marshal(destination.BestTimeToVisit)
	if err != nil {
		return fmt.Errorf("failed to marshal best time to visit: %w", err)
	}

	budgetInfoJSON, err := json.Marshal(destination.Budget)
	if err != nil {
		return fmt.Errorf("failed to marshal budget info: %w", err)
	}

	languageJSON, err := json.Marshal(destination.Language)
	if err != nil {
		return fmt.Errorf("failed to marshal language: %w", err)
	}

	destID := destination.ID
	if destID == "" {
		destID = uuid.New().String()
	}

	query := `
		INSERT INTO destinations (
			id, airport_code, city_name, country_name, country_code,
			description, image_url, activities, popularity_score,
			climate_info, best_time_to_visit, budget_info, timezone,
			language, currency, visa_required, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
		ON CONFLICT (airport_code) DO UPDATE SET
			city_name = EXCLUDED.city_name,
			country_name = EXCLUDED.country_name,
			description = EXCLUDED.description,
			activities = EXCLUDED.activities,
			popularity_score = EXCLUDED.popularity_score,
			updated_at = EXCLUDED.updated_at
	`

	_, err = c.db.ExecContext(ctx, query,
		destID,
		destination.AirportCode,
		destination.CityName,
		destination.CountryName,
		destination.CountryCode,
		destination.Description,
		destination.ImageURL,
		activitiesJSON,
		destination.PopularityScore,
		climateInfoJSON,
		bestTimeToVisitJSON,
		budgetInfoJSON,
		destination.TimeZone,
		languageJSON,
		destination.Currency,
		destination.VisaRequired,
		destination.CreatedAt,
		destination.UpdatedAt,
	)

	if err != nil {
		return fmt.Errorf("failed to store destination: %w", err)
	}

	log.Printf("Stored destination: %s (%s)", destination.CityName, destination.AirportCode)
	return nil
}

// GetDestination retrieves destination by airport code
func (c *Client) GetDestination(ctx context.Context, airportCode string) (*models.Destination, error) {
	query := `
		SELECT id, airport_code, city_name, country_name, country_code,
			   description, image_url, activities, popularity_score,
			   climate_info, best_time_to_visit, budget_info, timezone,
			   language, currency, visa_required, created_at, updated_at
		FROM destinations
		WHERE airport_code = $1
	`

	var destination models.Destination
	var activitiesJSON, climateInfoJSON, bestTimeToVisitJSON, budgetInfoJSON, languageJSON []byte

	err := c.db.QueryRowContext(ctx, query, airportCode).Scan(
		&destination.ID,
		&destination.AirportCode,
		&destination.CityName,
		&destination.CountryName,
		&destination.CountryCode,
		&destination.Description,
		&destination.ImageURL,
		&activitiesJSON,
		&destination.PopularityScore,
		&climateInfoJSON,
		&bestTimeToVisitJSON,
		&budgetInfoJSON,
		&destination.TimeZone,
		&languageJSON,
		&destination.Currency,
		&destination.VisaRequired,
		&destination.CreatedAt,
		&destination.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get destination: %w", err)
	}

	// Deserialize JSON fields
	if err := json.Unmarshal(activitiesJSON, &destination.Activities); err != nil {
		destination.Activities = []models.ActivityInfo{}
	}

	if err := json.Unmarshal(climateInfoJSON, &destination.ClimateInfo); err != nil {
		destination.ClimateInfo = models.ClimateInfo{}
	}

	if err := json.Unmarshal(bestTimeToVisitJSON, &destination.BestTimeToVisit); err != nil {
		destination.BestTimeToVisit = []string{}
	}

	if err := json.Unmarshal(budgetInfoJSON, &destination.Budget); err != nil {
		destination.Budget = models.BudgetInfo{}
	}

	if err := json.Unmarshal(languageJSON, &destination.Language); err != nil {
		destination.Language = []string{}
	}

	return &destination, nil
}

// StoreDestinationExploreRequest stores a destination explore request
func (c *Client) StoreDestinationExploreRequest(ctx context.Context, request models.DestinationExploreRequest) error {
	preferredActivitiesJSON, err := json.Marshal(request.PreferredActivities)
	if err != nil {
		return fmt.Errorf("failed to marshal preferred activities: %w", err)
	}

	travelDatesJSON, err := json.Marshal(request.TravelDates)
	if err != nil {
		return fmt.Errorf("failed to marshal travel dates: %w", err)
	}

	requestID := request.ID
	if requestID == "" {
		requestID = uuid.New().String()
	}

	query := `
		INSERT INTO destination_explore_requests (
			id, origin_airport_code, min_flight_duration_hours,
			max_flight_duration_hours, preferred_activities, budget_level,
			travel_dates, max_results, include_visa_required, created_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		ON CONFLICT (id) DO NOTHING
	`

	_, err = c.db.ExecContext(ctx, query,
		requestID,
		request.OriginAirportCode,
		request.MinFlightDurationHours,
		request.MaxFlightDurationHours,
		preferredActivitiesJSON,
		request.BudgetLevel,
		travelDatesJSON,
		request.MaxResults,
		request.IncludeVisaRequired,
		request.CreatedAt,
	)

	if err != nil {
		return fmt.Errorf("failed to store destination explore request: %w", err)
	}

	log.Printf("Stored destination explore request: %s", requestID)
	return nil
}

// GetCachedRecommendations retrieves cached recommendations (placeholder)
func (c *Client) GetCachedRecommendations(ctx context.Context, cacheKey string) (string, error) {
	// This could be implemented with a cache table or Redis
	// For now, return empty to indicate no cache
	return "", sql.ErrNoRows
}

// StorePriceHistoryFromSearch stores price history from flight search
func (c *Client) StorePriceHistoryFromSearch(ctx context.Context, searchResp interface{}) error {
	// Implementation depends on your search response structure
	log.Printf("Price history storage not yet implemented for PostgreSQL")
	return nil
}

// StoreFlightOffersFromSearch stores flight offers from search
func (c *Client) StoreFlightOffersFromSearch(ctx context.Context, searchResp interface{}) error {
	// Implementation depends on your search response structure
	log.Printf("Flight offers storage not yet implemented for PostgreSQL")
	return nil
}

// StoreSearchResults stores search results cache
func (c *Client) StoreSearchResults(ctx context.Context, searchResp interface{}) error {
	// Implementation depends on your search response structure
	log.Printf("Search results storage not yet implemented for PostgreSQL")
	return nil
}