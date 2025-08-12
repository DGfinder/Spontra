package handlers

import (
	"net/http"

	"spontra/user-service/internal/middleware"
	"spontra/user-service/internal/models"
	"spontra/user-service/internal/repository"
	
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// UserHandler handles user-related requests
type UserHandler struct {
	userRepo *repository.UserRepository
}

// NewUserHandler creates a new user handler
func NewUserHandler(userRepo *repository.UserRepository) *UserHandler {
	return &UserHandler{
		userRepo: userRepo,
	}
}

// GetUser retrieves a user by ID
func (h *UserHandler) GetUser(c *gin.Context) {
	userIDStr := c.Param("id")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "invalid_user_id",
			"message": "Invalid user ID format",
		})
		return
	}

	user, err := h.userRepo.GetUserByID(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "user_not_found",
			"message": "User not found",
		})
		return
	}

	// Remove password hash from response
	user.PasswordHash = ""

	c.JSON(http.StatusOK, gin.H{
		"user": user,
	})
}

// UpdateUser updates a user's information
func (h *UserHandler) UpdateUser(c *gin.Context) {
	userIDStr := c.Param("id")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "invalid_user_id",
			"message": "Invalid user ID format",
		})
		return
	}

	var req models.UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "invalid_request",
			"message": "Invalid request data",
			"details": err.Error(),
		})
		return
	}

	updatedUser, err := h.userRepo.UpdateUser(userID, &req)
	if err != nil {
		if err.Error() == "user not found" {
			c.JSON(http.StatusNotFound, gin.H{
				"error":   "user_not_found",
				"message": "User not found",
			})
			return
		}
		if err.Error() == "no fields to update" {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "no_fields_to_update",
				"message": "At least one field must be provided for update",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "update_failed",
			"message": "Failed to update user",
			"details": err.Error(),
		})
		return
	}

	// Remove password hash from response
	updatedUser.PasswordHash = ""

	c.JSON(http.StatusOK, gin.H{
		"user": updatedUser,
	})
}

// DeleteUser deletes a user
func (h *UserHandler) DeleteUser(c *gin.Context) {
	userIDStr := c.Param("id")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "invalid_user_id",
			"message": "Invalid user ID format",
		})
		return
	}

	err = h.userRepo.DeleteUser(userID)
	if err != nil {
		if err.Error() == "user not found" {
			c.JSON(http.StatusNotFound, gin.H{
				"error":   "user_not_found",
				"message": "User not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "deletion_failed",
			"message": "Failed to delete user",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "User deleted successfully",
	})
}

// GetUserPreferences retrieves user preferences
func (h *UserHandler) GetUserPreferences(c *gin.Context) {
	userIDStr := c.Param("id")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "invalid_user_id",
			"message": "Invalid user ID format",
		})
		return
	}

	preferences, err := h.userRepo.GetUserPreferences(userID)
	if err != nil {
		if err.Error() == "user preferences not found" {
			// Try to create default preferences
			preferences, err = h.userRepo.CreateUserPreferences(userID)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{
					"error":   "preferences_creation_failed",
					"message": "Failed to create user preferences",
				})
				return
			}
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   "preferences_retrieval_failed",
				"message": "Failed to retrieve user preferences",
				"details": err.Error(),
			})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"preferences": preferences,
	})
}

// UpdateUserPreferences updates user preferences
func (h *UserHandler) UpdateUserPreferences(c *gin.Context) {
	userIDStr := c.Param("id")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "invalid_user_id",
			"message": "Invalid user ID format",
		})
		return
	}

	var req models.UserPreferences
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "invalid_request",
			"message": "Invalid request data",
			"details": err.Error(),
		})
		return
	}

	// Validate flight duration preferences
	if req.PreferredFlightDuration.MinHours < 0 || req.PreferredFlightDuration.MaxHours > 24 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "invalid_flight_duration",
			"message": "Flight duration must be between 0 and 24 hours",
		})
		return
	}

	if req.PreferredFlightDuration.MinHours >= req.PreferredFlightDuration.MaxHours {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "invalid_flight_duration_range",
			"message": "Minimum flight duration must be less than maximum",
		})
		return
	}

	// Validate budget level
	validBudgetLevels := map[string]bool{
		"budget":  true,
		"economy": true,
		"premium": true,
		"luxury":  true,
		"any":     true,
	}
	if !validBudgetLevels[req.PreferredBudgetLevel] {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "invalid_budget_level",
			"message": "Budget level must be one of: budget, economy, premium, luxury, any",
		})
		return
	}

	updatedPreferences, err := h.userRepo.UpdateUserPreferences(userID, &req)
	if err != nil {
		if err.Error() == "user preferences not found" {
			c.JSON(http.StatusNotFound, gin.H{
				"error":   "preferences_not_found",
				"message": "User preferences not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "update_failed",
			"message": "Failed to update user preferences",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"preferences": updatedPreferences,
	})
}

// GetCurrentUserSessions retrieves all active sessions for the current user
func (h *UserHandler) GetCurrentUserSessions(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "authentication_required",
			"message": "User authentication required",
		})
		return
	}

	// This would require the session repository, but we'll add it later
	// For now, return a placeholder response with user ID
	c.JSON(http.StatusOK, gin.H{
		"user_id": userID,
		"sessions": []map[string]interface{}{
			{
				"id":         "current",
				"created_at": "2025-08-03T00:00:00Z",
				"ip_address": c.ClientIP(),
				"user_agent": c.GetHeader("User-Agent"),
				"is_current": true,
			},
		},
	})
}

// UpdatePassword allows users to change their password
func (h *UserHandler) UpdatePassword(c *gin.Context) {
	userIDStr := c.Param("id")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "invalid_user_id",
			"message": "Invalid user ID format",
		})
		return
	}

	var req struct {
		CurrentPassword string `json:"current_password" binding:"required"`
		NewPassword     string `json:"new_password" binding:"required,min=8"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "invalid_request",
			"message": "Invalid request data",
			"details": err.Error(),
		})
		return
	}

	// Get current user to verify they exist
	_, err = h.userRepo.GetUserByID(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "user_not_found",
			"message": "User not found",
		})
		return
	}

	// For now, return a placeholder response as we need the auth service
	// This would be implemented with proper password verification and hashing
	c.JSON(http.StatusOK, gin.H{
		"message": "Password update functionality will be implemented with auth service integration",
	})
}