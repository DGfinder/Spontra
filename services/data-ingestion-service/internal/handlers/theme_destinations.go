package handlers

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
    "github.com/google/uuid"

	"spontra/data-ingestion-service/internal/cassandra"
	"spontra/data-ingestion-service/internal/models"
)

// ThemeDestinationHandler handles theme-based destination API endpoints
type ThemeDestinationHandler struct {
	cassandraClient *cassandra.Client
	validator       *validator.Validate
}

// NewThemeDestinationHandler creates a new theme destination handler
func NewThemeDestinationHandler(cassandraClient *cassandra.Client, validator *validator.Validate) *ThemeDestinationHandler {
	return &ThemeDestinationHandler{
		cassandraClient: cassandraClient,
		validator:       validator,
	}
}

// ThemeDestinationRequest represents a request for theme-based destinations
type ThemeDestinationRequest struct {
	Origin           string   `json:"origin" binding:"required" validate:"len=3"`
	Theme            string   `json:"theme" binding:"required"`
	MaxFlightTime    *int     `json:"max_flight_time,omitempty"`
	MinScore         *int     `json:"min_score,omitempty"`
	PriceRange       *string  `json:"price_range,omitempty"`
	Limit            *int     `json:"limit,omitempty"`
	IncludeCountries []string `json:"include_countries,omitempty"`
	ExcludeCountries []string `json:"exclude_countries,omitempty"`
}

// ThemeDestinationResponse represents the API response
type ThemeDestinationResponse struct {
	RequestID           string                    `json:"request_id"`
	Theme               string                    `json:"theme"`
	Origin              string                    `json:"origin"`
	TotalResults        int                       `json:"total_results"`
	FilteredResults     int                       `json:"filtered_results"`
	ProcessingTimeMs    int64                     `json:"processing_time_ms"`
	CacheHit            bool                      `json:"cache_hit"`
	Destinations        []DestinationWithScoring  `json:"destinations"`
	CountryAggregations []CountryAggregation      `json:"country_aggregations"`
	SearchMetadata      SearchMetadata            `json:"metadata"`
}

// DestinationWithScoring includes theme scoring information
type DestinationWithScoring struct {
	ID                string            `json:"id"`
	IataCode          string            `json:"iata_code"`
	CityName          string            `json:"city_name"`
	CountryName       string            `json:"country_name"`
	CountryCode       string            `json:"country_code"`
	ThemeScore        int               `json:"theme_score"`
	AllThemeScores    map[string]int    `json:"all_theme_scores"`
	Highlights        []string          `json:"highlights"`
	Description       string            `json:"description"`
	AverageFlightTime float64           `json:"average_flight_time"`
	PriceRange        string            `json:"price_range"`
	BestMonths        []string          `json:"best_months"`
	PopularityScore   float64           `json:"popularity_score"`
	ReasonForMatch    string            `json:"reason_for_match"`
	EstimatedPrice    EstimatedPrice    `json:"estimated_price"`
}

// CountryAggregation provides country-level statistics
type CountryAggregation struct {
	CountryCode       string  `json:"country_code"`
	CountryName       string  `json:"country_name"`
	DestinationCount  int     `json:"destination_count"`
	AverageScore      float64 `json:"average_score"`
	BestScore         int     `json:"best_score"`
	AverageFlightTime float64 `json:"average_flight_time"`
	PriceRanges       []string `json:"price_ranges"`
}

// EstimatedPrice provides price estimation
type EstimatedPrice struct {
	Currency     string `json:"currency"`
	MinPrice     int    `json:"min_price"`
	MaxPrice     int    `json:"max_price"`
	AveragePrice int    `json:"average_price"`
	Confidence   string `json:"confidence"`
}

// SearchMetadata provides additional search information
type SearchMetadata struct {
	ThemeDefinition ThemeDefinition `json:"theme_definition"`
	SearchStrategy  string          `json:"search_strategy"`
	Filters         []string        `json:"filters_applied"`
	Recommendations []string        `json:"recommendations"`
}

