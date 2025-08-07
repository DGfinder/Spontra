package elasticsearch

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/olivere/elastic/v7"
	"spontra/search-service/internal/models"
)

// OptimizationConfig contains configuration for Elasticsearch optimization
type OptimizationConfig struct {
	BatchSize           int
	RefreshInterval     string
	ReplicaCount        int
	MaxConcurrentShards int
	QueryCacheSize      string
	FielddataSize       string
}

// DefaultOptimizationConfig returns default optimization settings
func DefaultOptimizationConfig() *OptimizationConfig {
	return &OptimizationConfig{
		BatchSize:           1000,
		RefreshInterval:     "1s",
		ReplicaCount:        1,
		MaxConcurrentShards: 5,
		QueryCacheSize:      "20%",
		FielddataSize:       "40%",
	}
}

// OptimizeIndices applies performance optimizations to all indices
func (c *Client) OptimizeIndices() error {
	config := DefaultOptimizationConfig()
	
	indices := []string{
		c.getFlightIndex(),
		c.getAirportIndex(),
	}

	for _, index := range indices {
		if err := c.optimizeIndex(index, config); err != nil {
			return fmt.Errorf("failed to optimize index %s: %w", index, err)
		}
	}

	return nil
}

// optimizeIndex applies optimizations to a specific index
func (c *Client) optimizeIndex(index string, config *OptimizationConfig) error {
	log.Printf("Optimizing index: %s", index)

	// Update index settings for performance
	settings := map[string]interface{}{
		"refresh_interval":          config.RefreshInterval,
		"number_of_replicas":        config.ReplicaCount,
		"max_concurrent_shards":     config.MaxConcurrentShards,
		"indices.queries.cache.size": config.QueryCacheSize,
		"indices.fielddata.cache.size": config.FielddataSize,
		"index.routing.allocation.total_shards_per_node": 2,
	}

	_, err := c.client.IndexPutSettings().
		Index(index).
		BodyJson(map[string]interface{}{"settings": settings}).
		Do(context.Background())

	if err != nil {
		return fmt.Errorf("failed to update index settings: %w", err)
	}

	log.Printf("Applied performance settings to index: %s", index)
	return nil
}

// BulkIndexFlights efficiently bulk indexes multiple flights
func (c *Client) BulkIndexFlights(flights []models.Flight) error {
	if len(flights) == 0 {
		return nil
	}

	config := DefaultOptimizationConfig()
	bulkService := c.client.Bulk()
	
	for i, flight := range flights {
		request := elastic.NewBulkIndexRequest().
			Index(c.getFlightIndex()).
			Id(flight.ID.String()).
			Doc(flight)
		
		bulkService.Add(request)

		// Execute batch when reaching batch size
		if (i+1)%config.BatchSize == 0 || i == len(flights)-1 {
			response, err := bulkService.Do(context.Background())
			if err != nil {
				return fmt.Errorf("bulk index failed: %w", err)
			}

			if response.Errors {
				for _, item := range response.Items {
					for action, result := range item {
						if result.Error != nil {
							log.Printf("Bulk %s error: %v", action, result.Error)
						}
					}
				}
			}

			log.Printf("Bulk indexed %d flights", len(response.Items))
			
			// Reset bulk service for next batch
			bulkService = c.client.Bulk()
		}
	}

	return nil
}

// BulkIndexAirports efficiently bulk indexes multiple airports
func (c *Client) BulkIndexAirports(airports []models.AirportSuggestion) error {
	if len(airports) == 0 {
		return nil
	}

	config := DefaultOptimizationConfig()
	bulkService := c.client.Bulk()
	
	for i, airport := range airports {
		request := elastic.NewBulkIndexRequest().
			Index(c.getAirportIndex()).
			Id(airport.Code).
			Doc(airport)
		
		bulkService.Add(request)

		// Execute batch when reaching batch size
		if (i+1)%config.BatchSize == 0 || i == len(airports)-1 {
			response, err := bulkService.Do(context.Background())
			if err != nil {
				return fmt.Errorf("bulk index failed: %w", err)
			}

			if response.Errors {
				for _, item := range response.Items {
					for action, result := range item {
						if result.Error != nil {
							log.Printf("Bulk %s error: %v", action, result.Error)
						}
					}
				}
			}

			log.Printf("Bulk indexed %d airports", len(response.Items))
			
			// Reset bulk service for next batch
			bulkService = c.client.Bulk()
		}
	}

	return nil
}

