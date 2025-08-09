package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"

	"spontra/data-ingestion-service/internal/amadeus"
	"spontra/data-ingestion-service/internal/cassandra"
	"spontra/data-ingestion-service/internal/config"
	"spontra/data-ingestion-service/internal/elasticsearch"
	"spontra/data-ingestion-service/internal/handlers"
	"spontra/data-ingestion-service/internal/models"
	"spontra/data-ingestion-service/internal/services"
	"spontra/data-ingestion-service/pkg/kafka"
)

// App represents the application
type App struct {
	config                *config.Config
	router                *gin.Engine
	amadeus               *amadeus.Client
	kafka                 *kafka.Producer
	cassandra             *cassandra.Client
	elasticsearch         *elasticsearch.Client
	validator             *validator.Validate
	csvImportService      *services.CSVImportService
	recommendationEngine  *services.DestinationRecommendationEngine
	themeDestHandler      *handlers.ThemeDestinationHandler
}

func main() {
	// Load configuration
	cfg := config.NewConfig()
	if err := cfg.Validate(); err != nil {
		log.Fatal("Configuration validation failed:", err)
	}

	// Initialize application
	app := &App{
		config:    cfg,
		validator: validator.New(),
	}

	if err := app.initializeServices(); err != nil {
		log.Fatal("Failed to initialize services:", err)
	}

	// Setup routes
	app.setupRoutes()

	// Start server
	app.startServer()
}

// initializeServices initializes all services
func (a *App) initializeServices() error {
	var err error

	// Initialize Amadeus client
	a.amadeus = amadeus.NewClient(a.config.Amadeus)

	// Initialize Cassandra client
	a.cassandra, err = cassandra.NewClient(a.config.Cassandra)
	if err != nil {
		return fmt.Errorf("failed to initialize Cassandra client: %w", err)
	}

	// Initialize Elasticsearch client
	a.elasticsearch, err = elasticsearch.NewClient(a.config.Elasticsearch)
	if err != nil {
		return fmt.Errorf("failed to initialize Elasticsearch client: %w", err)
	}

	// Initialize Kafka producer
	kafkaConfig := kafka.ProducerConfig{
		Brokers:       a.config.Kafka.Brokers,
		BatchSize:     a.config.Kafka.BatchSize,
		BatchTimeout:  a.config.Kafka.BatchTimeout,
		RetryAttempts: a.config.Kafka.RetryAttempts,
		RetryDelay:    a.config.Kafka.RetryDelay,
		Topics: map[string]string{
			"flight_search_requests":  a.config.Kafka.Topics.FlightSearchRequests,
			"flight_search_responses": a.config.Kafka.Topics.FlightSearchResponses,
			"flight_offers":          a.config.Kafka.Topics.FlightOffers,
			"price_updates":          a.config.Kafka.Topics.PriceUpdates,
			"flight_updates":         a.config.Kafka.Topics.FlightUpdates,
			"error_events":           a.config.Kafka.Topics.ErrorEvents,
		},
	}

	a.kafka, err = kafka.NewProducer(kafkaConfig)
	if err != nil {
		return fmt.Errorf("failed to initialize Kafka producer: %w", err)
	}

	// Initialize CSV import service
	a.csvImportService = services.NewCSVImportService(a.cassandra)

	// Initialize recommendation engine
	a.recommendationEngine = services.NewDestinationRecommendationEngine(a.cassandra, a.csvImportService)

	// Initialize theme destination handler
	a.themeDestHandler = handlers.NewThemeDestinationHandler(a.cassandra, a.validator)

	return nil
}

