package cassandra

import (
	"context"
	"fmt"
	"time"

	"github.com/gocql/gocql"
	"github.com/google/uuid"

	"spontra/data-ingestion-service/internal/models"
)

// initDestinationSchema initializes the destination and flight route tables
func (c *Client) initDestinationSchema() error {
	// Create flight_routes table for storing CSV duration data
	flightRoutesQuery := `
		CREATE TABLE IF NOT EXISTS flight_routes (
			id UUID,
			origin_airport_code TEXT,
			destination_airport_code TEXT,
			estimated_duration_hours INT,
			estimated_duration_minutes INT,
			total_duration_minutes INT,
			created_at TIMESTAMP,
			updated_at TIMESTAMP,
			PRIMARY KEY ((origin_airport_code), destination_airport_code, id)
		) WITH CLUSTERING ORDER BY (destination_airport_code ASC)
		AND gc_grace_seconds = 86400;
	`

	if err := c.session.Query(flightRoutesQuery).Exec(); err != nil {
		return fmt.Errorf("failed to create flight_routes table: %w", err)
	}

	// Create destinations table for storing destination metadata
	destinationsQuery := `
		CREATE TABLE IF NOT EXISTS destinations (
			id UUID,
			airport_code TEXT,
			city_name TEXT,
			country_name TEXT,
			country_code TEXT,
			description TEXT,
			image_url TEXT,
			activities TEXT, -- JSON serialized ActivityInfo array
			popularity_score DOUBLE,
			climate_info TEXT, -- JSON serialized ClimateInfo
			best_time_to_visit TEXT, -- JSON serialized string array
			budget_info TEXT, -- JSON serialized BudgetInfo
			timezone TEXT,
			language TEXT, -- JSON serialized string array
			currency TEXT,
			visa_required BOOLEAN,
			created_at TIMESTAMP,
			updated_at TIMESTAMP,
			PRIMARY KEY (airport_code)
		) WITH gc_grace_seconds = 86400;
	`

	if err := c.session.Query(destinationsQuery).Exec(); err != nil {
		return fmt.Errorf("failed to create destinations table: %w", err)
	}

	// Create flight_routes_by_duration index for duration-based queries
	flightRoutesByDurationQuery := `
		CREATE TABLE IF NOT EXISTS flight_routes_by_duration (
			origin_airport_code TEXT,
			total_duration_minutes INT,
			destination_airport_code TEXT,
			id UUID,
			estimated_duration_hours INT,
			estimated_duration_minutes INT,
			created_at TIMESTAMP,
			updated_at TIMESTAMP,
			PRIMARY KEY ((origin_airport_code), total_duration_minutes, destination_airport_code, id)
		) WITH CLUSTERING ORDER BY (total_duration_minutes ASC, destination_airport_code ASC)
		AND gc_grace_seconds = 86400;
	`

	if err := c.session.Query(flightRoutesByDurationQuery).Exec(); err != nil {
		return fmt.Errorf("failed to create flight_routes_by_duration table: %w", err)
	}

	// Create destination_explore_requests table for tracking search requests
	destinationExploreRequestsQuery := `
		CREATE TABLE IF NOT EXISTS destination_explore_requests (
			id UUID,
			origin_airport_code TEXT,
			min_flight_duration_hours INT,
			max_flight_duration_hours INT,
			preferred_activities TEXT, -- JSON serialized ActivityType array
			budget_level TEXT,
			travel_dates TEXT, -- JSON serialized TravelDates
			max_results INT,
			include_visa_required BOOLEAN,
			created_at TIMESTAMP,
			PRIMARY KEY (id)
		) WITH gc_grace_seconds = 86400
		AND default_time_to_live = 2592000; -- 30 days TTL
	`

	if err := c.session.Query(destinationExploreRequestsQuery).Exec(); err != nil {
		return fmt.Errorf("failed to create destination_explore_requests table: %w", err)
	}

	return nil
}

// StoreFlightRoutes stores flight route data in batch
func (c *Client) StoreFlightRoutes(ctx context.Context, routes []models.FlightRoute) error {
	if len(routes) == 0 {
		return nil
	}

	// Use smaller batches to avoid timeout
	batchSize := 100
	for i := 0; i < len(routes); i += batchSize {
		end := i + batchSize
		if end > len(routes) {
			end = len(routes)
		}

		batch := routes[i:end]
		if err := c.storeFlightRoutesBatch(ctx, batch); err != nil {
			return fmt.Errorf("failed to store flight routes batch %d-%d: %w", i, end, err)
		}
	}

	return nil
}