// CreateSearchTemplate creates and stores a search template for optimized queries
func (c *Client) CreateSearchTemplate(templateID, templateBody string) error {
	_, err := c.client.PutScript().
		Id(templateID).
		BodyString(templateBody).
		Do(context.Background())

	if err != nil {
		return fmt.Errorf("failed to create search template: %w", err)
	}

	log.Printf("Created search template: %s", templateID)
	return nil
}

// SetupSearchTemplates creates optimized search templates
func (c *Client) SetupSearchTemplates() error {
	// Flight search template
	flightTemplate := `{
		"script": {
			"lang": "mustache",
			"source": {
				"query": {
					"bool": {
						"filter": [
							{"term": {"origin_airport": "{{origin}}"}},
							{"term": {"destination_airport": "{{destination}}"}},
							{"range": {"departure_time": {"gte": "{{date_from}}", "lte": "{{date_to}}"}}}
						],
						"should": [
							{{#cabin_class}}{"term": {"cabin_class": "{{cabin_class}}"}}{{/cabin_class}},
							{{#direct_only}}{"term": {"stops": 0}}{{/direct_only}}
						]
					}
				},
				"sort": [
					{{#sort_price}}{"price": {"order": "{{sort_order}}"}}{{/sort_price}},
					{{#sort_duration}}{"duration_minutes": {"order": "{{sort_order}}"}}{{/sort_duration}},
					{"_score": {"order": "desc"}}
				],
				"size": "{{max_results}}"
			}
		}
	}`

	if err := c.CreateSearchTemplate("flight_search", flightTemplate); err != nil {
		return err
	}

	// Airport autocomplete template
	airportTemplate := `{
		"script": {
			"lang": "mustache",
			"source": {
				"query": {
					"bool": {
						"should": [
							{"term": {"code.exact": {"value": "{{query}}", "boost": 10}}},
							{"prefix": {"code": {"value": "{{query}}", "boost": 5}}},
							{"prefix": {"name": {"value": "{{query}}", "boost": 3}}},
							{"prefix": {"city": {"value": "{{query}}", "boost": 3}}},
							{"multi_match": {
								"query": "{{query}}",
								"fields": ["code^3", "name^2", "city^2", "country"],
								"type": "best_fields",
								"fuzziness": "AUTO"
							}}
						],
						"minimum_should_match": 1
					}
				},
				"sort": [
					{"_score": {"order": "desc"}},
					{"popularity": {"order": "desc"}}
				],
				"size": "{{limit}}"
			}
		}
	}`

	return c.CreateSearchTemplate("airport_autocomplete", airportTemplate)
}

