package repository

import (
	"database/sql"
	"fmt"
	"time"

	"spontra/search-service/internal/models"
)

// DurationRepository handles flight duration data access
type DurationRepository struct {
	db *sql.DB
}

// NewDurationRepository creates a new duration repository
func NewDurationRepository(db *sql.DB) *DurationRepository {
	return &DurationRepository{db: db}
}

// FlightDuration represents a flight duration record
type FlightDuration struct {
	ID                 string    `db:"id"`
	OriginAirport      string    `db:"origin_airport"`
	DestinationAirport string    `db:"destination_airport"`
	DurationMinutes    int       `db:"duration_minutes"`
	DistanceKM         int       `db:"distance_km"`
	IsDirect           bool      `db:"is_direct"`
	TypicalStops       int       `db:"typical_stops"`
	CreatedAt          time.Time `db:"created_at"`
	UpdatedAt          time.Time `db:"updated_at"`
}

// GetFlightDuration retrieves flight duration for a specific route
func (r *DurationRepository) GetFlightDuration(originAirport, destinationAirport string) (*FlightDuration, error) {
	query := `
		SELECT id, origin_airport, destination_airport, duration_minutes, distance_km, is_direct, typical_stops, created_at, updated_at
		FROM flight_durations 
		WHERE origin_airport = $1 AND destination_airport = $2`

	var duration FlightDuration
	err := r.db.QueryRow(query, originAirport, destinationAirport).Scan(
		&duration.ID,
		&duration.OriginAirport,
		&duration.DestinationAirport,
		&duration.DurationMinutes,
		&duration.DistanceKM,
		&duration.IsDirect,
		&duration.TypicalStops,
		&duration.CreatedAt,
		&duration.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("flight duration not found for route %s -> %s", originAirport, destinationAirport)
		}
		return nil, fmt.Errorf("failed to get flight duration: %w", err)
	}

	return &duration, nil
}

// GetFlightDurationsForOrigin retrieves all flight durations from a specific origin
func (r *DurationRepository) GetFlightDurationsForOrigin(originAirport string, limit int) ([]FlightDuration, error) {
	if limit <= 0 {
		limit = 50
	}

	query := `
		SELECT id, origin_airport, destination_airport, duration_minutes, distance_km, is_direct, typical_stops, created_at, updated_at
		FROM flight_durations 
		WHERE origin_airport = $1 
		ORDER BY duration_minutes ASC 
		LIMIT $2`

	rows, err := r.db.Query(query, originAirport, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to get flight durations for origin: %w", err)
	}
	defer rows.Close()

	var durations []FlightDuration
	for rows.Next() {
		var duration FlightDuration
		err := rows.Scan(
			&duration.ID,
			&duration.OriginAirport,
			&duration.DestinationAirport,
			&duration.DurationMinutes,
			&duration.DistanceKM,
			&duration.IsDirect,
			&duration.TypicalStops,
			&duration.CreatedAt,
			&duration.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan flight duration: %w", err)
		}
		durations = append(durations, duration)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("failed to iterate flight durations: %w", err)
	}

	return durations, nil
}

// GetDirectFlights retrieves only direct flights for a route
func (r *DurationRepository) GetDirectFlights(originAirport, destinationAirport string) (*FlightDuration, error) {
	query := `
		SELECT id, origin_airport, destination_airport, duration_minutes, distance_km, is_direct, typical_stops, created_at, updated_at
		FROM flight_durations 
		WHERE origin_airport = $1 AND destination_airport = $2 AND is_direct = true`

	var duration FlightDuration
	err := r.db.QueryRow(query, originAirport, destinationAirport).Scan(
		&duration.ID,
		&duration.OriginAirport,
		&duration.DestinationAirport,
		&duration.DurationMinutes,
		&duration.DistanceKM,
		&duration.IsDirect,
		&duration.TypicalStops,
		&duration.CreatedAt,
		&duration.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("no direct flights found for route %s -> %s", originAirport, destinationAirport)
		}
		return nil, fmt.Errorf("failed to get direct flight duration: %w", err)
	}

	return &duration, nil
}

