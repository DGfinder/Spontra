package repository

import (
	"database/sql"
	"fmt"
	"time"

	"spontra/pricing-service/internal/database"
	"spontra/pricing-service/internal/models"
	"github.com/google/uuid"
)

// AlertRepository handles price alert-related database operations
type AlertRepository struct {
	db *database.DB
}

// NewAlertRepository creates a new alert repository
func NewAlertRepository(db *database.DB) *AlertRepository {
	return &AlertRepository{db: db}
}

// CreatePriceAlert creates a new price alert
func (r *AlertRepository) CreatePriceAlert(alert *models.PriceAlert) error {
	query := `
		INSERT INTO price_alerts (
			id, user_id, origin_airport, destination_airport, departure_date,
			return_date, max_price, currency, trip_type, passenger_count, cabin_class,
			is_active, notification_email, expires_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
		RETURNING created_at, updated_at`
	
	err := r.db.QueryRow(
		query,
		alert.ID,
		alert.UserID,
		alert.OriginAirport,
		alert.DestinationAirport,
		alert.DepartureDate,
		alert.ReturnDate,
		alert.MaxPrice,
		alert.Currency,
		alert.TripType,
		alert.PassengerCount,
		alert.CabinClass,
		alert.IsActive,
		alert.NotificationEmail,
		alert.ExpiresAt,
	).Scan(&alert.CreatedAt, &alert.UpdatedAt)
	
	if err != nil {
		return fmt.Errorf("failed to create price alert: %w", err)
	}
	
	return nil
}

// GetPriceAlertByID retrieves a price alert by ID
func (r *AlertRepository) GetPriceAlertByID(alertID uuid.UUID) (*models.PriceAlert, error) {
	alert := &models.PriceAlert{}
	query := `
		SELECT id, user_id, origin_airport, destination_airport, departure_date,
		       return_date, max_price, currency, trip_type, passenger_count, cabin_class,
		       is_active, notification_email, last_triggered, trigger_count,
		       created_at, updated_at, expires_at
		FROM price_alerts
		WHERE id = $1`
	
	err := r.db.QueryRow(query, alertID).Scan(
		&alert.ID,
		&alert.UserID,
		&alert.OriginAirport,
		&alert.DestinationAirport,
		&alert.DepartureDate,
		&alert.ReturnDate,
		&alert.MaxPrice,
		&alert.Currency,
		&alert.TripType,
		&alert.PassengerCount,
		&alert.CabinClass,
		&alert.IsActive,
		&alert.NotificationEmail,
		&alert.LastTriggered,
		&alert.TriggerCount,
		&alert.CreatedAt,
		&alert.UpdatedAt,
		&alert.ExpiresAt,
	)
	
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("price alert not found")
		}
		return nil, fmt.Errorf("failed to get price alert: %w", err)
	}
	
	return alert, nil
}

// GetUserPriceAlerts retrieves all price alerts for a user
func (r *AlertRepository) GetUserPriceAlerts(userID uuid.UUID) ([]models.PriceAlert, error) {
	query := `
		SELECT id, user_id, origin_airport, destination_airport, departure_date,
		       return_date, max_price, currency, trip_type, passenger_count, cabin_class,
		       is_active, notification_email, last_triggered, trigger_count,
		       created_at, updated_at, expires_at
		FROM price_alerts
		WHERE user_id = $1
		ORDER BY created_at DESC`
	
	rows, err := r.db.Query(query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to query user price alerts: %w", err)
	}
	defer rows.Close()
	
	var alerts []models.PriceAlert
	for rows.Next() {
		var alert models.PriceAlert
		err := rows.Scan(
			&alert.ID,
			&alert.UserID,
			&alert.OriginAirport,
			&alert.DestinationAirport,
			&alert.DepartureDate,
			&alert.ReturnDate,
			&alert.MaxPrice,
			&alert.Currency,
			&alert.TripType,
			&alert.PassengerCount,
			&alert.CabinClass,
			&alert.IsActive,
			&alert.NotificationEmail,
			&alert.LastTriggered,
			&alert.TriggerCount,
			&alert.CreatedAt,
			&alert.UpdatedAt,
			&alert.ExpiresAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan price alert: %w", err)
		}
		alerts = append(alerts, alert)
	}
	
	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating price alerts: %w", err)
	}
	
	return alerts, nil
}

// GetActivePriceAlerts retrieves all active price alerts
func (r *AlertRepository) GetActivePriceAlerts() ([]models.PriceAlert, error) {
	query := `
		SELECT id, user_id, origin_airport, destination_airport, departure_date,
		       return_date, max_price, currency, trip_type, passenger_count, cabin_class,
		       is_active, notification_email, last_triggered, trigger_count,
		       created_at, updated_at, expires_at
		FROM active_price_alerts
		ORDER BY created_at ASC`
	
	rows, err := r.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to query active price alerts: %w", err)
	}
	defer rows.Close()
	
	var alerts []models.PriceAlert
	for rows.Next() {
		var alert models.PriceAlert
		err := rows.Scan(
			&alert.ID,
			&alert.UserID,
			&alert.OriginAirport,
			&alert.DestinationAirport,
			&alert.DepartureDate,
			&alert.ReturnDate,
			&alert.MaxPrice,
			&alert.Currency,
			&alert.TripType,
			&alert.PassengerCount,
			&alert.CabinClass,
			&alert.IsActive,
			&alert.NotificationEmail,
			&alert.LastTriggered,
			&alert.TriggerCount,
			&alert.CreatedAt,
			&alert.UpdatedAt,
			&alert.ExpiresAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan price alert: %w", err)
		}
		alerts = append(alerts, alert)
	}
	
	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating active price alerts: %w", err)
	}
	
	return alerts, nil
}

