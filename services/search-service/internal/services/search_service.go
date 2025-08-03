package services

import (
	"fmt"
	"log"
	"net/http"
	"sort"
	"time"

	"spontra/search-service/internal/cache"
	"spontra/search-service/internal/config"
	"spontra/search-service/internal/database"
	"spontra/search-service/internal/elasticsearch"
	"spontra/search-service/internal/models"
	"spontra/search-service/internal/repository"
	"github.com/google/uuid"
	"github.com/shopspring/decimal"
)

// SearchService handles flight search orchestration
type SearchService struct {
	cfg             *config.Config
	db              *database.Database
	cache           *cache.RedisClient
	elasticsearch   *elasticsearch.Client
	sessionRepo     *repository.SessionRepository
	historyRepo     *repository.HistoryRepository
	cacheKeyBuilder *cache.CacheKeyBuilder
	httpClient      *http.Client
}

// NewSearchService creates a new search service
func NewSearchService(
	cfg *config.Config,
	db *database.Database,
	redisClient *cache.RedisClient,
	elasticsearch *elasticsearch.Client,
	sessionRepo *repository.SessionRepository,
	historyRepo *repository.HistoryRepository,
) *SearchService {
	return &SearchService{
		cfg:             cfg,
		db:              db,
		cache:           redisClient,
		elasticsearch:   elasticsearch,
		sessionRepo:     sessionRepo,
		historyRepo:     historyRepo,
		cacheKeyBuilder: cache.NewCacheKeyBuilder("search"),
		httpClient: &http.Client{
			Timeout: cfg.ProviderTimeout,
		},
	}
}

// SearchFlights orchestrates flight search across multiple providers
func (s *SearchService) SearchFlights(req *models.FlightSearchRequest) (*models.FlightSearchResponse, error) {
	startTime := time.Now()

	// Generate search ID
	req.ID = uuid.New()
	req.CreatedAt = time.Now()

	// Validate request
	if err := s.validateSearchRequest(req); err != nil {
		return nil, fmt.Errorf("invalid search request: %w", err)
	}

	// Check cache first
	cacheKey := s.cacheKeyBuilder.SearchResults(
		req.OriginAirport,
		req.DestinationAirport,
		req.DepartureDate.Format("2006-01-02"),
		req.PassengerCount,
	)

	var cachedResponse models.FlightSearchResponse
	if err := s.cache.Get(cacheKey, &cachedResponse); err == nil {
		// Update metadata
		cachedResponse.SearchMetadata.CacheHit = true
		cachedResponse.SearchMetadata.FromCache = true
		cachedResponse.SearchMetadata.SearchTime = time.Since(startTime)
		
		log.Printf("Cache hit for search %s", req.ID)
		return &cachedResponse, nil
	}

	// Search across multiple providers
	flights, metadata, err := s.orchestrateSearch(req)
	if err != nil {
		return nil, fmt.Errorf("search orchestration failed: %w", err)
	}

	// Apply filters and sorting
	filteredFlights := s.applyFilters(flights, req)
	sortedFlights := s.applySorting(filteredFlights, req.SortBy, req.SortOrder)

	// Limit results
	if len(sortedFlights) > req.MaxResults {
		sortedFlights = sortedFlights[:req.MaxResults]
	}

	// Build response
	response := &models.FlightSearchResponse{
		SearchID:      req.ID,
		RequestID:     uuid.New().String(),
		SearchRequest: *req,
		Flights:       sortedFlights,
		SearchMetadata: models.SearchMetadata{
			TotalResults:        metadata.TotalResults,
			ResultsReturned:     len(sortedFlights),
			SearchTime:          time.Since(startTime),
			ProvidersQueried:    metadata.ProvidersQueried,
			ProvidersSuccessful: metadata.ProvidersSuccessful,
			ProvidersErrors:     metadata.ProvidersErrors,
			CacheHit:            false,
			FromCache:           false,
			Currency:            "EUR",
		},
		CreatedAt: time.Now(),
		ExpiresAt: time.Now().Add(s.cfg.SearchResultsCacheTTL),
	}

	// Calculate price and duration ranges
	response.SearchMetadata.PriceRange = s.calculatePriceRange(sortedFlights)
	response.SearchMetadata.DurationRange = s.calculateDurationRange(sortedFlights)

	// Cache the response
	if err := s.cache.Set(cacheKey, response, s.cfg.SearchResultsCacheTTL); err != nil {
		log.Printf("Failed to cache search results: %v", err)
	}

	// Store search history (async)
	go s.storeSearchHistory(req, response)

	log.Printf("Search %s completed in %v, found %d flights", req.ID, response.SearchMetadata.SearchTime, len(sortedFlights))

	return response, nil
}

