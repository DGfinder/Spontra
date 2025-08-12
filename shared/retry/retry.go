package retry

import (
	"context"
	"fmt"
	"math"
	"math/rand"
	"time"

	"spontra/shared/errors"
)

// Strategy defines the retry strategy
type Strategy string

const (
	StrategyFixed       Strategy = "fixed"
	StrategyLinear      Strategy = "linear"
	StrategyExponential Strategy = "exponential"
	StrategyJittered    Strategy = "jittered"
)

// Config holds retry configuration
type Config struct {
	MaxAttempts     int           `json:"max_attempts"`
	InitialDelay    time.Duration `json:"initial_delay"`
	MaxDelay        time.Duration `json:"max_delay"`
	Multiplier      float64       `json:"multiplier"`
	Strategy        Strategy      `json:"strategy"`
	Jitter          bool          `json:"jitter"`
	JitterMaxFactor float64       `json:"jitter_max_factor"`
	RetryableErrors []string      `json:"retryable_errors"`
	IsRetryable     func(error) bool `json:"-"`
}

// DefaultConfig returns a default retry configuration
func DefaultConfig() *Config {
	return &Config{
		MaxAttempts:     3,
		InitialDelay:    100 * time.Millisecond,
		MaxDelay:        30 * time.Second,
		Multiplier:      2.0,
		Strategy:        StrategyExponential,
		Jitter:          true,
		JitterMaxFactor: 0.1,
		RetryableErrors: []string{
			"TIMEOUT",
			"SERVICE_UNAVAILABLE",
			"BAD_GATEWAY",
			"EXTERNAL_SERVICE_ERROR",
			"RATE_LIMIT_EXCEEDED",
			"CIRCUIT_BREAKER_OPEN",
		},
		IsRetryable: DefaultIsRetryable,
	}
}

// DefaultIsRetryable determines if an error should be retried
func DefaultIsRetryable(err error) bool {
	if err == nil {
		return false
	}

	// Check if it's an AppError with retryable flag
	if appErr, ok := err.(*errors.AppError); ok {
		return appErr.Retryable
	}

	// Check for specific error types
	switch err.(type) {
	case *errors.AppError:
		appErr := err.(*errors.AppError)
		return appErr.Type == errors.ErrorTypeTimeout ||
			   appErr.Type == errors.ErrorTypeUnavailable ||
			   appErr.Type == errors.ErrorTypeBadGateway ||
			   appErr.Type == errors.ErrorTypeExternal ||
			   appErr.Type == errors.ErrorTypeRateLimit
	default:
		return false
	}
}

// Retryer implements retry logic
type Retryer struct {
	config *Config
	rand   *rand.Rand
}

// NewRetryer creates a new retryer instance
func NewRetryer(config *Config) *Retryer {
	if config == nil {
		config = DefaultConfig()
	}

	return &Retryer{
		config: config,
		rand:   rand.New(rand.NewSource(time.Now().UnixNano())),
	}
}

// ExecuteAttempt represents a single retry attempt
type ExecuteAttempt struct {
	Attempt   int           `json:"attempt"`
	Delay     time.Duration `json:"delay"`
	Error     error         `json:"error,omitempty"`
	StartTime time.Time     `json:"start_time"`
	EndTime   time.Time     `json:"end_time,omitempty"`
	Duration  time.Duration `json:"duration,omitempty"`
}

// ExecuteResult contains the result of a retry execution
type ExecuteResult struct {
	Success     bool              `json:"success"`
	Attempts    []ExecuteAttempt  `json:"attempts"`
	TotalTime   time.Duration     `json:"total_time"`
	FinalError  error             `json:"final_error,omitempty"`
}

// Execute executes a function with retry logic
func (r *Retryer) Execute(fn func() error) *ExecuteResult {
	return r.ExecuteWithContext(context.Background(), func(ctx context.Context) error {
		return fn()
	})
}

