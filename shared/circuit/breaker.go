package circuit

import (
	"context"
	"errors"
	"fmt"
	"sync"
	"time"

	"spontra/shared/errors"
)

// State represents the circuit breaker state
type State int

const (
	StateClosed State = iota
	StateHalfOpen
	StateOpen
)

func (s State) String() string {
	switch s {
	case StateClosed:
		return "CLOSED"
	case StateHalfOpen:
		return "HALF_OPEN"
	case StateOpen:
		return "OPEN"
	default:
		return "UNKNOWN"
	}
}

// Config holds circuit breaker configuration
type Config struct {
	Name               string        `json:"name"`
	MaxRequests        uint32        `json:"max_requests"`        // Max requests allowed in half-open state
	Interval           time.Duration `json:"interval"`            // Time period for collecting statistics
	Timeout            time.Duration `json:"timeout"`             // Timeout for opening the circuit
	ReadyToTrip        func(counts Counts) bool `json:"-"`       // Function to determine if circuit should open
	OnStateChange      func(name string, from State, to State) `json:"-"` // State change callback
	IsSuccessful       func(err error) bool `json:"-"`          // Function to determine if result is successful
}

// DefaultConfig returns a default circuit breaker configuration
func DefaultConfig(name string) *Config {
	return &Config{
		Name:        name,
		MaxRequests: 3,
		Interval:    60 * time.Second,
		Timeout:     60 * time.Second,
		ReadyToTrip: func(counts Counts) bool {
			return counts.ConsecutiveFailures >= 5 || 
				   (counts.TotalRequests >= 10 && counts.FailureRatio() >= 0.6)
		},
		OnStateChange: func(name string, from State, to State) {
			// Default implementation logs state changes
		},
		IsSuccessful: func(err error) bool {
			// By default, any non-nil error is considered a failure
			return err == nil
		},
	}
}

// Counts holds the statistics for the circuit breaker
type Counts struct {
	Requests             uint32    `json:"requests"`
	TotalSuccesses       uint32    `json:"total_successes"`
	TotalFailures        uint32    `json:"total_failures"`
	ConsecutiveSuccesses uint32    `json:"consecutive_successes"`
	ConsecutiveFailures  uint32    `json:"consecutive_failures"`
	TotalRequests        uint32    `json:"total_requests"`
}

// FailureRatio returns the failure ratio
func (c Counts) FailureRatio() float64 {
	if c.TotalRequests == 0 {
		return 0.0
	}
	return float64(c.TotalFailures) / float64(c.TotalRequests)
}

// SuccessRatio returns the success ratio
func (c Counts) SuccessRatio() float64 {
	if c.TotalRequests == 0 {
		return 0.0
	}
	return float64(c.TotalSuccesses) / float64(c.TotalRequests)
}

// CircuitBreaker implements the circuit breaker pattern
type CircuitBreaker struct {
	name          string
	maxRequests   uint32
	interval      time.Duration
	timeout       time.Duration
	readyToTrip   func(counts Counts) bool
	onStateChange func(name string, from State, to State)
	isSuccessful  func(err error) bool

	mutex      sync.RWMutex
	state      State
	generation uint64
	counts     Counts
	expiry     time.Time
}

// NewCircuitBreaker creates a new circuit breaker instance
func NewCircuitBreaker(config *Config) *CircuitBreaker {
	cb := &CircuitBreaker{
		name:          config.Name,
		maxRequests:   config.MaxRequests,
		interval:      config.Interval,
		timeout:       config.Timeout,
		readyToTrip:   config.ReadyToTrip,
		onStateChange: config.OnStateChange,
		isSuccessful:  config.IsSuccessful,
		state:         StateClosed,
		expiry:        time.Now().Add(config.Interval),
	}

	return cb
}

// Execute runs the given function if the circuit breaker allows it
func (cb *CircuitBreaker) Execute(fn func() error) error {
	generation, err := cb.beforeRequest()
	if err != nil {
		return err
	}

	defer func() {
		cb.afterRequest(generation, cb.isSuccessful(err))
	}()

	err = fn()
	return err
}

