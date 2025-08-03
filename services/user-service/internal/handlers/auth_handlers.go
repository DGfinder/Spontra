package handlers

import (
	"fmt"
	"net/http"
	"time"

	"spontra/user-service/internal/auth"
	"spontra/user-service/internal/middleware"
	"spontra/user-service/internal/models"
	"spontra/user-service/internal/repository"
	
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// AuthHandler handles authentication-related requests
type AuthHandler struct {
	authService       *auth.AuthService
	userRepo          *repository.UserRepository
	sessionRepo       *repository.SessionRepository
}

// NewAuthHandler creates a new authentication handler
func NewAuthHandler(
	authService *auth.AuthService,
	userRepo *repository.UserRepository,
	sessionRepo *repository.SessionRepository,
) *AuthHandler {
	return &AuthHandler{
		authService: authService,
		userRepo:    userRepo,
		sessionRepo: sessionRepo,
	}
}

// RegisterUser handles user registration
func (h *AuthHandler) RegisterUser(c *gin.Context) {
	var req models.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "invalid_request",
			"message": "Invalid request data",
			"details": err.Error(),
		})
		return
	}

	// Check if user already exists
	existingUser, _ := h.userRepo.GetUserByEmail(req.Email)
	if existingUser != nil {
		c.JSON(http.StatusConflict, gin.H{
			"error":   "user_exists",
			"message": "User with this email already exists",
		})
		return
	}

	// Hash password
	hashedPassword, err := h.authService.HashPassword(req.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "password_hash_failed",
			"message": "Failed to process password",
		})
		return
	}

	// Create user
	user := &models.User{
		ID:           uuid.New(),
		Email:        req.Email,
		PasswordHash: hashedPassword,
		FirstName:    req.FirstName,
		LastName:     req.LastName,
		IsVerified:   false,
	}

	if err := h.userRepo.CreateUser(user); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "user_creation_failed",
			"message": "Failed to create user",
			"details": err.Error(),
		})
		return
	}

	// Create default user preferences
	_, err = h.userRepo.CreateUserPreferences(user.ID)
	if err != nil {
		// Log error but don't fail registration
		fmt.Printf("Failed to create user preferences for user %s: %v\n", user.ID, err)
	}

	// Generate tokens
	accessToken, err := h.authService.GenerateAccessToken(user.ID, user.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "token_generation_failed",
			"message": "Failed to generate access token",
		})
		return
	}

	refreshToken, err := h.authService.GenerateRefreshToken()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "token_generation_failed",
			"message": "Failed to generate refresh token",
		})
		return
	}

	// Create session
	session := &models.Session{
		ID:           uuid.New(),
		UserID:       user.ID,
		RefreshToken: refreshToken,
		IsActive:     true,
		ExpiresAt:    time.Now().Add(30 * 24 * time.Hour), // 30 days
		IPAddress:    getIPAddress(c),
		UserAgent:    getUserAgent(c),
	}

	if err := h.sessionRepo.CreateSession(session); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "session_creation_failed",
			"message": "Failed to create session",
		})
		return
	}

	// Remove password hash from response
	user.PasswordHash = ""

	// Return successful registration response
	c.JSON(http.StatusCreated, models.LoginResponse{
		User:         *user,
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresIn:    int64(time.Hour * 24 / time.Second), // 24 hours in seconds
	})
}