// ExecuteWithContext executes a function with retry logic and context
func (r *Retryer) ExecuteWithContext(ctx context.Context, fn func(context.Context) error) *ExecuteResult {
	startTime := time.Now()
	result := &ExecuteResult{
		Attempts: make([]ExecuteAttempt, 0, r.config.MaxAttempts),
	}

	for attempt := 1; attempt <= r.config.MaxAttempts; attempt++ {
		attemptStart := time.Now()
		
		// Check context cancellation
		select {
		case <-ctx.Done():
			result.FinalError = ctx.Err()
			result.TotalTime = time.Since(startTime)
			return result
		default:
		}

		attemptResult := ExecuteAttempt{
			Attempt:   attempt,
			StartTime: attemptStart,
		}

		// Execute the function
		err := fn(ctx)
		attemptResult.EndTime = time.Now()
		attemptResult.Duration = attemptResult.EndTime.Sub(attemptResult.StartTime)
		attemptResult.Error = err

		if err == nil {
			// Success
			result.Success = true
			result.Attempts = append(result.Attempts, attemptResult)
			result.TotalTime = time.Since(startTime)
			return result
		}

		// Check if error is retryable
		if !r.isRetryable(err) {
			result.FinalError = err
			result.Attempts = append(result.Attempts, attemptResult)
			result.TotalTime = time.Since(startTime)
			return result
		}

		// Calculate delay for next attempt
		if attempt < r.config.MaxAttempts {
			delay := r.calculateDelay(attempt)
			attemptResult.Delay = delay
			
			// Sleep with context awareness
			select {
			case <-ctx.Done():
				result.FinalError = ctx.Err()
				result.Attempts = append(result.Attempts, attemptResult)
				result.TotalTime = time.Since(startTime)
				return result
			case <-time.After(delay):
				// Continue to next attempt
			}
		}

		result.Attempts = append(result.Attempts, attemptResult)
		result.FinalError = err
	}

	result.TotalTime = time.Since(startTime)
	return result
}

// ExecuteWithCallback executes a function with retry logic and attempt callbacks
func (r *Retryer) ExecuteWithCallback(
	ctx context.Context,
	fn func(context.Context) error,
	onAttempt func(attempt int, err error),
) *ExecuteResult {
	return r.ExecuteWithCallbacks(ctx, fn, onAttempt, nil, nil)
}

// ExecuteWithCallbacks executes with comprehensive callbacks
func (r *Retryer) ExecuteWithCallbacks(
	ctx context.Context,
	fn func(context.Context) error,
	onAttempt func(attempt int, err error),
	onSuccess func(attempts int, totalTime time.Duration),
	onFailure func(attempts int, totalTime time.Duration, finalError error),
) *ExecuteResult {
	result := r.ExecuteWithContext(ctx, fn)

	// Call attempt callback for each attempt
	if onAttempt != nil {
		for _, attempt := range result.Attempts {
			onAttempt(attempt.Attempt, attempt.Error)
		}
	}

	// Call final callback
	if result.Success && onSuccess != nil {
		onSuccess(len(result.Attempts), result.TotalTime)
	} else if !result.Success && onFailure != nil {
		onFailure(len(result.Attempts), result.TotalTime, result.FinalError)
	}

	return result
}

// calculateDelay calculates the delay for the next retry attempt
func (r *Retryer) calculateDelay(attempt int) time.Duration {
	var delay time.Duration

	switch r.config.Strategy {
	case StrategyFixed:
		delay = r.config.InitialDelay
	case StrategyLinear:
		delay = time.Duration(int64(r.config.InitialDelay) * int64(attempt))
	case StrategyExponential:
		delay = time.Duration(float64(r.config.InitialDelay) * math.Pow(r.config.Multiplier, float64(attempt-1)))
	case StrategyJittered:
		baseDelay := time.Duration(float64(r.config.InitialDelay) * math.Pow(r.config.Multiplier, float64(attempt-1)))
		jitter := time.Duration(r.rand.Float64() * float64(baseDelay) * r.config.JitterMaxFactor)
		delay = baseDelay + jitter
	default:
		delay = r.config.InitialDelay
	}

	// Apply jitter if enabled
	if r.config.Jitter && r.config.Strategy != StrategyJittered {
		jitterAmount := time.Duration(r.rand.Float64() * float64(delay) * r.config.JitterMaxFactor)
		delay += jitterAmount
	}

	// Respect max delay
	if delay > r.config.MaxDelay {
		delay = r.config.MaxDelay
	}

	return delay
}