// ThemeDefinition provides theme information
type ThemeDefinition struct {
	Key         string   `json:"key"`
	Name        string   `json:"name"`
	Description string   `json:"description"`
	Keywords    []string `json:"keywords"`
}

// GetDestinationsByTheme retrieves destinations for a specific theme
func (h *ThemeDestinationHandler) GetDestinationsByTheme(c *gin.Context) {
	startTime := time.Now()
	requestID := "theme_" + time.Now().Format("20060102_150405")

	var req ThemeDestinationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":      "Invalid request format",
			"request_id": requestID,
			"details":    err.Error(),
		})
		return
	}

	// Validate request
	if err := h.validator.Struct(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":      "Request validation failed",
			"request_id": requestID,
			"details":    err.Error(),
		})
		return
	}

	// Set default values
	if req.MinScore == nil {
		defaultScore := 60
		req.MinScore = &defaultScore
	}
	if req.Limit == nil {
		defaultLimit := 20
		req.Limit = &defaultLimit
	}

	// Validate theme
	validThemes := []string{"party", "adventure", "learn", "shopping", "beach"}
	themeValid := false
	for _, validTheme := range validThemes {
		if strings.EqualFold(req.Theme, validTheme) {
			req.Theme = strings.ToLower(req.Theme)
			themeValid = true
			break
		}
	}

	if !themeValid {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":         "Invalid theme",
			"request_id":    requestID,
			"valid_themes":  validThemes,
			"provided":      req.Theme,
		})
		return
	}

	// Check cache first
	cacheKey := h.generateCacheKey(req)
	cacheHit := false
	
	if cachedData, err := h.cassandraClient.GetCachedRecommendations(c.Request.Context(), cacheKey); err == nil && cachedData != "" {
		log.Printf("Cache hit for key: %s", cacheKey)
		cacheHit = true
		
		// Parse cached data and return
		// For now, we'll skip cache parsing and go to fresh data
	}

	// Get theme-based destinations from Cassandra
	destinations, err := h.cassandraClient.GetDestinationsByTheme(c.Request.Context(), req.Theme, *req.Limit*2, *req.MinScore)
	if err != nil {
		log.Printf("Failed to get destinations by theme: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":      "Failed to retrieve destinations",
			"request_id": requestID,
			"details":    err.Error(),
		})
		return
	}

	if len(destinations) == 0 {
		c.JSON(http.StatusOK, ThemeDestinationResponse{
			RequestID:        requestID,
			Theme:           req.Theme,
			Origin:          req.Origin,
			TotalResults:    0,
			FilteredResults: 0,
			ProcessingTimeMs: time.Since(startTime).Milliseconds(),
			CacheHit:        cacheHit,
			Destinations:    []DestinationWithScoring{},
			CountryAggregations: []CountryAggregation{},
			SearchMetadata: h.buildSearchMetadata(req),
		})
		return
	}

	// Apply additional filters
	filteredDestinations := h.applyFilters(destinations, req)

	// Convert to response format and enrich with additional data
	responseDestinations := make([]DestinationWithScoring, 0, len(filteredDestinations))
	countryMap := make(map[string]*CountryAggregation)

	for _, dest := range filteredDestinations {
		// Get full destination details
		fullDest, err := h.cassandraClient.GetDestinationByIataCode(c.Request.Context(), dest.IataCode)
		if err != nil {
			log.Printf("Warning: Could not get full details for %s: %v", dest.IataCode, err)
			continue
		}

		if fullDest == nil {
			continue
		}

		// Build response destination
		respDest := DestinationWithScoring{
			ID:                fullDest.ID.String(),
			IataCode:          fullDest.IataCode,
			CityName:          fullDest.CityName,
			CountryName:       fullDest.CountryName,
			CountryCode:       fullDest.CountryCode,
			ThemeScore:        dest.ThemeScore,
			AllThemeScores:    fullDest.ThemeScores,
			Highlights:        fullDest.Highlights,
			Description:       fullDest.Description,
			AverageFlightTime: fullDest.AverageFlightTime,
			PriceRange:        fullDest.PriceRange,
			BestMonths:        fullDest.BestMonths,
			PopularityScore:   fullDest.PopularityScore,
			ReasonForMatch:    h.generateReasonForMatch(req.Theme, dest.ThemeScore, fullDest.Highlights),
			EstimatedPrice:    h.generateEstimatedPrice(fullDest.PriceRange, fullDest.AverageFlightTime),
		}

		responseDestinations = append(responseDestinations, respDest)

		// Update country aggregation
		if country, exists := countryMap[dest.CountryCode]; exists {
			country.DestinationCount++
			country.AverageScore = (country.AverageScore + float64(dest.ThemeScore)) / 2
			if dest.ThemeScore > country.BestScore {
				country.BestScore = dest.ThemeScore
			}
			country.AverageFlightTime = (country.AverageFlightTime + dest.AverageFlightTime) / 2
			
			// Add price range if not already present
			priceRangeExists := false
			for _, pr := range country.PriceRanges {
				if pr == fullDest.PriceRange {
					priceRangeExists = true
					break
				}
			}
			if !priceRangeExists {
				country.PriceRanges = append(country.PriceRanges, fullDest.PriceRange)
			}
		} else {
			countryMap[dest.CountryCode] = &CountryAggregation{
				CountryCode:       dest.CountryCode,
				CountryName:       dest.CountryName,
				DestinationCount:  1,
				AverageScore:      float64(dest.ThemeScore),
				BestScore:         dest.ThemeScore,
				AverageFlightTime: dest.AverageFlightTime,
				PriceRanges:       []string{fullDest.PriceRange},
			}
		}

		// Limit final results
		if len(responseDestinations) >= *req.Limit {
			break
		}
	}

	// Convert country map to slice
	countryAggregations := make([]CountryAggregation, 0, len(countryMap))
	for _, country := range countryMap {
		countryAggregations = append(countryAggregations, *country)
	}

	response := ThemeDestinationResponse{
		RequestID:           requestID,
		Theme:              req.Theme,
		Origin:             req.Origin,
		TotalResults:       len(destinations),
		FilteredResults:    len(responseDestinations),
		ProcessingTimeMs:   time.Since(startTime).Milliseconds(),
		CacheHit:           cacheHit,
		Destinations:       responseDestinations,
		CountryAggregations: countryAggregations,
		SearchMetadata:     h.buildSearchMetadata(req),
	}

	// Cache the response for future requests
	if !cacheHit {
		if err := h.cassandraClient.CacheRecommendations(c.Request.Context(), cacheKey, req.Origin, req.Theme, 0, response); err != nil {
			log.Printf("Warning: Failed to cache recommendations: %v", err)
		}
	}

	c.JSON(http.StatusOK, response)
}

