package cassandra

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/gocql/gocql"
	"github.com/google/uuid"

	"spontra/data-ingestion-service/internal/models"
)

// ThemeDestination represents a destination with theme scoring for Cassandra
type ThemeDestination struct {
	ID                  uuid.UUID         `db:"id"`
	IataCode            string            `db:"iata_code"`
	CityName            string            `db:"city_name"`
	CountryName         string            `db:"country_name"`
	CountryCode         string            `db:"country_code"`
	ThemeScores         map[string]int    `db:"theme_scores"`
	Highlights          []string          `db:"highlights"`
	Description         string            `db:"description"`
	AverageFlightTime   float64           `db:"average_flight_time"`
	PriceRange          string            `db:"price_range"`
	BestMonths          []string          `db:"best_months"`
	ImageURL            string            `db:"image_url"`
	PopularityScore     float64           `db:"popularity_score"`
	Timezone            string            `db:"timezone"`
	Language            []string          `db:"language"`
	Currency            string            `db:"currency"`
	VisaRequired        bool              `db:"visa_required"`
	CreatedAt           time.Time         `db:"created_at"`
	UpdatedAt           time.Time         `db:"updated_at"`
}

// ThemeDestinationByTheme represents the theme-optimized table structure
type ThemeDestinationByTheme struct {
	ThemeName           string    `db:"theme_name"`
	ThemeScore          int       `db:"theme_score"`
	DestinationID       uuid.UUID `db:"destination_id"`
	IataCode            string    `db:"iata_code"`
	CityName            string    `db:"city_name"`
	CountryName         string    `db:"country_name"`
	CountryCode         string    `db:"country_code"`
	PriceRange          string    `db:"price_range"`
	AverageFlightTime   float64   `db:"average_flight_time"`
	CreatedAt           time.Time `db:"created_at"`
}

// StoreThemeDestination stores a single theme destination
func (c *Client) StoreThemeDestination(ctx context.Context, dest ThemeDestination) error {
	now := time.Now()
	if dest.CreatedAt.IsZero() {
		dest.CreatedAt = now
	}
	dest.UpdatedAt = now

	// Store in main destinations table
	mainQuery := `
		INSERT INTO destinations (
			id, iata_code, city_name, country_name, country_code, theme_scores,
			highlights, description, average_flight_time, price_range, best_months,
			image_url, popularity_score, timezone, language, currency, visa_required,
			created_at, updated_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`

	bestMonthsSet := make(map[string]struct{})
	for _, month := range dest.BestMonths {
		bestMonthsSet[month] = struct{}{}
	}

	languageSet := make(map[string]struct{})
	for _, lang := range dest.Language {
		languageSet[lang] = struct{}{}
	}

	if err := c.session.Query(mainQuery,
		dest.ID, dest.IataCode, dest.CityName, dest.CountryName, dest.CountryCode,
		dest.ThemeScores, dest.Highlights, dest.Description, dest.AverageFlightTime,
		dest.PriceRange, bestMonthsSet, dest.ImageURL, dest.PopularityScore,
		dest.Timezone, languageSet, dest.Currency, dest.VisaRequired,
		dest.CreatedAt, dest.UpdatedAt,
	).Exec(); err != nil {
		return fmt.Errorf("failed to store destination: %w", err)
	}

	// Store in theme-optimized tables
	for themeName, themeScore := range dest.ThemeScores {
		themeEntry := ThemeDestinationByTheme{
			ThemeName:         themeName,
			ThemeScore:        themeScore,
			DestinationID:     dest.ID,
			IataCode:          dest.IataCode,
			CityName:          dest.CityName,
			CountryName:       dest.CountryName,
			CountryCode:       dest.CountryCode,
			PriceRange:        dest.PriceRange,
			AverageFlightTime: dest.AverageFlightTime,
			CreatedAt:         now,
		}

		themeQuery := `
			INSERT INTO destinations_by_theme (
				theme_name, theme_score, destination_id, iata_code, city_name,
				country_name, country_code, price_range, average_flight_time, created_at
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		`

		if err := c.session.Query(themeQuery,
			themeEntry.ThemeName, themeEntry.ThemeScore, themeEntry.DestinationID,
			themeEntry.IataCode, themeEntry.CityName, themeEntry.CountryName,
			themeEntry.CountryCode, themeEntry.PriceRange, themeEntry.AverageFlightTime,
			themeEntry.CreatedAt,
		).Exec(); err != nil {
			return fmt.Errorf("failed to store theme entry for %s: %w", themeName, err)
		}
	}

	// Store in country aggregation table
	countryQuery := `
		INSERT INTO destinations_by_country (
			country_code, country_name, destination_id, iata_code, city_name,
			theme_scores, price_range, average_flight_time, popularity_score, created_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`

	if err := c.session.Query(countryQuery,
		dest.CountryCode, dest.CountryName, dest.ID, dest.IataCode, dest.CityName,
		dest.ThemeScores, dest.PriceRange, dest.AverageFlightTime, dest.PopularityScore,
		now,
	).Exec(); err != nil {
		return fmt.Errorf("failed to store country entry: %w", err)
	}

	return nil
}

