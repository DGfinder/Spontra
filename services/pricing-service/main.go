package main

import (
	"log"
	"net/http"
	"time"

	"spontra/pricing-service/internal/cache"
	"spontra/pricing-service/internal/config"
	"spontra/pricing-service/internal/database"
	"spontra/pricing-service/internal/handlers"
	"spontra/pricing-service/internal/repository"
	"spontra/pricing-service/internal/services"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
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

	// Connect to Redis
	redisClient, err := cache.NewRedisClient(cfg.RedisURL)
	if err != nil {
		log.Fatal("Failed to connect to Redis:", err)
	}
	defer redisClient.Close()

	// Initialize repositories
	priceRepo := repository.NewPriceRepository(db)
	alertRepo := repository.NewAlertRepository(db)
	trackingRepo := repository.NewTrackingRepository(db)

	// Initialize services
	priceService := services.NewPriceService(priceRepo, redisClient, cfg.PriceComparisonTTL)
	analyticsService := services.NewAnalyticsService(priceRepo, redisClient, cfg.TrendsCacheTTL)
	alertService := services.NewAlertService(alertRepo, priceRepo, redisClient, cfg.MaxAlertsPerUser)
	trackingService := services.NewTrackingService(trackingRepo, priceRepo, redisClient, cfg.MaxTrackingPerUser)

	// Initialize handlers
	priceHandler := handlers.NewPriceHandler(priceService, analyticsService)
	alertHandler := handlers.NewAlertHandler(alertService)
	trackingHandler := handlers.NewTrackingHandler(trackingService)

	// Create router
	router := gin.Default()

	// Add middleware
	router.Use(gin.Recovery())
	router.Use(gin.Logger())

	// CORS middleware (simplified for development)
	router.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	// Health check endpoint
	router.GET("/health", func(c *gin.Context) {
		// Check database health
		if err := db.HealthCheck(); err != nil {
			c.JSON(500, gin.H{
				"status":  "unhealthy",
				"service": "pricing-service",
				"error":   "database connection failed",
			})
			return
		}

		// Check Redis health
		if err := redisClient.HealthCheck(); err != nil {
			c.JSON(500, gin.H{
				"status":  "unhealthy",
				"service": "pricing-service",
				"error":   "redis connection failed",
			})
			return
		}

		c.JSON(200, gin.H{
			"status":    "healthy",
			"service":   "pricing-service",
			"timestamp": time.Now().UTC(),
			"version":   "1.0.0",
		})
	})

	// API v1 routes
	v1 := router.Group("/api/v1")
	{
		// Price comparison routes (public)
		pricing := v1.Group("/pricing")
		{
			pricing.POST("/compare", priceHandler.ComparePrices)
			pricing.GET("/history", priceHandler.GetPriceHistory)
			pricing.GET("/statistics", priceHandler.GetPriceStatistics)
			pricing.GET("/popular-routes", priceHandler.GetPopularRoutes)
		}

		// Analytics routes (public)
		analytics := v1.Group("/analytics")
		{
			analytics.GET("/trends/:route", priceHandler.GetPriceTrends)
			analytics.GET("/predictions/:route", priceHandler.GetPricePredictions)
			analytics.GET("/route/:route", priceHandler.GetRouteAnalytics)
			analytics.GET("/market-overview", priceHandler.GetMarketOverview)
		}

		// Protected routes that require authentication
		// Note: In production, you'd add proper authentication middleware here
		// For now, we'll simulate authentication with a simple middleware
		authenticated := v1.Group("/")
		authenticated.Use(simulateAuthMiddleware()) // Placeholder for auth
		{
			// Price alerts routes
			alerts := authenticated.Group("/alerts")
			{
				alerts.POST("/", alertHandler.CreatePriceAlert)
				alerts.GET("/user/:userId", alertHandler.GetUserAlerts)
				alerts.PUT("/:alertId", alertHandler.UpdatePriceAlert)
				alerts.DELETE("/:alertId", alertHandler.DeletePriceAlert)
			}

			// Price tracking routes
			tracking := authenticated.Group("/tracking")
			{
				tracking.POST("/", trackingHandler.CreatePriceTracking)
				tracking.GET("/user", trackingHandler.GetUserTracking)
				tracking.PUT("/:trackingId/stop", trackingHandler.StopPriceTracking)
				tracking.DELETE("/:trackingId", trackingHandler.DeletePriceTracking)
				tracking.GET("/stats", trackingHandler.GetTrackingStats)
				tracking.GET("/popular-routes", trackingHandler.GetPopularTrackedRoutes)
			}
		}
	}

	// Start background services
	go startBackgroundServices(cfg, priceService, alertService, trackingService, db)

	log.Printf("Pricing service starting on port %s", cfg.Port)
	log.Printf("Environment: %s", cfg.Environment)
	log.Printf("Database: Connected and migrated")
	log.Printf("Redis: Connected")

	if err := router.Run(":" + cfg.Port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}

// simulateAuthMiddleware is a placeholder for authentication middleware
// In production, this would validate JWT tokens and extract user information
func simulateAuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// For development/testing, we'll simulate a user ID
		// In production, this would come from validated JWT token
		userID := "123e4567-e89b-12d3-a456-426614174000" // Sample UUID
		
		// Parse the UUID
		if uuid, err := uuid.Parse(userID); err == nil {
			c.Set("user_id", uuid)
		} else {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error":   "invalid_token",
				"message": "Invalid authentication token",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// startBackgroundServices starts background jobs for price tracking and alerts
func startBackgroundServices(
	cfg *config.Config,
	priceService *services.PriceService,
	alertService *services.AlertService,
	trackingService *services.TrackingService,
	db *database.DB,
) {
	// Cleanup expired prices daily
	go func() {
		ticker := time.NewTicker(24 * time.Hour)
		defer ticker.Stop()

		for {
			select {
			case <-ticker.C:
				if err := priceService.CleanupExpiredPrices(); err != nil {
					log.Printf("Failed to cleanup expired prices: %v", err)
				}
				if err := alertService.CleanupExpiredAlerts(); err != nil {
					log.Printf("Failed to cleanup expired alerts: %v", err)
				}
			}
		}
	}()

	// Check alerts every hour
	go func() {
		ticker := time.NewTicker(time.Hour)
		defer ticker.Stop()

		for {
			select {
			case <-ticker.C:
				if err := alertService.CheckAndTriggerAlerts(); err != nil {
					log.Printf("Failed to check alerts: %v", err)
				}
			}
		}
	}()

	// Process active tracking every 4 hours
	go func() {
		ticker := time.NewTicker(cfg.TrackingInterval)
		defer ticker.Stop()

		for {
			select {
			case <-ticker.C:
				if err := trackingService.ProcessActiveTracking(); err != nil {
					log.Printf("Failed to process active tracking: %v", err)
				}
			}
		}
	}()

	// Update price history daily
	go func() {
		ticker := time.NewTicker(24 * time.Hour)
		defer ticker.Stop()

		for {
			select {
			case <-ticker.C:
				if err := priceService.UpdatePriceHistory(); err != nil {
					log.Printf("Failed to update price history: %v", err)
				}
			}
		}
	}()

	log.Println("Background services started")
}