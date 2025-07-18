package httpclient

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"golang.org/x/time/rate"
)

// HTTPClient represents an HTTP client with retry logic and rate limiting
type HTTPClient struct {
	client      *http.Client
	rateLimiter *rate.Limiter
	maxRetries  int
	retryDelay  time.Duration
}

// HTTPClientConfig represents HTTP client configuration
type HTTPClientConfig struct {
	Timeout              time.Duration
	MaxRetries           int
	RetryDelay           time.Duration
	RateLimitRPS         int
	RateLimitBurst       int
	InsecureSkipVerify   bool
	MaxIdleConns         int
	MaxIdleConnsPerHost  int
	IdleConnTimeout      time.Duration
}

// Request represents an HTTP request
type Request struct {
	Method  string
	URL     string
	Headers map[string]string
	Body    interface{}
}

// Response represents an HTTP response
type Response struct {
	StatusCode int
	Headers    map[string][]string
	Body       []byte
}

// Error represents an HTTP error
type Error struct {
	StatusCode int    `json:"status_code"`
	Message    string `json:"message"`
	Body       string `json:"body"`
}

func (e *Error) Error() string {
	return fmt.Sprintf("HTTP %d: %s", e.StatusCode, e.Message)
}

// NewHTTPClient creates a new HTTP client with the given configuration
func NewHTTPClient(config HTTPClientConfig) *HTTPClient {
	// Create rate limiter if configured
	var rateLimiter *rate.Limiter
	if config.RateLimitRPS > 0 {
		rateLimiter = rate.NewLimiter(rate.Limit(config.RateLimitRPS), config.RateLimitBurst)
	}

	// Create HTTP client with custom transport
	transport := &http.Transport{
		MaxIdleConns:        config.MaxIdleConns,
		MaxIdleConnsPerHost: config.MaxIdleConnsPerHost,
		IdleConnTimeout:     config.IdleConnTimeout,
		DisableCompression:  false,
	}

	client := &http.Client{
		Transport: transport,
		Timeout:   config.Timeout,
	}

	return &HTTPClient{
		client:      client,
		rateLimiter: rateLimiter,
		maxRetries:  config.MaxRetries,
		retryDelay:  config.RetryDelay,
	}
}

// Do executes an HTTP request with retry logic and rate limiting
func (c *HTTPClient) Do(ctx context.Context, req Request) (*Response, error) {
	// Apply rate limiting
	if c.rateLimiter != nil {
		if err := c.rateLimiter.Wait(ctx); err != nil {
			return nil, fmt.Errorf("rate limiter error: %w", err)
		}
	}

	var lastErr error
	for attempt := 0; attempt <= c.maxRetries; attempt++ {
		if attempt > 0 {
			// Apply retry delay
			select {
			case <-ctx.Done():
				return nil, ctx.Err()
			case <-time.After(c.retryDelay * time.Duration(attempt)):
			}
		}

		response, err := c.doRequest(ctx, req)
		if err != nil {
			lastErr = err
			if !c.shouldRetry(err) {
				break
			}
			continue
		}

		// Check if response indicates we should retry
		if c.shouldRetryStatusCode(response.StatusCode) {
			lastErr = &Error{
				StatusCode: response.StatusCode,
				Message:    "HTTP error response",
				Body:       string(response.Body),
			}
			continue
		}

		return response, nil
	}

	return nil, fmt.Errorf("max retries exceeded: %w", lastErr)
}

// doRequest executes a single HTTP request
func (c *HTTPClient) doRequest(ctx context.Context, req Request) (*Response, error) {
	var bodyReader io.Reader
	if req.Body != nil {
		bodyBytes, err := json.Marshal(req.Body)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal request body: %w", err)
		}
		bodyReader = bytes.NewReader(bodyBytes)
	}

	httpReq, err := http.NewRequestWithContext(ctx, req.Method, req.URL, bodyReader)
	if err != nil {
		return nil, fmt.Errorf("failed to create HTTP request: %w", err)
	}

	// Set headers
	for key, value := range req.Headers {
		httpReq.Header.Set(key, value)
	}

	// Set default Content-Type if not provided and body exists
	if req.Body != nil && httpReq.Header.Get("Content-Type") == "" {
		httpReq.Header.Set("Content-Type", "application/json")
	}

	httpResp, err := c.client.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("HTTP request failed: %w", err)
	}
	defer httpResp.Body.Close()

	body, err := io.ReadAll(httpResp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	return &Response{
		StatusCode: httpResp.StatusCode,
		Headers:    httpResp.Header,
		Body:       body,
	}, nil
}