// UpdatePriceAlert updates a price alert
func (r *AlertRepository) UpdatePriceAlert(alertID uuid.UUID, alert *models.PriceAlert) error {
	query := `
		UPDATE price_alerts 
		SET max_price = $1, currency = $2, notification_email = $3, 
		    is_active = $4, expires_at = $5, updated_at = CURRENT_TIMESTAMP
		WHERE id = $6`
	
	result, err := r.db.Exec(
		query,
		alert.MaxPrice,
		alert.Currency,
		alert.NotificationEmail,
		alert.IsActive,
		alert.ExpiresAt,
		alertID,
	)
	
	if err != nil {
		return fmt.Errorf("failed to update price alert: %w", err)
	}
	
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}
	
	if rowsAffected == 0 {
		return fmt.Errorf("price alert not found")
	}
	
	return nil
}

// DeletePriceAlert deletes a price alert
func (r *AlertRepository) DeletePriceAlert(alertID uuid.UUID, userID uuid.UUID) error {
	query := "DELETE FROM price_alerts WHERE id = $1 AND user_id = $2"
	result, err := r.db.Exec(query, alertID, userID)
	if err != nil {
		return fmt.Errorf("failed to delete price alert: %w", err)
	}
	
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}
	
	if rowsAffected == 0 {
		return fmt.Errorf("price alert not found or unauthorized")
	}
	
	return nil
}

// TriggerAlert marks an alert as triggered
func (r *AlertRepository) TriggerAlert(alertID uuid.UUID) error {
	query := `
		UPDATE price_alerts 
		SET last_triggered = CURRENT_TIMESTAMP, 
		    trigger_count = trigger_count + 1,
		    updated_at = CURRENT_TIMESTAMP
		WHERE id = $1`
	
	result, err := r.db.Exec(query, alertID)
	if err != nil {
		return fmt.Errorf("failed to trigger alert: %w", err)
	}
	
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}
	
	if rowsAffected == 0 {
		return fmt.Errorf("price alert not found")
	}
	
	return nil
}

// DeactivateAlert deactivates a price alert
func (r *AlertRepository) DeactivateAlert(alertID uuid.UUID) error {
	query := `
		UPDATE price_alerts 
		SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
		WHERE id = $1`
	
	result, err := r.db.Exec(query, alertID)
	if err != nil {
		return fmt.Errorf("failed to deactivate alert: %w", err)
	}
	
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}
	
	if rowsAffected == 0 {
		return fmt.Errorf("price alert not found")
	}
	
	return nil
}

// GetUserAlertCount returns the number of active alerts for a user
func (r *AlertRepository) GetUserAlertCount(userID uuid.UUID) (int, error) {
	var count int
	query := "SELECT COUNT(*) FROM price_alerts WHERE user_id = $1 AND is_active = TRUE"
	err := r.db.QueryRow(query, userID).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("failed to get user alert count: %w", err)
	}
	return count, nil
}

// CleanupExpiredAlerts deactivates expired alerts
func (r *AlertRepository) CleanupExpiredAlerts() (int64, error) {
	query := `
		UPDATE price_alerts 
		SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
		WHERE is_active = TRUE AND expires_at < CURRENT_TIMESTAMP`
	
	result, err := r.db.Exec(query)
	if err != nil {
		return 0, fmt.Errorf("failed to cleanup expired alerts: %w", err)
	}
	
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return 0, fmt.Errorf("failed to get rows affected: %w", err)
	}
	
	return rowsAffected, nil
}

// GetAlertsForPriceCheck returns alerts that should be checked against new prices
func (r *AlertRepository) GetAlertsForPriceCheck(origin, destination string, departureDate time.Time) ([]models.PriceAlert, error) {
	query := `
		SELECT id, user_id, origin_airport, destination_airport, departure_date,
		       return_date, max_price, currency, trip_type, passenger_count, cabin_class,
		       is_active, notification_email, last_triggered, trigger_count,
		       created_at, updated_at, expires_at
		FROM active_price_alerts
		WHERE origin_airport = $1 
		  AND destination_airport = $2
		  AND departure_date::date = $3::date
		  AND (last_triggered IS NULL OR last_triggered < CURRENT_TIMESTAMP - INTERVAL '4 hours')`
	
	rows, err := r.db.Query(query, origin, destination, departureDate)
	if err != nil {
		return nil, fmt.Errorf("failed to query alerts for price check: %w", err)
	}
	defer rows.Close()
	
	var alerts []models.PriceAlert
	for rows.Next() {
		var alert models.PriceAlert
		err := rows.Scan(
			&alert.ID,
			&alert.UserID,
			&alert.OriginAirport,
			&alert.DestinationAirport,
			&alert.DepartureDate,
			&alert.ReturnDate,
			&alert.MaxPrice,
			&alert.Currency,
			&alert.TripType,
			&alert.PassengerCount,
			&alert.CabinClass,
			&alert.IsActive,
			&alert.NotificationEmail,
			&alert.LastTriggered,
			&alert.TriggerCount,
			&alert.CreatedAt,
			&alert.UpdatedAt,
			&alert.ExpiresAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan price alert: %w", err)
		}
		alerts = append(alerts, alert)
	}
	
	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating price alerts: %w", err)
	}
	
	return alerts, nil
}