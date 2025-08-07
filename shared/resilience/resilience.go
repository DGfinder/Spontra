package resilience

import (
	"context"
	"time"

	"spontra/shared/circuit"
	"spontra/shared/errors"
	"spontra/shared/retry"
)

// ResilienceConfig combines circuit breaker and retry configurations
type ResilienceConfig struct {
	RetryConfig          *retry.Config
	CircuitBreakerConfig *circuit.Config
	Timeout              time.Duration
	EnableCircuitBreaker bool
	EnableRetry          bool
	EnableTimeout        bool
}

// DefaultResilienceConfig returns a default resilience configuration
func DefaultResilienceConfig(name string) *ResilienceConfig {
	return &ResilienceConfig{
		RetryConfig:          retry.DefaultConfig(),
		CircuitBreakerConfig: circuit.DefaultConfig(name),
		Timeout:              30 * time.Second,
		EnableCircuitBreaker: true,
		EnableRetry:          true,
		EnableTimeout:        true,
	}
}

// ExternalServiceConfig returns resilience config optimized for external services
func ExternalServiceConfig(serviceName string) *ResilienceConfig {
	return &ResilienceConfig{
		RetryConfig:          retry.ExternalServiceRetryConfig(),
		CircuitBreakerConfig: circuit.DefaultConfig(serviceName),
		Timeout:              60 * time.Second,
		EnableCircuitBreaker: true,
		EnableRetry:          true,
		EnableTimeout:        true,
	}
}

// DatabaseConfig returns resilience config optimized for database operations
func DatabaseConfig(dbName string) *ResilienceConfig {
	return &ResilienceConfig{
		RetryConfig:          retry.DatabaseRetryConfig(),
		CircuitBreakerConfig: circuit.DefaultConfig("db-" + dbName),
		Timeout:              10 * time.Second,
		EnableCircuitBreaker: true,
		EnableRetry:          true,
		EnableTimeout:        true,
	}
}

// CacheConfig returns resilience config optimized for cache operations
func CacheConfig(cacheName string) *ResilienceConfig {
	return &ResilienceConfig{
		RetryConfig:          retry.QuickRetryConfig(),
		CircuitBreakerConfig: circuit.DefaultConfig("cache-" + cacheName),
		Timeout:              5 * time.Second,
		EnableCircuitBreaker: false, // Cache failures are often acceptable
		EnableRetry:          true,
		EnableTimeout:        true,
	}
}

// ResilientExecutor combines circuit breaker, retry, and timeout patterns
type ResilientExecutor struct {
	config        *ResilienceConfig
	circuitBreaker *circuit.CircuitBreaker
	retryer       *retry.Retryer
}

// NewResilientExecutor creates a new resilient executor
func NewResilientExecutor(config *ResilienceConfig) *ResilientExecutor {
	executor := &ResilientExecutor{
		config: config,
	}

	if config.EnableRetry {
		executor.retryer = retry.NewRetryer(config.RetryConfig)
	}

	if config.EnableCircuitBreaker {
		executor.circuitBreaker = circuit.NewCircuitBreaker(config.CircuitBreakerConfig)
	}

	return executor
}

// Execute runs a function with resilience patterns
func (e *ResilientExecutor) Execute(fn func() error) error {
	return e.ExecuteWithContext(context.Background(), func(ctx context.Context) error {
		return fn()
	})
}

// ExecuteWithContext runs a function with resilience patterns and context
func (e *ResilientExecutor) ExecuteWithContext(ctx context.Context, fn func(context.Context) error) error {
	// Apply timeout if enabled
	if e.config.EnableTimeout {
		var cancel context.CancelFunc
		ctx, cancel = context.WithTimeout(ctx, e.config.Timeout)
		defer cancel()
	}

	// Wrap function with circuit breaker if enabled
	var wrappedFn func(context.Context) error
	if e.config.EnableCircuitBreaker && e.circuitBreaker != nil {
		wrappedFn = func(ctx context.Context) error {
			return e.circuitBreaker.ExecuteWithContext(ctx, fn)
		}
	} else {
		wrappedFn = fn
	}

	// Apply retry if enabled
	if e.config.EnableRetry && e.retryer != nil {
		result := e.retryer.ExecuteWithContext(ctx, wrappedFn)
		return result.FinalError
	}

	// Execute directly if no retry
	return wrappedFn(ctx)
}

// ExecuteWithCallbacks runs with resilience patterns and callbacks
func (e *ResilientExecutor) ExecuteWithCallbacks(
	ctx context.Context,
	fn func(context.Context) error,
	onAttempt func(attempt int, err error),
	onSuccess func(attempts int, totalTime time.Duration),
	onFailure func(attempts int, totalTime time.Duration, finalError error),
) error {
	// Apply timeout if enabled
	if e.config.EnableTimeout {
		var cancel context.CancelFunc
		ctx, cancel = context.WithTimeout(ctx, e.config.Timeout)
		defer cancel()
	}

	// Wrap function with circuit breaker if enabled
	var wrappedFn func(context.Context) error
	if e.config.EnableCircuitBreaker && e.circuitBreaker != nil {
		wrappedFn = func(ctx context.Context) error {
			return e.circuitBreaker.ExecuteWithContext(ctx, fn)
		}
	} else {
		wrappedFn = fn
	}

	// Apply retry with callbacks if enabled
	if e.config.EnableRetry && e.retryer != nil {
		result := e.retryer.ExecuteWithCallbacks(ctx, wrappedFn, onAttempt, onSuccess, onFailure)
		return result.FinalError
	}

	// Execute directly with manual callback handling if no retry
	start := time.Now()
	err := wrappedFn(ctx)
	duration := time.Since(start)

	if onAttempt != nil {
		onAttempt(1, err)
	}

	if err == nil && onSuccess != nil {
		onSuccess(1, duration)
	} else if err != nil && onFailure != nil {
		onFailure(1, duration, err)
	}

	return err
}

