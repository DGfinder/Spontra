package cassandra

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/gocql/gocql"
	"github.com/google/uuid"

	"spontra/data-ingestion-service/internal/config"
	"spontra/data-ingestion-service/internal/models"
)

// Client represents a Cassandra client
type Client struct {
	session *gocql.Session
	config  config.CassandraConfig
}

// FlightInventory represents flight inventory data for Cassandra
type FlightInventory struct {
	ID                   uuid.UUID `db:"id"`
	FlightOfferID        string    `db:"flight_offer_id"`
	OriginCode           string    `db:"origin_code"`
	DestinationCode      string    `db:"destination_code"`
	DepartureDate        time.Time `db:"departure_date"`
	CarrierCode          string    `db:"carrier_code"`
	FlightNumber         string    `db:"flight_number"`
	Price                float64   `db:"price"`
	Currency             string    `db:"currency"`
	AvailableSeats       int       `db:"available_seats"`
	CabinClass           string    `db:"cabin_class"`
	Duration             string    `db:"duration"`
	Stops                int       `db:"stops"`
	SearchTimestamp      time.Time `db:"search_timestamp"`
	ExpiresAt            time.Time `db:"expires_at"`
	RawData              string    `db:"raw_data"`
	CreatedAt            time.Time `db:"created_at"`
	UpdatedAt            time.Time `db:"updated_at"`
}

// PriceHistory represents price history data for Cassandra
type PriceHistory struct {
	ID              uuid.UUID `db:"id"`
	Route           string    `db:"route"`
	FlightOfferID   string    `db:"flight_offer_id"`
	CarrierCode     string    `db:"carrier_code"`
	Price           float64   `db:"price"`
	Currency        string    `db:"currency"`
	PriceDate       time.Time `db:"price_date"`
	SearchTimestamp time.Time `db:"search_timestamp"`
	Provider        string    `db:"provider"`
	CreatedAt       time.Time `db:"created_at"`
}

// SearchResults represents search results cache for Cassandra
type SearchResults struct {
	ID               uuid.UUID `db:"id"`
	SearchRequestID  string    `db:"search_request_id"`
	OriginCode       string    `db:"origin_code"`
	DestinationCode  string    `db:"destination_code"`
	DepartureDate    time.Time `db:"departure_date"`
	ReturnDate       *time.Time `db:"return_date"`
	Provider         string    `db:"provider"`
	ResultsCount     int       `db:"results_count"`
	SearchTimestamp  time.Time `db:"search_timestamp"`
	ExpiresAt        time.Time `db:"expires_at"`
	ResultsData      string    `db:"results_data"`
	CreatedAt        time.Time `db:"created_at"`
}

// NewClient creates a new Cassandra client
func NewClient(config config.CassandraConfig) (*Client, error) {
	cluster := gocql.NewCluster(config.Hosts...)
	cluster.Keyspace = config.Keyspace
	cluster.Consistency = gocql.Quorum
	cluster.ProtoVersion = 4
	cluster.ConnectTimeout = 10 * time.Second
	cluster.Timeout = 5 * time.Second
	cluster.RetryPolicy = &gocql.ExponentialBackoffRetryPolicy{
		Min:        100 * time.Millisecond,
		Max:        10 * time.Second,
		NumRetries: 3,
	}

	// Set authentication if provided
	if config.Username != "" && config.Password != "" {
		cluster.Authenticator = gocql.PasswordAuthenticator{
			Username: config.Username,
			Password: config.Password,
		}
	}

	session, err := cluster.CreateSession()
	if err != nil {
		return nil, fmt.Errorf("failed to create Cassandra session: %w", err)
	}

	client := &Client{
		session: session,
		config:  config,
	}

	// Initialize schema
	if err := client.initSchema(); err != nil {
		return nil, fmt.Errorf("failed to initialize schema: %w", err)
	}

	return client, nil
}

