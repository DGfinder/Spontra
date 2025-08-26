package main

import (
	"bytes"
	"fmt"
	"io"
	"log"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"spontra/search-service/internal/cache"
	"spontra/search-service/internal/config"
	"spontra/search-service/internal/database"
	"spontra/search-service/internal/elasticsearch"
	"spontra/search-service/internal/models"
	"spontra/search-service/internal/repository"
	"spontra/search-service/internal/services"
)

var (
	cfg                 *config.Config
	db                  *database.Database
	redisClient         *cache.RedisClient
	elasticsearchClient *elasticsearch.Client
	searchService       *services.SearchService
	sessionRepo         *repository.SessionRepository
	historyRepo         *repository.HistoryRepository
	httpClient          *http.Client
)

func main() {
	// Load configuration
	var err error
	cfg, err = config.Load()
	if err != nil {
		log.Fatal("Failed to load configuration:", err)
	}

	// Initialize database
	db, err = database.NewDatabase(cfg)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer db.Close()

	// Create database tables
	if err := db.CreateTables(); err != nil {
		log.Fatal("Failed to create database tables:", err)
	}

	// Initialize Redis
	redisClient, err = cache.NewRedisClient(cfg.RedisURL)
	if err != nil {
		log.Fatal("Failed to connect to Redis:", err)
	}
	defer redisClient.Close()

	// Initialize Elasticsearch
	elasticsearchClient, err = elasticsearch.NewClient(cfg)
	if err != nil {
		log.Fatal("Failed to connect to Elasticsearch:", err)
	}

	// Initialize repositories
	sessionRepo = repository.NewSessionRepository(db.DB)
	historyRepo = repository.NewHistoryRepository(db.DB)
	durationRepo := repository.NewDurationRepository(db.DB)

	// Initialize services
	searchService = services.NewSearchService(cfg, db, redisClient, elasticsearchClient, sessionRepo, historyRepo)

	// Initialize HTTP client
	httpClient = &http.Client{
		Timeout: cfg.ProviderTimeout,
	}

	// Set Gin mode
	if cfg.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	router := gin.Default()
	
	// Health check endpoint
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "healthy",
			"service": "search-service",
		})
	})

	// API v1 routes
	v1 := router.Group("/api/v1")
	{
		// Flight search routes
		search := v1.Group("/search")
		{
			search.POST("/flights", searchFlights)
			search.GET("/flights/:searchId", getSearchResults)
			search.POST("/flights/filter", filterFlights)
			search.GET("/suggestions/airports", getAirportSuggestions)
		}

		// Cache management routes
		cache := v1.Group("/cache")
		{
			cache.DELETE("/clear", clearCache)
			cache.GET("/stats", getCacheStats)
		}

		// Destination exploration routes (proxy to data-ingestion-service)
		explore := v1.Group("/explore")
		{
			explore.POST("/destinations", exploreDestinations)
			explore.GET("/destinations/:airport/insights", getDestinationInsights)
			explore.GET("/destinations/:airport/similar", findSimilarDestinations)
		}

		// Destination data routes (proxy to data-ingestion-service)
		destinations := v1.Group("/destinations")
		{
			destinations.GET("/:airport", getDestinationInfo)
		}

		// Reference data routes (Postgres)
		reference := v1.Group("/reference")
		{
			rh := handlers.NewReferenceHandler(db.DB)
			reference.GET("/airlines", rh.GetAirlines)
			reference.GET("/aircraft", rh.GetAircraft)
		}

		// Flight durations (Postgres)
		durations := v1.Group("/durations")
		{
			dh := handlers.NewDurationHandler(durationRepo)
			durations.GET("/route", dh.GetRouteDuration)
			durations.GET("/origin/:origin", dh.ListByOrigin)
			durations.GET("/direct", dh.GetDirect)
			durations.GET("/range", dh.ListByRange)
			durations.GET("/popular", dh.PopularDestinations)
			durations.GET("/stats/routes", dh.RouteStats)
			durations.GET("/stats/connectivity/:airport", dh.Connectivity)
		}
	}

	log.Printf("Search service starting on port %s", cfg.Port)
	if err := router.Run(":" + cfg.Port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}

// Flight search handlers
func searchFlights(c *gin.Context) {
	var req models.FlightSearchRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request format",
			"details": err.Error(),
		})
		return
	}

	// Set defaults
	if req.MaxResults <= 0 {
		req.MaxResults = cfg.DefaultMaxResults
	}
	if req.SortBy == "" {
		req.SortBy = "price"
	}
	if req.SortOrder == "" {
		req.SortOrder = "asc"
	}
	if req.CabinClass == "" {
		req.CabinClass = "economy"
	}

	// Get or create session
	sessionID := c.GetHeader("X-Session-ID")
	if sessionID == "" {
		sessionID = uuid.New().String()
	}
	req.SearchSessionID = sessionID

	// Get user ID from header if authenticated
	userIDStr := c.GetHeader("X-User-ID")
	if userIDStr != "" {
		if userID, err := uuid.Parse(userIDStr); err == nil {
			req.UserID = &userID
		}
	}

	// Perform search
	response, err := searchService.SearchFlights(&req)
	if err != nil {
		log.Printf("Search failed: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Search failed",
			"details": err.Error(),
		})
		return
	}

	// Increment session search count
	go func() {
		if err := sessionRepo.IncrementSearchCount(sessionID); err != nil {
			log.Printf("Failed to increment search count: %v", err)
		}
	}()

	c.JSON(http.StatusOK, response)
}