// storeFlightRoutesBatch stores a batch of flight routes
func (c *Client) storeFlightRoutesBatch(ctx context.Context, routes []models.FlightRoute) error {
	batch := c.session.NewBatch(gocql.LoggedBatch)

	for _, route := range routes {
		// Store in main flight_routes table
		query1 := `
			INSERT INTO flight_routes (
				id, origin_airport_code, destination_airport_code,
				estimated_duration_hours, estimated_duration_minutes,
				total_duration_minutes, created_at, updated_at
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
		`

		routeID, err := uuid.Parse(route.ID)
		if err != nil {
			routeID = uuid.New()
		}

		batch.Query(query1,
			routeID,
			route.OriginAirportCode,
			route.DestinationAirportCode,
			route.EstimatedDurationHours,
			route.EstimatedDurationMinutes,
			route.TotalDurationMinutes,
			route.CreatedAt,
			route.UpdatedAt,
		)

		// Store in duration-indexed table for efficient duration-based queries
		query2 := `
			INSERT INTO flight_routes_by_duration (
				origin_airport_code, total_duration_minutes, destination_airport_code,
				id, estimated_duration_hours, estimated_duration_minutes,
				created_at, updated_at
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
		`

		batch.Query(query2,
			route.OriginAirportCode,
			route.TotalDurationMinutes,
			route.DestinationAirportCode,
			routeID,
			route.EstimatedDurationHours,
			route.EstimatedDurationMinutes,
			route.CreatedAt,
			route.UpdatedAt,
		)
	}

	if err := c.session.ExecuteBatch(batch); err != nil {
		return fmt.Errorf("failed to execute flight routes batch: %w", err)
	}

	return nil
}