// orchestrateSearch coordinates search across multiple providers
func (s *SearchService) orchestrateSearch(req *models.FlightSearchRequest) ([]models.Flight, *SearchMetadata, error) {
	type providerResult struct {
		provider string
		flights  []models.Flight
		err      error
	}

	results := make(chan providerResult, len(s.cfg.EnabledProviders))
	
	// Launch searches to all enabled providers
	for _, provider := range s.cfg.EnabledProviders {
		go func(p string) {
			flights, err := s.searchProvider(p, req)
			results <- providerResult{
				provider: p,
				flights:  flights,
				err:      err,
			}
		}(provider)
	}

	// Collect results
	var allFlights []models.Flight
	metadata := &SearchMetadata{
		ProvidersQueried:    s.cfg.EnabledProviders,
		ProvidersSuccessful: []string{},
		ProvidersErrors:     make(map[string]string),
	}

	for i := 0; i < len(s.cfg.EnabledProviders); i++ {
		result := <-results
		if result.err != nil {
			metadata.ProvidersErrors[result.provider] = result.err.Error()
			log.Printf("Provider %s failed: %v", result.provider, result.err)
		} else {
			metadata.ProvidersSuccessful = append(metadata.ProvidersSuccessful, result.provider)
			allFlights = append(allFlights, result.flights...)
		}
	}

	metadata.TotalResults = len(allFlights)
	
	return allFlights, metadata, nil
}

// searchProvider searches a specific provider
func (s *SearchService) searchProvider(provider string, req *models.FlightSearchRequest) ([]models.Flight, error) {
	switch provider {
	case "amadeus":
		return s.searchAmadeus(req)
	case "data-ingestion":
		return s.searchDataIngestion(req)
	case "elasticsearch":
		return s.searchElasticsearch(req)
	default:
		return nil, fmt.Errorf("unknown provider: %s", provider)
	}
}

// searchAmadeus searches using Amadeus API (via data-ingestion service)
func (s *SearchService) searchAmadeus(req *models.FlightSearchRequest) ([]models.Flight, error) {
	// For now, delegate to data-ingestion service
	return s.searchDataIngestion(req)
}

// searchDataIngestion searches using the data-ingestion service
func (s *SearchService) searchDataIngestion(req *models.FlightSearchRequest) ([]models.Flight, error) {
	// This would make an HTTP request to the data-ingestion service
	// For now, return empty results as placeholder
	log.Printf("Searching data-ingestion service for %s->%s", req.OriginAirport, req.DestinationAirport)
	return []models.Flight{}, nil
}

// searchElasticsearch searches using Elasticsearch
func (s *SearchService) searchElasticsearch(req *models.FlightSearchRequest) ([]models.Flight, error) {
	response, err := s.elasticsearch.SearchFlights(req)
	if err != nil {
		return nil, err
	}
	return response.Flights, nil
}

// applyFilters applies filters to search results
func (s *SearchService) applyFilters(flights []models.Flight, req *models.FlightSearchRequest) []models.Flight {
	var filtered []models.Flight

	for _, flight := range flights {
		// Direct flights only filter
		if req.DirectFlightsOnly && flight.Stops > 0 {
			continue
		}

		// Max stops filter
		if req.MaxStops != nil && flight.Stops > *req.MaxStops {
			continue
		}

		// Flight duration filters
		if req.MinFlightDurationHours != nil && flight.Duration < (*req.MinFlightDurationHours * 60) {
			continue
		}
		if req.MaxFlightDurationHours != nil && flight.Duration > (*req.MaxFlightDurationHours * 60) {
			continue
		}

		// Preferred airlines filter
		if len(req.PreferredAirlines) > 0 {
			preferred := false
			for _, airline := range req.PreferredAirlines {
				if flight.Airline == airline {
					preferred = true
					break
				}
			}
			if !preferred {
				continue
			}
		}

		// Excluded airlines filter
		excluded := false
		for _, airline := range req.ExcludedAirlines {
			if flight.Airline == airline {
				excluded = true
				break
			}
		}
		if excluded {
			continue
		}

		filtered = append(filtered, flight)
	}

	return filtered
}