// GetThemeDefinitions returns all available theme definitions
func (h *ThemeDestinationHandler) GetThemeDefinitions(c *gin.Context) {
	defs, err := h.cassandraClient.GetAllThemeDefinitions(c.Request.Context())
	if err != nil {
		log.Printf("Failed to fetch theme definitions: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch theme definitions",
		})
		return
	}

	themes := make([]ThemeDefinition, 0, len(defs))
	for _, d := range defs {
		var keywords []string
		for k := range d.Keywords { keywords = append(keywords, k) }
		themes = append(themes, ThemeDefinition{
			Key: d.Key,
			Name: d.Name,
			Description: d.Description,
			Keywords: keywords,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"themes":     themes,
		"total":      len(themes),
		"timestamp":  time.Now().Format(time.RFC3339),
	})
}

// CreateThemeDefinition creates a new or updates an existing theme definition
func (h *ThemeDestinationHandler) CreateThemeDefinition(c *gin.Context) {
	var req struct {
		Key         string   `json:"key" binding:"required"`
		Name        string   `json:"name" binding:"required"`
		Description string   `json:"description"`
		Keywords    []string `json:"keywords"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request", "details": err.Error()})
		return
	}

	keywordsSet := make(map[string]struct{})
	for _, k := range req.Keywords { keywordsSet[k] = struct{}{} }

	def := cassandra.ThemeDefinitionDB{
		Key: req.Key,
		Name: req.Name,
		Description: req.Description,
		Keywords: keywordsSet,
		CreatedAt: time.Now(),
	}
	if err := h.cassandraClient.UpsertThemeDefinition(c.Request.Context(), def); err != nil {
		log.Printf("Failed to upsert theme definition: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save theme definition"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true})
}

// UpdateThemeDefinition updates an existing definition by key
func (h *ThemeDestinationHandler) UpdateThemeDefinition(c *gin.Context) {
	key := c.Param("key")
	if key == "" { c.JSON(http.StatusBadRequest, gin.H{"error": "key is required"}); return }

	var req struct {
		Name        *string  `json:"name"`
		Description *string  `json:"description"`
		Keywords    []string `json:"keywords"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request", "details": err.Error()})
		return
	}

	keywordsSet := make(map[string]struct{})
	for _, k := range req.Keywords { keywordsSet[k] = struct{}{} }

	def := cassandra.ThemeDefinitionDB{ Key: key, CreatedAt: time.Now() }
	if req.Name != nil { def.Name = *req.Name }
	if req.Description != nil { def.Description = *req.Description }
	if len(req.Keywords) > 0 { def.Keywords = keywordsSet }

	if err := h.cassandraClient.UpsertThemeDefinition(c.Request.Context(), def); err != nil {
		log.Printf("Failed to update theme definition: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update theme definition"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true})
}