// GetStats returns statistics about the resilient executor
func (e *ResilientExecutor) GetStats() map[string]interface{} {
	stats := map[string]interface{}{
		"config": map[string]interface{}{
			"circuit_breaker_enabled": e.config.EnableCircuitBreaker,
			"retry_enabled":           e.config.EnableRetry,
			"timeout_enabled":         e.config.EnableTimeout,
			"timeout_seconds":         e.config.Timeout.Seconds(),
		},
	}

	if e.circuitBreaker != nil {
		stats["circuit_breaker"] = e.circuitBreaker.Stats()
	}

	return stats
}

// Reset resets the resilient executor state
func (e *ResilientExecutor) Reset() {
	if e.circuitBreaker != nil {
		e.circuitBreaker.Reset()
	}
}

// Global resilient executors for common use cases
var (
	// DatabaseExecutor for database operations
	DatabaseExecutor = NewResilientExecutor(DatabaseConfig("default"))
	
	// CacheExecutor for cache operations
	CacheExecutor = NewResilientExecutor(CacheConfig("default"))
	
	// HTTPExecutor for HTTP client calls
	HTTPExecutor = NewResilientExecutor(ExternalServiceConfig("http"))
)

// Convenience functions for common patterns

// ExecuteWithResilience executes a function with default resilience patterns
func ExecuteWithResilience(fn func() error, config *ResilienceConfig) error {
	executor := NewResilientExecutor(config)
	return executor.Execute(fn)
}

// ExecuteWithResilienceAndContext executes with resilience and context
func ExecuteWithResilienceAndContext(ctx context.Context, fn func(context.Context) error, config *ResilienceConfig) error {
	executor := NewResilientExecutor(config)
	return executor.ExecuteWithContext(ctx, fn)
}

// DatabaseOperation executes a database operation with resilience
func DatabaseOperation(fn func() error) error {
	return DatabaseExecutor.Execute(fn)
}

// DatabaseOperationWithContext executes a database operation with context
func DatabaseOperationWithContext(ctx context.Context, fn func(context.Context) error) error {
	return DatabaseExecutor.ExecuteWithContext(ctx, fn)
}

// CacheOperation executes a cache operation with resilience
func CacheOperation(fn func() error) error {
	return CacheExecutor.Execute(fn)
}

// CacheOperationWithContext executes a cache operation with context
func CacheOperationWithContext(ctx context.Context, fn func(context.Context) error) error {
	return CacheExecutor.ExecuteWithContext(ctx, fn)
}

// HTTPOperation executes an HTTP operation with resilience
func HTTPOperation(fn func() error) error {
	return HTTPExecutor.Execute(fn)
}

// HTTPOperationWithContext executes an HTTP operation with context
func HTTPOperationWithContext(ctx context.Context, fn func(context.Context) error) error {
	return HTTPExecutor.ExecuteWithContext(ctx, fn)
}

// ExternalServiceCall executes an external service call with full resilience
func ExternalServiceCall(serviceName string, fn func() error) error {
	config := ExternalServiceConfig(serviceName)
	return ExecuteWithResilience(fn, config)
}

// ExternalServiceCallWithContext executes an external service call with context
func ExternalServiceCallWithContext(ctx context.Context, serviceName string, fn func(context.Context) error) error {
	config := ExternalServiceConfig(serviceName)
	return ExecuteWithResilienceAndContext(ctx, fn, config)
}

// FallbackExecutor provides fallback functionality when primary operations fail
type FallbackExecutor struct {
	primary  func() error
	fallback func() error
	config   *ResilienceConfig
}

// NewFallbackExecutor creates a new fallback executor
func NewFallbackExecutor(primary, fallback func() error, config *ResilienceConfig) *FallbackExecutor {
	return &FallbackExecutor{
		primary:  primary,
		fallback: fallback,
		config:   config,
	}
}

// Execute tries the primary function, falling back to the fallback function if it fails
func (f *FallbackExecutor) Execute() error {
	// Try primary operation with resilience
	err := ExecuteWithResilience(f.primary, f.config)
	if err == nil {
		return nil
	}

	// Check if error is retryable - if not, don't use fallback
	if appErr, ok := err.(*errors.AppError); ok && !appErr.Retryable {
		return err
	}

	// Try fallback operation
	fallbackErr := f.fallback()
	if fallbackErr != nil {
		// Return original error if fallback also fails
		return err
	}

	return nil
}

// ExecuteWithFallback is a convenience function for fallback pattern
func ExecuteWithFallback(primary, fallback func() error, config *ResilienceConfig) error {
	executor := NewFallbackExecutor(primary, fallback, config)
	return executor.Execute()
}