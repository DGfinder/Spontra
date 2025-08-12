package main

import (
	"log"
	"time"

	"spontra/user-service/internal/auth"
	"spontra/user-service/internal/config"
	"spontra/user-service/internal/database"
	"spontra/user-service/internal/handlers"
	"spontra/user-service/internal/metrics"
	"spontra/user-service/internal/middleware"
	"spontra/user-service/internal/repository"
	"spontra/user-service/internal/tracing"
	sharedMiddleware "spontra/shared/middleware"

	"github.com/gin-gonic/gin"
)

func main() {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatal("Failed to load configuration:", err)
	}

	// Set Gin mode based on environment
	if cfg.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	// Connect to database
	db, err := database.NewConnection(cfg.DatabaseURL)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer db.Close()

	// Run database migrations
	if err := db.Migrate(); err != nil {
		log.Fatal("Failed to run database migrations:", err)
	}

	// Initialize tracing
	cleanupTracing, err := tracing.InitTracing(tracing.TracingConfig{
		ServiceName:    "user-service",
		ServiceVersion: "1.0.0",
		Environment:    cfg.Environment,
		JaegerEndpoint: "http://localhost:14268/api/traces",
	})
	if err != nil {
		log.Printf("Failed to initialize tracing: %v", err)
	} else {
		defer cleanupTracing()
	}

	// Initialize metrics
	metricsInstance := metrics.NewMetrics()

	// Initialize services
	authService := auth.NewAuthService(cfg.JWTSecret, cfg.JWTExpiry)

	// Initialize repositories
	userRepo := repository.NewUserRepository(db)
	sessionRepo := repository.NewSessionRepository(db)

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(authService, userRepo, sessionRepo)
	userHandler := handlers.NewUserHandler(userRepo)

	// Create router
	router := gin.Default()

	// Add middleware in order
	// 1. Request ID (must be first)
	router.Use(sharedMiddleware.RequestIDMiddleware(sharedMiddleware.DefaultRequestIDConfig()))
	
	// 2. Error handling
	errorConfig := sharedMiddleware.DefaultErrorHandlerConfig("user-service")
	if cfg.Environment == "development" {
		errorConfig = sharedMiddleware.DevelopmentErrorHandlerConfig("user-service")
	}
	router.Use(sharedMiddleware.ErrorHandler(errorConfig))
	
	// 3. Circuit breaker
	cbConfig := sharedMiddleware.DefaultCircuitBreakerConfig("user-service")
	router.Use(sharedMiddleware.CircuitBreakerMiddleware(cbConfig))
	
	// 4. CORS
	corsConfig := middleware.DefaultCORSConfig(cfg.AllowedOrigins)
	router.Use(middleware.CORSMiddleware(corsConfig))

	// 5. Metrics middleware
	router.Use(metricsInstance.MetricsMiddleware("user-service"))

	// 6. Request logging middleware
	router.Use(gin.Logger())

	// System endpoints
	router.GET("/metrics", metricsInstance.PrometheusHandler())
	router.GET("/circuit-breakers", sharedMiddleware.CircuitBreakerHealthCheck())
	router.GET("/circuit-breakers/metrics", sharedMiddleware.CircuitBreakerMetrics())
	router.POST("/circuit-breakers/:name/reset", sharedMiddleware.ResetCircuitBreaker())
	router.POST("/circuit-breakers/reset-all", sharedMiddleware.ResetAllCircuitBreakers())

	// Health check endpoint
	router.GET("/health", func(c *gin.Context) {
		// Check database health
		if err := db.HealthCheck(); err != nil {
			c.JSON(500, gin.H{
				"status":  "unhealthy",
				"service": "user-service",
				"error":   "database connection failed",
			})
			return
		}

		c.JSON(200, gin.H{
			"status":    "healthy",
			"service":   "user-service",
			"timestamp": time.Now().UTC(),
			"version":   "1.0.0",
		})
	})

	// API v1 routes
	v1 := router.Group("/api/v1")
	{
		// Authentication routes (public)
		auth := v1.Group("/auth")
		{
			auth.POST("/register", authHandler.RegisterUser)
			auth.POST("/login", authHandler.LoginUser)
			auth.POST("/logout", authHandler.LogoutUser)
			auth.POST("/refresh", authHandler.RefreshToken)
		}

		// Protected routes that require authentication
		protected := v1.Group("/")
		protected.Use(middleware.AuthMiddleware(authService))
		{
			// Profile routes (accessible to authenticated user)
			protected.GET("/profile", authHandler.GetProfile)
			protected.GET("/sessions", userHandler.GetCurrentUserSessions)

			// User management routes (with ownership requirement)
			users := protected.Group("/users")
			{
				// Public user info (no ownership check)
				users.GET("/:id", userHandler.GetUser)

				// Protected routes requiring ownership
				owned := users.Group("/")
				owned.Use(middleware.RequireOwnership())
				{
					owned.PUT("/:id", userHandler.UpdateUser)
					owned.DELETE("/:id", userHandler.DeleteUser)
					owned.GET("/:id/preferences", userHandler.GetUserPreferences)
					owned.PUT("/:id/preferences", userHandler.UpdateUserPreferences)
					owned.PUT("/:id/password", userHandler.UpdatePassword)
				}
			}
		}
	}

	// Start cleanup routine for expired sessions
	go func() {
		ticker := time.NewTicker(24 * time.Hour) // Run daily
		defer ticker.Stop()

		for {
			select {
			case <-ticker.C:
				if err := sessionRepo.CleanupExpiredSessions(); err != nil {
					log.Printf("Failed to cleanup expired sessions: %v", err)
				}
			}
		}
	}()

	log.Printf("User service starting on port %s", cfg.Port)
	log.Printf("Environment: %s", cfg.Environment)
	log.Printf("Database: Connected and migrated")
	log.Printf("CORS origins: %v", cfg.AllowedOrigins)

	if err := router.Run(":" + cfg.Port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}