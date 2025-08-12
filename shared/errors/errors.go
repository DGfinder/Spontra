package errors

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

// ErrorType represents different categories of errors
type ErrorType string

const (
	ErrorTypeValidation     ErrorType = "validation"
	ErrorTypeAuthentication ErrorType = "authentication"
	ErrorTypeAuthorization  ErrorType = "authorization"
	ErrorTypeNotFound       ErrorType = "not_found"
	ErrorTypeConflict       ErrorType = "conflict"
	ErrorTypeRateLimit      ErrorType = "rate_limit"
	ErrorTypeInternal       ErrorType = "internal"
	ErrorTypeExternal       ErrorType = "external"
	ErrorTypeTimeout        ErrorType = "timeout"
	ErrorTypeUnavailable    ErrorType = "unavailable"
	ErrorTypeBadGateway     ErrorType = "bad_gateway"
)

// Severity levels for errors
type Severity string

const (
	SeverityLow      Severity = "low"
	SeverityMedium   Severity = "medium"
	SeverityHigh     Severity = "high"
	SeverityCritical Severity = "critical"
)

// AppError represents a structured application error
type AppError struct {
	Type        ErrorType              `json:"type"`
	Code        string                 `json:"code"`
	Message     string                 `json:"message"`
	Details     map[string]interface{} `json:"details,omitempty"`
	Severity    Severity               `json:"severity"`
	StatusCode  int                    `json:"status_code"`
	Timestamp   time.Time              `json:"timestamp"`
	RequestID   string                 `json:"request_id,omitempty"`
	Service     string                 `json:"service"`
	Operation   string                 `json:"operation,omitempty"`
	Retryable   bool                   `json:"retryable"`
	Cause       error                  `json:"-"` // Original error, not serialized
}

// Error implements the error interface
func (e *AppError) Error() string {
	if e.Cause != nil {
		return fmt.Sprintf("%s: %s (caused by: %v)", e.Code, e.Message, e.Cause)
	}
	return fmt.Sprintf("%s: %s", e.Code, e.Message)
}

// Unwrap returns the underlying error for error wrapping
func (e *AppError) Unwrap() error {
	return e.Cause
}

// ToJSON serializes the error to JSON
func (e *AppError) ToJSON() []byte {
	data, _ := json.Marshal(e)
	return data
}

// ErrorBuilder helps construct AppError instances
type ErrorBuilder struct {
	err *AppError
}

// NewError creates a new error builder
func NewError(errorType ErrorType, code, message string) *ErrorBuilder {
	return &ErrorBuilder{
		err: &AppError{
			Type:       errorType,
			Code:       code,
			Message:    message,
			Details:    make(map[string]interface{}),
			Severity:   SeverityMedium,
			StatusCode: getDefaultStatusCode(errorType),
			Timestamp:  time.Now().UTC(),
			Retryable:  isRetryableByDefault(errorType),
		},
	}
}

// WithDetails adds details to the error
func (b *ErrorBuilder) WithDetails(details map[string]interface{}) *ErrorBuilder {
	for k, v := range details {
		b.err.Details[k] = v
	}
	return b
}

// WithDetail adds a single detail to the error
func (b *ErrorBuilder) WithDetail(key string, value interface{}) *ErrorBuilder {
	b.err.Details[key] = value
	return b
}

// WithSeverity sets the error severity
func (b *ErrorBuilder) WithSeverity(severity Severity) *ErrorBuilder {
	b.err.Severity = severity
	return b
}

// WithStatusCode sets the HTTP status code
func (b *ErrorBuilder) WithStatusCode(code int) *ErrorBuilder {
	b.err.StatusCode = code
	return b
}

// WithRequestID sets the request ID
func (b *ErrorBuilder) WithRequestID(requestID string) *ErrorBuilder {
	b.err.RequestID = requestID
	return b
}

// WithService sets the service name
func (b *ErrorBuilder) WithService(service string) *ErrorBuilder {
	b.err.Service = service
	return b
}

// WithOperation sets the operation name
func (b *ErrorBuilder) WithOperation(operation string) *ErrorBuilder {
	b.err.Operation = operation
	return b
}

