package database

import (
	"database/sql"
	"fmt"
	"log"
	"time"

	_ "github.com/lib/pq"
)

// DB wraps the database connection
type DB struct {
	*sql.DB
}

// NewConnection creates a new database connection
func NewConnection(databaseURL string) (*DB, error) {
	db, err := sql.Open("postgres", databaseURL)
	if err != nil {
		return nil, fmt.Errorf("failed to open database connection: %w", err)
	}

	// Configure connection pool
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(25)
	db.SetConnMaxLifetime(time.Minute * 5)

	// Test the connection
	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	log.Println("Successfully connected to PostgreSQL database")

	return &DB{db}, nil
}

// Migrate runs database migrations
func (db *DB) Migrate() error {
	log.Println("Running database migrations...")

	// Create flight_prices table
	createFlightPricesTable := `
	CREATE TABLE IF NOT EXISTS flight_prices (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		provider_name VARCHAR(100) NOT NULL,
		origin_airport VARCHAR(10) NOT NULL,
		destination_airport VARCHAR(10) NOT NULL,
		departure_date TIMESTAMP WITH TIME ZONE NOT NULL,
		return_date TIMESTAMP WITH TIME ZONE,
		price DECIMAL(10,2) NOT NULL,
		currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
		trip_type VARCHAR(20) NOT NULL DEFAULT 'oneway',
		passenger_count INTEGER NOT NULL DEFAULT 1,
		cabin_class VARCHAR(20) NOT NULL DEFAULT 'economy',
		is_refundable BOOLEAN DEFAULT FALSE,
		baggage_included BOOLEAN DEFAULT FALSE,
		direct_flight BOOLEAN DEFAULT FALSE,
		duration_minutes INTEGER,
		booking_url TEXT,
		valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
		created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
	);`

	// Create price_history table for analytics
	createPriceHistoryTable := `
	CREATE TABLE IF NOT EXISTS price_history (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		route_id VARCHAR(20) NOT NULL,
		origin_airport VARCHAR(10) NOT NULL,
		destination_airport VARCHAR(10) NOT NULL,
		date DATE NOT NULL,
		average_price DECIMAL(10,2) NOT NULL,
		min_price DECIMAL(10,2) NOT NULL,
		max_price DECIMAL(10,2) NOT NULL,
		price_count INTEGER NOT NULL,
		currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
		created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
		UNIQUE(route_id, date)
	);`

	// Create price_alerts table
	createPriceAlertsTable := `
	CREATE TABLE IF NOT EXISTS price_alerts (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		user_id UUID NOT NULL,
		origin_airport VARCHAR(10) NOT NULL,
		destination_airport VARCHAR(10) NOT NULL,
		departure_date TIMESTAMP WITH TIME ZONE NOT NULL,
		return_date TIMESTAMP WITH TIME ZONE,
		max_price DECIMAL(10,2) NOT NULL,
		currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
		trip_type VARCHAR(20) NOT NULL DEFAULT 'oneway',
		passenger_count INTEGER NOT NULL DEFAULT 1,
		cabin_class VARCHAR(20) NOT NULL DEFAULT 'economy',
		is_active BOOLEAN DEFAULT TRUE,
		notification_email VARCHAR(255) NOT NULL,
		last_triggered TIMESTAMP WITH TIME ZONE,
		trigger_count INTEGER DEFAULT 0,
		created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
		expires_at TIMESTAMP WITH TIME ZONE NOT NULL
	);`

	// Create price_tracking table
	createPriceTrackingTable := `
	CREATE TABLE IF NOT EXISTS price_tracking (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		user_id UUID NOT NULL,
		route_id VARCHAR(20) NOT NULL,
		origin_airport VARCHAR(10) NOT NULL,
		destination_airport VARCHAR(10) NOT NULL,
		departure_date TIMESTAMP WITH TIME ZONE NOT NULL,
		return_date TIMESTAMP WITH TIME ZONE,
		trip_type VARCHAR(20) NOT NULL DEFAULT 'oneway',
		passenger_count INTEGER NOT NULL DEFAULT 1,
		cabin_class VARCHAR(20) NOT NULL DEFAULT 'economy',
		is_active BOOLEAN DEFAULT TRUE,
		created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
	);`

	// Create indexes for performance
	createIndexes := `
	-- Indexes for flight_prices
	CREATE INDEX IF NOT EXISTS idx_flight_prices_route_date ON flight_prices(origin_airport, destination_airport, departure_date);
	CREATE INDEX IF NOT EXISTS idx_flight_prices_provider ON flight_prices(provider_name);
	CREATE INDEX IF NOT EXISTS idx_flight_prices_price ON flight_prices(price);
	CREATE INDEX IF NOT EXISTS idx_flight_prices_valid_until ON flight_prices(valid_until);
	CREATE INDEX IF NOT EXISTS idx_flight_prices_created_at ON flight_prices(created_at);

	-- Indexes for price_history
	CREATE INDEX IF NOT EXISTS idx_price_history_route_date ON price_history(route_id, date);
	CREATE INDEX IF NOT EXISTS idx_price_history_route ON price_history(origin_airport, destination_airport);
	CREATE INDEX IF NOT EXISTS idx_price_history_date ON price_history(date);

	-- Indexes for price_alerts
	CREATE INDEX IF NOT EXISTS idx_price_alerts_user_id ON price_alerts(user_id);
	CREATE INDEX IF NOT EXISTS idx_price_alerts_route ON price_alerts(origin_airport, destination_airport);
	CREATE INDEX IF NOT EXISTS idx_price_alerts_active ON price_alerts(is_active);
	CREATE INDEX IF NOT EXISTS idx_price_alerts_expires_at ON price_alerts(expires_at);

	-- Indexes for price_tracking
	CREATE INDEX IF NOT EXISTS idx_price_tracking_user_id ON price_tracking(user_id);
	CREATE INDEX IF NOT EXISTS idx_price_tracking_route ON price_tracking(route_id);
	CREATE INDEX IF NOT EXISTS idx_price_tracking_active ON price_tracking(is_active);
	`

	// Create trigger for updating updated_at timestamps
	createUpdateTrigger := `
	CREATE OR REPLACE FUNCTION update_updated_at_column()
	RETURNS TRIGGER AS $$
	BEGIN
		NEW.updated_at = CURRENT_TIMESTAMP;
		RETURN NEW;
	END;
	$$ language 'plpgsql';

	DROP TRIGGER IF EXISTS update_flight_prices_updated_at ON flight_prices;
	CREATE TRIGGER update_flight_prices_updated_at
		BEFORE UPDATE ON flight_prices
		FOR EACH ROW
		EXECUTE FUNCTION update_updated_at_column();

	DROP TRIGGER IF EXISTS update_price_alerts_updated_at ON price_alerts;
	CREATE TRIGGER update_price_alerts_updated_at
		BEFORE UPDATE ON price_alerts
		FOR EACH ROW
		EXECUTE FUNCTION update_updated_at_column();

	DROP TRIGGER IF EXISTS update_price_tracking_updated_at ON price_tracking;
	CREATE TRIGGER update_price_tracking_updated_at
		BEFORE UPDATE ON price_tracking
		FOR EACH ROW
		EXECUTE FUNCTION update_updated_at_column();
	`

	// Create views for common queries
	createViews := `
	-- View for current valid prices
	CREATE OR REPLACE VIEW current_flight_prices AS
	SELECT *
	FROM flight_prices
	WHERE valid_until > CURRENT_TIMESTAMP
	ORDER BY price ASC;

	-- View for active price alerts
	CREATE OR REPLACE VIEW active_price_alerts AS
	SELECT *
	FROM price_alerts
	WHERE is_active = TRUE AND expires_at > CURRENT_TIMESTAMP;

	-- View for route analytics
	CREATE OR REPLACE VIEW route_price_analytics AS
	SELECT 
		route_id,
		origin_airport,
		destination_airport,
		COUNT(*) as data_points,
		AVG(average_price) as overall_avg_price,
		MIN(min_price) as lowest_price,
		MAX(max_price) as highest_price,
		STDDEV(average_price) as price_volatility,
		MIN(date) as first_recorded,
		MAX(date) as last_recorded
	FROM price_history
	GROUP BY route_id, origin_airport, destination_airport;
	`

	// Execute migrations
	migrations := []string{
		createFlightPricesTable,
		createPriceHistoryTable,
		createPriceAlertsTable,
		createPriceTrackingTable,
		createIndexes,
		createUpdateTrigger,
		createViews,
	}

	for i, migration := range migrations {
		if _, err := db.Exec(migration); err != nil {
			return fmt.Errorf("failed to execute migration %d: %w", i+1, err)
		}
	}

	log.Println("Database migrations completed successfully")
	return nil
}

// Close closes the database connection
func (db *DB) Close() error {
	return db.DB.Close()
}

// HealthCheck checks if the database is healthy
func (db *DB) HealthCheck() error {
	return db.Ping()
}

// CleanupExpiredPrices removes expired price records
func (db *DB) CleanupExpiredPrices() error {
	query := "DELETE FROM flight_prices WHERE valid_until < CURRENT_TIMESTAMP"
	result, err := db.Exec(query)
	if err != nil {
		return fmt.Errorf("failed to cleanup expired prices: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected > 0 {
		log.Printf("Cleaned up %d expired price records", rowsAffected)
	}

	return nil
}

// CleanupExpiredAlerts removes expired price alerts
func (db *DB) CleanupExpiredAlerts() error {
	query := "UPDATE price_alerts SET is_active = FALSE WHERE expires_at < CURRENT_TIMESTAMP AND is_active = TRUE"
	result, err := db.Exec(query)
	if err != nil {
		return fmt.Errorf("failed to cleanup expired alerts: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected > 0 {
		log.Printf("Deactivated %d expired price alerts", rowsAffected)
	}

	return nil
}