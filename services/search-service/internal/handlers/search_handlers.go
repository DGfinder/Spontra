package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"spontra/search-service/internal/elasticsearch"
	"spontra/search-service/internal/metrics"
	"spontra/search-service/internal/models"
	"spontra/search-service/internal/services"
	"spontra/search-service/internal/tracing"
)

// SearchHandler handles search-related HTTP requests
type SearchHandler struct {
	searchService *services.SearchService
	esClient      *elasticsearch.Client
	metrics       *metrics.Metrics
}

// NewSearchHandler creates a new search handler
func NewSearchHandler(searchService *services.SearchService, esClient *elasticsearch.Client, metrics *metrics.Metrics) *SearchHandler {
	return &SearchHandler{
		searchService: searchService,
		esClient:      esClient,
		metrics:       metrics,
	}
}

// SearchFlights handles flight search requests with optimized Elasticsearch queries
func (h *SearchHandler) SearchFlights(c *gin.Context) {
	ctx, span := tracing.StartSpan(c.Request.Context(), "search.flights",
		tracing.HTTPMethod(c.Request.Method),
		tracing.HTTPURL(c.Request.URL.String()),
	)
	defer span.End()

	var req models.FlightSearchRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		tracing.SetSpanError(ctx, err)
		h.metrics.RecordSearchRequest("", "", "error", 0, 0)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format", "details": err.Error()})
		return
	}

	// Validate required fields
	if req.OriginAirport == "" || req.DestinationAirport == "" {
		err := &models.ValidationError{Message: "Origin and destination airports are required"}
		tracing.SetSpanError(ctx, err)
		h.metrics.RecordSearchRequest(req.OriginAirport, req.DestinationAirport, "error", 0, 0)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Message})
		return
	}

	// Set defaults
	if req.MaxResults <= 0 {
		req.MaxResults = 50
	}
	if req.SortBy == "" {
		req.SortBy = "price"
	}
	if req.SortOrder == "" {
		req.SortOrder = "asc"
	}

	// Add search attributes to span
	tracing.SetSpanAttributes(ctx,
		tracing.SearchOrigin(req.OriginAirport),
		tracing.SearchDestination(req.DestinationAirport),
		tracing.SearchDate(req.DepartureDate.Format("2006-01-02")),
		tracing.SearchPassengers(req.Passengers),
	)

	// Perform search using optimized Elasticsearch
	start := time.Now()
	response, err := h.esClient.SearchFlightsWithTemplate(&req)
	duration := time.Since(start)

	if err != nil {
		tracing.SetSpanError(ctx, err)
		h.metrics.RecordSearchRequest(req.OriginAirport, req.DestinationAirport, "error", duration, 0)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Search failed", "details": err.Error()})
		return
	}

	// Record metrics
	h.metrics.RecordSearchRequest(req.OriginAirport, req.DestinationAirport, "success", duration, len(response.Flights))
	tracing.SetSpanAttributes(ctx, tracing.SearchResults(len(response.Flights)))
	tracing.SetSpanSuccess(ctx)

	c.JSON(http.StatusOK, response)
}

// SearchFlightsWithFacets returns search results with aggregated facets for filtering
func (h *SearchHandler) SearchFlightsWithFacets(c *gin.Context) {
	ctx, span := tracing.StartSpan(c.Request.Context(), "search.flights_with_facets")
	defer span.End()

	var req models.FlightSearchRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		tracing.SetSpanError(ctx, err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format", "details": err.Error()})
		return
	}

	// Set defaults
	if req.MaxResults <= 0 {
		req.MaxResults = 50
	}

	start := time.Now()
	response, facets, err := h.esClient.SearchWithFacets(&req)
	duration := time.Since(start)

	if err != nil {
		tracing.SetSpanError(ctx, err)
		h.metrics.RecordSearchRequest(req.OriginAirport, req.DestinationAirport, "error", duration, 0)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Faceted search failed", "details": err.Error()})
		return
	}

	h.metrics.RecordSearchRequest(req.OriginAirport, req.DestinationAirport, "success", duration, len(response.Flights))
	tracing.SetSpanSuccess(ctx)

	c.JSON(http.StatusOK, gin.H{
		"results": response,
		"facets":  facets,
	})
}