func getSearchResults(c *gin.Context) {
	searchID := c.Param("searchId")
	if searchID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Search ID is required"})
		return
	}

	// Parse search ID
	searchUUID, err := uuid.Parse(searchID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid search ID format"})
		return
	}

	// Get search history
	history, err := historyRepo.GetSearchHistory(searchUUID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Search results not found"})
		return
	}

	c.JSON(http.StatusOK, history)
}

func filterFlights(c *gin.Context) {
	var filter models.SearchFilter
	if err := c.ShouldBindJSON(&filter); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid filter format",
			"details": err.Error(),
		})
		return
	}

	// TODO: Implement flight filtering logic
	// This would apply filters to cached search results
	c.JSON(http.StatusOK, gin.H{
		"message": "Filter applied",
		"filter":  filter,
	})
}

func getAirportSuggestions(c *gin.Context) {
	query := c.Query("q")
	if query == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Query parameter 'q' is required"})
		return
	}

	limitStr := c.DefaultQuery("limit", "10")
	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit <= 0 {
		limit = 10
	}

	// Check cache first
	cacheKey := cache.NewCacheKeyBuilder("airport").AirportSuggestions(query)
	var suggestions []models.AirportSuggestion
	if err := redisClient.Get(cacheKey, &suggestions); err == nil {
		c.JSON(http.StatusOK, gin.H{
			"suggestions": suggestions,
			"from_cache":  true,
		})
		return
	}

	// Search Elasticsearch
	suggestions, err = elasticsearchClient.SearchAirports(query, limit)
	if err != nil {
		log.Printf("Airport search failed: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Airport search failed",
			"details": err.Error(),
		})
		return
	}

	// Cache results for 1 hour
	go func() {
		if err := redisClient.Set(cacheKey, suggestions, cfg.AirportCacheTTL); err != nil {
			log.Printf("Failed to cache airport suggestions: %v", err)
		}
	}()

	c.JSON(http.StatusOK, gin.H{
		"suggestions": suggestions,
		"from_cache":  false,
	})
}

// Cache management handlers
func clearCache(c *gin.Context) {
	// Only allow cache clearing in development/staging
	if cfg.Environment == "production" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Cache clearing not allowed in production"})
		return
	}

	if err := redisClient.FlushDB(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to clear cache",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Cache cleared successfully"})
}

func getCacheStats(c *gin.Context) {
	stats, err := redisClient.GetStats()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to get cache stats",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, stats)
}

// Destination exploration handlers (proxy to data-ingestion-service)

// exploreDestinations proxies destination discovery requests
func exploreDestinations(c *gin.Context) {
	proxyRequest(c, "POST", "/api/v1/explore/destinations")
}

// getDestinationInsights proxies destination insights requests
func getDestinationInsights(c *gin.Context) {
	airport := c.Param("airport")
	proxyRequest(c, "GET", fmt.Sprintf("/api/v1/explore/destinations/%s/insights", airport))
}

// findSimilarDestinations proxies similar destinations requests
func findSimilarDestinations(c *gin.Context) {
	airport := c.Param("airport")
	origin := c.Query("origin")
	if origin == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Origin query parameter is required",
		})
		return
	}
	
	proxyRequest(c, "GET", fmt.Sprintf("/api/v1/explore/destinations/%s/similar?origin=%s", airport, origin))
}

// getDestinationInfo proxies destination information requests
func getDestinationInfo(c *gin.Context) {
	airport := c.Param("airport")
	proxyRequest(c, "GET", fmt.Sprintf("/api/v1/data/destinations/%s", airport))
}

// proxyRequest handles proxying requests to the data-ingestion-service
func proxyRequest(c *gin.Context, method, path string) {
	targetURL := cfg.DataIngestionServiceURL + path
	
	var body io.Reader
	if method == "POST" || method == "PUT" {
		// Read the request body
		bodyBytes, err := io.ReadAll(c.Request.Body)
		if err != nil {
			log.Printf("Error reading request body: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to read request body",
			})
			return
		}
		body = bytes.NewReader(bodyBytes)
	}

	// Create the proxy request
	req, err := http.NewRequestWithContext(c.Request.Context(), method, targetURL, body)
	if err != nil {
		log.Printf("Error creating proxy request: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to create proxy request",
		})
		return
	}

	// Copy relevant headers
	req.Header.Set("Content-Type", c.GetHeader("Content-Type"))
	req.Header.Set("Accept", c.GetHeader("Accept"))
	
	// Forward the request
	resp, err := httpClient.Do(req)
	if err != nil {
		log.Printf("Error forwarding request to data-ingestion-service: %v", err)
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error":   "Data ingestion service unavailable",
			"details": err.Error(),
		})
		return
	}
	defer resp.Body.Close()

	// Read the response
	responseBody, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Printf("Error reading response body: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to read response from data ingestion service",
		})
		return
	}

	// Forward the response
	c.Header("Content-Type", resp.Header.Get("Content-Type"))
	c.Data(resp.StatusCode, resp.Header.Get("Content-Type"), responseBody)
}