// setupRoutes sets up all HTTP routes
func (a *App) setupRoutes() {
	if gin.Mode() == gin.DebugMode {
		gin.SetMode(gin.ReleaseMode)
	}

	a.router = gin.New()
	a.router.Use(gin.Logger())
	a.router.Use(gin.Recovery())

	// Health check endpoint
	a.router.GET("/health", a.healthCheck)

	// API v1 routes
	v1 := a.router.Group("/api/v1")
	{
		// Flight search routes
		search := v1.Group("/search")
		{
			search.POST("/flights", a.searchFlights)
			search.GET("/status/:searchId", a.getSearchStatus)
		}

		// Data ingestion routes
		ingestion := v1.Group("/ingestion")
		{
			ingestion.POST("/flights", a.ingestFlightData)
			ingestion.POST("/prices", a.ingestPriceData)
			ingestion.POST("/schedules", a.ingestScheduleData)
			ingestion.GET("/status", a.getIngestionStatus)
		}

		// Data providers management
		providers := v1.Group("/providers")
		{
			providers.GET("/", a.getDataProviders)
			providers.POST("/:provider/sync", a.syncDataProvider)
			providers.GET("/:provider/status", a.getProviderStatus)
		}

		// Kafka producer routes
		kafkaRoutes := v1.Group("/kafka")
		{
			kafkaRoutes.POST("/publish", a.publishToKafka)
			kafkaRoutes.GET("/topics", a.getKafkaTopics)
			kafkaRoutes.GET("/stats", a.getKafkaStats)
		}

		// Destination exploration routes
		explore := v1.Group("/explore")
		{
			explore.POST("/destinations", a.exploreDestinations)
			explore.GET("/destinations/:airport/insights", a.getDestinationInsights)
			explore.GET("/destinations/:airport/similar", a.findSimilarDestinations)
		}

		// CSV import and data management routes
		dataManagement := v1.Group("/data")
		{
			dataManagement.POST("/import/flight-routes", a.importFlightRoutes)
			dataManagement.POST("/create/sample-destinations", a.createSampleDestinations)
			dataManagement.GET("/destinations/:airport", a.getDestinationInfo)
		}

		// Theme-based destination routes
		themes := v1.Group("/themes")
		{
			themes.GET("/definitions", a.themeDestHandler.GetThemeDefinitions)
			themes.POST("/destinations", a.themeDestHandler.GetDestinationsByTheme)
			themes.GET("/countries/:country/destinations", a.themeDestHandler.GetDestinationsByCountry)
		}
	}
}

// startServer starts the HTTP server
func (a *App) startServer() {
	server := &http.Server{
		Addr:           ":" + a.config.Server.Port,
		Handler:        a.router,
		ReadTimeout:    a.config.Server.ReadTimeout,
		WriteTimeout:   a.config.Server.WriteTimeout,
		IdleTimeout:    a.config.Server.IdleTimeout,
		MaxHeaderBytes: a.config.Server.MaxHeaderBytes,
	}

	// Start server in a goroutine
	go func() {
		log.Printf("Data ingestion service starting on port %s", a.config.Server.Port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal("Failed to start server:", err)
		}
	}()

	// Wait for interrupt signal to gracefully shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down server...")

	// Create a context with timeout for shutdown
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// Shutdown server
	if err := server.Shutdown(ctx); err != nil {
		log.Fatal("Server forced to shutdown:", err)
	}

	// Close Kafka producer
	if err := a.kafka.Close(); err != nil {
		log.Printf("Error closing Kafka producer: %v", err)
	}

	// Close Cassandra client
	if err := a.cassandra.Close(); err != nil {
		log.Printf("Error closing Cassandra client: %v", err)
	}

	// Close Elasticsearch client
	if err := a.elasticsearch.Close(); err != nil {
		log.Printf("Error closing Elasticsearch client: %v", err)
	}

	log.Println("Server exited")
}

// Health check handler
func (a *App) healthCheck(c *gin.Context) {
	status := "healthy"
	checks := make(map[string]interface{})

	// Check Cassandra
	if err := a.cassandra.HealthCheck(); err != nil {
		checks["cassandra"] = map[string]interface{}{
			"status": "unhealthy",
			"error":  err.Error(),
		}
		status = "unhealthy"
	} else {
		checks["cassandra"] = map[string]interface{}{
			"status": "healthy",
		}
	}

	// Check Elasticsearch
	if err := a.elasticsearch.HealthCheck(c.Request.Context()); err != nil {
		checks["elasticsearch"] = map[string]interface{}{
			"status": "unhealthy",
			"error":  err.Error(),
		}
		status = "unhealthy"
	} else {
		checks["elasticsearch"] = map[string]interface{}{
			"status": "healthy",
		}
	}

	// Check Kafka (basic check)
	kafkaStats := a.kafka.GetStats()
	checks["kafka"] = map[string]interface{}{
		"status": "healthy",
		"stats":  kafkaStats,
	}

	responseCode := http.StatusOK
	if status == "unhealthy" {
		responseCode = http.StatusServiceUnavailable
	}

	c.JSON(responseCode, gin.H{
		"status":    status,
		"service":   "data-ingestion-service",
		"timestamp": time.Now().Format(time.RFC3339),
		"version":   "1.0.0",
		"checks":    checks,
	})
}