// AutocompleteAirports provides instant airport suggestions
func (h *SearchHandler) AutocompleteAirports(c *gin.Context) {
	ctx, span := tracing.StartSpan(c.Request.Context(), "search.autocomplete_airports")
	defer span.End()

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

	tracing.SetSpanAttributes(ctx,
		tracing.Operation("autocomplete"),
		tracing.Resource("airports"),
	)

	start := time.Now()
	suggestions, err := h.esClient.SearchAirportsWithTemplate(query, limit)
	duration := time.Since(start)

	if err != nil {
		tracing.SetSpanError(ctx, err)
		h.metrics.RecordCacheOperation("autocomplete", "error", duration)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Autocomplete failed", "details": err.Error()})
		return
	}

	h.metrics.RecordCacheOperation("autocomplete", "success", duration)
	tracing.SetSpanSuccess(ctx)

	c.JSON(http.StatusOK, gin.H{
		"suggestions": suggestions,
		"query":       query,
		"count":       len(suggestions),
	})
}

// GetSearchAggregations returns aggregated search data for insights
func (h *SearchHandler) GetSearchAggregations(c *gin.Context) {
	ctx, span := tracing.StartSpan(c.Request.Context(), "search.aggregations")
	defer span.End()

	var req models.FlightSearchRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		tracing.SetSpanError(ctx, err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format", "details": err.Error()})
		return
	}

	start := time.Now()
	aggregations, err := h.esClient.GetSearchAggregations(&req)
	duration := time.Since(start)

	if err != nil {
		tracing.SetSpanError(ctx, err)
		h.metrics.RecordDatabaseOperation("aggregation", "flights", "error", duration)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Aggregation failed", "details": err.Error()})
		return
	}

	h.metrics.RecordDatabaseOperation("aggregation", "flights", "success", duration)
	tracing.SetSpanSuccess(ctx)

	c.JSON(http.StatusOK, aggregations)
}

// GetPopularRoutes returns the most popular flight routes
func (h *SearchHandler) GetPopularRoutes(c *gin.Context) {
	ctx, span := tracing.StartSpan(c.Request.Context(), "search.popular_routes")
	defer span.End()

	limitStr := c.DefaultQuery("limit", "20")
	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit <= 0 {
		limit = 20
	}

	start := time.Now()
	routes, err := h.esClient.GetPopularRoutes(limit)
	duration := time.Since(start)

	if err != nil {
		tracing.SetSpanError(ctx, err)
		h.metrics.RecordDatabaseOperation("aggregation", "routes", "error", duration)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get popular routes", "details": err.Error()})
		return
	}

	h.metrics.RecordDatabaseOperation("aggregation", "routes", "success", duration)
	tracing.SetSpanSuccess(ctx)

	c.JSON(http.StatusOK, gin.H{
		"popular_routes": routes,
		"limit":          limit,
		"count":          len(routes),
	})
}

// GetPriceInsights returns price analysis for a specific route
func (h *SearchHandler) GetPriceInsights(c *gin.Context) {
	ctx, span := tracing.StartSpan(c.Request.Context(), "search.price_insights")
	defer span.End()

	origin := c.Query("origin")
	destination := c.Query("destination")
	if origin == "" || destination == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Origin and destination parameters are required"})
		return
	}

	daysStr := c.DefaultQuery("days", "30")
	days, err := strconv.Atoi(daysStr)
	if err != nil || days <= 0 {
		days = 30
	}

	tracing.SetSpanAttributes(ctx,
		tracing.SearchOrigin(origin),
		tracing.SearchDestination(destination),
	)

	start := time.Now()
	insights, err := h.esClient.GetPriceInsights(origin, destination, days)
	duration := time.Since(start)

	if err != nil {
		tracing.SetSpanError(ctx, err)
		h.metrics.RecordDatabaseOperation("aggregation", "price_insights", "error", duration)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get price insights", "details": err.Error()})
		return
	}

	h.metrics.RecordDatabaseOperation("aggregation", "price_insights", "success", duration)
	tracing.SetSpanSuccess(ctx)

	c.JSON(http.StatusOK, insights)
}

