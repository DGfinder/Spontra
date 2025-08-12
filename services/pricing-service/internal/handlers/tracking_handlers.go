package handlers

import (
	"net/http"
	"strconv"

	"spontra/pricing-service/internal/models"
	"spontra/pricing-service/internal/services"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// TrackingHandler handles price tracking-related HTTP requests
type TrackingHandler struct {
	trackingService *services.TrackingService
}

// NewTrackingHandler creates a new tracking handler
func NewTrackingHandler(trackingService *services.TrackingService) *TrackingHandler {
	return &TrackingHandler{
		trackingService: trackingService,
	}
}

// CreatePriceTracking handles price tracking creation requests
func (h *TrackingHandler) CreatePriceTracking(c *gin.Context) {
	var req models.PriceTrackingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "invalid_request",
			"message": "Invalid request data",
			"details": err.Error(),
		})
		return
	}

	// Validate the request
	if err := h.trackingService.ValidateTrackingRequest(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "validation_failed",
			"message": err.Error(),
		})
		return
	}

	// Get user ID from context (set by auth middleware)
	userIDStr, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "authentication_required",
			"message": "User authentication required",
		})
		return
	}

	userID, ok := userIDStr.(uuid.UUID)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "invalid_user_id",
			"message": "Invalid user ID format",
		})
		return
	}

	// Create the tracking record
	tracking, err := h.trackingService.CreatePriceTracking(userID, &req)
	if err != nil {
		if err.Error() == "maximum number of tracking records reached (10)" {
			c.JSON(http.StatusConflict, gin.H{
				"error":   "limit_exceeded",
				"message": err.Error(),
			})
			return
		}

		if err.Error() == "tracking already exists for this route" {
			c.JSON(http.StatusConflict, gin.H{
				"error":   "duplicate_tracking",
				"message": err.Error(),
			})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "creation_failed",
			"message": "Failed to create price tracking",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"tracking": tracking,
		"message":  "Price tracking created successfully",
	})
}

// GetUserTracking handles requests to get user's price tracking records
func (h *TrackingHandler) GetUserTracking(c *gin.Context) {
	// Get user ID from context
	userIDStr, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "authentication_required",
			"message": "User authentication required",
		})
		return
	}

	userID, ok := userIDStr.(uuid.UUID)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "invalid_user_id",
			"message": "Invalid user ID format",
		})
		return
	}

	// Check if detailed data is requested
	includeDetails := c.DefaultQuery("include_details", "false")

	if includeDetails == "true" {
		// Get tracking with price data
		trackingWithPrices, err := h.trackingService.GetPriceTrackingWithPrices(userID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   "retrieval_failed",
				"message": "Failed to get price tracking with details",
				"details": err.Error(),
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"user_id":  userID,
			"tracking": trackingWithPrices,
			"count":    len(trackingWithPrices),
		})
		return
	}

	// Get basic tracking records
	tracking, err := h.trackingService.GetUserPriceTracking(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "retrieval_failed",
			"message": "Failed to get price tracking",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"user_id":  userID,
		"tracking": tracking,
		"count":    len(tracking),
	})
}

// StopPriceTracking handles requests to stop price tracking
func (h *TrackingHandler) StopPriceTracking(c *gin.Context) {
	trackingIDStr := c.Param("trackingId")
	trackingID, err := uuid.Parse(trackingIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "invalid_tracking_id",
			"message": "Invalid tracking ID format",
		})
		return
	}

	// Get user ID from context
	userIDStr, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "authentication_required",
			"message": "User authentication required",
		})
		return
	}

	userID, ok := userIDStr.(uuid.UUID)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "invalid_user_id",
			"message": "Invalid user ID format",
		})
		return
	}

	if err := h.trackingService.StopPriceTracking(trackingID, userID); err != nil {
		if err.Error() == "price tracking not found or unauthorized" {
			c.JSON(http.StatusNotFound, gin.H{
				"error":   "tracking_not_found",
				"message": "Price tracking not found or you don't have permission to stop it",
			})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "stop_failed",
			"message": "Failed to stop price tracking",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Price tracking stopped successfully",
	})
}

// DeletePriceTracking handles requests to delete price tracking
func (h *TrackingHandler) DeletePriceTracking(c *gin.Context) {
	trackingIDStr := c.Param("trackingId")
	trackingID, err := uuid.Parse(trackingIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "invalid_tracking_id",
			"message": "Invalid tracking ID format",
		})
		return
	}

	// Get user ID from context
	userIDStr, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "authentication_required",
			"message": "User authentication required",
		})
		return
	}

	userID, ok := userIDStr.(uuid.UUID)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "invalid_user_id",
			"message": "Invalid user ID format",
		})
		return
	}

	if err := h.trackingService.DeletePriceTracking(trackingID, userID); err != nil {
		if err.Error() == "price tracking not found or unauthorized" {
			c.JSON(http.StatusNotFound, gin.H{
				"error":   "tracking_not_found",
				"message": "Price tracking not found or you don't have permission to delete it",
			})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "deletion_failed",
			"message": "Failed to delete price tracking",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Price tracking deleted successfully",
	})
}

// GetTrackingStats handles requests for tracking statistics
func (h *TrackingHandler) GetTrackingStats(c *gin.Context) {
	stats, err := h.trackingService.GetTrackingStats()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "stats_failed",
			"message": "Failed to get tracking statistics",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"statistics": stats,
	})
}

// GetPopularTrackedRoutes handles requests for popular tracked routes
func (h *TrackingHandler) GetPopularTrackedRoutes(c *gin.Context) {
	limitStr := c.DefaultQuery("limit", "10")
	limit := 10

	if limitStr != "10" {
		if parsedLimit, err := strconv.Atoi(limitStr); err == nil && parsedLimit > 0 && parsedLimit <= 50 {
			limit = parsedLimit
		}
	}

	routes, err := h.trackingService.GetPopularTrackedRoutes(limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "routes_failed",
			"message": "Failed to get popular tracked routes",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"limit":  limit,
		"routes": routes,
	})
}