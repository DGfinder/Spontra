package database

import (
	"database/sql"
	"fmt"
	"log"
	"time"

	_ "github.com/lib/pq"
	"spontra/search-service/internal/config"
)

// Database represents the database connection
type Database struct {
	DB *sql.DB
}

// NewDatabase creates a new database connection
func NewDatabase(cfg *config.Config) (*Database, error) {
	db, err := sql.Open("postgres", cfg.DatabaseURL)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	// Configure connection pool
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(25)
	db.SetConnMaxLifetime(5 * time.Minute)

	// Test connection
	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	log.Println("Database connection established")

	return &Database{DB: db}, nil
}

// Close closes the database connection
func (d *Database) Close() error {
	if d.DB != nil {
		return d.DB.Close()
	}
	return nil
}

// CreateTables creates the necessary database tables
func (d *Database) CreateTables() error {
	queries := []string{
		createSearchSessionsTable,
		createSearchHistoryTable,
		createFlightDurationsTable,
		createFlightDurationsIndex,
		createSearchSessionsIndex,
		createSearchHistoryIndex,
	}

	for _, query := range queries {
		if _, err := d.DB.Exec(query); err != nil {
			return fmt.Errorf("failed to execute query: %w", err)
		}
	}

	log.Println("Database tables created successfully")
	return nil
}

const createSearchSessionsTable = `
CREATE TABLE IF NOT EXISTS search_sessions (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	user_id UUID,
	session_id VARCHAR(255) NOT NULL,
	created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
	expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
	is_active BOOLEAN DEFAULT TRUE,
	search_count INTEGER DEFAULT 0,
	last_search_at TIMESTAMP WITH TIME ZONE,
	ip_address INET,
	user_agent TEXT
);`

const createSearchHistoryTable = `
CREATE TABLE IF NOT EXISTS search_history (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	search_id UUID NOT NULL,
	user_id UUID,
	session_id VARCHAR(255) NOT NULL,
	request JSONB NOT NULL,
	result_count INTEGER DEFAULT 0,
	best_price DECIMAL(10,2),
	currency VARCHAR(3) DEFAULT 'EUR',
	created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
	expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);`

const createFlightDurationsTable = `
CREATE TABLE IF NOT EXISTS flight_durations (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	origin_airport VARCHAR(3) NOT NULL,
	destination_airport VARCHAR(3) NOT NULL,
	duration_minutes INTEGER NOT NULL,
	distance_km INTEGER,
	is_direct BOOLEAN DEFAULT TRUE,
	typical_stops INTEGER DEFAULT 0,
	created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);`

const createFlightDurationsIndex = `
CREATE INDEX IF NOT EXISTS idx_flight_durations_route 
ON flight_durations(origin_airport, destination_airport);`

const createSearchSessionsIndex = `
CREATE INDEX IF NOT EXISTS idx_search_sessions_user_id ON search_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_search_sessions_session_id ON search_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_search_sessions_expires_at ON search_sessions(expires_at);`

const createSearchHistoryIndex = `
CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_session_id ON search_history(session_id);
CREATE INDEX IF NOT EXISTS idx_search_history_search_id ON search_history(search_id);
CREATE INDEX IF NOT EXISTS idx_search_history_created_at ON search_history(created_at);`