// Flight search handler
func (a *App) searchFlights(c *gin.Context) {
	var searchReq models.FlightSearchRequest
	if err := c.ShouldBindJSON(&searchReq); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request format",
			"details": err.Error(),
		})
		return
	}

	// Validate request
	if err := a.validator.Struct(&searchReq); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Validation failed",
			"details": err.Error(),
		})
		return
	}

	// Set default values
	if searchReq.ID == "" {
		searchReq.ID = "search_" + time.Now().Format("20060102_150405")
	}
	if searchReq.Currency == "" {
		searchReq.Currency = "USD"
	}
	if searchReq.CabinClass == "" {
		searchReq.CabinClass = "ECONOMY"
	}
	if searchReq.MaxResults == 0 {
		searchReq.MaxResults = 100
	}

	// Publish search request to Kafka
	if err := a.kafka.PublishFlightSearchRequest(c.Request.Context(), searchReq); err != nil {
		log.Printf("Failed to publish search request to Kafka: %v", err)
		// Don't fail the request, just log the error
	}

	// Search flights using Amadeus API
	searchResp, err := a.amadeus.SearchFlights(c.Request.Context(), &searchReq)
	if err != nil {
		log.Printf("Flight search failed: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Flight search failed",
			"details": err.Error(),
		})
		return
	}

	// Store data in parallel (don't block the response)
	go func() {
		ctx := context.Background()
		
		// Store flight offers in Cassandra
		if err := a.cassandra.StoreFlightOffersFromSearch(ctx, searchResp); err != nil {
			log.Printf("Failed to store flight offers in Cassandra: %v", err)
		}

		// Store price history in Cassandra
		if err := a.cassandra.StorePriceHistoryFromSearch(ctx, searchResp); err != nil {
			log.Printf("Failed to store price history in Cassandra: %v", err)
		}

		// Store search results cache in Cassandra
		if err := a.cassandra.StoreSearchResults(ctx, searchResp); err != nil {
			log.Printf("Failed to store search results in Cassandra: %v", err)
		}

		// Index flight offers in Elasticsearch
		if err := a.elasticsearch.IndexFlightOffersFromSearch(ctx, searchResp); err != nil {
			log.Printf("Failed to index flight offers in Elasticsearch: %v", err)
		}
	}()

	// Publish search response to Kafka
	if err := a.kafka.PublishFlightSearchResponse(c.Request.Context(), searchResp); err != nil {
		log.Printf("Failed to publish search response to Kafka: %v", err)
		// Don't fail the request, just log the error
	}

	// Publish flight offers to Kafka
	if len(searchResp.FlightOffers) > 0 {
		if err := a.kafka.PublishFlightOffers(c.Request.Context(), searchResp.FlightOffers); err != nil {
			log.Printf("Failed to publish flight offers to Kafka: %v", err)
		}
	}

	c.JSON(http.StatusOK, searchResp)
}

// Get search status handler
func (a *App) getSearchStatus(c *gin.Context) {
	searchID := c.Param("searchId")
	if searchID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Search ID is required",
		})
		return
	}

	// TODO: Implement search status retrieval from cache/database
	c.JSON(http.StatusOK, gin.H{
		"search_id": searchID,
		"status":    "completed",
		"message":   "Search status retrieval not yet implemented",
	})
}

// Data ingestion handlers
func (a *App) ingestFlightData(c *gin.Context) {
	var flightData interface{}
	if err := c.ShouldBindJSON(&flightData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid flight data format",
			"details": err.Error(),
		})
		return
	}

	// Publish flight data to Kafka
	if err := a.kafka.PublishFlightUpdate(c.Request.Context(), flightData); err != nil {
		log.Printf("Failed to publish flight data to Kafka: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to publish flight data",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Flight data ingested successfully",
		"timestamp": time.Now().Format(time.RFC3339),
	})
}