// GetFlightsByDurationRange retrieves flights within a specific duration range
func (r *DurationRepository) GetFlightsByDurationRange(originAirport string, minDuration, maxDuration int, limit int) ([]FlightDuration, error) {
	if limit <= 0 {
		limit = 50
	}

	query := `
		SELECT id, origin_airport, destination_airport, duration_minutes, distance_km, is_direct, typical_stops, created_at, updated_at
		FROM flight_durations 
		WHERE origin_airport = $1 
		AND duration_minutes >= $2 
		AND duration_minutes <= $3
		ORDER BY duration_minutes ASC 
		LIMIT $4`

	rows, err := r.db.Query(query, originAirport, minDuration, maxDuration, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to get flights by duration range: %w", err)
	}
	defer rows.Close()

	var durations []FlightDuration
	for rows.Next() {
		var duration FlightDuration
		err := rows.Scan(
			&duration.ID,
			&duration.OriginAirport,
			&duration.DestinationAirport,
			&duration.DurationMinutes,
			&duration.DistanceKM,
			&duration.IsDirect,
			&duration.TypicalStops,
			&duration.CreatedAt,
			&duration.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan flight duration: %w", err)
		}
		durations = append(durations, duration)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("failed to iterate flight durations: %w", err)
	}

	return durations, nil
}

// GetPopularDestinations retrieves the most popular destinations from an origin
func (r *DurationRepository) GetPopularDestinations(originAirport string, directOnly bool, limit int) ([]FlightDuration, error) {
	if limit <= 0 {
		limit = 20
	}

	baseQuery := `
		SELECT id, origin_airport, destination_airport, duration_minutes, distance_km, is_direct, typical_stops, created_at, updated_at
		FROM flight_durations 
		WHERE origin_airport = $1`

	var args []interface{}
	args = append(args, originAirport)

	if directOnly {
		baseQuery += " AND is_direct = true"
	}

	// Order by shortest duration first (proxy for popularity)
	baseQuery += " ORDER BY duration_minutes ASC LIMIT $2"
	args = append(args, limit)

	rows, err := r.db.Query(baseQuery, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to get popular destinations: %w", err)
	}
	defer rows.Close()

	var durations []FlightDuration
	for rows.Next() {
		var duration FlightDuration
		err := rows.Scan(
			&duration.ID,
			&duration.OriginAirport,
			&duration.DestinationAirport,
			&duration.DurationMinutes,
			&duration.DistanceKM,
			&duration.IsDirect,
			&duration.TypicalStops,
			&duration.CreatedAt,
			&duration.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan popular destination: %w", err)
		}
		durations = append(durations, duration)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("failed to iterate popular destinations: %w", err)
	}

	return durations, nil
}

// GetRouteStatistics retrieves statistics for flight durations
func (r *DurationRepository) GetRouteStatistics() (map[string]interface{}, error) {
	query := `
		SELECT 
			COUNT(*) as total_routes,
			COUNT(CASE WHEN is_direct = true THEN 1 END) as direct_routes,
			COUNT(CASE WHEN is_direct = false THEN 1 END) as connection_routes,
			AVG(duration_minutes) as avg_duration,
			MIN(duration_minutes) as min_duration,
			MAX(duration_minutes) as max_duration,
			AVG(distance_km) as avg_distance,
			MIN(distance_km) as min_distance,
			MAX(distance_km) as max_distance
		FROM flight_durations`

	var stats struct {
		TotalRoutes      int64   `db:"total_routes"`
		DirectRoutes     int64   `db:"direct_routes"`
		ConnectionRoutes int64   `db:"connection_routes"`
		AvgDuration      float64 `db:"avg_duration"`
		MinDuration      int     `db:"min_duration"`
		MaxDuration      int     `db:"max_duration"`
		AvgDistance      float64 `db:"avg_distance"`
		MinDistance      int     `db:"min_distance"`
		MaxDistance      int     `db:"max_distance"`
	}

	err := r.db.QueryRow(query).Scan(
		&stats.TotalRoutes,
		&stats.DirectRoutes,
		&stats.ConnectionRoutes,
		&stats.AvgDuration,
		&stats.MinDuration,
		&stats.MaxDuration,
		&stats.AvgDistance,
		&stats.MinDistance,
		&stats.MaxDistance,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to get route statistics: %w", err)
	}

	result := map[string]interface{}{
		"total_routes":      stats.TotalRoutes,
		"direct_routes":     stats.DirectRoutes,
		"connection_routes": stats.ConnectionRoutes,
		"direct_percentage": float64(stats.DirectRoutes) / float64(stats.TotalRoutes) * 100,
		"avg_duration_minutes": stats.AvgDuration,
		"min_duration_minutes": stats.MinDuration,
		"max_duration_minutes": stats.MaxDuration,
		"avg_distance_km":      stats.AvgDistance,
		"min_distance_km":      stats.MinDistance,
		"max_distance_km":      stats.MaxDistance,
	}

	return result, nil
}

