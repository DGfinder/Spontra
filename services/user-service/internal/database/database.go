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

	// Create users table
	createUsersTable := `
	CREATE TABLE IF NOT EXISTS users (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		email VARCHAR(255) UNIQUE NOT NULL,
		password_hash VARCHAR(255) NOT NULL,
		first_name VARCHAR(100) NOT NULL,
		last_name VARCHAR(100) NOT NULL,
		date_of_birth DATE,
		phone_number VARCHAR(20),
		profile_image TEXT,
		is_verified BOOLEAN DEFAULT FALSE,
		created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
		last_login_at TIMESTAMP WITH TIME ZONE
	);`

	// Create user_preferences table
	createPreferencesTable := `
	CREATE TABLE IF NOT EXISTS user_preferences (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		preferred_activities TEXT[] DEFAULT '{}',
		preferred_budget_level VARCHAR(20) DEFAULT 'any',
		preferred_flight_duration JSONB DEFAULT '{"min_hours": 1, "max_hours": 12}',
		preferred_departure_time_ranges TEXT[] DEFAULT '{}',
		preferred_airports TEXT[] DEFAULT '{}',
		avoided_destinations TEXT[] DEFAULT '{}',
		preferred_languages TEXT[] DEFAULT '{"en"}',
		notification_settings JSONB DEFAULT '{"email_alerts": true, "price_alerts": true, "new_destinations": true, "weekly_digest": false}',
		privacy_settings JSONB DEFAULT '{"profile_visibility": "public", "search_history_shared": false, "travel_history_shared": false}',
		created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
		UNIQUE(user_id)
	);`

	// Create sessions table
	createSessionsTable := `
	CREATE TABLE IF NOT EXISTS sessions (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		refresh_token VARCHAR(255) NOT NULL UNIQUE,
		is_active BOOLEAN DEFAULT TRUE,
		expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
		created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
		ip_address INET,
		user_agent TEXT
	);`

	// Create indexes
	createIndexes := `
	CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
	CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
	CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
	CREATE INDEX IF NOT EXISTS idx_sessions_refresh_token ON sessions(refresh_token);
	CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
	CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
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

	DROP TRIGGER IF EXISTS update_users_updated_at ON users;
	CREATE TRIGGER update_users_updated_at
		BEFORE UPDATE ON users
		FOR EACH ROW
		EXECUTE FUNCTION update_updated_at_column();

	DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
	CREATE TRIGGER update_user_preferences_updated_at
		BEFORE UPDATE ON user_preferences
		FOR EACH ROW
		EXECUTE FUNCTION update_updated_at_column();
	`

	// Execute migrations
	migrations := []string{
		createUsersTable,
		createPreferencesTable,
		createSessionsTable,
		createIndexes,
		createUpdateTrigger,
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