func (a *App) ingestPriceData(c *gin.Context) {
	var priceData interface{}
	if err := c.ShouldBindJSON(&priceData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid price data format",
			"details": err.Error(),
		})
		return
	}

	// Publish price data to Kafka
	if err := a.kafka.PublishPriceUpdate(c.Request.Context(), priceData); err != nil {
		log.Printf("Failed to publish price data to Kafka: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to publish price data",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Price data ingested successfully",
		"timestamp": time.Now().Format(time.RFC3339),
	})
}

func (a *App) ingestScheduleData(c *gin.Context) {
	var scheduleData interface{}
	if err := c.ShouldBindJSON(&scheduleData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid schedule data format",
			"details": err.Error(),
		})
		return
	}

	// Publish schedule data to Kafka
	if err := a.kafka.PublishFlightUpdate(c.Request.Context(), scheduleData); err != nil {
		log.Printf("Failed to publish schedule data to Kafka: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to publish schedule data",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Schedule data ingested successfully",
		"timestamp": time.Now().Format(time.RFC3339),
	})
}

func (a *App) getIngestionStatus(c *gin.Context) {
	stats := a.kafka.GetStats()
	
	c.JSON(http.StatusOK, gin.H{
		"service": "data-ingestion-service",
		"status":  "running",
		"kafka_stats": stats,
		"timestamp": time.Now().Format(time.RFC3339),
	})
}

// Data providers handlers
func (a *App) getDataProviders(c *gin.Context) {
	providers := []map[string]interface{}{
		{
			"name":        "amadeus",
			"description": "Amadeus GDS API",
			"status":      "active",
			"endpoints":   []string{"flight-search", "flight-offers"},
		},
		{
			"name":        "sabre",
			"description": "Sabre GDS API",
			"status":      "inactive",
			"endpoints":   []string{"flight-search", "flight-offers"},
		},
	}

	c.JSON(http.StatusOK, gin.H{
		"providers": providers,
		"total":     len(providers),
	})
}

func (a *App) syncDataProvider(c *gin.Context) {
	provider := c.Param("provider")
	
	switch provider {
	case "amadeus":
		// TODO: Implement Amadeus sync logic
		c.JSON(http.StatusOK, gin.H{
			"message": "Amadeus sync initiated",
			"provider": provider,
			"status": "in_progress",
		})
	default:
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Provider not found",
			"provider": provider,
		})
	}
}

func (a *App) getProviderStatus(c *gin.Context) {
	provider := c.Param("provider")
	
	switch provider {
	case "amadeus":
		c.JSON(http.StatusOK, gin.H{
			"provider": provider,
			"status":   "active",
			"health":   "healthy",
			"last_sync": time.Now().Add(-1 * time.Hour).Format(time.RFC3339),
		})
	default:
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Provider not found",
			"provider": provider,
		})
	}
}