// GetAirlineComparison compares airlines for a specific route
func (h *SearchHandler) GetAirlineComparison(c *gin.Context) {
	ctx, span := tracing.StartSpan(c.Request.Context(), "search.airline_comparison")
	defer span.End()

	origin := c.Query("origin")
	destination := c.Query("destination")
	if origin == "" || destination == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Origin and destination parameters are required"})
		return
	}

	tracing.SetSpanAttributes(ctx,
		tracing.SearchOrigin(origin),
		tracing.SearchDestination(destination),
	)

	start := time.Now()
	comparison, err := h.esClient.GetAirlineComparison(origin, destination)
	duration := time.Since(start)

	if err != nil {
		tracing.SetSpanError(ctx, err)
		h.metrics.RecordDatabaseOperation("aggregation", "airline_comparison", "error", duration)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get airline comparison", "details": err.Error()})
		return
	}

	h.metrics.RecordDatabaseOperation("aggregation", "airline_comparison", "success", duration)
	tracing.SetSpanSuccess(ctx)

	c.JSON(http.StatusOK, gin.H{
		"route":    map[string]string{"origin": origin, "destination": destination},
		"airlines": comparison,
		"count":    len(comparison),
	})
}

// GetIndexStats returns Elasticsearch performance statistics
func (h *SearchHandler) GetIndexStats(c *gin.Context) {
	ctx, span := tracing.StartSpan(c.Request.Context(), "search.index_stats")
	defer span.End()

	start := time.Now()
	stats, err := h.esClient.GetIndexStats()
	duration := time.Since(start)

	if err != nil {
		tracing.SetSpanError(ctx, err)
		h.metrics.RecordDatabaseOperation("stats", "elasticsearch", "error", duration)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get index stats", "details": err.Error()})
		return
	}

	h.metrics.RecordDatabaseOperation("stats", "elasticsearch", "success", duration)
	tracing.SetSpanSuccess(ctx)

	c.JSON(http.StatusOK, gin.H{
		"index_stats": stats,
		"timestamp":   time.Now().UTC(),
	})
}

// OptimizeIndices applies performance optimizations to Elasticsearch indices
func (h *SearchHandler) OptimizeIndices(c *gin.Context) {
	ctx, span := tracing.StartSpan(c.Request.Context(), "search.optimize_indices")
	defer span.End()

	start := time.Now()
	err := h.esClient.OptimizeIndices()
	duration := time.Since(start)

	if err != nil {
		tracing.SetSpanError(ctx, err)
		h.metrics.RecordDatabaseOperation("optimize", "elasticsearch", "error", duration)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to optimize indices", "details": err.Error()})
		return
	}

	h.metrics.RecordDatabaseOperation("optimize", "elasticsearch", "success", duration)
	tracing.SetSpanSuccess(ctx)

	c.JSON(http.StatusOK, gin.H{
		"message":   "Indices optimized successfully",
		"timestamp": time.Now().UTC(),
		"duration":  duration.String(),
	})
}

// WarmupCaches preloads common queries into Elasticsearch caches
func (h *SearchHandler) WarmupCaches(c *gin.Context) {
	ctx, span := tracing.StartSpan(c.Request.Context(), "search.warmup_caches")
	defer span.End()

	start := time.Now()
	err := h.esClient.WarmupQueries()
	duration := time.Since(start)

	if err != nil {
		tracing.SetSpanError(ctx, err)
		h.metrics.RecordCacheOperation("warmup", "error", duration)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to warmup caches", "details": err.Error()})
		return
	}

	h.metrics.RecordCacheOperation("warmup", "success", duration)
	tracing.SetSpanSuccess(ctx)

	c.JSON(http.StatusOK, gin.H{
		"message":   "Caches warmed up successfully",
		"timestamp": time.Now().UTC(),
		"duration":  duration.String(),
	})
}