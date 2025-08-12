package middleware

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"spontra/shared/circuit"
	"spontra/shared/errors"
)

// CircuitBreakerConfig configures the circuit breaker middleware
type CircuitBreakerConfig struct {
	Name            string
	SkipPaths       []string              // Paths to skip circuit breaker
	BreakerConfig   *circuit.Config       // Circuit breaker configuration
	Manager         *circuit.CircuitBreakerManager
	ResponseHandler func(c *gin.Context, state circuit.State)
}

// DefaultCircuitBreakerConfig returns default circuit breaker middleware configuration
func DefaultCircuitBreakerConfig(serviceName string) *CircuitBreakerConfig {
	return &CircuitBreakerConfig{
		Name:      serviceName + "-http",
		SkipPaths: []string{"/health", "/metrics", "/ready"},
		BreakerConfig: &circuit.Config{
			Name:        serviceName + "-http",
			MaxRequests: 5,
			Interval:    60 * time.Second,
			Timeout:     30 * time.Second,
			ReadyToTrip: func(counts circuit.Counts) bool {
				return counts.ConsecutiveFailures >= 3 ||
					   (counts.TotalRequests >= 10 && counts.FailureRatio() >= 0.5)
			},
			IsSuccessful: func(err error) bool {
				return err == nil
			},
		},
		Manager:         circuit.GlobalManager,
		ResponseHandler: DefaultCircuitBreakerResponse,
	}
}

// CircuitBreakerMiddleware returns a middleware that implements circuit breaker pattern
func CircuitBreakerMiddleware(config *CircuitBreakerConfig) gin.HandlerFunc {
	breaker := config.Manager.GetBreaker(config.Name, config.BreakerConfig)

	return func(c *gin.Context) {
		// Skip circuit breaker for specified paths
		if shouldSkipPath(c.Request.URL.Path, config.SkipPaths) {
			c.Next()
			return
		}

		// Execute request through circuit breaker
		err := breaker.ExecuteWithContext(c.Request.Context(), func(ctx context.Context) error {
			c.Next()

			// Check if response indicates an error
			statusCode := c.Writer.Status()
			if statusCode >= 500 {
				return fmt.Errorf("server error: %d", statusCode)
			}

			// Check for application errors
			if len(c.Errors) > 0 {
				return c.Errors.Last().Err
			}

			return nil
		})

		// Handle circuit breaker errors
		if err != nil {
			// Check if it's a circuit breaker error
			if appErr, ok := err.(*errors.AppError); ok && 
			   (appErr.Code == "CIRCUIT_BREAKER_OPEN" || appErr.Code == "CIRCUIT_BREAKER_HALF_OPEN_LIMIT") {
				config.ResponseHandler(c, breaker.State())
				return
			}

			// For other errors, let the error handler middleware handle them
			c.Error(err)
		}
	}
}

// DefaultCircuitBreakerResponse provides default response for circuit breaker errors
func DefaultCircuitBreakerResponse(c *gin.Context, state circuit.State) {
	var appErr *errors.AppError

	switch state {
	case circuit.StateOpen:
		appErr = errors.UnavailableError("circuit-breaker", "Service is temporarily unavailable due to high error rate")
	case circuit.StateHalfOpen:
		appErr = errors.UnavailableError("circuit-breaker", "Service is recovering, please try again later")
	default:
		appErr = errors.UnavailableError("circuit-breaker", "Service is temporarily unavailable")
	}

	response := map[string]interface{}{
		"error": map[string]interface{}{
			"type":       appErr.Type,
			"code":       appErr.Code,
			"message":    appErr.Message,
			"timestamp":  appErr.Timestamp.Format(time.RFC3339),
			"details": map[string]interface{}{
				"circuit_breaker_state": state.String(),
				"retry_after_seconds":   30,
			},
		},
	}

	c.Header("Content-Type", "application/json")
	c.Header("Retry-After", "30")
	c.JSON(appErr.StatusCode, response)
	c.Abort()
}

// shouldSkipPath checks if a path should skip circuit breaker
func shouldSkipPath(path string, skipPaths []string) bool {
	for _, skipPath := range skipPaths {
		if path == skipPath {
			return true
		}
	}
	return false
}

// ExternalServiceCircuitBreaker creates a circuit breaker for external service calls
func ExternalServiceCircuitBreaker(serviceName string) *circuit.CircuitBreaker {
	config := &circuit.Config{
		Name:        serviceName,
		MaxRequests: 3,
		Interval:    30 * time.Second,
		Timeout:     60 * time.Second,
		ReadyToTrip: func(counts circuit.Counts) bool {
			return counts.ConsecutiveFailures >= 5 ||
				   (counts.TotalRequests >= 20 && counts.FailureRatio() >= 0.6)
		},
		OnStateChange: func(name string, from circuit.State, to circuit.State) {
			// Log state changes for external services
			fmt.Printf("Circuit breaker '%s' state changed from %s to %s\n", name, from, to)
		},
		IsSuccessful: func(err error) bool {
			if err == nil {
				return true
			}
			
			// Consider certain errors as non-failures for circuit breaker
			if appErr, ok := err.(*errors.AppError); ok {
				switch appErr.Type {
				case errors.ErrorTypeValidation, errors.ErrorTypeAuthentication, errors.ErrorTypeAuthorization:
					return true // Don't count client errors as circuit breaker failures
				}
			}
			
			return false
		},
	}

	return circuit.GlobalManager.GetBreaker(serviceName, config)
}