// SearchFlightsWithTemplate uses the optimized search template
func (c *Client) SearchFlightsWithTemplate(req *models.FlightSearchRequest) (*models.FlightSearchResponse, error) {
	startTime := time.Now()

	// Prepare template parameters
	params := map[string]interface{}{
		"origin":      req.OriginAirport,
		"destination": req.DestinationAirport,
		"max_results": req.MaxResults,
		"sort_order":  req.SortOrder,
	}

	// Date range
	if req.FlexibleDates && req.FlexibleDatesRange > 0 {
		startDate := req.DepartureDate.AddDate(0, 0, -req.FlexibleDatesRange)
		endDate := req.DepartureDate.AddDate(0, 0, req.FlexibleDatesRange)
		params["date_from"] = startDate.Format(time.RFC3339)
		params["date_to"] = endDate.Format(time.RFC3339)
	} else {
		startOfDay := time.Date(req.DepartureDate.Year(), req.DepartureDate.Month(), req.DepartureDate.Day(), 0, 0, 0, 0, req.DepartureDate.Location())
		endOfDay := startOfDay.Add(24 * time.Hour)
		params["date_from"] = startOfDay.Format(time.RFC3339)
		params["date_to"] = endOfDay.Format(time.RFC3339)
	}

	// Optional parameters
	if req.CabinClass != "" {
		params["cabin_class"] = req.CabinClass
	}
	if req.DirectFlightsOnly {
		params["direct_only"] = true
	}
	if req.SortBy == "price" {
		params["sort_price"] = true
	} else if req.SortBy == "duration" {
		params["sort_duration"] = true
	}

	// Execute template search
	searchResult, err := c.client.SearchTemplate().
		Index(c.getFlightIndex()).
		Id("flight_search").
		BodyJson(map[string]interface{}{"params": params}).
		Do(context.Background())

	if err != nil {
		return nil, fmt.Errorf("template search failed: %w", err)
	}

	// Parse results
	flights := make([]models.Flight, 0, len(searchResult.Hits.Hits))
	for _, hit := range searchResult.Hits.Hits {
		var flight models.Flight
		if err := json.Unmarshal(hit.Source, &flight); err != nil {
			log.Printf("Failed to unmarshal flight: %v", err)
			continue
		}
		flights = append(flights, flight)
	}

	searchTime := time.Since(startTime)

	response := &models.FlightSearchResponse{
		SearchID:      req.ID,
		SearchRequest: *req,
		Flights:       flights,
		SearchMetadata: models.SearchMetadata{
			TotalResults:    int(searchResult.TotalHits()),
			ResultsReturned: len(flights),
			SearchTime:      searchTime,
		},
		CreatedAt: time.Now(),
		ExpiresAt: time.Now().Add(c.cfg.CacheTimeout),
	}

	return response, nil
}

// SearchAirportsWithTemplate uses the optimized autocomplete template
func (c *Client) SearchAirportsWithTemplate(query string, limit int) ([]models.AirportSuggestion, error) {
	if limit <= 0 {
		limit = 10
	}

	params := map[string]interface{}{
		"query": query,
		"limit": limit,
	}

	searchResult, err := c.client.SearchTemplate().
		Index(c.getAirportIndex()).
		Id("airport_autocomplete").
		BodyJson(map[string]interface{}{"params": params}).
		Do(context.Background())

	if err != nil {
		return nil, fmt.Errorf("template search failed: %w", err)
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

// ForceRefresh forces a refresh of all indices
func (c *Client) ForceRefresh() error {
	_, err := c.client.Refresh().
		Index(c.getFlightIndex(), c.getAirportIndex()).
		Do(context.Background())
	
	if err != nil {
		return fmt.Errorf("failed to refresh indices: %w", err)
	}

	log.Println("Forced refresh of all indices")
	return nil
}

// GetIndexStats returns performance statistics for indices
func (c *Client) GetIndexStats() (map[string]interface{}, error) {
	stats, err := c.client.IndexStats().
		Index(c.getFlightIndex(), c.getAirportIndex()).
		Do(context.Background())

	if err != nil {
		return nil, fmt.Errorf("failed to get index stats: %w", err)
	}

	result := make(map[string]interface{})
	for indexName, indexStats := range stats.Indices {
		result[indexName] = map[string]interface{}{
			"docs_count":         indexStats.Total.Docs.Count,
			"docs_deleted":       indexStats.Total.Docs.Deleted,
			"store_size_bytes":   indexStats.Total.Store.SizeInBytes,
			"query_total":        indexStats.Total.Search.QueryTotal,
			"query_time_millis":  indexStats.Total.Search.QueryTimeInMillis,
			"fetch_total":        indexStats.Total.Search.FetchTotal,
			"fetch_time_millis":  indexStats.Total.Search.FetchTimeInMillis,
		}
	}

	return result, nil
}

// WarmupQueries executes common queries to warm up the cache
func (c *Client) WarmupQueries() error {
	log.Println("Warming up Elasticsearch caches with common queries...")

	// Common airport searches
	commonAirportQueries := []string{"LON", "PAR", "NYC", "SFO", "LAX", "JFK", "LHR", "CDG"}
	for _, query := range commonAirportQueries {
		if _, err := c.SearchAirportsWithTemplate(query, 5); err != nil {
			log.Printf("Warmup query failed for airports '%s': %v", query, err)
		}
	}

	log.Println("Cache warmup completed")
	return nil
}