// ExecuteWithContext runs the given function with context if the circuit breaker allows it
func (cb *CircuitBreaker) ExecuteWithContext(ctx context.Context, fn func(ctx context.Context) error) error {
	generation, err := cb.beforeRequest()
	if err != nil {
		return err
	}

	defer func() {
		cb.afterRequest(generation, cb.isSuccessful(err))
	}()

	// Check for context cancellation
	select {
	case <-ctx.Done():
		return ctx.Err()
	default:
	}

	err = fn(ctx)
	return err
}

// beforeRequest checks if the request should be allowed
func (cb *CircuitBreaker) beforeRequest() (uint64, error) {
	cb.mutex.Lock()
	defer cb.mutex.Unlock()

	now := time.Now()
	state, generation := cb.currentState(now)

	if state == StateOpen {
		return generation, errors.NewError(errors.ErrorTypeUnavailable, "CIRCUIT_BREAKER_OPEN", 
			fmt.Sprintf("Circuit breaker '%s' is open", cb.name)).
			WithDetail("circuit_breaker", cb.name).
			WithDetail("state", state.String()).
			WithRetryable(true).
			Build()
	}

	if state == StateHalfOpen && cb.counts.Requests >= cb.maxRequests {
		return generation, errors.NewError(errors.ErrorTypeUnavailable, "CIRCUIT_BREAKER_HALF_OPEN_LIMIT", 
			fmt.Sprintf("Circuit breaker '%s' is half-open but at request limit", cb.name)).
			WithDetail("circuit_breaker", cb.name).
			WithDetail("state", state.String()).
			WithDetail("current_requests", cb.counts.Requests).
			WithDetail("max_requests", cb.maxRequests).
			WithRetryable(true).
			Build()
	}

	cb.counts.Requests++
	return generation, nil
}

// afterRequest updates the circuit breaker state after a request
func (cb *CircuitBreaker) afterRequest(before uint64, success bool) {
	cb.mutex.Lock()
	defer cb.mutex.Unlock()

	now := time.Now()
	state, generation := cb.currentState(now)

	if generation != before {
		return // Different generation, ignore
	}

	if success {
		cb.onSuccess(state)
	} else {
		cb.onFailure(state)
	}
}

// onSuccess handles successful requests
func (cb *CircuitBreaker) onSuccess(state State) {
	cb.counts.TotalSuccesses++
	cb.counts.ConsecutiveSuccesses++
	cb.counts.ConsecutiveFailures = 0

	if state == StateHalfOpen {
		cb.setState(StateClosed)
	}
}

// onFailure handles failed requests
func (cb *CircuitBreaker) onFailure(state State) {
	cb.counts.TotalFailures++
	cb.counts.ConsecutiveFailures++
	cb.counts.ConsecutiveSuccesses = 0

	if cb.readyToTrip(cb.counts) {
		cb.setState(StateOpen)
	}
}

// currentState returns the current state and generation
func (cb *CircuitBreaker) currentState(now time.Time) (State, uint64) {
	switch cb.state {
	case StateClosed:
		if !cb.expiry.IsZero() && cb.expiry.Before(now) {
			cb.toNewGeneration(now)
		}
	case StateOpen:
		if cb.expiry.Before(now) {
			cb.setState(StateHalfOpen)
		}
	}
	return cb.state, cb.generation
}

// setState changes the circuit breaker state
func (cb *CircuitBreaker) setState(state State) {
	if cb.state == state {
		return
	}

	prev := cb.state
	cb.state = state

	now := time.Now()
	switch state {
	case StateClosed:
		cb.toNewGeneration(now)
	case StateOpen:
		cb.generation++
		cb.expiry = now.Add(cb.timeout)
	case StateHalfOpen:
		cb.generation++
	}

	if cb.onStateChange != nil {
		cb.onStateChange(cb.name, prev, state)
	}
}

// toNewGeneration resets the circuit breaker to a new generation
func (cb *CircuitBreaker) toNewGeneration(now time.Time) {
	cb.generation++
	cb.counts = Counts{}
	
	var zero time.Time
	switch cb.state {
	case StateClosed:
		if cb.interval == 0 {
			cb.expiry = zero
		} else {
			cb.expiry = now.Add(cb.interval)
		}
	case StateOpen:
		cb.expiry = now.Add(cb.timeout)
	default: // StateHalfOpen
		cb.expiry = zero
	}
}