// GetFlightRoutesByDuration retrieves flight routes within a duration range from an origin
func (c *Client) GetFlightRoutesByDuration(ctx context.Context, origin string, minDurationMinutes, maxDurationMinutes int) ([]models.FlightRoute, error) {
	query := `
		SELECT origin_airport_code, destination_airport_code, id,
			   estimated_duration_hours, estimated_duration_minutes,
			   total_duration_minutes, created_at, updated_at
		FROM flight_routes_by_duration
		WHERE origin_airport_code = ? 
		  AND total_duration_minutes >= ? 
		  AND total_duration_minutes <= ?
		ORDER BY total_duration_minutes ASC
		LIMIT 100
	`

	iter := c.session.Query(query, origin, minDurationMinutes, maxDurationMinutes).Iter()
	defer iter.Close()

	var routes []models.FlightRoute

	var (
		originCode         string
		destinationCode    string
		id                 uuid.UUID
		durationHours      int
		durationMinutes    int
		totalMinutes       int
		createdAt          time.Time
		updatedAt          time.Time
	)

	for iter.Scan(&originCode, &destinationCode, &id, &durationHours, &durationMinutes, &totalMinutes, &createdAt, &updatedAt) {
		route := models.FlightRoute{
			ID:                     id.String(),
			OriginAirportCode:      originCode,
			DestinationAirportCode: destinationCode,
			EstimatedDurationHours: durationHours,
			EstimatedDurationMinutes: durationMinutes,
			TotalDurationMinutes:   totalMinutes,
			CreatedAt:              createdAt,
			UpdatedAt:              updatedAt,
		}
		routes = append(routes, route)
	}

	if err := iter.Close(); err != nil {
		return nil, fmt.Errorf("failed to get flight routes by duration: %w", err)
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
		WHERE origin_airport_code = ?
		ORDER BY destination_airport_code ASC
		LIMIT 500
	`

	iter := c.session.Query(query, origin).Iter()
	defer iter.Close()

	var routes []models.FlightRoute

	var (
		id                 uuid.UUID
		originCode         string
		destinationCode    string
		durationHours      int
		durationMinutes    int
		totalMinutes       int
		createdAt          time.Time
		updatedAt          time.Time
	)

	for iter.Scan(&id, &originCode, &destinationCode, &durationHours, &durationMinutes, &totalMinutes, &createdAt, &updatedAt) {
		route := models.FlightRoute{
			ID:                     id.String(),
			OriginAirportCode:      originCode,
			DestinationAirportCode: destinationCode,
			EstimatedDurationHours: durationHours,
			EstimatedDurationMinutes: durationMinutes,
			TotalDurationMinutes:   totalMinutes,
			CreatedAt:              createdAt,
			UpdatedAt:              updatedAt,
		}
		routes = append(routes, route)
	}

	if err := iter.Close(); err != nil {
		return nil, fmt.Errorf("failed to get flight routes from origin: %w", err)
	}

	return routes, nil
}

// StoreDestination stores destination data
func (c *Client) StoreDestination(ctx context.Context, destination models.Destination) error {
	// Serialize complex fields to JSON
	activitiesJSON, err := serializeToJSON(destination.Activities)
	if err != nil {
		return fmt.Errorf("failed to serialize activities: %w", err)
	}

	climateInfoJSON, err := serializeToJSON(destination.ClimateInfo)
	if err != nil {
		return fmt.Errorf("failed to serialize climate info: %w", err)
	}

	bestTimeToVisitJSON, err := serializeToJSON(destination.BestTimeToVisit)
	if err != nil {
		return fmt.Errorf("failed to serialize best time to visit: %w", err)
	}

	budgetInfoJSON, err := serializeToJSON(destination.Budget)
	if err != nil {
		return fmt.Errorf("failed to serialize budget info: %w", err)
	}

	languageJSON, err := serializeToJSON(destination.Language)
	if err != nil {
		return fmt.Errorf("failed to serialize language: %w", err)
	}

	query := `
		INSERT INTO destinations (
			id, airport_code, city_name, country_name, country_code,
			description, image_url, activities, popularity_score,
			climate_info, best_time_to_visit, budget_info, timezone,
			language, currency, visa_required, created_at, updated_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`

	destID, err := uuid.Parse(destination.ID)
	if err != nil {
		destID = uuid.New()
	}

	if err := c.session.Query(query,
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
	).Exec(); err != nil {
		return fmt.Errorf("failed to store destination: %w", err)
	}

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
		WHERE airport_code = ?
	`

	var (
		id                  uuid.UUID
		airportCodeResult   string
		cityName            string
		countryName         string
		countryCode         string
		description         string
		imageURL            string
		activitiesJSON      string
		popularityScore     float64
		climateInfoJSON     string
		bestTimeToVisitJSON string
		budgetInfoJSON      string
		timezone            string
		languageJSON        string
		currency            string
		visaRequired        bool
		createdAt           time.Time
		updatedAt           time.Time
	)

	err := c.session.Query(query, airportCode).Scan(
		&id, &airportCodeResult, &cityName, &countryName, &countryCode,
		&description, &imageURL, &activitiesJSON, &popularityScore,
		&climateInfoJSON, &bestTimeToVisitJSON, &budgetInfoJSON, &timezone,
		&languageJSON, &currency, &visaRequired, &createdAt, &updatedAt,
	)

	if err == gocql.ErrNotFound {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get destination: %w", err)
	}

	// Deserialize JSON fields
	var activities []models.ActivityInfo
	if err := deserializeFromJSON(activitiesJSON, &activities); err != nil {
		activities = []models.ActivityInfo{}
	}

	var climateInfo models.ClimateInfo
	if err := deserializeFromJSON(climateInfoJSON, &climateInfo); err != nil {
		climateInfo = models.ClimateInfo{}
	}

	var bestTimeToVisit []string
	if err := deserializeFromJSON(bestTimeToVisitJSON, &bestTimeToVisit); err != nil {
		bestTimeToVisit = []string{}
	}

	var budgetInfo models.BudgetInfo
	if err := deserializeFromJSON(budgetInfoJSON, &budgetInfo); err != nil {
		budgetInfo = models.BudgetInfo{}
	}

	var language []string
	if err := deserializeFromJSON(languageJSON, &language); err != nil {
		language = []string{}
	}

	destination := &models.Destination{
		ID:              id.String(),
		AirportCode:     airportCodeResult,
		CityName:        cityName,
		CountryName:     countryName,
		CountryCode:     countryCode,
		Description:     description,
		ImageURL:        imageURL,
		Activities:      activities,
		PopularityScore: popularityScore,
		ClimateInfo:     climateInfo,
		BestTimeToVisit: bestTimeToVisit,
		Budget:          budgetInfo,
		TimeZone:        timezone,
		Language:        language,
		Currency:        currency,
		VisaRequired:    visaRequired,
		CreatedAt:       createdAt,
		UpdatedAt:       updatedAt,
	}

	return destination, nil
}

// StoreDestinationExploreRequest stores a destination explore request
func (c *Client) StoreDestinationExploreRequest(ctx context.Context, request models.DestinationExploreRequest) error {
	preferredActivitiesJSON, err := serializeToJSON(request.PreferredActivities)
	if err != nil {
		return fmt.Errorf("failed to serialize preferred activities: %w", err)
	}

	travelDatesJSON, err := serializeToJSON(request.TravelDates)
	if err != nil {
		return fmt.Errorf("failed to serialize travel dates: %w", err)
	}

	query := `
		INSERT INTO destination_explore_requests (
			id, origin_airport_code, min_flight_duration_hours,
			max_flight_duration_hours, preferred_activities, budget_level,
			travel_dates, max_results, include_visa_required, created_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`

	requestID, err := uuid.Parse(request.ID)
	if err != nil {
		requestID = uuid.New()
	}

	if err := c.session.Query(query,
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
	).Exec(); err != nil {
		return fmt.Errorf("failed to store destination explore request: %w", err)
	}

	return nil
}