// initSchema initializes the Cassandra schema
func (c *Client) initSchema() error {
	// Create flight_inventory table
	flightInventoryQuery := `
		CREATE TABLE IF NOT EXISTS flight_inventory (
			id UUID,
			flight_offer_id TEXT,
			origin_code TEXT,
			destination_code TEXT,
			departure_date DATE,
			carrier_code TEXT,
			flight_number TEXT,
			price DOUBLE,
			currency TEXT,
			available_seats INT,
			cabin_class TEXT,
			duration TEXT,
			stops INT,
			search_timestamp TIMESTAMP,
			expires_at TIMESTAMP,
			raw_data TEXT,
			created_at TIMESTAMP,
			updated_at TIMESTAMP,
			PRIMARY KEY ((origin_code, destination_code), departure_date, search_timestamp, id)
		) WITH CLUSTERING ORDER BY (departure_date ASC, search_timestamp DESC)
		AND gc_grace_seconds = 86400
		AND default_time_to_live = 2592000;
	`

	if err := c.session.Query(flightInventoryQuery).Exec(); err != nil {
		return fmt.Errorf("failed to create flight_inventory table: %w", err)
	}

	// Create price_history table
	priceHistoryQuery := `
		CREATE TABLE IF NOT EXISTS price_history (
			id UUID,
			route TEXT,
			flight_offer_id TEXT,
			carrier_code TEXT,
			price DOUBLE,
			currency TEXT,
			price_date DATE,
			search_timestamp TIMESTAMP,
			provider TEXT,
			created_at TIMESTAMP,
			PRIMARY KEY ((route), price_date, search_timestamp, id)
		) WITH CLUSTERING ORDER BY (price_date ASC, search_timestamp DESC)
		AND gc_grace_seconds = 86400
		AND default_time_to_live = 7776000;
	`

	if err := c.session.Query(priceHistoryQuery).Exec(); err != nil {
		return fmt.Errorf("failed to create price_history table: %w", err)
	}

	// Create search_results table
	searchResultsQuery := `
		CREATE TABLE IF NOT EXISTS search_results (
			id UUID,
			search_request_id TEXT,
			origin_code TEXT,
			destination_code TEXT,
			departure_date DATE,
			return_date DATE,
			provider TEXT,
			results_count INT,
			search_timestamp TIMESTAMP,
			expires_at TIMESTAMP,
			results_data TEXT,
			created_at TIMESTAMP,
			PRIMARY KEY ((search_request_id), search_timestamp, id)
		) WITH CLUSTERING ORDER BY (search_timestamp DESC)
		AND gc_grace_seconds = 86400
		AND default_time_to_live = 86400;
	`

	if err := c.session.Query(searchResultsQuery).Exec(); err != nil {
		return fmt.Errorf("failed to create search_results table: %w", err)
	}

	log.Println("Cassandra schema initialized successfully")
	return nil
}

// StoreFlightInventory stores flight inventory data
func (c *Client) StoreFlightInventory(ctx context.Context, inventory []FlightInventory) error {
	batch := c.session.NewBatch(gocql.LoggedBatch)
	
	for _, item := range inventory {
		query := `
			INSERT INTO flight_inventory (
				id, flight_offer_id, origin_code, destination_code, departure_date,
				carrier_code, flight_number, price, currency, available_seats,
				cabin_class, duration, stops, search_timestamp, expires_at,
				raw_data, created_at, updated_at
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		`
		
		batch.Query(query,
			item.ID, item.FlightOfferID, item.OriginCode, item.DestinationCode,
			item.DepartureDate, item.CarrierCode, item.FlightNumber, item.Price,
			item.Currency, item.AvailableSeats, item.CabinClass, item.Duration,
			item.Stops, item.SearchTimestamp, item.ExpiresAt, item.RawData,
			item.CreatedAt, item.UpdatedAt,
		)
	}

	if err := c.session.ExecuteBatch(batch); err != nil {
		return fmt.Errorf("failed to store flight inventory: %w", err)
	}

	return nil
}

