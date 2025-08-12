package elasticsearch

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/olivere/elastic/v7"
	"spontra/search-service/internal/config"
	"spontra/search-service/internal/models"
)

// Client wraps the Elasticsearch client
type Client struct {
	client *elastic.Client
	cfg    *config.Config
}

// NewClient creates a new Elasticsearch client
func NewClient(cfg *config.Config) (*Client, error) {
	client, err := elastic.NewClient(
		elastic.SetURL(cfg.ElasticsearchURL),
		elastic.SetSniff(false),
		elastic.SetHealthcheckInterval(10*time.Second),
		elastic.SetRetrier(elastic.NewBackoffRetrier(elastic.NewExponentialBackoff(100*time.Millisecond, 30*time.Second))),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create Elasticsearch client: %w", err)
	}

	// Test connection
	info, code, err := client.Ping(cfg.ElasticsearchURL).Do(context.Background())
	if err != nil {
		return nil, fmt.Errorf("failed to ping Elasticsearch: %w", err)
	}
	log.Printf("Elasticsearch connection successful (code %d): %s", code, info.Version.Number)

	esClient := &Client{
		client: client,
		cfg:    cfg,
	}

	// Create indices if they don't exist
	if err := esClient.createIndices(); err != nil {
		return nil, fmt.Errorf("failed to create indices: %w", err)
	}

	return esClient, nil
}

// createIndices creates the necessary Elasticsearch indices
func (c *Client) createIndices() error {
	indices := map[string]string{
		c.getFlightIndex():  flightIndexMapping,
		c.getAirportIndex(): airportIndexMapping,
	}

	for indexName, mapping := range indices {
		exists, err := c.client.IndexExists(indexName).Do(context.Background())
		if err != nil {
			return fmt.Errorf("failed to check if index exists: %w", err)
		}

		if !exists {
			createIndex, err := c.client.CreateIndex(indexName).
				Body(mapping).
				Do(context.Background())
			if err != nil {
				return fmt.Errorf("failed to create index %s: %w", indexName, err)
			}
			log.Printf("Created Elasticsearch index: %s (acknowledged: %t)", indexName, createIndex.Acknowledged)
		}
	}

	return nil
}

// IndexFlight indexes a flight document
func (c *Client) IndexFlight(flight *models.Flight) error {
	_, err := c.client.Index().
		Index(c.getFlightIndex()).
		Id(flight.ID.String()).
		BodyJson(flight).
		Do(context.Background())

	if err != nil {
		return fmt.Errorf("failed to index flight: %w", err)
	}

	return nil
}

// IndexAirport indexes an airport document
func (c *Client) IndexAirport(airport *models.AirportSuggestion) error {
	_, err := c.client.Index().
		Index(c.getAirportIndex()).
		Id(airport.Code).
		BodyJson(airport).
		Do(context.Background())

	if err != nil {
		return fmt.Errorf("failed to index airport: %w", err)
	}

	return nil
}

// SearchFlights searches for flights based on criteria
func (c *Client) SearchFlights(req *models.FlightSearchRequest) (*models.FlightSearchResponse, error) {
	query := c.buildFlightSearchQuery(req)

	searchResult, err := c.client.Search().
		Index(c.getFlightIndex()).
		Query(query).
		Size(req.MaxResults).
		Sort(c.getSortField(req.SortBy), req.SortOrder == "asc").
		Do(context.Background())

	if err != nil {
		return nil, fmt.Errorf("failed to search flights: %w", err)
	}

	flights := make([]models.Flight, 0, len(searchResult.Hits.Hits))
	for _, hit := range searchResult.Hits.Hits {
		var flight models.Flight
		if err := json.Unmarshal(hit.Source, &flight); err != nil {
			log.Printf("Failed to unmarshal flight: %v", err)
			continue
		}
		flights = append(flights, flight)
	}

	response := &models.FlightSearchResponse{
		SearchID:      req.ID,
		SearchRequest: *req,
		Flights:       flights,
		SearchMetadata: models.SearchMetadata{
			TotalResults:    int(searchResult.TotalHits()),
			ResultsReturned: len(flights),
			SearchTime:      time.Duration(searchResult.TookInMillis) * time.Millisecond,
		},
		CreatedAt: time.Now(),
		ExpiresAt: time.Now().Add(c.cfg.CacheTimeout),
	}

	return response, nil
}

