package repository

import (
	"database/sql"
	"fmt"
	"strings"
	"time"

	"spontra/pricing-service/internal/database"
	"spontra/pricing-service/internal/models"
	"github.com/shopspring/decimal"
)

// PriceRepository handles price-related database operations
type PriceRepository struct {
	db *database.DB
}

// NewPriceRepository creates a new price repository
func NewPriceRepository(db *database.DB) *PriceRepository {
	return &PriceRepository{db: db}
}

// CreateFlightPrice creates a new flight price record
func (r *PriceRepository) CreateFlightPrice(price *models.FlightPrice) error {
	query := `
		INSERT INTO flight_prices (
			id, provider_name, origin_airport, destination_airport, departure_date, 
			return_date, price, currency, trip_type, passenger_count, cabin_class,
			is_refundable, baggage_included, direct_flight, duration_minutes,
			booking_url, valid_until
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
		RETURNING created_at, updated_at`
	
	err := r.db.QueryRow(
		query,
		price.ID,
		price.ProviderName,
		price.OriginAirport,
		price.DestinationAirport,
		price.DepartureDate,
		price.ReturnDate,
		price.Price,
		price.Currency,
		price.TripType,
		price.PassengerCount,
		price.CabinClass,
		price.IsRefundable,
		price.BaggageIncluded,
		price.DirectFlight,
		price.Duration,
		price.BookingURL,
		price.ValidUntil,
	).Scan(&price.CreatedAt, &price.UpdatedAt)
	
	if err != nil {
		return fmt.Errorf("failed to create flight price: %w", err)
	}
	
	return nil
}

// GetFlightPrices retrieves flight prices based on search criteria
func (r *PriceRepository) GetFlightPrices(req *models.PriceComparisonRequest) ([]models.FlightPrice, error) {
	query := `
		SELECT id, provider_name, origin_airport, destination_airport, departure_date,
		       return_date, price, currency, trip_type, passenger_count, cabin_class,
		       is_refundable, baggage_included, direct_flight, duration_minutes,
		       booking_url, valid_until, created_at, updated_at
		FROM current_flight_prices
		WHERE origin_airport = $1 
		  AND destination_airport = $2
		  AND departure_date::date = $3::date
		  AND trip_type = $4
		  AND passenger_count = $5`
	
	args := []interface{}{
		req.OriginAirport,
		req.DestinationAirport,
		req.DepartureDate,
		req.TripType,
		req.PassengerCount,
	}
	
	// Add optional filters
	argIndex := 6
	if req.CabinClass != "" {
		query += fmt.Sprintf(" AND cabin_class = $%d", argIndex)
		args = append(args, req.CabinClass)
		argIndex++
	}
	
	if req.ReturnDate != nil {
		query += fmt.Sprintf(" AND return_date::date = $%d::date", argIndex)
		args = append(args, *req.ReturnDate)
		argIndex++
	}
	
	if len(req.Providers) > 0 {
		placeholders := make([]string, len(req.Providers))
		for i := range req.Providers {
			placeholders[i] = fmt.Sprintf("$%d", argIndex+i)
		}
		query += fmt.Sprintf(" AND provider_name IN (%s)", strings.Join(placeholders, ","))
		for _, provider := range req.Providers {
			args = append(args, provider)
		}
		argIndex += len(req.Providers)
	}
	
	// Order by price and limit results
	query += " ORDER BY price ASC"
	if req.MaxResults > 0 {
		query += fmt.Sprintf(" LIMIT $%d", argIndex)
		args = append(args, req.MaxResults)
	}
	
	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query flight prices: %w", err)
	}
	defer rows.Close()
	
	var prices []models.FlightPrice
	for rows.Next() {
		var price models.FlightPrice
		err := rows.Scan(
			&price.ID,
			&price.ProviderName,
			&price.OriginAirport,
			&price.DestinationAirport,
			&price.DepartureDate,
			&price.ReturnDate,
			&price.Price,
			&price.Currency,
			&price.TripType,
			&price.PassengerCount,
			&price.CabinClass,
			&price.IsRefundable,
			&price.BaggageIncluded,
			&price.DirectFlight,
			&price.Duration,
			&price.BookingURL,
			&price.ValidUntil,
			&price.CreatedAt,
			&price.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan flight price: %w", err)
		}
		prices = append(prices, price)
	}
	
	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating flight prices: %w", err)
	}
	
	return prices, nil
}

// GetPriceHistory retrieves historical price data for a route
func (r *PriceRepository) GetPriceHistory(routeID string, days int) ([]models.PriceHistory, error) {
	query := `
		SELECT id, route_id, origin_airport, destination_airport, date,
		       average_price, min_price, max_price, price_count, currency, created_at
		FROM price_history
		WHERE route_id = $1 AND date >= CURRENT_DATE - INTERVAL '%d days'
		ORDER BY date DESC`
	
	query = fmt.Sprintf(query, days)
	
	rows, err := r.db.Query(query, routeID)
	if err != nil {
		return nil, fmt.Errorf("failed to query price history: %w", err)
	}
	defer rows.Close()
	
	var history []models.PriceHistory
	for rows.Next() {
		var record models.PriceHistory
		err := rows.Scan(
			&record.ID,
			&record.RouteID,
			&record.OriginAirport,
			&record.DestinationAirport,
			&record.Date,
			&record.AveragePrice,
			&record.MinPrice,
			&record.MaxPrice,
			&record.PriceCount,
			&record.Currency,
			&record.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan price history: %w", err)
		}
		history = append(history, record)
	}
	
	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating price history: %w", err)
	}
	
	return history, nil
}