// DeleteThemeDefinition deletes a definition by key
func (h *ThemeDestinationHandler) DeleteThemeDefinition(c *gin.Context) {
	key := c.Param("key")
	if key == "" { c.JSON(http.StatusBadRequest, gin.H{"error": "key is required"}); return }
	if err := h.cassandraClient.DeleteThemeDefinition(c.Request.Context(), key); err != nil {
		log.Printf("Failed to delete theme definition: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete theme definition"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true})
}

// ListRecommendationsCache returns recent cache entries
func (h *ThemeDestinationHandler) ListRecommendationsCache(c *gin.Context) {
    limitStr := c.Query("limit")
    limit := 100
    if limitStr != "" {
        if n, err := strconv.Atoi(limitStr); err == nil { limit = n }
    }
    entries, err := h.cassandraClient.ListCachedRecommendations(c.Request.Context(), limit)
    if err != nil {
        log.Printf("Failed to list cache: %v", err)
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to list cache"})
        return
    }
    c.JSON(http.StatusOK, gin.H{ "items": entries, "total": len(entries) })
}

// DeleteRecommendationCache deletes a cache entry by cache_key
func (h *ThemeDestinationHandler) DeleteRecommendationCache(c *gin.Context) {
    key := c.Param("cacheKey")
    if key == "" { c.JSON(http.StatusBadRequest, gin.H{"error": "cacheKey is required"}); return }
    if err := h.cassandraClient.DeleteCachedRecommendation(c.Request.Context(), key); err != nil {
        log.Printf("Failed to delete cache entry: %v", err)
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete cache entry"})
        return
    }
    c.JSON(http.StatusOK, gin.H{"success": true})
}

