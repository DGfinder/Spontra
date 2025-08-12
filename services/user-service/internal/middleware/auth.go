package middleware

import (
	"fmt"
	"net/http"
	"strings"

	"spontra/user-service/internal/auth"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// AuthMiddleware creates authentication middleware
func AuthMiddleware(authService *auth.AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error":   "missing_authorization_header",
				"message": "Authorization header is required",
			})
			c.Abort()
			return
		}

		// Extract token from "Bearer <token>" format
		tokenParts := strings.SplitN(authHeader, " ", 2)
		if len(tokenParts) != 2 || tokenParts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error":   "invalid_authorization_format",
				"message": "Authorization header must be in 'Bearer <token>' format",
			})
			c.Abort()
			return
		}

		token := tokenParts[1]
		
		// Validate the token
		claims, err := authService.ValidateAccessToken(token)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error":   "invalid_token",
				"message": "Invalid or expired token",
			})
			c.Abort()
			return
		}

		// Store user information in context
		c.Set("user_id", claims.UserID)
		c.Set("user_email", claims.Email)
		c.Set("claims", claims)

		c.Next()
	}
}

// OptionalAuthMiddleware provides optional authentication
func OptionalAuthMiddleware(authService *auth.AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			// No auth header, continue without authentication
			c.Next()
			return
		}

		// Extract token from "Bearer <token>" format
		tokenParts := strings.SplitN(authHeader, " ", 2)
		if len(tokenParts) != 2 || tokenParts[0] != "Bearer" {
			// Invalid format, continue without authentication
			c.Next()
			return
		}

		token := tokenParts[1]
		
		// Validate the token
		claims, err := authService.ValidateAccessToken(token)
		if err != nil {
			// Invalid token, continue without authentication
			c.Next()
			return
		}

		// Store user information in context
		c.Set("user_id", claims.UserID)
		c.Set("user_email", claims.Email)
		c.Set("claims", claims)

		c.Next()
	}
}

// GetUserID extracts user ID from gin context
func GetUserID(c *gin.Context) (uuid.UUID, error) {
	userID, exists := c.Get("user_id")
	if !exists {
		return uuid.Nil, fmt.Errorf("user_id not found in context")
	}
	
	id, ok := userID.(uuid.UUID)
	if !ok {
		return uuid.Nil, fmt.Errorf("user_id is not a valid UUID")
	}
	
	return id, nil
}

// GetUserEmail extracts user email from gin context
func GetUserEmail(c *gin.Context) (string, error) {
	userEmail, exists := c.Get("user_email")
	if !exists {
		return "", fmt.Errorf("user_email not found in context")
	}
	
	email, ok := userEmail.(string)
	if !ok {
		return "", fmt.Errorf("user_email is not a valid string")
	}
	
	return email, nil
}

// RequireOwnership middleware ensures user can only access their own resources
func RequireOwnership() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get authenticated user ID
		authenticatedUserID, err := GetUserID(c)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error":   "authentication_required",
				"message": "User authentication required",
			})
			c.Abort()
			return
		}

		// Get resource user ID from URL parameter
		resourceUserIDStr := c.Param("id")
		if resourceUserIDStr == "" {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "missing_user_id",
				"message": "User ID parameter is required",
			})
			c.Abort()
			return
		}

		resourceUserID, err := uuid.Parse(resourceUserIDStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "invalid_user_id",
				"message": "Invalid user ID format",
			})
			c.Abort()
			return
		}

		// Check if the authenticated user is accessing their own resource
		if authenticatedUserID != resourceUserID {
			c.JSON(http.StatusForbidden, gin.H{
				"error":   "access_denied",
				"message": "You can only access your own resources",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}