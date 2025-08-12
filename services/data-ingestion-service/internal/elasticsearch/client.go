package elasticsearch

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"strconv"
	"strings"
	"time"

	"github.com/olivere/elastic/v7"

	"spontra/data-ingestion-service/internal/config"
	"spontra/data-ingestion-service/internal/models"
)

// Client represents an Elasticsearch client
type Client struct {
	client *elastic.Client
	config config.ElasticsearchConfig
}

// FlightDocument represents a flight document for Elasticsearch
type FlightDocument struct {
	ID                   string    `json:"id"`
	FlightOfferID        string    `json:"flight_offer_id"`
	OriginCode           string    `json:"origin_code"`
	DestinationCode      string    `json:"destination_code"`
	DepartureDate        time.Time `json:"departure_date"`
	ReturnDate           *time.Time `json:"return_date,omitempty"`
	CarrierCode          string    `json:"carrier_code"`
	CarrierName          string    `json:"carrier_name"`
	FlightNumber         string    `json:"flight_number"`
	Price                float64   `json:"price"`
	Currency             string    `json:"currency"`
	AvailableSeats       int       `json:"available_seats"`
	CabinClass           string    `json:"cabin_class"`
	Duration             string    `json:"duration"`
	DurationMinutes      int       `json:"duration_minutes"`
	Stops                int       `json:"stops"`
	IsDirectFlight       bool      `json:"is_direct_flight"`
	SearchTimestamp      time.Time `json:"search_timestamp"`
	ExpiresAt            time.Time `json:"expires_at"`
	Provider             string    `json:"provider"`
	
	// Origin details
	OriginAirport        Airport   `json:"origin_airport"`
	OriginCity           string    `json:"origin_city"`
	OriginCountry        string    `json:"origin_country"`
	DepartureTime        time.Time `json:"departure_time"`
	
	// Destination details
	DestinationAirport   Airport   `json:"destination_airport"`
	DestinationCity      string    `json:"destination_city"`
	DestinationCountry   string    `json:"destination_country"`
	ArrivalTime          time.Time `json:"arrival_time"`
	
	// Flight details
	Segments             []Segment `json:"segments"`
	TotalDistance        int       `json:"total_distance,omitempty"`
	
	// Pricing details
	BasePrice            float64   `json:"base_price"`
	TaxesAndFees         float64   `json:"taxes_and_fees"`
	
	// Amenities and features
	WiFiAvailable        bool      `json:"wifi_available"`
	MealsIncluded        bool      `json:"meals_included"`
	CheckedBagsIncluded  int       `json:"checked_bags_included"`
	
	// Timestamps
	CreatedAt            time.Time `json:"created_at"`
	UpdatedAt            time.Time `json:"updated_at"`
}

// Airport represents airport information
type Airport struct {
	IataCode    string  `json:"iata_code"`
	Name        string  `json:"name"`
	City        string  `json:"city"`
	Country     string  `json:"country"`
	CountryCode string  `json:"country_code"`
	Timezone    string  `json:"timezone"`
	Latitude    float64 `json:"latitude,omitempty"`
	Longitude   float64 `json:"longitude,omitempty"`
}

// Segment represents a flight segment
type Segment struct {
	ID               string    `json:"id"`
	DepartureAirport string    `json:"departure_airport"`
	ArrivalAirport   string    `json:"arrival_airport"`
	DepartureTime    time.Time `json:"departure_time"`
	ArrivalTime      time.Time `json:"arrival_time"`
	CarrierCode      string    `json:"carrier_code"`
	FlightNumber     string    `json:"flight_number"`
	AircraftType     string    `json:"aircraft_type"`
	Duration         string    `json:"duration"`
	CabinClass       string    `json:"cabin_class"`
}

// SearchFilters represents search filters
type SearchFilters struct {
	OriginCodes         []string    `json:"origin_codes,omitempty"`
	DestinationCodes    []string    `json:"destination_codes,omitempty"`
	DepartureDateFrom   *time.Time  `json:"departure_date_from,omitempty"`
	DepartureDateTo     *time.Time  `json:"departure_date_to,omitempty"`
	ReturnDateFrom      *time.Time  `json:"return_date_from,omitempty"`
	ReturnDateTo        *time.Time  `json:"return_date_to,omitempty"`
	CarrierCodes        []string    `json:"carrier_codes,omitempty"`
	MaxPrice            *float64    `json:"max_price,omitempty"`
	MinPrice            *float64    `json:"min_price,omitempty"`
	CabinClasses        []string    `json:"cabin_classes,omitempty"`
	MaxStops            *int        `json:"max_stops,omitempty"`
	DirectFlightOnly    bool        `json:"direct_flight_only"`
	MaxDurationMinutes  *int        `json:"max_duration_minutes,omitempty"`
	Providers           []string    `json:"providers,omitempty"`
	SearchAfter         *time.Time  `json:"search_after,omitempty"`
}