// applySorting sorts flights based on criteria
func (s *SearchService) applySorting(flights []models.Flight, sortBy, sortOrder string) []models.Flight {
	sort.Slice(flights, func(i, j int) bool {
		ascending := sortOrder == "asc"
		
		switch sortBy {
		case "price":
			if ascending {
				return flights[i].Price.LessThan(flights[j].Price)
			}
			return flights[i].Price.GreaterThan(flights[j].Price)
		case "duration":
			if ascending {
				return flights[i].Duration < flights[j].Duration
			}
			return flights[i].Duration > flights[j].Duration
		case "departure_time":
			if ascending {
				return flights[i].DepartureTime.Before(flights[j].DepartureTime)
			}
			return flights[i].DepartureTime.After(flights[j].DepartureTime)
		case "relevance":
			if ascending {
				return flights[i].RelevanceScore < flights[j].RelevanceScore
			}
			return flights[i].RelevanceScore > flights[j].RelevanceScore
		default:
			// Default to price ascending
			return flights[i].Price.LessThan(flights[j].Price)
		}
	})

	return flights
}

// calculatePriceRange calculates price statistics
func (s *SearchService) calculatePriceRange(flights []models.Flight) models.PriceRange {
	if len(flights) == 0 {
		return models.PriceRange{}
	}

	minPrice := flights[0].Price
	maxPrice := flights[0].Price
	totalPrice := flights[0].Price

	for i := 1; i < len(flights); i++ {
		price := flights[i].Price
		if price.LessThan(minPrice) {
			minPrice = price
		}
		if price.GreaterThan(maxPrice) {
			maxPrice = price
		}
		totalPrice = totalPrice.Add(price)
	}

	avgPrice := totalPrice.Div(decimal.NewFromInt(int64(len(flights))))

	return models.PriceRange{
		MinPrice: minPrice,
		MaxPrice: maxPrice,
		AvgPrice: avgPrice,
		Currency: "EUR",
	}
}

// calculateDurationRange calculates duration statistics
func (s *SearchService) calculateDurationRange(flights []models.Flight) models.DurationRange {
	if len(flights) == 0 {
		return models.DurationRange{}
	}

	minDuration := flights[0].Duration
	maxDuration := flights[0].Duration
	totalDuration := flights[0].Duration

	for i := 1; i < len(flights); i++ {
		duration := flights[i].Duration
		if duration < minDuration {
			minDuration = duration
		}
		if duration > maxDuration {
			maxDuration = duration
		}
		totalDuration += duration
	}

	avgDuration := totalDuration / len(flights)

	return models.DurationRange{
		MinDuration: minDuration,
		MaxDuration: maxDuration,
		AvgDuration: avgDuration,
	}
}

// validateSearchRequest validates the search request
func (s *SearchService) validateSearchRequest(req *models.FlightSearchRequest) error {
	if req.OriginAirport == "" {
		return fmt.Errorf("origin airport is required")
	}
	if req.DestinationAirport == "" {
		return fmt.Errorf("destination airport is required")
	}
	if req.OriginAirport == req.DestinationAirport {
		return fmt.Errorf("origin and destination cannot be the same")
	}
	if req.PassengerCount < 1 || req.PassengerCount > 9 {
		return fmt.Errorf("passenger count must be between 1 and 9")
	}
	if req.DepartureDate.Before(time.Now().Truncate(24 * time.Hour)) {
		return fmt.Errorf("departure date cannot be in the past")
	}
	if req.MaxResults <= 0 {
		req.MaxResults = s.cfg.DefaultMaxResults
	}
	if req.MaxResults > s.cfg.MaxResultsLimit {
		req.MaxResults = s.cfg.MaxResultsLimit
	}

	return nil
}

// storeSearchHistory stores search results in history
func (s *SearchService) storeSearchHistory(req *models.FlightSearchRequest, response *models.FlightSearchResponse) {
	history := &models.SearchHistory{
		ID:          uuid.New(),
		SearchID:    req.ID,
		UserID:      req.UserID,
		SessionID:   req.SearchSessionID,
		Request:     *req,
		ResultCount: len(response.Flights),
		Currency:    "EUR",
		CreatedAt:   time.Now(),
		ExpiresAt:   time.Now().Add(24 * time.Hour * 30), // 30 days
	}

	if len(response.Flights) > 0 {
		history.BestPrice = &response.Flights[0].Price
	}

	if err := s.historyRepo.CreateSearchHistory(history); err != nil {
		log.Printf("Failed to store search history: %v", err)
	}
}

// SearchMetadata holds search orchestration metadata
type SearchMetadata struct {
	TotalResults        int               `json:"total_results"`
	ProvidersQueried    []string          `json:"providers_queried"`
	ProvidersSuccessful []string          `json:"providers_successful"`
	ProvidersErrors     map[string]string `json:"providers_errors"`
}