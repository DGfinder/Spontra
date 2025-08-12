package repository

import (
	"database/sql"
	"fmt"

	"spontra/pricing-service/internal/database"
	"spontra/pricing-service/internal/models"
	"github.com/google/uuid"
)

// TrackingRepository handles price tracking-related database operations
type TrackingRepository struct {
	db *database.DB
}

// NewTrackingRepository creates a new tracking repository
func NewTrackingRepository(db *database.DB) *TrackingRepository {
	return &TrackingRepository{db: db}
}

// CreatePriceTracking creates a new price tracking record
func (r *TrackingRepository) CreatePriceTracking(tracking *models.PriceTracking) error {
	query := `
		INSERT INTO price_tracking (
			id, user_id, route_id, origin_airport, destination_airport,
			departure_date, return_date, trip_type, passenger_count, cabin_class, is_active
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		RETURNING created_at, updated_at`
	
	err := r.db.QueryRow(
		query,
		tracking.ID,
		tracking.UserID,
		tracking.RouteID,
		tracking.OriginAirport,
		tracking.DestinationAirport,
		tracking.DepartureDate,
		tracking.ReturnDate,
		tracking.TripType,
		tracking.PassengerCount,
		tracking.CabinClass,
		tracking.IsActive,
	).Scan(&tracking.CreatedAt, &tracking.UpdatedAt)
	
	if err != nil {
		return fmt.Errorf("failed to create price tracking: %w", err)
	}
	
	return nil
}

// GetPriceTrackingByID retrieves a price tracking record by ID
func (r *TrackingRepository) GetPriceTrackingByID(trackingID uuid.UUID) (*models.PriceTracking, error) {
	tracking := &models.PriceTracking{}
	query := `
		SELECT id, user_id, route_id, origin_airport, destination_airport,
		       departure_date, return_date, trip_type, passenger_count, cabin_class,
		       is_active, created_at, updated_at
		FROM price_tracking
		WHERE id = $1`
	
	err := r.db.QueryRow(query, trackingID).Scan(
		&tracking.ID,
		&tracking.UserID,
		&tracking.RouteID,
		&tracking.OriginAirport,
		&tracking.DestinationAirport,
		&tracking.DepartureDate,
		&tracking.ReturnDate,
		&tracking.TripType,
		&tracking.PassengerCount,
		&tracking.CabinClass,
		&tracking.IsActive,
		&tracking.CreatedAt,
		&tracking.UpdatedAt,
	)
	
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("price tracking not found")
		}
		return nil, fmt.Errorf("failed to get price tracking: %w", err)
	}
	
	return tracking, nil
}

// GetUserPriceTracking retrieves all price tracking records for a user
func (r *TrackingRepository) GetUserPriceTracking(userID uuid.UUID) ([]models.PriceTracking, error) {
	query := `
		SELECT id, user_id, route_id, origin_airport, destination_airport,
		       departure_date, return_date, trip_type, passenger_count, cabin_class,
		       is_active, created_at, updated_at
		FROM price_tracking
		WHERE user_id = $1
		ORDER BY created_at DESC`
	
	rows, err := r.db.Query(query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to query user price tracking: %w", err)
	}
	defer rows.Close()
	
	var trackings []models.PriceTracking
	for rows.Next() {
		var tracking models.PriceTracking
		err := rows.Scan(
			&tracking.ID,
			&tracking.UserID,
			&tracking.RouteID,
			&tracking.OriginAirport,
			&tracking.DestinationAirport,
			&tracking.DepartureDate,
			&tracking.ReturnDate,
			&tracking.TripType,
			&tracking.PassengerCount,
			&tracking.CabinClass,
			&tracking.IsActive,
			&tracking.CreatedAt,
			&tracking.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan price tracking: %w", err)
		}
		trackings = append(trackings, tracking)
	}
	
	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating price tracking: %w", err)
	}
	
	return trackings, nil
}

// GetActivePriceTracking retrieves all active price tracking records
func (r *TrackingRepository) GetActivePriceTracking() ([]models.PriceTracking, error) {
	query := `
		SELECT id, user_id, route_id, origin_airport, destination_airport,
		       departure_date, return_date, trip_type, passenger_count, cabin_class,
		       is_active, created_at, updated_at
		FROM price_tracking
		WHERE is_active = TRUE
		ORDER BY created_at ASC`
	
	rows, err := r.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to query active price tracking: %w", err)
	}
	defer rows.Close()
	
	var trackings []models.PriceTracking
	for rows.Next() {
		var tracking models.PriceTracking
		err := rows.Scan(
			&tracking.ID,
			&tracking.UserID,
			&tracking.RouteID,
			&tracking.OriginAirport,
			&tracking.DestinationAirport,
			&tracking.DepartureDate,
			&tracking.ReturnDate,
			&tracking.TripType,
			&tracking.PassengerCount,
			&tracking.CabinClass,
			&tracking.IsActive,
			&tracking.CreatedAt,
			&tracking.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan price tracking: %w", err)
		}
		trackings = append(trackings, tracking)
	}
	
	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating active price tracking: %w", err)
	}
	
	return trackings, nil
}

