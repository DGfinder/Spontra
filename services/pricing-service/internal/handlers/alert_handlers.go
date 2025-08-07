package handlers

import (
	"net/http"

	"spontra/pricing-service/internal/models"
	"spontra/pricing-service/internal/services"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// AlertHandler handles price alert-related HTTP requests
type AlertHandler struct {
	alertService *services.AlertService
}

// NewAlertHandler creates a new alert handler
func NewAlertHandler(alertService *services.AlertService) *AlertHandler {
	return &AlertHandler{
		alertService: alertService,
	}
}

// CreatePriceAlert handles price alert creation requests
func (h *AlertHandler) CreatePriceAlert(c *gin.Context) {
	var req models.PriceAlertRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "invalid_request",
			"message": "Invalid request data",
			"details": err.Error(),
		})
		return
	}

	// Validate the request
	if err := h.alertService.ValidateAlertRequest(&req); err != nil {
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

	// Create the alert
	alert, err := h.alertService.CreatePriceAlert(userID, &req)
	if err != nil {
		if err.Error() == "maximum number of alerts reached (5)" {
			c.JSON(http.StatusConflict, gin.H{
				"error":   "limit_exceeded",
				"message": err.Error(),
			})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "creation_failed",
			"message": "Failed to create price alert",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"alert":   alert,
		"message": "Price alert created successfully",
	})
}

// GetUserAlerts handles requests to get user's price alerts
func (h *AlertHandler) GetUserAlerts(c *gin.Context) {
	// Get user ID from URL parameter
	userIDStr := c.Param("userId")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "invalid_user_id",
			"message": "Invalid user ID format",
		})
		return
	}

	// Get authenticated user ID from context
	authUserIDStr, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "authentication_required",
			"message": "User authentication required",
		})
		return
	}

	authUserID, ok := authUserIDStr.(uuid.UUID)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "invalid_auth_user_id",
			"message": "Invalid authenticated user ID",
		})
		return
	}

	// Check if user is requesting their own alerts
	if userID != authUserID {
		c.JSON(http.StatusForbidden, gin.H{
			"error":   "access_denied",
			"message": "You can only access your own alerts",
		})
		return
	}

	alerts, err := h.alertService.GetUserPriceAlerts(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "retrieval_failed",
			"message": "Failed to get price alerts",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"user_id": userID,
		"alerts":  alerts,
		"count":   len(alerts),
	})
}

// UpdatePriceAlert handles price alert update requests
func (h *AlertHandler) UpdatePriceAlert(c *gin.Context) {
	alertIDStr := c.Param("alertId")
	alertID, err := uuid.Parse(alertIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "invalid_alert_id",
			"message": "Invalid alert ID format",
		})
		return
	}

	var updates models.PriceAlert
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "invalid_request",
			"message": "Invalid request data",
			"details": err.Error(),
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

	if err := h.alertService.UpdatePriceAlert(alertID, userID, &updates); err != nil {
		if err.Error() == "unauthorized: alert belongs to different user" {
			c.JSON(http.StatusForbidden, gin.H{
				"error":   "access_denied",
				"message": "You can only update your own alerts",
			})
			return
		}

		if err.Error() == "failed to get price alert: price alert not found" {
			c.JSON(http.StatusNotFound, gin.H{
				"error":   "alert_not_found",
				"message": "Price alert not found",
			})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "update_failed",
			"message": "Failed to update price alert",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Price alert updated successfully",
	})
}

// DeletePriceAlert handles price alert deletion requests
func (h *AlertHandler) DeletePriceAlert(c *gin.Context) {
	alertIDStr := c.Param("alertId")
	alertID, err := uuid.Parse(alertIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "invalid_alert_id",
			"message": "Invalid alert ID format",
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

	if err := h.alertService.DeletePriceAlert(alertID, userID); err != nil {
		if err.Error() == "price alert not found or unauthorized" {
			c.JSON(http.StatusNotFound, gin.H{
				"error":   "alert_not_found",
				"message": "Price alert not found or you don't have permission to delete it",
			})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "deletion_failed",
			"message": "Failed to delete price alert",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Price alert deleted successfully",
	})
}