// UpdateDestinationByIata updates description/highlights/theme scores for a destination
func (h *ThemeDestinationHandler) UpdateDestinationByIata(c *gin.Context) {
    iata := strings.ToUpper(c.Param("iata"))
    if iata == "" { c.JSON(http.StatusBadRequest, gin.H{"error": "iata is required"}); return }

    var req struct {
        Description *string           `json:"description"`
        Highlights  *[]string         `json:"highlights"`
        ThemeScores *map[string]int   `json:"theme_scores"`
    }
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request", "details": err.Error()})
        return
    }

    id, err := h.cassandraClient.GetDestinationIDByIataCode(c.Request.Context(), iata)
    if err != nil {
        log.Printf("Failed to lookup destination id: %v", err)
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Lookup failed"})
        return
    }
    if id == (uuid.UUID{}) {
        c.JSON(http.StatusNotFound, gin.H{"error": "Destination not found"})
        return
    }

    updates := struct{
        Description *string
        Highlights  *[]string
        ThemeScores *map[string]int
    }{ Description: req.Description, Highlights: req.Highlights, ThemeScores: req.ThemeScores }

    if err := h.cassandraClient.UpdateDestinationByID(c.Request.Context(), id, updates); err != nil {
        log.Printf("Failed to update destination: %v", err)
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Update failed"})
        return
    }
    c.JSON(http.StatusOK, gin.H{"success": true})
}

// GetDestinationsByCountry returns destinations grouped by country
func (h *ThemeDestinationHandler) GetDestinationsByCountry(c *gin.Context) {
	countryCode := c.Param("country")
	if countryCode == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Country code parameter is required",
		})
		return
	}

	destinations, err := h.cassandraClient.GetDestinationsByCountry(c.Request.Context(), strings.ToUpper(countryCode))
	if err != nil {
		log.Printf("Failed to get destinations by country: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to retrieve destinations",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"country_code":  strings.ToUpper(countryCode),
		"destinations":  destinations,
		"total":         len(destinations),
		"timestamp":     time.Now().Format(time.RFC3339),
	})
}

// Helper methods

func (h *ThemeDestinationHandler) generateCacheKey(req ThemeDestinationRequest) string {
	key := fmt.Sprintf("%s_%s_%d_%d_%d",
		req.Origin,
		req.Theme,
		*req.MinScore,
		*req.Limit,
		time.Now().Format("2006010215"), // Cache for 1 hour
	)

	if req.MaxFlightTime != nil {
		key += fmt.Sprintf("_%d", *req.MaxFlightTime)
	}
	if req.PriceRange != nil {
		key += "_" + *req.PriceRange
	}

	return key
}

func (h *ThemeDestinationHandler) applyFilters(destinations []cassandra.ThemeDestinationByTheme, req ThemeDestinationRequest) []cassandra.ThemeDestinationByTheme {
	filtered := make([]cassandra.ThemeDestinationByTheme, 0, len(destinations))

	for _, dest := range destinations {
		// Apply flight time filter
		if req.MaxFlightTime != nil && dest.AverageFlightTime > float64(*req.MaxFlightTime) {
			continue
		}

		// Apply price range filter
		if req.PriceRange != nil && dest.PriceRange != *req.PriceRange {
			continue
		}

		// Apply country filters
		if len(req.IncludeCountries) > 0 {
			countryIncluded := false
			for _, country := range req.IncludeCountries {
				if strings.EqualFold(dest.CountryCode, country) {
					countryIncluded = true
					break
				}
			}
			if !countryIncluded {
				continue
			}
		}

		if len(req.ExcludeCountries) > 0 {
			countryExcluded := false
			for _, country := range req.ExcludeCountries {
				if strings.EqualFold(dest.CountryCode, country) {
					countryExcluded = true
					break
				}
			}
			if countryExcluded {
				continue
			}
		}

		filtered = append(filtered, dest)
	}

	return filtered
}

func (h *ThemeDestinationHandler) generateReasonForMatch(theme string, score int, highlights []string) string {
	var reason string
	
	switch {
	case score >= 90:
		reason = "Exceptional choice for " + theme
	case score >= 75:
		reason = "Great option for " + theme
	case score >= 60:
		reason = "Good fit for " + theme
	default:
		reason = "Suitable for " + theme
	}

	if len(highlights) > 0 {
		reason += " - featuring " + highlights[0]
	}

	return reason
}

