package main

import (
	"log"
	"os"

	"github.com/gin-gonic/gin"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8081"
	}

	router := gin.Default()
	
	// Health check endpoint
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "healthy",
			"service": "search-service",
		})
	})

	// API v1 routes
	v1 := router.Group("/api/v1")
	{
		// Flight search routes
		search := v1.Group("/search")
		{
			search.POST("/flights", searchFlights)
			search.GET("/flights/:searchId", getSearchResults)
			search.POST("/flights/filter", filterFlights)
			search.GET("/suggestions/airports", getAirportSuggestions)
		}

		// Cache management routes
		cache := v1.Group("/cache")
		{
			cache.DELETE("/clear", clearCache)
			cache.GET("/stats", getCacheStats)
		}
	}

	log.Printf("Search service starting on port %s", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}

// Flight search handlers
func searchFlights(c *gin.Context) {
	c.JSON(200, gin.H{"message": "Search flights - TODO: implement"})
}

func getSearchResults(c *gin.Context) {
	c.JSON(200, gin.H{"message": "Get search results - TODO: implement"})
}

func filterFlights(c *gin.Context) {
	c.JSON(200, gin.H{"message": "Filter flights - TODO: implement"})
}

func getAirportSuggestions(c *gin.Context) {
	c.JSON(200, gin.H{"message": "Get airport suggestions - TODO: implement"})
}

// Cache management handlers
func clearCache(c *gin.Context) {
	c.JSON(200, gin.H{"message": "Clear cache - TODO: implement"})
}

func getCacheStats(c *gin.Context) {
	c.JSON(200, gin.H{"message": "Get cache stats - TODO: implement"})
}