// SearchOptions represents search options
type SearchOptions struct {
	From    int      `json:"from"`
	Size    int      `json:"size"`
	SortBy  string   `json:"sort_by"`
	SortDir string   `json:"sort_dir"`
}

// SearchResult represents search result
type SearchResult struct {
	Total      int64            `json:"total"`
	Documents  []FlightDocument `json:"documents"`
	Aggregations map[string]interface{} `json:"aggregations,omitempty"`
}

// NewClient creates a new Elasticsearch client
func NewClient(config config.ElasticsearchConfig) (*Client, error) {
	// Create Elasticsearch client
	clientOptions := []elastic.ClientOptionFunc{
		elastic.SetURL(config.URLs...),
		elastic.SetRetrier(elastic.NewBackoffRetrier(elastic.NewExponentialBackoff(100*time.Millisecond, 5*time.Second))),
		elastic.SetGzip(true),
		elastic.SetHealthcheckInterval(10*time.Second),
		elastic.SetSniff(false),
	}

	// Add authentication if provided
	if config.Username != "" && config.Password != "" {
		clientOptions = append(clientOptions, elastic.SetBasicAuth(config.Username, config.Password))
	}

	client, err := elastic.NewClient(clientOptions...)
	if err != nil {
		return nil, fmt.Errorf("failed to create Elasticsearch client: %w", err)
	}

	esClient := &Client{
		client: client,
		config: config,
	}

	// Initialize index
	if err := esClient.initIndex(); err != nil {
		return nil, fmt.Errorf("failed to initialize index: %w", err)
	}

	return esClient, nil
}

// initIndex initializes the Elasticsearch index
func (c *Client) initIndex() error {
	ctx := context.Background()
	
	// Check if index exists
	exists, err := c.client.IndexExists(c.config.Index).Do(ctx)
	if err != nil {
		return fmt.Errorf("failed to check index existence: %w", err)
	}

	if !exists {
		// Create index with mapping
		mapping := `{
			"settings": {
				"number_of_shards": 3,
				"number_of_replicas": 1,
				"analysis": {
					"analyzer": {
						"flight_analyzer": {
							"type": "custom",
							"tokenizer": "standard",
							"filter": ["lowercase", "stop"]
						}
					}
				}
			},
			"mappings": {
				"properties": {
					"id": {"type": "keyword"},
					"flight_offer_id": {"type": "keyword"},
					"origin_code": {"type": "keyword"},
					"destination_code": {"type": "keyword"},
					"departure_date": {"type": "date"},
					"return_date": {"type": "date"},
					"carrier_code": {"type": "keyword"},
					"carrier_name": {"type": "text", "analyzer": "flight_analyzer"},
					"flight_number": {"type": "keyword"},
					"price": {"type": "double"},
					"currency": {"type": "keyword"},
					"available_seats": {"type": "integer"},
					"cabin_class": {"type": "keyword"},
					"duration": {"type": "keyword"},
					"duration_minutes": {"type": "integer"},
					"stops": {"type": "integer"},
					"is_direct_flight": {"type": "boolean"},
					"search_timestamp": {"type": "date"},
					"expires_at": {"type": "date"},
					"provider": {"type": "keyword"},
					"origin_airport": {
						"properties": {
							"iata_code": {"type": "keyword"},
							"name": {"type": "text", "analyzer": "flight_analyzer"},
							"city": {"type": "text", "analyzer": "flight_analyzer"},
							"country": {"type": "text", "analyzer": "flight_analyzer"},
							"country_code": {"type": "keyword"},
							"timezone": {"type": "keyword"},
							"latitude": {"type": "double"},
							"longitude": {"type": "double"}
						}
					},
					"origin_city": {"type": "text", "analyzer": "flight_analyzer"},
					"origin_country": {"type": "text", "analyzer": "flight_analyzer"},
					"departure_time": {"type": "date"},
					"destination_airport": {
						"properties": {
							"iata_code": {"type": "keyword"},
							"name": {"type": "text", "analyzer": "flight_analyzer"},
							"city": {"type": "text", "analyzer": "flight_analyzer"},
							"country": {"type": "text", "analyzer": "flight_analyzer"},
							"country_code": {"type": "keyword"},
							"timezone": {"type": "keyword"},
							"latitude": {"type": "double"},
							"longitude": {"type": "double"}
						}
					},
					"destination_city": {"type": "text", "analyzer": "flight_analyzer"},
					"destination_country": {"type": "text", "analyzer": "flight_analyzer"},
					"arrival_time": {"type": "date"},
					"segments": {
						"type": "nested",
						"properties": {
							"id": {"type": "keyword"},
							"departure_airport": {"type": "keyword"},
							"arrival_airport": {"type": "keyword"},
							"departure_time": {"type": "date"},
							"arrival_time": {"type": "date"},
							"carrier_code": {"type": "keyword"},
							"flight_number": {"type": "keyword"},
							"aircraft_type": {"type": "keyword"},
							"duration": {"type": "keyword"},
							"cabin_class": {"type": "keyword"}
						}
					},
					"total_distance": {"type": "integer"},
					"base_price": {"type": "double"},
					"taxes_and_fees": {"type": "double"},
					"wifi_available": {"type": "boolean"},
					"meals_included": {"type": "boolean"},
					"checked_bags_included": {"type": "integer"},
					"created_at": {"type": "date"},
					"updated_at": {"type": "date"}
				}
			}
		}`

		_, err := c.client.CreateIndex(c.config.Index).BodyString(mapping).Do(ctx)
		if err != nil {
			return fmt.Errorf("failed to create index: %w", err)
		}

		log.Printf("Elasticsearch index '%s' created successfully", c.config.Index)
	}

	return nil
}