// StoreThemeDestinations stores multiple theme destinations in batch
func (c *Client) StoreThemeDestinations(ctx context.Context, destinations []ThemeDestination) error {
	batch := c.session.NewBatch(gocql.LoggedBatch)
	now := time.Now()

	for _, dest := range destinations {
		if dest.CreatedAt.IsZero() {
			dest.CreatedAt = now
		}
		dest.UpdatedAt = now

		// Add main destinations table insert
		bestMonthsSet := make(map[string]struct{})
		for _, month := range dest.BestMonths {
			bestMonthsSet[month] = struct{}{}
		}

		languageSet := make(map[string]struct{})
		for _, lang := range dest.Language {
			languageSet[lang] = struct{}{}
		}

		mainQuery := `
			INSERT INTO destinations (
				id, iata_code, city_name, country_name, country_code, theme_scores,
				highlights, description, average_flight_time, price_range, best_months,
				image_url, popularity_score, timezone, language, currency, visa_required,
				created_at, updated_at
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		`

		batch.Query(mainQuery,
			dest.ID, dest.IataCode, dest.CityName, dest.CountryName, dest.CountryCode,
			dest.ThemeScores, dest.Highlights, dest.Description, dest.AverageFlightTime,
			dest.PriceRange, bestMonthsSet, dest.ImageURL, dest.PopularityScore,
			dest.Timezone, languageSet, dest.Currency, dest.VisaRequired,
			dest.CreatedAt, dest.UpdatedAt,
		)

		// Add theme-optimized table inserts
		for themeName, themeScore := range dest.ThemeScores {
			themeQuery := `
				INSERT INTO destinations_by_theme (
					theme_name, theme_score, destination_id, iata_code, city_name,
					country_name, country_code, price_range, average_flight_time, created_at
				) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
			`

			batch.Query(themeQuery,
				themeName, themeScore, dest.ID, dest.IataCode, dest.CityName,
				dest.CountryName, dest.CountryCode, dest.PriceRange, dest.AverageFlightTime,
				now,
			)
		}

		// Add country aggregation table insert
		countryQuery := `
			INSERT INTO destinations_by_country (
				country_code, country_name, destination_id, iata_code, city_name,
				theme_scores, price_range, average_flight_time, popularity_score, created_at
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		`

		batch.Query(countryQuery,
			dest.CountryCode, dest.CountryName, dest.ID, dest.IataCode, dest.CityName,
			dest.ThemeScores, dest.PriceRange, dest.AverageFlightTime, dest.PopularityScore,
			now,
		)
	}

	if err := c.session.ExecuteBatch(batch); err != nil {
		return fmt.Errorf("failed to store theme destinations batch: %w", err)
	}

	log.Printf("Successfully stored %d theme destinations", len(destinations))
	return nil
}