// DatabaseCircuitBreaker creates a circuit breaker for database operations
func DatabaseCircuitBreaker(dbName string) *circuit.CircuitBreaker {
	config := &circuit.Config{
		Name:        "database-" + dbName,
		MaxRequests: 5,
		Interval:    30 * time.Second,
		Timeout:     45 * time.Second,
		ReadyToTrip: func(counts circuit.Counts) bool {
			return counts.ConsecutiveFailures >= 3 ||
				   (counts.TotalRequests >= 10 && counts.FailureRatio() >= 0.5)
		},
		OnStateChange: func(name string, from circuit.State, to circuit.State) {
			// Critical: database circuit breaker state changes should be logged/alerted
			fmt.Printf("CRITICAL: Database circuit breaker '%s' state changed from %s to %s\n", name, from, to)
		},
		IsSuccessful: func(err error) bool {
			if err == nil {
				return true
			}
			
			// Database-specific error handling
			if appErr, ok := err.(*errors.AppError); ok {
				switch appErr.Type {
				case errors.ErrorTypeTimeout, errors.ErrorTypeUnavailable:
					return false // These should trigger circuit breaker
				default:
					return true // Other errors might be application-level
				}
			}
			
			return false
		},
	}

	return circuit.GlobalManager.GetBreaker("database-"+dbName, config)
}

// CacheCircuitBreaker creates a circuit breaker for cache operations
func CacheCircuitBreaker(cacheName string) *circuit.CircuitBreaker {
	config := &circuit.Config{
		Name:        "cache-" + cacheName,
		MaxRequests: 10,
		Interval:    15 * time.Second,
		Timeout:     30 * time.Second,
		ReadyToTrip: func(counts circuit.Counts) bool {
			// Be more lenient with cache failures
			return counts.ConsecutiveFailures >= 10 ||
				   (counts.TotalRequests >= 50 && counts.FailureRatio() >= 0.8)
		},
		OnStateChange: func(name string, from circuit.State, to circuit.State) {
			fmt.Printf("Cache circuit breaker '%s' state changed from %s to %s\n", name, from, to)
		},
		IsSuccessful: func(err error) bool {
			// Cache failures are often acceptable (cache miss, connection issues)
			return err == nil
		},
	}

	return circuit.GlobalManager.GetBreaker("cache-"+cacheName, config)
}

// CircuitBreakerHealthCheck returns circuit breaker health information
func CircuitBreakerHealthCheck() gin.HandlerFunc {
	return func(c *gin.Context) {
		stats := circuit.GlobalManager.GetAllStats()
		
		healthy := true
		for _, stat := range stats {
			if statMap, ok := stat.(map[string]interface{}); ok {
				if state, ok := statMap["state"].(string); ok && state == "OPEN" {
					healthy = false
					break
				}
			}
		}

		status := "healthy"
		httpStatus := http.StatusOK
		if !healthy {
			status = "degraded"
			httpStatus = http.StatusServiceUnavailable
		}

		c.JSON(httpStatus, gin.H{
			"status":           status,
			"circuit_breakers": stats,
			"timestamp":        time.Now().UTC(),
		})
	}
}

// CircuitBreakerMetrics returns detailed circuit breaker metrics
func CircuitBreakerMetrics() gin.HandlerFunc {
	return func(c *gin.Context) {
		stats := circuit.GlobalManager.GetAllStats()
		
		c.JSON(http.StatusOK, gin.H{
			"circuit_breakers": stats,
			"timestamp":        time.Now().UTC(),
		})
	}
}

// ResetCircuitBreaker resets a specific circuit breaker
func ResetCircuitBreaker() gin.HandlerFunc {
	return func(c *gin.Context) {
		name := c.Param("name")
		if name == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Circuit breaker name is required"})
			return
		}

		breaker, exists := circuit.GlobalManager.GetBreakerByName(name)
		if !exists {
			c.JSON(http.StatusNotFound, gin.H{"error": "Circuit breaker not found"})
			return
		}

		breaker.Reset()
		
		c.JSON(http.StatusOK, gin.H{
			"message": fmt.Sprintf("Circuit breaker '%s' has been reset", name),
			"state":   breaker.State().String(),
		})
	}
}

// ResetAllCircuitBreakers resets all circuit breakers
func ResetAllCircuitBreakers() gin.HandlerFunc {
	return func(c *gin.Context) {
		circuit.GlobalManager.ResetAll()
		
		c.JSON(http.StatusOK, gin.H{
			"message": "All circuit breakers have been reset",
		})
	}
}