// IndexFlightDocuments indexes flight documents
func (c *Client) IndexFlightDocuments(ctx context.Context, documents []FlightDocument) error {
	if len(documents) == 0 {
		return nil
	}

	bulkRequest := c.client.Bulk().Index(c.config.Index)

	for _, doc := range documents {
		req := elastic.NewBulkIndexRequest().Id(doc.ID).Doc(doc)
		bulkRequest = bulkRequest.Add(req)
	}

	bulkResponse, err := bulkRequest.Do(ctx)
	if err != nil {
		return fmt.Errorf("failed to index documents: %w", err)
	}

	if bulkResponse.Errors {
		var errorMessages []string
		for _, item := range bulkResponse.Items {
			for _, result := range item {
				if result.Error != nil {
					errorMessages = append(errorMessages, result.Error.Reason)
				}
			}
		}
		return fmt.Errorf("bulk indexing errors: %s", strings.Join(errorMessages, "; "))
	}

	log.Printf("Indexed %d flight documents successfully", len(documents))
	return nil
}

// IndexFlightOffersFromSearch indexes flight offers from search response
func (c *Client) IndexFlightOffersFromSearch(ctx context.Context, searchResp *models.FlightSearchResponse) error {
	var documents []FlightDocument
	now := time.Now()

	for _, offer := range searchResp.FlightOffers {
		doc := c.convertFlightOfferToDocument(&offer, searchResp, now)
		documents = append(documents, doc)
	}

	if len(documents) > 0 {
		return c.IndexFlightDocuments(ctx, documents)
	}

	return nil
}

