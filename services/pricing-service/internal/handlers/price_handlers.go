package handlers

import (
	"net/http"
	"strconv"
	"time"

	"spontra/pricing-service/internal/models"
	"spontra/pricing-service/internal/services"
	"github.com/gin-gonic/gin"
)

// PriceHandler handles price-related HTTP requests
type PriceHandler struct {
	priceService     *services.PriceService
	analyticsService *services.AnalyticsService
}

// NewPriceHandler creates a new price handler
func NewPriceHandler(priceService *services.PriceService, analyticsService *services.AnalyticsService) *PriceHandler {
	return &PriceHandler{
		priceService:     priceService,
		analyticsService: analyticsService,
	}
}

// ComparePrices handles price comparison requests
func (h *PriceHandler) ComparePrices(c *gin.Context) {
	var req models.PriceComparisonRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "invalid_request",
			"message": "Invalid request data",
			"details": err.Error(),
		})
		return
	}

	// Validate the request
	if err := h.priceService.ValidateSearchRequest(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "validation_failed",
			"message": err.Error(),
		})
		return
	}

	// Compare prices
	response, err := h.priceService.ComparePrices(&req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "comparison_failed",
			"message": "Failed to compare prices",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, response)
}

// GetPriceHistory handles price history requests
func (h *PriceHandler) GetPriceHistory(c *gin.Context) {
	origin := c.Query("origin")
	destination := c.Query("destination")
	daysStr := c.DefaultQuery("days", "30")

	if origin == "" || destination == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "missing_parameters",
			"message": "Origin and destination parameters are required",
		})
		return
	}

	days, err := strconv.Atoi(daysStr)
	if err != nil || days < 1 || days > 365 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "invalid_days",
			"message": "Days parameter must be between 1 and 365",
		})
		return
	}

	history, err := h.priceService.GetPriceHistory(origin, destination, days)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "history_failed",
			"message": "Failed to get price history",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"origin":      origin,
		"destination": destination,
		"days":        days,
		"history":     history,
	})
}

// GetPriceStatistics handles price statistics requests
func (h *PriceHandler) GetPriceStatistics(c *gin.Context) {
	origin := c.Query("origin")
	destination := c.Query("destination")
	startDateStr := c.Query("start_date")
	endDateStr := c.DefaultQuery("end_date", time.Now().Format("2006-01-02"))

	if origin == "" || destination == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "missing_parameters",
			"message": "Origin and destination parameters are required",
		})
		return
	}

	// Default to last 30 days if start_date not provided
	if startDateStr == "" {
		startDateStr = time.Now().AddDate(0, 0, -30).Format("2006-01-02")
	}

	startDate, err := time.Parse("2006-01-02", startDateStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "invalid_start_date",
			"message": "Start date must be in YYYY-MM-DD format",
		})
		return
	}

	endDate, err := time.Parse("2006-01-02", endDateStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "invalid_end_date",
			"message": "End date must be in YYYY-MM-DD format",
		})
		return
	}

	if endDate.Before(startDate) {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "invalid_date_range",
			"message": "End date cannot be before start date",
		})
		return
	}

	stats, err := h.priceService.GetPriceStatistics(origin, destination, startDate, endDate)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "statistics_failed",
			"message": "Failed to get price statistics",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"origin":      origin,
		"destination": destination,
		"start_date":  startDate.Format("2006-01-02"),
		"end_date":    endDate.Format("2006-01-02"),
		"statistics":  stats,
	})
}

// GetPopularRoutes handles popular routes requests
func (h *PriceHandler) GetPopularRoutes(c *gin.Context) {
	limitStr := c.DefaultQuery("limit", "10")
	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit < 1 || limit > 50 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "invalid_limit",
			"message": "Limit parameter must be between 1 and 50",
		})
		return
	}

	routes, err := h.priceService.GetPopularRoutes(limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "routes_failed",
			"message": "Failed to get popular routes",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"limit":  limit,
		"routes": routes,
	})
}

// GetPriceTrends handles price trends requests
func (h *PriceHandler) GetPriceTrends(c *gin.Context) {
	route := c.Param("route")
	period := c.DefaultQuery("period", "30d")

	if route == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "missing_route",
			"message": "Route parameter is required",
		})
		return
	}

	// Parse route (expecting format like "LHR-CDG")
	// This is simplified - in production you'd want more robust parsing
	if len(route) < 7 || route[3] != '-' {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "invalid_route_format",
			"message": "Route must be in format 'XXX-YYY' (e.g., 'LHR-CDG')",
		})
		return
	}

	origin := route[:3]
	destination := route[4:7]

	// Validate period
	validPeriods := map[string]bool{
		"7d":  true,
		"30d": true,
		"90d": true,
	}

	if !validPeriods[period] {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "invalid_period",
			"message": "Period must be one of: 7d, 30d, 90d",
		})
		return
	}

	trend, err := h.analyticsService.GetPriceTrends(origin, destination, period)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "trends_failed",
			"message": "Failed to get price trends",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, trend)
}

// GetPricePredictions handles price prediction requests
func (h *PriceHandler) GetPricePredictions(c *gin.Context) {
	route := c.Param("route")
	horizon := c.DefaultQuery("horizon", "2w")

	if route == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "missing_route",
			"message": "Route parameter is required",
		})
		return
	}

	// Parse route (expecting format like "LHR-CDG")
	if len(route) < 7 || route[3] != '-' {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "invalid_route_format",
			"message": "Route must be in format 'XXX-YYY' (e.g., 'LHR-CDG')",
		})
		return
	}

	origin := route[:3]
	destination := route[4:7]

	// Validate horizon
	validHorizons := map[string]bool{
		"1w": true,
		"2w": true,
		"1m": true,
	}

	if !validHorizons[horizon] {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "invalid_horizon",
			"message": "Horizon must be one of: 1w, 2w, 1m",
		})
		return
	}

	prediction, err := h.analyticsService.GetPricePredictions(origin, destination, horizon)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "prediction_failed",
			"message": "Failed to get price predictions",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, prediction)
}

// GetRouteAnalytics handles comprehensive route analytics requests
func (h *PriceHandler) GetRouteAnalytics(c *gin.Context) {
	route := c.Param("route")

	if route == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "missing_route",
			"message": "Route parameter is required",
		})
		return
	}

	// Parse route (expecting format like "LHR-CDG")
	if len(route) < 7 || route[3] != '-' {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "invalid_route_format",
			"message": "Route must be in format 'XXX-YYY' (e.g., 'LHR-CDG')",
		})
		return
	}

	origin := route[:3]
	destination := route[4:7]

	analytics, err := h.analyticsService.GetRouteAnalytics(origin, destination)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "analytics_failed",
			"message": "Failed to get route analytics",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"route":     route,
		"analytics": analytics,
	})
}

// GetMarketOverview handles market overview requests
func (h *PriceHandler) GetMarketOverview(c *gin.Context) {
	overview, err := h.analyticsService.GetMarketOverview()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "overview_failed",
			"message": "Failed to get market overview",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, overview)
}