// LoginUser handles user login
func (h *AuthHandler) LoginUser(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "invalid_request",
			"message": "Invalid request data",
			"details": err.Error(),
		})
		return
	}

	// Get user by email
	user, err := h.userRepo.GetUserByEmail(req.Email)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "invalid_credentials",
			"message": "Invalid email or password",
		})
		return
	}

	// Verify password
	if !h.authService.VerifyPassword(req.Password, user.PasswordHash) {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "invalid_credentials",
			"message": "Invalid email or password",
		})
		return
	}

	// Update last login
	if err := h.userRepo.UpdateLastLogin(user.ID); err != nil {
		// Log error but don't fail login
		fmt.Printf("Failed to update last login for user %s: %v\n", user.ID, err)
	}

	// Generate tokens
	accessToken, err := h.authService.GenerateAccessToken(user.ID, user.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "token_generation_failed",
			"message": "Failed to generate access token",
		})
		return
	}

	refreshToken, err := h.authService.GenerateRefreshToken()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "token_generation_failed",
			"message": "Failed to generate refresh token",
		})
		return
	}

	// Create session
	session := &models.Session{
		ID:           uuid.New(),
		UserID:       user.ID,
		RefreshToken: refreshToken,
		IsActive:     true,
		ExpiresAt:    time.Now().Add(30 * 24 * time.Hour), // 30 days
		IPAddress:    getIPAddress(c),
		UserAgent:    getUserAgent(c),
	}

	if err := h.sessionRepo.CreateSession(session); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "session_creation_failed",
			"message": "Failed to create session",
		})
		return
	}

	// Remove password hash from response
	user.PasswordHash = ""

	// Return successful login response
	c.JSON(http.StatusOK, models.LoginResponse{
		User:         *user,
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresIn:    int64(time.Hour * 24 / time.Second), // 24 hours in seconds
	})
}

// LogoutUser handles user logout
func (h *AuthHandler) LogoutUser(c *gin.Context) {
	var req models.RefreshTokenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "invalid_request",
			"message": "Refresh token is required",
		})
		return
	}

	// Invalidate the session
	if err := h.sessionRepo.InvalidateSession(req.RefreshToken); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "invalid_token",
			"message": "Invalid refresh token",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Successfully logged out",
	})
}

// RefreshToken handles token refresh
func (h *AuthHandler) RefreshToken(c *gin.Context) {
	var req models.RefreshTokenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "invalid_request",
			"message": "Refresh token is required",
		})
		return
	}

	// Get session by refresh token
	session, err := h.sessionRepo.GetSessionByRefreshToken(req.RefreshToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "invalid_token",
			"message": "Invalid or expired refresh token",
		})
		return
	}

	// Get user information
	user, err := h.userRepo.GetUserByID(session.UserID)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "user_not_found",
			"message": "User not found",
		})
		return
	}

	// Generate new access token
	accessToken, err := h.authService.GenerateAccessToken(user.ID, user.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "token_generation_failed",
			"message": "Failed to generate access token",
		})
		return
	}

	// Generate new refresh token
	newRefreshToken, err := h.authService.GenerateRefreshToken()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "token_generation_failed",
			"message": "Failed to generate refresh token",
		})
		return
	}

	// Invalidate old session
	if err := h.sessionRepo.InvalidateSession(req.RefreshToken); err != nil {
		// Log error but continue
		fmt.Printf("Failed to invalidate old session: %v\n", err)
	}

	// Create new session
	newSession := &models.Session{
		ID:           uuid.New(),
		UserID:       user.ID,
		RefreshToken: newRefreshToken,
		IsActive:     true,
		ExpiresAt:    time.Now().Add(30 * 24 * time.Hour), // 30 days
		IPAddress:    getIPAddress(c),
		UserAgent:    getUserAgent(c),
	}

	if err := h.sessionRepo.CreateSession(newSession); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "session_creation_failed",
			"message": "Failed to create session",
		})
		return
	}

	// Remove password hash from response
	user.PasswordHash = ""

	// Return new tokens
	c.JSON(http.StatusOK, models.LoginResponse{
		User:         *user,
		AccessToken:  accessToken,
		RefreshToken: newRefreshToken,
		ExpiresIn:    int64(time.Hour * 24 / time.Second), // 24 hours in seconds
	})
}

// GetProfile returns the current user's profile
func (h *AuthHandler) GetProfile(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "authentication_required",
			"message": "User authentication required",
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

// Helper functions
func getIPAddress(c *gin.Context) *string {
	ip := c.ClientIP()
	if ip == "" {
		return nil
	}
	return &ip
}

func getUserAgent(c *gin.Context) *string {
	userAgent := c.GetHeader("User-Agent")
	if userAgent == "" {
		return nil
	}
	return &userAgent
}