// SearchAirports searches for airport suggestions with optimized autocomplete
func (c *Client) SearchAirports(query string, limit int) ([]models.AirportSuggestion, error) {
	if limit <= 0 {
		limit = 10
	}

	// Build advanced autocomplete query
	boolQuery := elastic.NewBoolQuery()
	
	// Exact code match (highest priority)
	boolQuery.Should(elastic.NewTermQuery("code.exact", query).Boost(10.0))
	
	// Prefix matches for autocomplete
	boolQuery.Should(elastic.NewPrefixQuery("code", query).Boost(5.0))
	boolQuery.Should(elastic.NewPrefixQuery("name", query).Boost(3.0))
	boolQuery.Should(elastic.NewPrefixQuery("city", query).Boost(3.0))
	
	// Full-text search with fuzzy matching
	boolQuery.Should(elastic.NewMultiMatchQuery(query, "code^3", "name^2", "city^2", "country").
		Type("best_fields").
		Fuzziness("AUTO").
		Boost(1.0))
	
	// Minimum should match at least one clause
	boolQuery.MinimumShouldMatch("1")

	searchResult, err := c.client.Search().
		Index(c.getAirportIndex()).
		Query(boolQuery).
		Size(limit).
		Sort("_score", false).
		Sort("popularity", false).
		Do(context.Background())

	if err != nil {
		return nil, fmt.Errorf("failed to search airports: %w", err)
	}

	suggestions := make([]models.AirportSuggestion, 0, len(searchResult.Hits.Hits))
	for _, hit := range searchResult.Hits.Hits {
		var airport models.AirportSuggestion
		if err := json.Unmarshal(hit.Source, &airport); err != nil {
			log.Printf("Failed to unmarshal airport: %v", err)
			continue
		}
		airport.Relevance = float64(*hit.Score)
		suggestions = append(suggestions, airport)
	}

	return suggestions, nil
}

// buildFlightSearchQuery builds the search query for flights
func (c *Client) buildFlightSearchQuery(req *models.FlightSearchRequest) elastic.Query {
	boolQuery := elastic.NewBoolQuery()

	// Origin and destination filters
	boolQuery = boolQuery.Filter(elastic.NewTermQuery("origin_airport", req.OriginAirport))
	boolQuery = boolQuery.Filter(elastic.NewTermQuery("destination_airport", req.DestinationAirport))

	// Date range filter
	if req.FlexibleDates && req.FlexibleDatesRange > 0 {
		startDate := req.DepartureDate.AddDate(0, 0, -req.FlexibleDatesRange)
		endDate := req.DepartureDate.AddDate(0, 0, req.FlexibleDatesRange)
		boolQuery = boolQuery.Filter(elastic.NewRangeQuery("departure_time").
			Gte(startDate).
			Lte(endDate))
	} else {
		// Exact date (with some tolerance for time)
		startOfDay := time.Date(req.DepartureDate.Year(), req.DepartureDate.Month(), req.DepartureDate.Day(), 0, 0, 0, 0, req.DepartureDate.Location())
		endOfDay := startOfDay.Add(24 * time.Hour)
		boolQuery = boolQuery.Filter(elastic.NewRangeQuery("departure_time").
			Gte(startOfDay).
			Lt(endOfDay))
	}

	// Cabin class filter
	if req.CabinClass != "" {
		boolQuery = boolQuery.Filter(elastic.NewTermQuery("cabin_class", req.CabinClass))
	}

	// Direct flights only
	if req.DirectFlightsOnly {
		boolQuery = boolQuery.Filter(elastic.NewTermQuery("stops", 0))
	}

	// Max stops filter
	if req.MaxStops != nil {
		boolQuery = boolQuery.Filter(elastic.NewRangeQuery("stops").Lte(*req.MaxStops))
	}

	// Flight duration filters
	if req.MinFlightDurationHours != nil {
		boolQuery = boolQuery.Filter(elastic.NewRangeQuery("duration_minutes").Gte(*req.MinFlightDurationHours * 60))
	}
	if req.MaxFlightDurationHours != nil {
		boolQuery = boolQuery.Filter(elastic.NewRangeQuery("duration_minutes").Lte(*req.MaxFlightDurationHours * 60))
	}

	// Preferred airlines
	if len(req.PreferredAirlines) > 0 {
		boolQuery = boolQuery.Should(elastic.NewTermsQuery("airline", stringSliceToInterface(req.PreferredAirlines)...))
	}

	// Excluded airlines
	if len(req.ExcludedAirlines) > 0 {
		boolQuery = boolQuery.MustNot(elastic.NewTermsQuery("airline", stringSliceToInterface(req.ExcludedAirlines)...))
	}

	return boolQuery
}

