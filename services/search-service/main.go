package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
)

var (
	dataIngestionServiceURL = getEnvOrDefault("DATA_INGESTION_SERVICE_URL", "http://localhost:8080")
	httpClient = &http.Client{
		Timeout: 30 * time.Second,
	}
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

		// Destination exploration routes (proxy to data-ingestion-service)
		explore := v1.Group("/explore")
		{
			explore.POST("/destinations", exploreDestinations)
			explore.GET("/destinations/:airport/insights", getDestinationInsights)
			explore.GET("/destinations/:airport/similar", findSimilarDestinations)
		}

		// Destination data routes (proxy to data-ingestion-service)
		destinations := v1.Group("/destinations")
		{
			destinations.GET("/:airport", getDestinationInfo)
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

// Destination exploration handlers (proxy to data-ingestion-service)

// exploreDestinations proxies destination discovery requests
func exploreDestinations(c *gin.Context) {
	proxyRequest(c, "POST", "/api/v1/explore/destinations")
}

// getDestinationInsights proxies destination insights requests
func getDestinationInsights(c *gin.Context) {
	airport := c.Param("airport")
	proxyRequest(c, "GET", fmt.Sprintf("/api/v1/explore/destinations/%s/insights", airport))
}

// findSimilarDestinations proxies similar destinations requests
func findSimilarDestinations(c *gin.Context) {
	airport := c.Param("airport")
	origin := c.Query("origin")
	if origin == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Origin query parameter is required",
		})
		return
	}
	
	proxyRequest(c, "GET", fmt.Sprintf("/api/v1/explore/destinations/%s/similar?origin=%s", airport, origin))
}

// getDestinationInfo proxies destination information requests
func getDestinationInfo(c *gin.Context) {
	airport := c.Param("airport")
	proxyRequest(c, "GET", fmt.Sprintf("/api/v1/data/destinations/%s", airport))
}

// proxyRequest handles proxying requests to the data-ingestion-service
func proxyRequest(c *gin.Context, method, path string) {
	targetURL := dataIngestionServiceURL + path
	
	var body io.Reader
	if method == "POST" || method == "PUT" {
		// Read the request body
		bodyBytes, err := io.ReadAll(c.Request.Body)
		if err != nil {
			log.Printf("Error reading request body: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to read request body",
			})
			return
		}
		body = bytes.NewReader(bodyBytes)
	}

	// Create the proxy request
	req, err := http.NewRequestWithContext(c.Request.Context(), method, targetURL, body)
	if err != nil {
		log.Printf("Error creating proxy request: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to create proxy request",
		})
		return
	}

	// Copy relevant headers
	req.Header.Set("Content-Type", c.GetHeader("Content-Type"))
	req.Header.Set("Accept", c.GetHeader("Accept"))
	
	// Forward the request
	resp, err := httpClient.Do(req)
	if err != nil {
		log.Printf("Error forwarding request to data-ingestion-service: %v", err)
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": "Data ingestion service unavailable",
			"details": err.Error(),
		})
		return
	}
	defer resp.Body.Close()

	// Read the response
	responseBody, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Printf("Error reading response body: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to read response from data ingestion service",
		})
		return
	}

	// Forward the response
	c.Header("Content-Type", resp.Header.Get("Content-Type"))
	c.Data(resp.StatusCode, resp.Header.Get("Content-Type"), responseBody)
}

// getEnvOrDefault returns environment variable value or default if not set
func getEnvOrDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}