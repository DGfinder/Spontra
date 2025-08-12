package middleware

import (
	"log"
	"net/http"
	"runtime/debug"
	"time"

	"github.com/gin-gonic/gin"
	"spontra/shared/errors"
)

// ErrorHandlerConfig configures the error handling middleware
type ErrorHandlerConfig struct {
	EnableStackTrace   bool
	EnableRequestDump  bool
	Logger             func(c *gin.Context, err error, stack []byte)
	ErrorTransformer   func(c *gin.Context, err error) *errors.AppError
	IncludeDetails     bool
	Service            string
}

// DefaultErrorHandlerConfig returns default error handler configuration
func DefaultErrorHandlerConfig(service string) *ErrorHandlerConfig {
	return &ErrorHandlerConfig{
		EnableStackTrace:  false, // Disable in production
		EnableRequestDump: false, // Disable in production
		Logger:           DefaultErrorLogger,
		ErrorTransformer: DefaultErrorTransformer,
		IncludeDetails:   false, // Disable in production
		Service:          service,
	}
}

// DevelopmentErrorHandlerConfig returns configuration suitable for development
func DevelopmentErrorHandlerConfig(service string) *ErrorHandlerConfig {
	return &ErrorHandlerConfig{
		EnableStackTrace:  true,
		EnableRequestDump: true,
		Logger:           DefaultErrorLogger,
		ErrorTransformer: DefaultErrorTransformer,
		IncludeDetails:   true,
		Service:          service,
	}
}

// ErrorHandler returns a middleware that handles errors in a consistent way
func ErrorHandler(config *ErrorHandlerConfig) gin.HandlerFunc {
	return gin.CustomRecoveryWithWriter(gin.DefaultErrorWriter, func(c *gin.Context, recovered interface{}) {
		var err error
		
		// Handle panic recovery
		if recovered != nil {
			// Create an internal error from the panic
			err = errors.InternalError("Internal server error occurred", nil).
				WithRequestID(getRequestID(c)).
				WithService(config.Service).
				WithOperation(c.Request.Method + " " + c.Request.URL.Path)
			
			// Log the panic with stack trace
			if config.Logger != nil {
				stack := debug.Stack()
				config.Logger(c, err, stack)
			}
		} else {
			// Handle errors set in the context
			if len(c.Errors) > 0 {
				err = c.Errors.Last().Err
			}
		}

		if err != nil {
			handleError(c, err, config)
		}
	})
}

// ErrorHandlerMiddleware is a simpler error handler that doesn't handle panics
func ErrorHandlerMiddleware(config *ErrorHandlerConfig) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()

		// Check for errors after processing
		if len(c.Errors) > 0 {
			err := c.Errors.Last().Err
			handleError(c, err, config)
		}
	}
}

// handleError processes and responds to an error
func handleError(c *gin.Context, err error, config *ErrorHandlerConfig) {
	// Transform error to AppError
	appErr := config.ErrorTransformer(c, err)
	
	// Set request ID and service if not already set
	if appErr.RequestID == "" {
		appErr.RequestID = getRequestID(c)
	}
	if appErr.Service == "" {
		appErr.Service = config.Service
	}
	if appErr.Operation == "" {
		appErr.Operation = c.Request.Method + " " + c.Request.URL.Path
	}

	// Log the error
	if config.Logger != nil {
		var stack []byte
		if config.EnableStackTrace {
			stack = debug.Stack()
		}
		config.Logger(c, appErr, stack)
	}

	// Prepare response
	response := prepareErrorResponse(appErr, config)

	// Set response headers
	c.Header("Content-Type", "application/json")
	c.Header("X-Request-ID", appErr.RequestID)

	// Send response
	c.JSON(appErr.StatusCode, response)
	c.Abort()
}

// prepareErrorResponse creates the error response payload
func prepareErrorResponse(appErr *errors.AppError, config *ErrorHandlerConfig) map[string]interface{} {
	response := map[string]interface{}{
		"error": map[string]interface{}{
			"type":       appErr.Type,
			"code":       appErr.Code,
			"message":    appErr.Message,
			"timestamp":  appErr.Timestamp.Format(time.RFC3339),
			"request_id": appErr.RequestID,
		},
	}

	// Add details in development or if explicitly enabled
	if config.IncludeDetails && len(appErr.Details) > 0 {
		response["error"].(map[string]interface{})["details"] = appErr.Details
	}

	// Add service info
	if appErr.Service != "" {
		response["error"].(map[string]interface{})["service"] = appErr.Service
	}

	// Add operation info
	if appErr.Operation != "" {
		response["error"].(map[string]interface{})["operation"] = appErr.Operation
	}

	// Add retry info for retryable errors
	if appErr.Retryable {
		response["error"].(map[string]interface{})["retryable"] = true
		if retryAfter, exists := appErr.Details["retry_after_seconds"]; exists {
			response["error"].(map[string]interface{})["retry_after"] = retryAfter
		}
	}

	return response
}