// getSortField maps sort criteria to Elasticsearch fields
func (c *Client) getSortField(sortBy string) string {
	switch sortBy {
	case "price":
		return "price"
	case "duration":
		return "duration_minutes"
	case "departure_time":
		return "departure_time"
	case "relevance":
		return "_score"
	default:
		return "price" // Default to price
	}
}

// Helper functions
func (c *Client) getFlightIndex() string {
	return fmt.Sprintf("%s_%s", c.cfg.ESIndexPrefix, c.cfg.ESFlightIndex)
}

func (c *Client) getAirportIndex() string {
	return fmt.Sprintf("%s_%s", c.cfg.ESIndexPrefix, c.cfg.ESAirportIndex)
}

func stringSliceToInterface(slice []string) []interface{} {
	result := make([]interface{}, len(slice))
	for i, v := range slice {
		result[i] = v
	}
	return result
}

// Index settings and mappings
const flightIndexMapping = `{
	"settings": {
		"number_of_shards": 2,
		"number_of_replicas": 1,
		"refresh_interval": "1s",
		"index.query.default_field": ["origin_airport", "destination_airport", "airline"],
		"analysis": {
			"analyzer": {
				"standard_folding": {
					"type": "custom",
					"tokenizer": "standard",
					"filter": ["lowercase", "asciifolding"]
				},
				"autocomplete": {
					"type": "custom",
					"tokenizer": "keyword",
					"filter": ["lowercase", "edge_ngram_filter"]
				}
			},
			"filter": {
				"edge_ngram_filter": {
					"type": "edge_ngram",
					"min_gram": 1,
					"max_gram": 20
				}
			}
		}
	},
	"mappings": {
		"properties": {
			"id": {"type": "keyword"},
			"provider": {"type": "keyword"},
			"origin_airport": {"type": "keyword"},
			"destination_airport": {"type": "keyword"},
			"departure_time": {"type": "date"},
			"arrival_time": {"type": "date"},
			"duration_minutes": {"type": "integer"},
			"price": {"type": "float"},
			"currency": {"type": "keyword"},
			"cabin_class": {"type": "keyword"},
			"airline": {"type": "keyword"},
			"flight_number": {"type": "keyword"},
			"aircraft": {"type": "text"},
			"stops": {"type": "integer"},
			"is_refundable": {"type": "boolean"},
			"baggage_included": {"type": "boolean"},
			"valid_until": {"type": "date"},
			"seats_available": {"type": "integer"},
			"relevance_score": {"type": "float"},
			"activity_match": {"type": "float"}
		}
	}
}`

const airportIndexMapping = `{
	"settings": {
		"number_of_shards": 1,
		"number_of_replicas": 1,
		"refresh_interval": "1s",
		"analysis": {
			"analyzer": {
				"standard_folding": {
					"type": "custom",
					"tokenizer": "standard",
					"filter": ["lowercase", "asciifolding"]
				},
				"autocomplete": {
					"type": "custom",
					"tokenizer": "keyword",
					"filter": ["lowercase", "edge_ngram_filter"]
				},
				"search_analyzer": {
					"type": "custom",
					"tokenizer": "keyword",
					"filter": ["lowercase"]
				}
			},
			"filter": {
				"edge_ngram_filter": {
					"type": "edge_ngram",
					"min_gram": 1,
					"max_gram": 20
				}
			}
		}
	},
	"mappings": {
		"properties": {
			"code": {
				"type": "text",
				"analyzer": "autocomplete",
				"search_analyzer": "search_analyzer",
				"fields": {
					"exact": {"type": "keyword"}
				}
			},
			"name": {
				"type": "text",
				"analyzer": "autocomplete",
				"search_analyzer": "search_analyzer",
				"fields": {
					"standard": {"type": "text", "analyzer": "standard_folding"}
				}
			},
			"city": {
				"type": "text",
				"analyzer": "autocomplete",
				"search_analyzer": "search_analyzer",
				"fields": {
					"standard": {"type": "text", "analyzer": "standard_folding"}
				}
			},
			"country": {
				"type": "text",
				"analyzer": "standard_folding",
				"fields": {
					"keyword": {"type": "keyword"}
				}
			},
			"country_code": {"type": "keyword"},
			"type": {"type": "keyword"},
			"popularity": {"type": "float"},
			"coordinates": {"type": "geo_point"}
		}
	}
}`