// State returns the current state of the circuit breaker
func (cb *CircuitBreaker) State() State {
	cb.mutex.RLock()
	defer cb.mutex.RUnlock()

	state, _ := cb.currentState(time.Now())
	return state
}

// Counts returns the current counts
func (cb *CircuitBreaker) Counts() Counts {
	cb.mutex.RLock()
	defer cb.mutex.RUnlock()

	return cb.counts
}

// Name returns the circuit breaker name
func (cb *CircuitBreaker) Name() string {
	return cb.name
}

// Reset resets the circuit breaker to its initial state
func (cb *CircuitBreaker) Reset() {
	cb.mutex.Lock()
	defer cb.mutex.Unlock()

	cb.toNewGeneration(time.Now())
	cb.setState(StateClosed)
}

// Stats returns detailed statistics about the circuit breaker
func (cb *CircuitBreaker) Stats() map[string]interface{} {
	cb.mutex.RLock()
	defer cb.mutex.RUnlock()

	state, _ := cb.currentState(time.Now())
	
	return map[string]interface{}{
		"name":                    cb.name,
		"state":                   state.String(),
		"generation":              cb.generation,
		"counts":                  cb.counts,
		"failure_ratio":           cb.counts.FailureRatio(),
		"success_ratio":           cb.counts.SuccessRatio(),
		"expiry":                  cb.expiry,
		"max_requests":            cb.maxRequests,
		"interval_seconds":        cb.interval.Seconds(),
		"timeout_seconds":         cb.timeout.Seconds(),
	}
}

// CircuitBreakerManager manages multiple circuit breakers
type CircuitBreakerManager struct {
	breakers map[string]*CircuitBreaker
	mutex    sync.RWMutex
}

// NewManager creates a new circuit breaker manager
func NewManager() *CircuitBreakerManager {
	return &CircuitBreakerManager{
		breakers: make(map[string]*CircuitBreaker),
	}
}

// GetBreaker returns a circuit breaker by name, creating it if it doesn't exist
func (m *CircuitBreakerManager) GetBreaker(name string, config *Config) *CircuitBreaker {
	m.mutex.RLock()
	breaker, exists := m.breakers[name]
	m.mutex.RUnlock()

	if exists {
		return breaker
	}

	m.mutex.Lock()
	defer m.mutex.Unlock()

	// Double-check after acquiring write lock
	if breaker, exists := m.breakers[name]; exists {
		return breaker
	}

	if config == nil {
		config = DefaultConfig(name)
	}
	config.Name = name

	breaker = NewCircuitBreaker(config)
	m.breakers[name] = breaker
	return breaker
}

// GetBreakerByName returns an existing circuit breaker by name
func (m *CircuitBreakerManager) GetBreakerByName(name string) (*CircuitBreaker, bool) {
	m.mutex.RLock()
	defer m.mutex.RUnlock()

	breaker, exists := m.breakers[name]
	return breaker, exists
}

// RemoveBreaker removes a circuit breaker
func (m *CircuitBreakerManager) RemoveBreaker(name string) {
	m.mutex.Lock()
	defer m.mutex.Unlock()

	delete(m.breakers, name)
}

// ListBreakers returns all circuit breaker names
func (m *CircuitBreakerManager) ListBreakers() []string {
	m.mutex.RLock()
	defer m.mutex.RUnlock()

	names := make([]string, 0, len(m.breakers))
	for name := range m.breakers {
		names = append(names, name)
	}
	return names
}

// GetAllStats returns statistics for all circuit breakers
func (m *CircuitBreakerManager) GetAllStats() map[string]interface{} {
	m.mutex.RLock()
	defer m.mutex.RUnlock()

	stats := make(map[string]interface{})
	for name, breaker := range m.breakers {
		stats[name] = breaker.Stats()
	}
	return stats
}

// ResetAll resets all circuit breakers
func (m *CircuitBreakerManager) ResetAll() {
	m.mutex.RLock()
	defer m.mutex.RUnlock()

	for _, breaker := range m.breakers {
		breaker.Reset()
	}
}

// Global circuit breaker manager instance
var GlobalManager = NewManager()