// Kafka handlers
func (a *App) publishToKafka(c *gin.Context) {
	var req struct {
		Topic   string      `json:"topic" binding:"required"`
		Message interface{} `json:"message" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request format",
			"details": err.Error(),
		})
		return
	}

	message := kafka.Message{
		Topic:     req.Topic,
		Key:       "manual_" + time.Now().Format("20060102_150405"),
		Value:     req.Message,
		Timestamp: time.Now(),
		Headers: map[string]string{
			"source": "manual",
		},
	}

	if err := a.kafka.PublishMessage(c.Request.Context(), message); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to publish message",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Message published successfully",
		"topic":   req.Topic,
		"timestamp": time.Now().Format(time.RFC3339),
	})
}

func (a *App) getKafkaTopics(c *gin.Context) {
	topics := []map[string]string{
		{"name": "flight_search_requests", "description": "Flight search requests"},
		{"name": "flight_search_responses", "description": "Flight search responses"},
		{"name": "flight_offers", "description": "Flight offers"},
		{"name": "price_updates", "description": "Price updates"},
		{"name": "flight_updates", "description": "Flight updates"},
		{"name": "error_events", "description": "Error events"},
	}

	c.JSON(http.StatusOK, gin.H{
		"topics": topics,
		"total":  len(topics),
	})
}

func (a *App) getKafkaStats(c *gin.Context) {
	stats := a.kafka.GetStats()
	
	c.JSON(http.StatusOK, gin.H{
		"stats": stats,
		"timestamp": time.Now().Format(time.RFC3339),
	})
}

// Destination exploration handlers

// exploreDestinations handles destination discovery based on preferences
func (a *App) exploreDestinations(c *gin.Context) {
	var exploreReq models.DestinationExploreRequest
	if err := c.ShouldBindJSON(&exploreReq); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request format",
			"details": err.Error(),
		})
		return
	}

	// Validate request
	if err := a.validator.Struct(&exploreReq); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Validation failed",
			"details": err.Error(),
		})
		return
	}

	// Set default values if not provided
	if exploreReq.ID == "" {
		exploreReq.ID = "explore_" + time.Now().Format("20060102_150405")
	}
	if exploreReq.MaxResults == 0 {
		exploreReq.MaxResults = 20
	}
	if exploreReq.BudgetLevel == "" {
		exploreReq.BudgetLevel = "any"
	}

	// Store the explore request
	if err := a.cassandra.StoreDestinationExploreRequest(c.Request.Context(), exploreReq); err != nil {
		log.Printf("Failed to store explore request: %v", err)
		// Don't fail the request, just log the error
	}

	// Get destination recommendations
	response, err := a.recommendationEngine.RecommendDestinations(c.Request.Context(), exploreReq)
	if err != nil {
		log.Printf("Destination recommendation failed: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Destination recommendation failed",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, response)
}

// getDestinationInsights provides insights about destinations reachable from an origin
func (a *App) getDestinationInsights(c *gin.Context) {
	airport := c.Param("airport")
	if airport == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Airport parameter is required",
		})
		return
	}

	insights, err := a.recommendationEngine.GetDestinationInsights(c.Request.Context(), airport)
	if err != nil {
		log.Printf("Failed to get destination insights: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to get destination insights",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, insights)
}

// findSimilarDestinations finds destinations similar to a given destination
func (a *App) findSimilarDestinations(c *gin.Context) {
	airport := c.Param("airport")
	if airport == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Airport parameter is required",
		})
		return
	}

	origin := c.Query("origin")
	if origin == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Origin query parameter is required",
		})
		return
	}

	similarDestinations, err := a.recommendationEngine.FindSimilarDestinations(c.Request.Context(), airport, origin)
	if err != nil {
		log.Printf("Failed to find similar destinations: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to find similar destinations",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"target_airport": airport,
		"origin_airport": origin,
		"similar_destinations": similarDestinations,
		"total_results": len(similarDestinations),
	})
}

// Data management handlers

// importFlightRoutes handles CSV import of flight routes
func (a *App) importFlightRoutes(c *gin.Context) {
	var importReq struct {
		FilePath string `json:"file_path" binding:"required"`
	}

	if err := c.ShouldBindJSON(&importReq); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request format. Expected: {\"file_path\": \"/path/to/csv\"}",
			"details": err.Error(),
		})
		return
	}

	result, err := a.csvImportService.ImportFlightRoutesFromCSV(c.Request.Context(), importReq.FilePath)
	if err != nil {
		log.Printf("CSV import failed: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "CSV import failed",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, result)
}

// createSampleDestinations creates sample destination data
func (a *App) createSampleDestinations(c *gin.Context) {
	if err := a.csvImportService.CreateSampleDestinations(c.Request.Context()); err != nil {
		log.Printf("Failed to create sample destinations: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to create sample destinations",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Sample destinations created successfully",
		"timestamp": time.Now().Format(time.RFC3339),
	})
}

// getDestinationInfo retrieves destination information
func (a *App) getDestinationInfo(c *gin.Context) {
	airport := c.Param("airport")
	if airport == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Airport parameter is required",
		})
		return
	}

	destination, err := a.csvImportService.GetDestination(c.Request.Context(), airport)
	if err != nil {
		log.Printf("Failed to get destination info: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to get destination info",
			"details": err.Error(),
		})
		return
	}

	if destination == nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Destination not found",
			"airport": airport,
		})
		return
	}

	c.JSON(http.StatusOK, destination)
}