// CreatePriceHistory creates or updates a price history record
func (r *PriceRepository) CreatePriceHistory(history *models.PriceHistory) error {
	query := `
		INSERT INTO price_history (
			id, route_id, origin_airport, destination_airport, date,
			average_price, min_price, max_price, price_count, currency
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		ON CONFLICT (route_id, date)
		DO UPDATE SET
			average_price = EXCLUDED.average_price,
			min_price = EXCLUDED.min_price,
			max_price = EXCLUDED.max_price,
			price_count = EXCLUDED.price_count
		RETURNING created_at`
	
	err := r.db.QueryRow(
		query,
		history.ID,
		history.RouteID,
		history.OriginAirport,
		history.DestinationAirport,
		history.Date,
		history.AveragePrice,
		history.MinPrice,
		history.MaxPrice,
		history.PriceCount,
		history.Currency,
	).Scan(&history.CreatedAt)
	
	if err != nil {
		return fmt.Errorf("failed to create price history: %w", err)
	}
	
	return nil
}

// GetBestPrice returns the best (lowest) price for given criteria
func (r *PriceRepository) GetBestPrice(req *models.PriceComparisonRequest) (*models.FlightPrice, error) {
	prices, err := r.GetFlightPrices(req)
	if err != nil {
		return nil, err
	}
	
	if len(prices) == 0 {
		return nil, sql.ErrNoRows
	}
	
	// Prices are already ordered by price ASC, so first one is the best
	return &prices[0], nil
}

// GetPriceStatistics calculates price statistics for a route and date range
func (r *PriceRepository) GetPriceStatistics(origin, destination string, startDate, endDate time.Time) (map[string]interface{}, error) {
	query := `
		SELECT 
			COUNT(*) as total_prices,
			AVG(price) as average_price,
			MIN(price) as min_price,
			MAX(price) as max_price,
			STDDEV(price) as price_stddev,
			COUNT(DISTINCT provider_name) as provider_count
		FROM flight_prices
		WHERE origin_airport = $1 
		  AND destination_airport = $2
		  AND departure_date >= $3
		  AND departure_date <= $4
		  AND valid_until > CURRENT_TIMESTAMP`
	
	var stats struct {
		TotalPrices   int             `db:"total_prices"`
		AveragePrice  decimal.Decimal `db:"average_price"`
		MinPrice      decimal.Decimal `db:"min_price"`
		MaxPrice      decimal.Decimal `db:"max_price"`
		PriceStddev   sql.NullFloat64 `db:"price_stddev"`
		ProviderCount int             `db:"provider_count"`
	}
	
	err := r.db.QueryRow(query, origin, destination, startDate, endDate).Scan(
		&stats.TotalPrices,
		&stats.AveragePrice,
		&stats.MinPrice,
		&stats.MaxPrice,
		&stats.PriceStddev,
		&stats.ProviderCount,
	)
	
	if err != nil {
		return nil, fmt.Errorf("failed to get price statistics: %w", err)
	}
	
	result := map[string]interface{}{
		"total_prices":   stats.TotalPrices,
		"average_price":  stats.AveragePrice,
		"min_price":      stats.MinPrice,
		"max_price":      stats.MaxPrice,
		"provider_count": stats.ProviderCount,
	}
	
	if stats.PriceStddev.Valid {
		result["price_stddev"] = stats.PriceStddev.Float64
	}
	
	return result, nil
}

// DeleteExpiredPrices removes expired price records
func (r *PriceRepository) DeleteExpiredPrices() (int64, error) {
	result, err := r.db.Exec("DELETE FROM flight_prices WHERE valid_until < CURRENT_TIMESTAMP")
	if err != nil {
		return 0, fmt.Errorf("failed to delete expired prices: %w", err)
	}
	
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return 0, fmt.Errorf("failed to get rows affected: %w", err)
	}
	
	return rowsAffected, nil
}

// GetPopularRoutes returns the most searched routes
func (r *PriceRepository) GetPopularRoutes(limit int) ([]map[string]interface{}, error) {
	query := `
		SELECT 
			origin_airport,
			destination_airport,
			COUNT(*) as search_count,
			AVG(price) as avg_price,
			MIN(price) as min_price
		FROM flight_prices
		WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
		GROUP BY origin_airport, destination_airport
		ORDER BY search_count DESC
		LIMIT $1`
	
	rows, err := r.db.Query(query, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to query popular routes: %w", err)
	}
	defer rows.Close()
	
	var routes []map[string]interface{}
	for rows.Next() {
		var origin, destination string
		var searchCount int
		var avgPrice, minPrice decimal.Decimal
		
		err := rows.Scan(&origin, &destination, &searchCount, &avgPrice, &minPrice)
		if err != nil {
			return nil, fmt.Errorf("failed to scan popular route: %w", err)
		}
		
		route := map[string]interface{}{
			"origin_airport":      origin,
			"destination_airport": destination,
			"search_count":        searchCount,
			"average_price":       avgPrice,
			"min_price":          minPrice,
		}
		routes = append(routes, route)
	}
	
	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating popular routes: %w", err)
	}
	
	return routes, nil
}