// convertFlightOfferToDocument converts a flight offer to an Elasticsearch document
func (c *Client) convertFlightOfferToDocument(offer *models.FlightOffer, searchResp *models.FlightSearchResponse, now time.Time) FlightDocument {
	doc := FlightDocument{
		ID:                offer.ID,
		FlightOfferID:     offer.ID,
		Price:             offer.Price.Total.InexactFloat64(),
		Currency:          offer.Price.Currency,
		AvailableSeats:    offer.NumberOfBookableSeats,
		CabinClass:        offer.GetCabinClass(),
		SearchTimestamp:   searchResp.SearchedAt,
		ExpiresAt:         searchResp.ExpiresAt,
		Provider:          searchResp.Provider,
		BasePrice:         offer.Price.Base.InexactFloat64(),
		TaxesAndFees:      offer.Price.Total.InexactFloat64() - offer.Price.Base.InexactFloat64(),
		CreatedAt:         now,
		UpdatedAt:         now,
	}

	// Process outbound itinerary
	if outbound := offer.GetOutboundItinerary(); outbound != nil {
		doc.Duration = outbound.Duration
		doc.DurationMinutes = parseDurationToMinutes(outbound.Duration)
		doc.Stops = outbound.NumberOfStops()
		doc.IsDirectFlight = outbound.IsDirectFlight()

		if len(outbound.Segments) > 0 {
			firstSegment := outbound.Segments[0]
			lastSegment := outbound.Segments[len(outbound.Segments)-1]

			// Set flight details from main segment
			doc.OriginCode = firstSegment.Departure.IataCode
			doc.DestinationCode = lastSegment.Arrival.IataCode
			doc.DepartureDate = firstSegment.Departure.At
			doc.DepartureTime = firstSegment.Departure.At
			doc.ArrivalTime = lastSegment.Arrival.At
			doc.CarrierCode = firstSegment.CarrierCode
			doc.FlightNumber = firstSegment.Number

			// Set airport details
			doc.OriginAirport = Airport{
				IataCode:    firstSegment.Departure.Airport.IataCode,
				Name:        firstSegment.Departure.Airport.Name,
				City:        firstSegment.Departure.Airport.City,
				Country:     firstSegment.Departure.Airport.Country,
				CountryCode: firstSegment.Departure.Airport.CountryCode,
				Timezone:    firstSegment.Departure.Airport.Timezone,
				Latitude:    firstSegment.Departure.Airport.Latitude,
				Longitude:   firstSegment.Departure.Airport.Longitude,
			}

			doc.DestinationAirport = Airport{
				IataCode:    lastSegment.Arrival.Airport.IataCode,
				Name:        lastSegment.Arrival.Airport.Name,
				City:        lastSegment.Arrival.Airport.City,
				Country:     lastSegment.Arrival.Airport.Country,
				CountryCode: lastSegment.Arrival.Airport.CountryCode,
				Timezone:    lastSegment.Arrival.Airport.Timezone,
				Latitude:    lastSegment.Arrival.Airport.Latitude,
				Longitude:   lastSegment.Arrival.Airport.Longitude,
			}

			doc.OriginCity = firstSegment.Departure.Airport.City
			doc.OriginCountry = firstSegment.Departure.Airport.Country
			doc.DestinationCity = lastSegment.Arrival.Airport.City
			doc.DestinationCountry = lastSegment.Arrival.Airport.Country

			// Convert segments
			for _, segment := range outbound.Segments {
				doc.Segments = append(doc.Segments, Segment{
					ID:               segment.ID,
					DepartureAirport: segment.Departure.IataCode,
					ArrivalAirport:   segment.Arrival.IataCode,
					DepartureTime:    segment.Departure.At,
					ArrivalTime:      segment.Arrival.At,
					CarrierCode:      segment.CarrierCode,
					FlightNumber:     segment.Number,
					AircraftType:     segment.Aircraft.Code,
					Duration:         segment.Duration,
					CabinClass:       doc.CabinClass,
				})
			}
		}
	}

	// Process return itinerary if exists
	if returnIt := offer.GetReturnItinerary(); returnIt != nil {
		if len(returnIt.Segments) > 0 {
			firstSegment := returnIt.Segments[0]
			doc.ReturnDate = &firstSegment.Departure.At
		}
	}

	// Set amenities based on traveler pricings
	if len(offer.TravelerPricings) > 0 {
		tp := offer.TravelerPricings[0]
		if len(tp.FareDetailsBySegment) > 0 {
			fareDetails := tp.FareDetailsBySegment[0]
			if fareDetails.IncludedCheckedBags != nil {
				doc.CheckedBagsIncluded = fareDetails.IncludedCheckedBags.Quantity
			}
		}
	}

	return doc
}