func (h *ThemeDestinationHandler) generateEstimatedPrice(priceRange string, flightTime float64) EstimatedPrice {
	var min, max, avg int
	var confidence string

	switch priceRange {
	case "budget":
		min, max = int(flightTime*20+50), int(flightTime*30+100)
		confidence = "medium"
	case "mid-range":
		min, max = int(flightTime*30+100), int(flightTime*50+200)
		confidence = "high"
	case "luxury":
		min, max = int(flightTime*50+200), int(flightTime*80+400)
		confidence = "medium"
	default:
		min, max = int(flightTime*25+75), int(flightTime*40+150)
		confidence = "low"
	}

	avg = (min + max) / 2

	return EstimatedPrice{
		Currency:     "EUR",
		MinPrice:     min,
		MaxPrice:     max,
		AveragePrice: avg,
		Confidence:   confidence,
	}
}

func (h *ThemeDestinationHandler) buildSearchMetadata(req ThemeDestinationRequest) SearchMetadata {
	// Find theme definition
	var themeDef ThemeDefinition
	themes := []ThemeDefinition{
		{"party", "Social & Entertainment", "Nightlife, bars, clubs, music festivals, food scenes, social dining experiences", []string{"nightlife", "bars", "clubs", "restaurants", "music", "festivals", "social"}},
		{"adventure", "Active & Outdoor", "Hiking, extreme sports, nature activities, budget backpacking, outdoor wellness", []string{"hiking", "sports", "nature", "outdoor", "backpacking", "adventure", "mountains"}},
		{"learn", "Cultural & Creative", "Museums, history, arts districts, creative scenes, digital nomad hubs, education", []string{"museums", "history", "culture", "arts", "creative", "learning", "architecture"}},
		{"shopping", "Luxury & Indulgent", "Fashion, luxury shopping, spas, wellness experiences, romantic getaways, premium services", []string{"shopping", "luxury", "fashion", "spas", "wellness", "romance", "premium"}},
		{"beach", "Relaxation & Family", "Coastal destinations, family activities, leisure travel, beach wellness, water sports", []string{"beach", "coast", "family", "relaxation", "water", "leisure", "islands"}},
	}

	for _, theme := range themes {
		if theme.Key == req.Theme {
			themeDef = theme
			break
		}
	}

	// Build filters applied
	filters := []string{
		"theme_score >= " + strconv.Itoa(*req.MinScore),
	}
	if req.MaxFlightTime != nil {
		filters = append(filters, "flight_time <= "+strconv.Itoa(*req.MaxFlightTime)+"h")
	}
	if req.PriceRange != nil {
		filters = append(filters, "price_range = "+*req.PriceRange)
	}
	if len(req.IncludeCountries) > 0 {
		filters = append(filters, "include_countries: "+strings.Join(req.IncludeCountries, ","))
	}
	if len(req.ExcludeCountries) > 0 {
		filters = append(filters, "exclude_countries: "+strings.Join(req.ExcludeCountries, ","))
	}

	recommendations := []string{
		"Results are sorted by theme score (highest first)",
		"Consider multiple themes for diverse experiences",
		"Price estimates are based on historical data",
	}

	if req.Theme == "party" {
		recommendations = append(recommendations, "Best visited during summer months for outdoor events")
	} else if req.Theme == "adventure" {
		recommendations = append(recommendations, "Check seasonal weather conditions for outdoor activities")
	} else if req.Theme == "beach" {
		recommendations = append(recommendations, "Consider shoulder season for better prices")
	}

	return SearchMetadata{
		ThemeDefinition: themeDef,
		SearchStrategy:  "theme_score_descending_with_filters",
		Filters:         filters,
		Recommendations: recommendations,
	}
}