// WithRetryable sets whether the error is retryable
func (b *ErrorBuilder) WithRetryable(retryable bool) *ErrorBuilder {
	b.err.Retryable = retryable
	return b
}

// WithCause wraps an underlying error
func (b *ErrorBuilder) WithCause(cause error) *ErrorBuilder {
	b.err.Cause = cause
	return b
}

// Build returns the constructed AppError
func (b *ErrorBuilder) Build() *AppError {
	return b.err
}

// Predefined error constructors

// ValidationError creates a validation error
func ValidationError(message string, details map[string]interface{}) *AppError {
	return NewError(ErrorTypeValidation, "VALIDATION_ERROR", message).
		WithDetails(details).
		WithSeverity(SeverityLow).
		Build()
}

// AuthenticationError creates an authentication error
func AuthenticationError(message string) *AppError {
	return NewError(ErrorTypeAuthentication, "AUTHENTICATION_ERROR", message).
		WithSeverity(SeverityMedium).
		Build()
}

// AuthorizationError creates an authorization error
func AuthorizationError(message string) *AppError {
	return NewError(ErrorTypeAuthorization, "AUTHORIZATION_ERROR", message).
		WithSeverity(SeverityMedium).
		Build()
}

// NotFoundError creates a not found error
func NotFoundError(resource, identifier string) *AppError {
	return NewError(ErrorTypeNotFound, "NOT_FOUND", fmt.Sprintf("%s not found", resource)).
		WithDetail("resource", resource).
		WithDetail("identifier", identifier).
		WithSeverity(SeverityLow).
		Build()
}

// ConflictError creates a conflict error
func ConflictError(message string, details map[string]interface{}) *AppError {
	return NewError(ErrorTypeConflict, "CONFLICT", message).
		WithDetails(details).
		WithSeverity(SeverityMedium).
		Build()
}

// RateLimitError creates a rate limit error
func RateLimitError(message string, retryAfter time.Duration) *AppError {
	return NewError(ErrorTypeRateLimit, "RATE_LIMIT_EXCEEDED", message).
		WithDetail("retry_after_seconds", int(retryAfter.Seconds())).
		WithSeverity(SeverityMedium).
		WithRetryable(true).
		Build()
}

// InternalError creates an internal server error
func InternalError(message string, cause error) *AppError {
	return NewError(ErrorTypeInternal, "INTERNAL_ERROR", message).
		WithCause(cause).
		WithSeverity(SeverityHigh).
		WithRetryable(false).
		Build()
}

// ExternalServiceError creates an external service error
func ExternalServiceError(service, message string, cause error) *AppError {
	return NewError(ErrorTypeExternal, "EXTERNAL_SERVICE_ERROR", message).
		WithDetail("external_service", service).
		WithCause(cause).
		WithSeverity(SeverityMedium).
		WithRetryable(true).
		Build()
}

// TimeoutError creates a timeout error
func TimeoutError(operation string, timeout time.Duration) *AppError {
	return NewError(ErrorTypeTimeout, "TIMEOUT", fmt.Sprintf("Operation '%s' timed out", operation)).
		WithDetail("operation", operation).
		WithDetail("timeout_seconds", timeout.Seconds()).
		WithSeverity(SeverityMedium).
		WithRetryable(true).
		Build()
}

// UnavailableError creates a service unavailable error
func UnavailableError(service, message string) *AppError {
	return NewError(ErrorTypeUnavailable, "SERVICE_UNAVAILABLE", message).
		WithDetail("service", service).
		WithSeverity(SeverityHigh).
		WithStatusCode(http.StatusServiceUnavailable).
		WithRetryable(true).
		Build()
}

// BadGatewayError creates a bad gateway error
func BadGatewayError(upstream, message string) *AppError {
	return NewError(ErrorTypeBadGateway, "BAD_GATEWAY", message).
		WithDetail("upstream_service", upstream).
		WithSeverity(SeverityHigh).
		WithStatusCode(http.StatusBadGateway).
		WithRetryable(true).
		Build()
}

// Helper functions