// GetDestinationsByTheme retrieves destinations for a specific theme, sorted by score
func (c *Client) GetDestinationsByTheme(ctx context.Context, theme string, limit int, minScore int) ([]ThemeDestinationByTheme, error) {
	query := `
		SELECT theme_name, theme_score, destination_id, iata_code, city_name,
			   country_name, country_code, price_range, average_flight_time, created_at
		FROM destinations_by_theme
		WHERE theme_name = ? AND theme_score >= ?
		ORDER BY theme_score DESC
		LIMIT ?
	`

	iter := c.session.Query(query, theme, minScore, limit).Iter()
	defer iter.Close()

	var destinations []ThemeDestinationByTheme
	var dest ThemeDestinationByTheme

	for iter.Scan(
		&dest.ThemeName, &dest.ThemeScore, &dest.DestinationID, &dest.IataCode,
		&dest.CityName, &dest.CountryName, &dest.CountryCode, &dest.PriceRange,
		&dest.AverageFlightTime, &dest.CreatedAt,
	) {
		destinations = append(destinations, dest)
	}

	if err := iter.Close(); err != nil {
		return nil, fmt.Errorf("failed to get destinations by theme: %w", err)
	}

	return destinations, nil
}

// GetDestinationByIataCode retrieves a full destination by IATA code
func (c *Client) GetDestinationByIataCode(ctx context.Context, iataCode string) (*ThemeDestination, error) {
	query := `
		SELECT id, iata_code, city_name, country_name, country_code, theme_scores,
			   highlights, description, average_flight_time, price_range, best_months,
			   image_url, popularity_score, timezone, language, currency, visa_required,
			   created_at, updated_at
		FROM destinations
		WHERE iata_code = ?
		LIMIT 1
	`

	var dest ThemeDestination
	var bestMonthsSet map[string]struct{}
	var languageSet map[string]struct{}

	if err := c.session.Query(query, iataCode).Scan(
		&dest.ID, &dest.IataCode, &dest.CityName, &dest.CountryName, &dest.CountryCode,
		&dest.ThemeScores, &dest.Highlights, &dest.Description, &dest.AverageFlightTime,
		&dest.PriceRange, &bestMonthsSet, &dest.ImageURL, &dest.PopularityScore,
		&dest.Timezone, &languageSet, &dest.Currency, &dest.VisaRequired,
		&dest.CreatedAt, &dest.UpdatedAt,
	); err != nil {
		if err == gocql.ErrNotFound {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get destination by IATA code: %w", err)
	}

	// Convert sets to slices
	for month := range bestMonthsSet {
		dest.BestMonths = append(dest.BestMonths, month)
	}

	for lang := range languageSet {
		dest.Language = append(dest.Language, lang)
	}

	return &dest, nil
}

// GetDestinationsByCountry retrieves all destinations for a specific country
func (c *Client) GetDestinationsByCountry(ctx context.Context, countryCode string) ([]ThemeDestination, error) {
	query := `
		SELECT country_code, country_name, destination_id, iata_code, city_name,
			   theme_scores, price_range, average_flight_time, popularity_score, created_at
		FROM destinations_by_country
		WHERE country_code = ?
	`

	iter := c.session.Query(query, countryCode).Iter()
	defer iter.Close()

	var destinations []ThemeDestination
	var dest ThemeDestination

	for iter.Scan(
		&dest.CountryCode, &dest.CountryName, &dest.ID, &dest.IataCode, &dest.CityName,
		&dest.ThemeScores, &dest.PriceRange, &dest.AverageFlightTime, &dest.PopularityScore,
		&dest.CreatedAt,
	) {
		destinations = append(destinations, dest)
	}

	if err := iter.Close(); err != nil {
		return nil, fmt.Errorf("failed to get destinations by country: %w", err)
	}

	return destinations, nil
}

// CacheRecommendations stores pre-computed recommendations in cache
func (c *Client) CacheRecommendations(ctx context.Context, cacheKey string, origin string, theme string, maxFlightHours int, recommendations interface{}) error {
	now := time.Now()
	expiresAt := now.Add(24 * time.Hour) // 24 hour cache

	recommendationsJSON, err := json.Marshal(recommendations)
	if err != nil {
		return fmt.Errorf("failed to marshal recommendations: %w", err)
	}

	query := `
		INSERT INTO destination_recommendations_cache (
			cache_key, origin_airport, theme_name, max_flight_hours,
			generation_date, recommendations_json, expires_at, created_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
	`

	if err := c.session.Query(query,
		cacheKey, origin, theme, maxFlightHours,
		now.Truncate(24*time.Hour), string(recommendationsJSON), expiresAt, now,
	).Exec(); err != nil {
		return fmt.Errorf("failed to cache recommendations: %w", err)
	}

	return nil
}

// GetCachedRecommendations retrieves cached recommendations
func (c *Client) GetCachedRecommendations(ctx context.Context, cacheKey string) (string, error) {
	query := `
		SELECT recommendations_json
		FROM destination_recommendations_cache
		WHERE cache_key = ?
		AND expires_at > ?
		LIMIT 1
	`

	var recommendationsJSON string
	if err := c.session.Query(query, cacheKey, time.Now()).Scan(&recommendationsJSON); err != nil {
		if err == gocql.ErrNotFound {
			return "", nil // Cache miss
		}
		return "", fmt.Errorf("failed to get cached recommendations: %w", err)
	}

	return recommendationsJSON, nil
}

// GetFlightRoutesFromOrigin gets all flight routes from a specific origin
func (c *Client) GetFlightRoutesFromOrigin(ctx context.Context, origin string) ([]models.FlightRoute, error) {
	query := `
		SELECT id, origin_airport_code, destination_airport_code,
			   estimated_duration_hours, estimated_duration_minutes, total_duration_minutes,
			   created_at, updated_at
		FROM flight_routes
		WHERE origin_airport_code = ?
	`

	iter := c.session.Query(query, origin).Iter()
	defer iter.Close()

	var routes []models.FlightRoute
	var route models.FlightRoute

	for iter.Scan(
		&route.ID, &route.OriginAirportCode, &route.DestinationAirportCode,
		&route.EstimatedDurationHours, &route.EstimatedDurationMinutes, &route.TotalDurationMinutes,
		&route.CreatedAt, &route.UpdatedAt,
	) {
		routes = append(routes, route)
	}

	if err := iter.Close(); err != nil {
		return nil, fmt.Errorf("failed to get flight routes from origin: %w", err)
	}

	return routes, nil
}

// InitializeThemeDefinitions populates the theme definitions table
func (c *Client) InitializeThemeDefinitions(ctx context.Context) error {
	themes := []struct {
		key         string
		name        string
		description string
		keywords    []string
	}{
		{
			key:         "party",
			name:        "Social & Entertainment",
			description: "Nightlife, bars, clubs, music festivals, food scenes, social dining experiences",
			keywords:    []string{"nightlife", "bars", "clubs", "restaurants", "music", "festivals", "social"},
		},
		{
			key:         "adventure",
			name:        "Active & Outdoor",
			description: "Hiking, extreme sports, nature activities, budget backpacking, outdoor wellness",
			keywords:    []string{"hiking", "sports", "nature", "outdoor", "backpacking", "adventure", "mountains"},
		},
		{
			key:         "learn",
			name:        "Cultural & Creative",
			description: "Museums, history, arts districts, creative scenes, digital nomad hubs, education",
			keywords:    []string{"museums", "history", "culture", "arts", "creative", "learning", "architecture"},
		},
		{
			key:         "shopping",
			name:        "Luxury & Indulgent",
			description: "Fashion, luxury shopping, spas, wellness experiences, romantic getaways, premium services",
			keywords:    []string{"shopping", "luxury", "fashion", "spas", "wellness", "romance", "premium"},
		},
		{
			key:         "beach",
			name:        "Relaxation & Family",
			description: "Coastal destinations, family activities, leisure travel, beach wellness, water sports",
			keywords:    []string{"beach", "coast", "family", "relaxation", "water", "leisure", "islands"},
		},
	}

	for _, theme := range themes {
		keywordsSet := make(map[string]struct{})
		for _, keyword := range theme.keywords {
			keywordsSet[keyword] = struct{}{}
		}

		query := `
			INSERT INTO theme_definitions (theme_key, theme_name, description, keywords, created_at)
			VALUES (?, ?, ?, ?, ?)
		`

		if err := c.session.Query(query,
			theme.key, theme.name, theme.description, keywordsSet, time.Now(),
		).Exec(); err != nil {
			log.Printf("Warning: Failed to insert theme definition for %s (might already exist): %v", theme.key, err)
		}
	}

	log.Println("Theme definitions initialized successfully")
	return nil
}