// UpdatePriceTracking updates a price tracking record
func (r *TrackingRepository) UpdatePriceTracking(trackingID uuid.UUID, isActive bool) error {
	query := `
		UPDATE price_tracking 
		SET is_active = $1, updated_at = CURRENT_TIMESTAMP
		WHERE id = $2`
	
	result, err := r.db.Exec(query, isActive, trackingID)
	if err != nil {
		return fmt.Errorf("failed to update price tracking: %w", err)
	}
	
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}
	
	if rowsAffected == 0 {
		return fmt.Errorf("price tracking not found")
	}
	
	return nil
}

// DeletePriceTracking deletes a price tracking record
func (r *TrackingRepository) DeletePriceTracking(trackingID uuid.UUID, userID uuid.UUID) error {
	query := "DELETE FROM price_tracking WHERE id = $1 AND user_id = $2"
	result, err := r.db.Exec(query, trackingID, userID)
	if err != nil {
		return fmt.Errorf("failed to delete price tracking: %w", err)
	}
	
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}
	
	if rowsAffected == 0 {
		return fmt.Errorf("price tracking not found or unauthorized")
	}
	
	return nil
}

// DeactivatePriceTracking deactivates a price tracking record
func (r *TrackingRepository) DeactivatePriceTracking(trackingID uuid.UUID, userID uuid.UUID) error {
	query := `
		UPDATE price_tracking 
		SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
		WHERE id = $1 AND user_id = $2`
	
	result, err := r.db.Exec(query, trackingID, userID)
	if err != nil {
		return fmt.Errorf("failed to deactivate price tracking: %w", err)
	}
	
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}
	
	if rowsAffected == 0 {
		return fmt.Errorf("price tracking not found or unauthorized")
	}
	
	return nil
}

// GetUserTrackingCount returns the number of active tracking records for a user
func (r *TrackingRepository) GetUserTrackingCount(userID uuid.UUID) (int, error) {
	var count int
	query := "SELECT COUNT(*) FROM price_tracking WHERE user_id = $1 AND is_active = TRUE"
	err := r.db.QueryRow(query, userID).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("failed to get user tracking count: %w", err)
	}
	return count, nil
}

// CheckExistingTracking checks if a user already has tracking for the same route
func (r *TrackingRepository) CheckExistingTracking(userID uuid.UUID, routeID string) (bool, error) {
	var exists bool
	query := `
		SELECT EXISTS(
			SELECT 1 FROM price_tracking 
			WHERE user_id = $1 AND route_id = $2 AND is_active = TRUE
		)`
	
	err := r.db.QueryRow(query, userID, routeID).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("failed to check existing tracking: %w", err)
	}
	
	return exists, nil
}

// GetTrackingStats returns tracking statistics
func (r *TrackingRepository) GetTrackingStats() (map[string]interface{}, error) {
	stats := make(map[string]interface{})
	
	// Count active tracking records
	var activeCount int
	err := r.db.QueryRow("SELECT COUNT(*) FROM price_tracking WHERE is_active = TRUE").Scan(&activeCount)
	if err != nil {
		return nil, fmt.Errorf("failed to count active tracking: %w", err)
	}
	stats["active_tracking"] = activeCount
	
	// Count total tracking records
	var totalCount int
	err = r.db.QueryRow("SELECT COUNT(*) FROM price_tracking").Scan(&totalCount)
	if err != nil {
		return nil, fmt.Errorf("failed to count total tracking: %w", err)
	}
	stats["total_tracking"] = totalCount
	
	// Count unique users with tracking
	var uniqueUsers int
	err = r.db.QueryRow("SELECT COUNT(DISTINCT user_id) FROM price_tracking WHERE is_active = TRUE").Scan(&uniqueUsers)
	if err != nil {
		return nil, fmt.Errorf("failed to count unique users: %w", err)
	}
	stats["unique_users"] = uniqueUsers
	
	// Count unique routes being tracked
	var uniqueRoutes int
	err = r.db.QueryRow("SELECT COUNT(DISTINCT route_id) FROM price_tracking WHERE is_active = TRUE").Scan(&uniqueRoutes)
	if err != nil {
		return nil, fmt.Errorf("failed to count unique routes: %w", err)
	}
	stats["unique_routes"] = uniqueRoutes
	
	return stats, nil
}