// StoreFlightOffersFromSearch stores flight offers from search response
func (c *Client) StoreFlightOffersFromSearch(ctx context.Context, searchResp *models.FlightSearchResponse) error {
	var inventory []FlightInventory
	now := time.Now()

	for _, offer := range searchResp.FlightOffers {
		if len(offer.Itineraries) == 0 {
			continue
		}

		// Get main itinerary details
		mainItinerary := offer.Itineraries[0]
		if len(mainItinerary.Segments) == 0 {
			continue
		}

		mainSegment := mainItinerary.Segments[0]
		
		// Convert raw data to JSON
		rawData, err := json.Marshal(offer)
		if err != nil {
			log.Printf("Failed to marshal flight offer to JSON: %v", err)
			continue
		}

		item := FlightInventory{
			ID:                   uuid.New(),
			FlightOfferID:        offer.ID,
			OriginCode:           mainSegment.Departure.IataCode,
			DestinationCode:      mainSegment.Arrival.IataCode,
			DepartureDate:        mainSegment.Departure.At,
			CarrierCode:          mainSegment.CarrierCode,
			FlightNumber:         mainSegment.Number,
			Price:                float64(offer.Price.Total),
			Currency:             offer.Price.Currency,
			AvailableSeats:       offer.NumberOfBookableSeats,
			CabinClass:           offer.GetCabinClass(),
			Duration:             mainItinerary.Duration,
			Stops:                mainItinerary.NumberOfStops(),
			SearchTimestamp:      searchResp.SearchedAt,
			ExpiresAt:            searchResp.ExpiresAt,
			RawData:              string(rawData),
			CreatedAt:            now,
			UpdatedAt:            now,
		}

		inventory = append(inventory, item)
	}

	if len(inventory) > 0 {
		return c.StoreFlightInventory(ctx, inventory)
	}

	return nil
}

// StorePriceHistory stores price history data
func (c *Client) StorePriceHistory(ctx context.Context, history []PriceHistory) error {
	batch := c.session.NewBatch(gocql.LoggedBatch)
	
	for _, item := range history {
		query := `
			INSERT INTO price_history (
				id, route, flight_offer_id, carrier_code, price, currency,
				price_date, search_timestamp, provider, created_at
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		`
		
		batch.Query(query,
			item.ID, item.Route, item.FlightOfferID, item.CarrierCode,
			item.Price, item.Currency, item.PriceDate, item.SearchTimestamp,
			item.Provider, item.CreatedAt,
		)
	}

	if err := c.session.ExecuteBatch(batch); err != nil {
		return fmt.Errorf("failed to store price history: %w", err)
	}

	return nil
}

// StorePriceHistoryFromSearch stores price history from search response
func (c *Client) StorePriceHistoryFromSearch(ctx context.Context, searchResp *models.FlightSearchResponse) error {
	var history []PriceHistory
	now := time.Now()

	for _, offer := range searchResp.FlightOffers {
		if len(offer.Itineraries) == 0 {
			continue
		}

		// Get main itinerary details
		mainItinerary := offer.Itineraries[0]
		if len(mainItinerary.Segments) == 0 {
			continue
		}

		mainSegment := mainItinerary.Segments[0]
		route := fmt.Sprintf("%s-%s", mainSegment.Departure.IataCode, mainSegment.Arrival.IataCode)

		item := PriceHistory{
			ID:              uuid.New(),
			Route:           route,
			FlightOfferID:   offer.ID,
			CarrierCode:     mainSegment.CarrierCode,
			Price:           float64(offer.Price.Total),
			Currency:        offer.Price.Currency,
			PriceDate:       mainSegment.Departure.At.Truncate(24 * time.Hour),
			SearchTimestamp: searchResp.SearchedAt,
			Provider:        searchResp.Provider,
			CreatedAt:       now,
		}

		history = append(history, item)
	}

	if len(history) > 0 {
		return c.StorePriceHistory(ctx, history)
	}

	return nil
}