// GetAirportConnectivity returns connectivity metrics for an airport
func (r *DurationRepository) GetAirportConnectivity(airportCode string) (map[string]interface{}, error) {
	query := `
		SELECT 
			COUNT(*) as total_destinations,
			COUNT(CASE WHEN is_direct = true THEN 1 END) as direct_destinations,
			AVG(duration_minutes) as avg_flight_time,
			MIN(duration_minutes) as shortest_flight,
			MAX(duration_minutes) as longest_flight
		FROM flight_durations 
		WHERE origin_airport = $1`

	var connectivity struct {
		TotalDestinations  int64   `db:"total_destinations"`
		DirectDestinations int64   `db:"direct_destinations"`
		AvgFlightTime      float64 `db:"avg_flight_time"`
		ShortestFlight     int     `db:"shortest_flight"`
		LongestFlight      int     `db:"longest_flight"`
	}

	err := r.db.QueryRow(query, airportCode).Scan(
		&connectivity.TotalDestinations,
		&connectivity.DirectDestinations,
		&connectivity.AvgFlightTime,
		&connectivity.ShortestFlight,
		&connectivity.LongestFlight,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to get airport connectivity: %w", err)
	}

	result := map[string]interface{}{
		"airport_code":         airportCode,
		"total_destinations":   connectivity.TotalDestinations,
		"direct_destinations":  connectivity.DirectDestinations,
		"connection_percentage": float64(connectivity.TotalDestinations-connectivity.DirectDestinations) / float64(connectivity.TotalDestinations) * 100,
		"avg_flight_time_minutes": connectivity.AvgFlightTime,
		"shortest_flight_minutes": connectivity.ShortestFlight,
		"longest_flight_minutes":  connectivity.LongestFlight,
	}

	return result, nil
}

// ValidateFlightDuration checks if a flight duration exists and is reasonable
func (r *DurationRepository) ValidateFlightDuration(originAirport, destinationAirport string, requestedDuration int) (*models.DurationValidation, error) {
	duration, err := r.GetFlightDuration(originAirport, destinationAirport)
	if err != nil {
		return &models.DurationValidation{
			IsValid:   false,
			Message:   fmt.Sprintf("Route %s -> %s not found in database", originAirport, destinationAirport),
			Suggested: nil,
		}, nil
	}

	// Check if requested duration is within reasonable bounds (±20% of expected)
	tolerance := int(float64(duration.DurationMinutes) * 0.2)
	minDuration := duration.DurationMinutes - tolerance
	maxDuration := duration.DurationMinutes + tolerance

	isValid := requestedDuration >= minDuration && requestedDuration <= maxDuration

	validation := &models.DurationValidation{
		IsValid:           isValid,
		ExpectedDuration:  duration.DurationMinutes,
		RequestedDuration: requestedDuration,
		Suggested: &models.FlightSuggestion{
			OriginAirport:      duration.OriginAirport,
			DestinationAirport: duration.DestinationAirport,
			DurationMinutes:    duration.DurationMinutes,
			DistanceKM:         duration.DistanceKM,
			IsDirect:           duration.IsDirect,
			TypicalStops:       duration.TypicalStops,
		},
	}

	if !isValid {
		if requestedDuration < minDuration {
			validation.Message = fmt.Sprintf("Requested duration (%d min) too short. Expected: %d min", requestedDuration, duration.DurationMinutes)
		} else {
			validation.Message = fmt.Sprintf("Requested duration (%d min) too long. Expected: %d min", requestedDuration, duration.DurationMinutes)
		}
	} else {
		validation.Message = "Duration is within expected range"
	}

	return validation, nil
}