// SearchFlights searches for flights based on filters
func (c *Client) SearchFlights(ctx context.Context, filters SearchFilters, options SearchOptions) (*SearchResult, error) {
	query := elastic.NewBoolQuery()

	// Add filters
	if len(filters.OriginCodes) > 0 {
		query = query.Filter(elastic.NewTermsQuery("origin_code", interfaceSlice(filters.OriginCodes)...))
	}

	if len(filters.DestinationCodes) > 0 {
		query = query.Filter(elastic.NewTermsQuery("destination_code", interfaceSlice(filters.DestinationCodes)...))
	}

	if filters.DepartureDateFrom != nil || filters.DepartureDateTo != nil {
		rangeQuery := elastic.NewRangeQuery("departure_date")
		if filters.DepartureDateFrom != nil {
			rangeQuery = rangeQuery.Gte(*filters.DepartureDateFrom)
		}
		if filters.DepartureDateTo != nil {
			rangeQuery = rangeQuery.Lte(*filters.DepartureDateTo)
		}
		query = query.Filter(rangeQuery)
	}

	if filters.ReturnDateFrom != nil || filters.ReturnDateTo != nil {
		rangeQuery := elastic.NewRangeQuery("return_date")
		if filters.ReturnDateFrom != nil {
			rangeQuery = rangeQuery.Gte(*filters.ReturnDateFrom)
		}
		if filters.ReturnDateTo != nil {
			rangeQuery = rangeQuery.Lte(*filters.ReturnDateTo)
		}
		query = query.Filter(rangeQuery)
	}

	if len(filters.CarrierCodes) > 0 {
		query = query.Filter(elastic.NewTermsQuery("carrier_code", interfaceSlice(filters.CarrierCodes)...))
	}

	if filters.MinPrice != nil || filters.MaxPrice != nil {
		rangeQuery := elastic.NewRangeQuery("price")
		if filters.MinPrice != nil {
			rangeQuery = rangeQuery.Gte(*filters.MinPrice)
		}
		if filters.MaxPrice != nil {
			rangeQuery = rangeQuery.Lte(*filters.MaxPrice)
		}
		query = query.Filter(rangeQuery)
	}

	if len(filters.CabinClasses) > 0 {
		query = query.Filter(elastic.NewTermsQuery("cabin_class", interfaceSlice(filters.CabinClasses)...))
	}

	if filters.MaxStops != nil {
		query = query.Filter(elastic.NewRangeQuery("stops").Lte(*filters.MaxStops))
	}

	if filters.DirectFlightOnly {
		query = query.Filter(elastic.NewTermQuery("is_direct_flight", true))
	}

	if filters.MaxDurationMinutes != nil {
		query = query.Filter(elastic.NewRangeQuery("duration_minutes").Lte(*filters.MaxDurationMinutes))
	}

	if len(filters.Providers) > 0 {
		query = query.Filter(elastic.NewTermsQuery("provider", interfaceSlice(filters.Providers)...))
	}

	if filters.SearchAfter != nil {
		query = query.Filter(elastic.NewRangeQuery("search_timestamp").Gte(*filters.SearchAfter))
	}

	// Add expiration filter
	query = query.Filter(elastic.NewRangeQuery("expires_at").Gt(time.Now()))

	// Create search request
	searchService := c.client.Search().
		Index(c.config.Index).
		Query(query).
		From(options.From).
		Size(options.Size)

	// Add sorting
	sortField := "price"
	if options.SortBy != "" {
		sortField = options.SortBy
	}
	
	ascending := true
	if options.SortDir == "desc" {
		ascending = false
	}
	
	searchService = searchService.Sort(sortField, ascending)

	// Execute search
	searchResult, err := searchService.Do(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to search flights: %w", err)
	}

	// Parse results
	var documents []FlightDocument
	for _, hit := range searchResult.Hits.Hits {
		var doc FlightDocument
		if err := json.Unmarshal(hit.Source, &doc); err != nil {
			log.Printf("Failed to unmarshal search result: %v", err)
			continue
		}
		documents = append(documents, doc)
	}

	return &SearchResult{
		Total:     searchResult.Hits.TotalHits.Value,
		Documents: documents,
	}, nil
}

// DeleteExpiredDocuments deletes expired flight documents
func (c *Client) DeleteExpiredDocuments(ctx context.Context) error {
	query := elastic.NewRangeQuery("expires_at").Lt(time.Now())
	
	_, err := c.client.DeleteByQuery(c.config.Index).Query(query).Do(ctx)
	if err != nil {
		return fmt.Errorf("failed to delete expired documents: %w", err)
	}

	return nil
}

// Close closes the Elasticsearch client
func (c *Client) Close() error {
	// Elasticsearch client doesn't need explicit closing
	return nil
}

// HealthCheck checks if Elasticsearch is healthy
func (c *Client) HealthCheck(ctx context.Context) error {
	_, _, err := c.client.Ping(c.config.URLs[0]).Do(ctx)
	if err != nil {
		return fmt.Errorf("Elasticsearch health check failed: %w", err)
	}
	return nil
}

// Helper functions

func interfaceSlice(strings []string) []interface{} {
	interfaces := make([]interface{}, len(strings))
	for i, s := range strings {
		interfaces[i] = s
	}
	return interfaces
}

func parseDurationToMinutes(duration string) int {
	// Parse ISO 8601 duration format (e.g., "PT2H30M")
	// This is a simplified parser for flight durations
	duration = strings.TrimPrefix(duration, "PT")
	
	totalMinutes := 0
	
	// Parse hours
	if hIndex := strings.Index(duration, "H"); hIndex != -1 {
		hoursStr := duration[:hIndex]
		if hours, err := strconv.Atoi(hoursStr); err == nil {
			totalMinutes += hours * 60
		}
		duration = duration[hIndex+1:]
	}
	
	// Parse minutes
	if mIndex := strings.Index(duration, "M"); mIndex != -1 {
		minutesStr := duration[:mIndex]
		if minutes, err := strconv.Atoi(minutesStr); err == nil {
			totalMinutes += minutes
		}
	}
	
	return totalMinutes
}