// StoreSearchResults stores search results cache
func (c *Client) StoreSearchResults(ctx context.Context, searchResp *models.FlightSearchResponse) error {
	// Convert results to JSON
	resultsData, err := json.Marshal(searchResp.FlightOffers)
	if err != nil {
		return fmt.Errorf("failed to marshal search results: %w", err)
	}

	item := SearchResults{
		ID:              uuid.New(),
		SearchRequestID: searchResp.SearchRequestID,
		OriginCode:      "", // Would need to get from search request
		DestinationCode: "", // Would need to get from search request
		DepartureDate:   time.Now(), // Would need to get from search request
		ReturnDate:      nil, // Would need to get from search request
		Provider:        searchResp.Provider,
		ResultsCount:    len(searchResp.FlightOffers),
		SearchTimestamp: searchResp.SearchedAt,
		ExpiresAt:       searchResp.ExpiresAt,
		ResultsData:     string(resultsData),
		CreatedAt:       time.Now(),
	}

	query := `
		INSERT INTO search_results (
			id, search_request_id, origin_code, destination_code,
			departure_date, return_date, provider, results_count,
			search_timestamp, expires_at, results_data, created_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`

	if err := c.session.Query(query,
		item.ID, item.SearchRequestID, item.OriginCode, item.DestinationCode,
		item.DepartureDate, item.ReturnDate, item.Provider, item.ResultsCount,
		item.SearchTimestamp, item.ExpiresAt, item.ResultsData, item.CreatedAt,
	).Exec(); err != nil {
		return fmt.Errorf("failed to store search results: %w", err)
	}

	return nil
}

// GetFlightInventory retrieves flight inventory data
func (c *Client) GetFlightInventory(ctx context.Context, origin, destination string, departureDate time.Time) ([]FlightInventory, error) {
	query := `
		SELECT id, flight_offer_id, origin_code, destination_code, departure_date,
			   carrier_code, flight_number, price, currency, available_seats,
			   cabin_class, duration, stops, search_timestamp, expires_at,
			   raw_data, created_at, updated_at
		FROM flight_inventory
		WHERE origin_code = ? AND destination_code = ? AND departure_date = ?
		ORDER BY search_timestamp DESC
		LIMIT 100
	`

	iter := c.session.Query(query, origin, destination, departureDate).Iter()
	defer iter.Close()

	var inventory []FlightInventory
	var item FlightInventory

	for iter.Scan(
		&item.ID, &item.FlightOfferID, &item.OriginCode, &item.DestinationCode,
		&item.DepartureDate, &item.CarrierCode, &item.FlightNumber, &item.Price,
		&item.Currency, &item.AvailableSeats, &item.CabinClass, &item.Duration,
		&item.Stops, &item.SearchTimestamp, &item.ExpiresAt, &item.RawData,
		&item.CreatedAt, &item.UpdatedAt,
	) {
		inventory = append(inventory, item)
	}

	if err := iter.Close(); err != nil {
		return nil, fmt.Errorf("failed to get flight inventory: %w", err)
	}

	return inventory, nil
}

// GetPriceHistory retrieves price history for a route
func (c *Client) GetPriceHistory(ctx context.Context, route string, days int) ([]PriceHistory, error) {
	startDate := time.Now().AddDate(0, 0, -days).Truncate(24 * time.Hour)
	
	query := `
		SELECT id, route, flight_offer_id, carrier_code, price, currency,
			   price_date, search_timestamp, provider, created_at
		FROM price_history
		WHERE route = ? AND price_date >= ?
		ORDER BY price_date DESC, search_timestamp DESC
		LIMIT 1000
	`

	iter := c.session.Query(query, route, startDate).Iter()
	defer iter.Close()

	var history []PriceHistory
	var item PriceHistory

	for iter.Scan(
		&item.ID, &item.Route, &item.FlightOfferID, &item.CarrierCode,
		&item.Price, &item.Currency, &item.PriceDate, &item.SearchTimestamp,
		&item.Provider, &item.CreatedAt,
	) {
		history = append(history, item)
	}

	if err := iter.Close(); err != nil {
		return nil, fmt.Errorf("failed to get price history: %w", err)
	}

	return history, nil
}

// Close closes the Cassandra session
func (c *Client) Close() error {
	if c.session != nil {
		c.session.Close()
	}
	return nil
}

// HealthCheck checks if Cassandra is healthy
func (c *Client) HealthCheck() error {
	if err := c.session.Query("SELECT now() FROM system.local").Exec(); err != nil {
		return fmt.Errorf("Cassandra health check failed: %w", err)
	}
	return nil
}

import (
	"encoding/json"
)