// DefaultErrorTransformer transforms any error into an AppError
func DefaultErrorTransformer(c *gin.Context, err error) *errors.AppError {
	// If it's already an AppError, return it
	if appErr, ok := err.(*errors.AppError); ok {
		return appErr
	}

	// Transform based on error type or message
	switch err.Error() {
	case "record not found":
		return errors.NotFoundError("resource", "").
			WithCause(err)
	case "invalid request":
		return errors.ValidationError("Invalid request format", nil).
			WithCause(err)
	default:
		return errors.InternalError("An unexpected error occurred", err)
	}
}

// DefaultErrorLogger provides default error logging
func DefaultErrorLogger(c *gin.Context, err error, stack []byte) {
	// Basic error logging
	log.Printf("[ERROR] %s %s - %v", c.Request.Method, c.Request.URL.Path, err)
	
	// Log stack trace if provided
	if stack != nil {
		log.Printf("[STACK] %s", string(stack))
	}

	// Log request details if needed
	log.Printf("[REQUEST] Method: %s, Path: %s, IP: %s, UserAgent: %s",
		c.Request.Method,
		c.Request.URL.Path,
		c.ClientIP(),
		c.Request.UserAgent())
}

// getRequestID extracts or generates a request ID
func getRequestID(c *gin.Context) string {
	// Try to get from header first
	if requestID := c.GetHeader("X-Request-ID"); requestID != "" {
		return requestID
	}
	
	// Try to get from context
	if requestID, exists := c.Get("request_id"); exists {
		if id, ok := requestID.(string); ok {
			return id
		}
	}
	
	// Generate a new one (this should ideally be done by request ID middleware)
	return generateRequestID()
}

// generateRequestID generates a simple request ID
func generateRequestID() string {
	return time.Now().Format("20060102150405") + "-" + randomString(6)
}

// randomString generates a random string of specified length
func randomString(length int) string {
	const charset = "abcdefghijklmnopqrstuvwxyz0123456789"
	result := make([]byte, length)
	for i := range result {
		result[i] = charset[time.Now().UnixNano()%int64(len(charset))]
	}
	return string(result)
}

// NotFoundHandler returns a handler for 404 errors
func NotFoundHandler(service string) gin.HandlerFunc {
	return func(c *gin.Context) {
		appErr := errors.NotFoundError("endpoint", c.Request.URL.Path).
			WithRequestID(getRequestID(c)).
			WithService(service).
			WithOperation(c.Request.Method + " " + c.Request.URL.Path)

		response := map[string]interface{}{
			"error": map[string]interface{}{
				"type":       appErr.Type,
				"code":       appErr.Code,
				"message":    appErr.Message,
				"timestamp":  appErr.Timestamp.Format(time.RFC3339),
				"request_id": appErr.RequestID,
				"service":    appErr.Service,
			},
		}

		c.Header("Content-Type", "application/json")
		c.Header("X-Request-ID", appErr.RequestID)
		c.JSON(http.StatusNotFound, response)
	}
}

// MethodNotAllowedHandler returns a handler for 405 errors
func MethodNotAllowedHandler(service string) gin.HandlerFunc {
	return func(c *gin.Context) {
		appErr := errors.NewError(errors.ErrorTypeValidation, "METHOD_NOT_ALLOWED", 
			"Method not allowed for this endpoint").
			WithStatusCode(http.StatusMethodNotAllowed).
			WithRequestID(getRequestID(c)).
			WithService(service).
			WithOperation(c.Request.Method + " " + c.Request.URL.Path).
			Build()

		response := map[string]interface{}{
			"error": map[string]interface{}{
				"type":       appErr.Type,
				"code":       appErr.Code,
				"message":    appErr.Message,
				"timestamp":  appErr.Timestamp.Format(time.RFC3339),
				"request_id": appErr.RequestID,
				"service":    appErr.Service,
			},
		}

		c.Header("Content-Type", "application/json")
		c.Header("X-Request-ID", appErr.RequestID)
		c.JSON(http.StatusMethodNotAllowed, response)
	}
}

// ValidationErrorHandler handles validation errors specifically
func ValidationErrorHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()

		// Check for binding errors
		if len(c.Errors) > 0 {
			err := c.Errors.Last()
			if err.Type == gin.ErrorTypeBind {
				appErr := errors.ValidationError("Request validation failed", map[string]interface{}{
					"validation_errors": err.Error(),
				}).WithRequestID(getRequestID(c))

				response := map[string]interface{}{
					"error": map[string]interface{}{
						"type":       appErr.Type,
						"code":       appErr.Code,
						"message":    appErr.Message,
						"details":    appErr.Details,
						"timestamp":  appErr.Timestamp.Format(time.RFC3339),
						"request_id": appErr.RequestID,
					},
				}

				c.Header("Content-Type", "application/json")
				c.Header("X-Request-ID", appErr.RequestID)
				c.JSON(appErr.StatusCode, response)
				c.Abort()
			}
		}
	}
}