func getDefaultStatusCode(errorType ErrorType) int {
	switch errorType {
	case ErrorTypeValidation:
		return http.StatusBadRequest
	case ErrorTypeAuthentication:
		return http.StatusUnauthorized
	case ErrorTypeAuthorization:
		return http.StatusForbidden
	case ErrorTypeNotFound:
		return http.StatusNotFound
	case ErrorTypeConflict:
		return http.StatusConflict
	case ErrorTypeRateLimit:
		return http.StatusTooManyRequests
	case ErrorTypeTimeout:
		return http.StatusRequestTimeout
	case ErrorTypeUnavailable:
		return http.StatusServiceUnavailable
	case ErrorTypeBadGateway:
		return http.StatusBadGateway
	case ErrorTypeExternal:
		return http.StatusBadGateway
	default:
		return http.StatusInternalServerError
	}
}

func isRetryableByDefault(errorType ErrorType) bool {
	switch errorType {
	case ErrorTypeRateLimit, ErrorTypeTimeout, ErrorTypeUnavailable, ErrorTypeBadGateway, ErrorTypeExternal:
		return true
	default:
		return false
	}
}

// Error code constants for common errors
const (
	// Authentication & Authorization
	ErrCodeInvalidCredentials   = "INVALID_CREDENTIALS"
	ErrCodeTokenExpired         = "TOKEN_EXPIRED"
	ErrCodeTokenInvalid         = "TOKEN_INVALID"
	ErrCodeInsufficientScope    = "INSUFFICIENT_SCOPE"
	ErrCodeAccountLocked        = "ACCOUNT_LOCKED"
	ErrCodeAccountNotVerified   = "ACCOUNT_NOT_VERIFIED"

	// Validation
	ErrCodeInvalidInput         = "INVALID_INPUT"
	ErrCodeMissingRequiredField = "MISSING_REQUIRED_FIELD"
	ErrCodeInvalidFormat        = "INVALID_FORMAT"
	ErrCodeValueOutOfRange      = "VALUE_OUT_OF_RANGE"

	// Resource Management
	ErrCodeResourceNotFound     = "RESOURCE_NOT_FOUND"
	ErrCodeResourceAlreadyExists = "RESOURCE_ALREADY_EXISTS"
	ErrCodeResourceInUse        = "RESOURCE_IN_USE"
	ErrCodeResourceLocked       = "RESOURCE_LOCKED"

	// External Services
	ErrCodeAmadeusUnavailable   = "AMADEUS_UNAVAILABLE"
	ErrCodeAmadeusRateLimit     = "AMADEUS_RATE_LIMIT"
	ErrCodeAmadeusAuthFailed    = "AMADEUS_AUTH_FAILED"
	ErrCodeElasticsearchDown    = "ELASTICSEARCH_DOWN"
	ErrCodeRedisConnectionFailed = "REDIS_CONNECTION_FAILED"
	ErrCodeDatabaseTimeout      = "DATABASE_TIMEOUT"

	// Business Logic
	ErrCodeFlightNotAvailable   = "FLIGHT_NOT_AVAILABLE"
	ErrCodeSearchResultsExpired = "SEARCH_RESULTS_EXPIRED"
	ErrCodePriceChanged         = "PRICE_CHANGED"
	ErrCodeBookingNotAllowed    = "BOOKING_NOT_ALLOWED"
)

// Common error instances
var (
	ErrInvalidCredentials = AuthenticationError("Invalid username or password")
	ErrTokenExpired      = AuthenticationError("Authentication token has expired")
	ErrTokenInvalid      = AuthenticationError("Invalid authentication token")
	ErrInsufficientScope = AuthorizationError("Insufficient permissions for this operation")
	ErrAccountLocked     = AuthenticationError("Account is locked due to too many failed attempts")
	
	ErrInvalidInput      = ValidationError("Invalid input provided", nil)
	ErrMissingField      = ValidationError("Required field is missing", nil)
	
	ErrUserNotFound      = NotFoundError("user", "")
	ErrFlightNotFound    = NotFoundError("flight", "")
	ErrSearchNotFound    = NotFoundError("search", "")
)