// shouldRetry determines if a request should be retried based on the error
func (c *HTTPClient) shouldRetry(err error) bool {
	// Retry on network errors, timeout errors, etc.
	if err == nil {
		return false
	}

	errStr := strings.ToLower(err.Error())
	
	// Retry on common transient errors
	retryableErrors := []string{
		"connection refused",
		"connection reset",
		"timeout",
		"temporary failure",
		"network is unreachable",
		"no route to host",
		"broken pipe",
	}

	for _, retryableError := range retryableErrors {
		if strings.Contains(errStr, retryableError) {
			return true
		}
	}

	return false
}

// shouldRetryStatusCode determines if a request should be retried based on status code
func (c *HTTPClient) shouldRetryStatusCode(statusCode int) bool {
	// Retry on server errors and certain client errors
	switch statusCode {
	case http.StatusTooManyRequests,     // 429
		 http.StatusInternalServerError,  // 500
		 http.StatusBadGateway,          // 502
		 http.StatusServiceUnavailable,  // 503
		 http.StatusGatewayTimeout:      // 504
		return true
	default:
		return false
	}
}

// Get executes a GET request
func (c *HTTPClient) Get(ctx context.Context, url string, headers map[string]string) (*Response, error) {
	return c.Do(ctx, Request{
		Method:  http.MethodGet,
		URL:     url,
		Headers: headers,
	})
}

// Post executes a POST request
func (c *HTTPClient) Post(ctx context.Context, url string, body interface{}, headers map[string]string) (*Response, error) {
	return c.Do(ctx, Request{
		Method:  http.MethodPost,
		URL:     url,
		Headers: headers,
		Body:    body,
	})
}

// Put executes a PUT request
func (c *HTTPClient) Put(ctx context.Context, url string, body interface{}, headers map[string]string) (*Response, error) {
	return c.Do(ctx, Request{
		Method:  http.MethodPut,
		URL:     url,
		Headers: headers,
		Body:    body,
	})
}

// Delete executes a DELETE request
func (c *HTTPClient) Delete(ctx context.Context, url string, headers map[string]string) (*Response, error) {
	return c.Do(ctx, Request{
		Method:  http.MethodDelete,
		URL:     url,
		Headers: headers,
	})
}

// GetJSON executes a GET request and unmarshals the response to the given interface
func (c *HTTPClient) GetJSON(ctx context.Context, url string, headers map[string]string, result interface{}) error {
	resp, err := c.Get(ctx, url, headers)
	if err != nil {
		return err
	}

	if resp.StatusCode >= 400 {
		return &Error{
			StatusCode: resp.StatusCode,
			Message:    "HTTP error response",
			Body:       string(resp.Body),
		}
	}

	if err := json.Unmarshal(resp.Body, result); err != nil {
		return fmt.Errorf("failed to unmarshal response: %w", err)
	}

	return nil
}

// PostJSON executes a POST request and unmarshals the response to the given interface
func (c *HTTPClient) PostJSON(ctx context.Context, url string, body interface{}, headers map[string]string, result interface{}) error {
	resp, err := c.Post(ctx, url, body, headers)
	if err != nil {
		return err
	}

	if resp.StatusCode >= 400 {
		return &Error{
			StatusCode: resp.StatusCode,
			Message:    "HTTP error response",
			Body:       string(resp.Body),
		}
	}

	if result != nil {
		if err := json.Unmarshal(resp.Body, result); err != nil {
			return fmt.Errorf("failed to unmarshal response: %w", err)
		}
	}

	return nil
}

// IsRetryableError checks if an error is retryable
func IsRetryableError(err error) bool {
	if err == nil {
		return false
	}

	// Check if it's an HTTP error
	if httpErr, ok := err.(*Error); ok {
		return httpErr.StatusCode >= 500 || httpErr.StatusCode == 429
	}

	// Check for network errors
	errStr := strings.ToLower(err.Error())
	retryableErrors := []string{
		"connection refused",
		"connection reset",
		"timeout",
		"temporary failure",
		"network is unreachable",
		"no route to host",
		"broken pipe",
	}

	for _, retryableError := range retryableErrors {
		if strings.Contains(errStr, retryableError) {
			return true
		}
	}

	return false
}

// DefaultHTTPClientConfig returns default HTTP client configuration
func DefaultHTTPClientConfig() HTTPClientConfig {
	return HTTPClientConfig{
		Timeout:             30 * time.Second,
		MaxRetries:          3,
		RetryDelay:          1 * time.Second,
		RateLimitRPS:        10,
		RateLimitBurst:      20,
		InsecureSkipVerify:  false,
		MaxIdleConns:        100,
		MaxIdleConnsPerHost: 10,
		IdleConnTimeout:     90 * time.Second,
	}
}