// isRetryable determines if an error should be retried
func (r *Retryer) isRetryable(err error) bool {
	if r.config.IsRetryable != nil {
		return r.config.IsRetryable(err)
	}

	return DefaultIsRetryable(err)
}

// RetryableError wraps an error to make it retryable
func RetryableError(err error) error {
	if appErr, ok := err.(*errors.AppError); ok {
		appErr.Retryable = true
		return appErr
	}

	return errors.NewError(errors.ErrorTypeExternal, "RETRYABLE_ERROR", err.Error()).
		WithCause(err).
		WithRetryable(true).
		Build()
}

// NonRetryableError wraps an error to make it non-retryable
func NonRetryableError(err error) error {
	if appErr, ok := err.(*errors.AppError); ok {
		appErr.Retryable = false
		return appErr
	}

	return errors.NewError(errors.ErrorTypeInternal, "NON_RETRYABLE_ERROR", err.Error()).
		WithCause(err).
		WithRetryable(false).
		Build()
}

// Predefined retry configurations

// NetworkRetryConfig returns a configuration optimized for network operations
func NetworkRetryConfig() *Config {
	return &Config{
		MaxAttempts:     5,
		InitialDelay:    200 * time.Millisecond,
		MaxDelay:        10 * time.Second,
		Multiplier:      2.0,
		Strategy:        StrategyJittered,
		Jitter:          true,
		JitterMaxFactor: 0.2,
		IsRetryable:     DefaultIsRetryable,
	}
}

// DatabaseRetryConfig returns a configuration optimized for database operations
func DatabaseRetryConfig() *Config {
	return &Config{
		MaxAttempts:     3,
		InitialDelay:    50 * time.Millisecond,
		MaxDelay:        5 * time.Second,
		Multiplier:      1.5,
		Strategy:        StrategyExponential,
		Jitter:          true,
		JitterMaxFactor: 0.1,
		IsRetryable:     func(err error) bool {
			if appErr, ok := err.(*errors.AppError); ok {
				return appErr.Type == errors.ErrorTypeTimeout ||
					   appErr.Type == errors.ErrorTypeUnavailable
			}
			return false
		},
	}
}

// ExternalServiceRetryConfig returns a configuration for external service calls
func ExternalServiceRetryConfig() *Config {
	return &Config{
		MaxAttempts:     4,
		InitialDelay:    500 * time.Millisecond,
		MaxDelay:        30 * time.Second,
		Multiplier:      2.5,
		Strategy:        StrategyJittered,
		Jitter:          true,
		JitterMaxFactor: 0.3,
		IsRetryable:     func(err error) bool {
			if appErr, ok := err.(*errors.AppError); ok {
				return appErr.Type == errors.ErrorTypeTimeout ||
					   appErr.Type == errors.ErrorTypeUnavailable ||
					   appErr.Type == errors.ErrorTypeBadGateway ||
					   appErr.Type == errors.ErrorTypeExternal ||
					   appErr.Type == errors.ErrorTypeRateLimit
			}
			return false
		},
	}
}

// QuickRetryConfig returns a configuration for quick operations
func QuickRetryConfig() *Config {
	return &Config{
		MaxAttempts:     2,
		InitialDelay:    10 * time.Millisecond,
		MaxDelay:        100 * time.Millisecond,
		Multiplier:      2.0,
		Strategy:        StrategyFixed,
		Jitter:          false,
		IsRetryable:     DefaultIsRetryable,
	}
}

// Helper functions for common retry patterns

// RetryFunc is a convenience function for simple retries
func RetryFunc(fn func() error, config *Config) error {
	retryer := NewRetryer(config)
	result := retryer.Execute(fn)
	return result.FinalError
}

// RetryFuncWithContext is a convenience function for retries with context
func RetryFuncWithContext(ctx context.Context, fn func(context.Context) error, config *Config) error {
	retryer := NewRetryer(config)
	result := retryer.ExecuteWithContext(ctx, fn)
	return result.FinalError
}

// RetryWithTimeout combines retry with timeout
func RetryWithTimeout(fn func() error, config *Config, timeout time.Duration) error {
	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()

	return RetryFuncWithContext(ctx, func(ctx context.Context) error {
		return fn()
	}, config)
}