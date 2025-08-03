package metrics

import (
	"time"

	"github.com/gin-gonic/gin"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

// Metrics contains all Prometheus metrics for the search service
type Metrics struct {
	// HTTP metrics
	httpRequestsTotal        *prometheus.CounterVec
	httpRequestDuration      *prometheus.HistogramVec
	httpRequestsInFlight     prometheus.Gauge
	httpResponseSize         *prometheus.HistogramVec

	// Business metrics
	searchRequests           *prometheus.CounterVec
	searchDuration           *prometheus.HistogramVec
	searchResults            *prometheus.HistogramVec
	providerRequests         *prometheus.CounterVec
	providerDuration         *prometheus.HistogramVec
	providerErrors           *prometheus.CounterVec

	// Cache metrics
	cacheOperations          *prometheus.CounterVec
	cacheHitRate             *prometheus.GaugeVec
	cacheDuration            *prometheus.HistogramVec

	// Database metrics
	dbConnections            prometheus.Gauge
	dbOperations             *prometheus.CounterVec
	dbDuration               *prometheus.HistogramVec

	// System metrics
	activeSearches           prometheus.Gauge
	queuedSearches           prometheus.Gauge
}

// NewMetrics creates a new metrics instance
func NewMetrics() *Metrics {
	return &Metrics{
		// HTTP metrics
		httpRequestsTotal: promauto.NewCounterVec(
			prometheus.CounterOpts{
				Name: "http_requests_total",
				Help: "Total number of HTTP requests",
			},
			[]string{"method", "endpoint", "status_code", "service"},
		),
		httpRequestDuration: promauto.NewHistogramVec(
			prometheus.HistogramOpts{
				Name:    "http_request_duration_seconds",
				Help:    "Duration of HTTP requests in seconds",
				Buckets: prometheus.DefBuckets,
			},
			[]string{"method", "endpoint", "status_code", "service"},
		),
		httpRequestsInFlight: promauto.NewGauge(
			prometheus.GaugeOpts{
				Name: "http_requests_in_flight",
				Help: "Number of HTTP requests currently being served",
			},
		),
		httpResponseSize: promauto.NewHistogramVec(
			prometheus.HistogramOpts{
				Name:    "http_response_size_bytes",
				Help:    "Size of HTTP responses in bytes",
				Buckets: []float64{100, 1000, 10000, 100000, 1000000},
			},
			[]string{"method", "endpoint", "status_code", "service"},
		),

		// Business metrics
		searchRequests: promauto.NewCounterVec(
			prometheus.CounterOpts{
				Name: "spontra_search_requests_total",
				Help: "Total number of search requests",
			},
			[]string{"origin", "destination", "result"}, // result: success, error, timeout
		),
		searchDuration: promauto.NewHistogramVec(
			prometheus.HistogramOpts{
				Name:    "spontra_search_duration_seconds",
				Help:    "Duration of search requests in seconds",
				Buckets: []float64{0.1, 0.5, 1.0, 2.0, 5.0, 10.0, 30.0},
			},
			[]string{"origin", "destination"},
		),
		searchResults: promauto.NewHistogramVec(
			prometheus.HistogramOpts{
				Name:    "spontra_search_results_count",
				Help:    "Number of results returned per search",
				Buckets: []float64{0, 1, 5, 10, 25, 50, 100, 250, 500},
			},
			[]string{"origin", "destination"},
		),
		providerRequests: promauto.NewCounterVec(
			prometheus.CounterOpts{
				Name: "spontra_provider_requests_total",
				Help: "Total number of requests to search providers",
			},
			[]string{"provider", "result"}, // provider: amadeus, skyscanner, etc. | result: success, error, timeout
		),
		providerDuration: promauto.NewHistogramVec(
			prometheus.HistogramOpts{
				Name:    "spontra_provider_duration_seconds",
				Help:    "Duration of provider requests in seconds",
				Buckets: []float64{0.1, 0.5, 1.0, 2.0, 5.0, 10.0, 30.0},
			},
			[]string{"provider"},
		),
		providerErrors: promauto.NewCounterVec(
			prometheus.CounterOpts{
				Name: "spontra_provider_errors_total",
				Help: "Total number of provider errors",
			},
			[]string{"provider", "error_type"}, // error_type: timeout, auth, rate_limit, etc.
		),

		// Cache metrics
		cacheOperations: promauto.NewCounterVec(
			prometheus.CounterOpts{
				Name: "cache_operations_total",
				Help: "Total number of cache operations",
			},
			[]string{"operation", "result"}, // get, set, delete | hit, miss, success, error
		),
		cacheHitRate: promauto.NewGaugeVec(
			prometheus.GaugeOpts{
				Name: "cache_hit_rate",
				Help: "Cache hit rate percentage",
			},
			[]string{"cache_type"},
		),
		cacheDuration: promauto.NewHistogramVec(
			prometheus.HistogramOpts{
				Name:    "cache_operation_duration_seconds",
				Help:    "Duration of cache operations in seconds",
				Buckets: []float64{0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1.0},
			},
			[]string{"operation"},
		),

		// Database metrics
		dbConnections: promauto.NewGauge(
			prometheus.GaugeOpts{
				Name: "database_connections_active",
				Help: "Number of active database connections",
			},
		),
		dbOperations: promauto.NewCounterVec(
			prometheus.CounterOpts{
				Name: "database_operations_total",
				Help: "Total number of database operations",
			},
			[]string{"operation", "table", "result"}, // select, insert, update, delete | flights, routes, etc. | success, error
		),
		dbDuration: promauto.NewHistogramVec(
			prometheus.HistogramOpts{
				Name:    "database_operation_duration_seconds",
				Help:    "Duration of database operations in seconds",
				Buckets: []float64{0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1.0, 5.0},
			},
			[]string{"operation", "table"},
		),

		// System metrics
		activeSearches: promauto.NewGauge(
			prometheus.GaugeOpts{
				Name: "spontra_active_searches",
				Help: "Number of currently active searches",
			},
		),
		queuedSearches: promauto.NewGauge(
			prometheus.GaugeOpts{
				Name: "spontra_queued_searches",
				Help: "Number of searches waiting in queue",
			},
		),
	}
}

// PrometheusHandler returns a Gin handler for Prometheus metrics
func (m *Metrics) PrometheusHandler() gin.HandlerFunc {
	h := promhttp.Handler()
	return gin.WrapH(h)
}

// MetricsMiddleware returns a Gin middleware for collecting HTTP metrics
func (m *Metrics) MetricsMiddleware(serviceName string) gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		m.httpRequestsInFlight.Inc()

		// Process request
		c.Next()

		// Record metrics
		duration := time.Since(start).Seconds()
		statusCode := string(rune(c.Writer.Status()))
		method := c.Request.Method
		endpoint := c.FullPath()
		responseSize := float64(c.Writer.Size())

		m.httpRequestsTotal.WithLabelValues(method, endpoint, statusCode, serviceName).Inc()
		m.httpRequestDuration.WithLabelValues(method, endpoint, statusCode, serviceName).Observe(duration)
		m.httpResponseSize.WithLabelValues(method, endpoint, statusCode, serviceName).Observe(responseSize)
		m.httpRequestsInFlight.Dec()
	}
}

// Business Metrics Methods

// RecordSearchRequest records a search request metric
func (m *Metrics) RecordSearchRequest(origin, destination, result string, duration time.Duration, resultCount int) {
	m.searchRequests.WithLabelValues(origin, destination, result).Inc()
	m.searchDuration.WithLabelValues(origin, destination).Observe(duration.Seconds())
	m.searchResults.WithLabelValues(origin, destination).Observe(float64(resultCount))
}

// RecordProviderRequest records a provider request metric
func (m *Metrics) RecordProviderRequest(provider, result string, duration time.Duration) {
	m.providerRequests.WithLabelValues(provider, result).Inc()
	m.providerDuration.WithLabelValues(provider).Observe(duration.Seconds())
}

// RecordProviderError records a provider error
func (m *Metrics) RecordProviderError(provider, errorType string) {
	m.providerErrors.WithLabelValues(provider, errorType).Inc()
}

// Cache Metrics Methods

// RecordCacheOperation records cache operation metrics
func (m *Metrics) RecordCacheOperation(operation, result string, duration time.Duration) {
	m.cacheOperations.WithLabelValues(operation, result).Inc()
	m.cacheDuration.WithLabelValues(operation).Observe(duration.Seconds())
}

// SetCacheHitRate sets the cache hit rate for a specific cache type
func (m *Metrics) SetCacheHitRate(cacheType string, hitRate float64) {
	m.cacheHitRate.WithLabelValues(cacheType).Set(hitRate)
}

// Database Metrics Methods

// RecordDatabaseOperation records database operation metrics
func (m *Metrics) RecordDatabaseOperation(operation, table, result string, duration time.Duration) {
	m.dbOperations.WithLabelValues(operation, table, result).Inc()
	m.dbDuration.WithLabelValues(operation, table).Observe(duration.Seconds())
}

// SetActiveConnections sets the number of active database connections
func (m *Metrics) SetActiveConnections(count float64) {
	m.dbConnections.Set(count)
}

// System Metrics Methods

// SetActiveSearches sets the number of currently active searches
func (m *Metrics) SetActiveSearches(count float64) {
	m.activeSearches.Set(count)
}

// SetQueuedSearches sets the number of searches waiting in queue
func (m *Metrics) SetQueuedSearches(count float64) {
	m.queuedSearches.Set(count)
}

// TimedCacheOperation measures cache operation duration
func (m *Metrics) TimedCacheOperation(operation string, fn func() error) error {
	start := time.Now()
	err := fn()
	duration := time.Since(start)
	
	result := "success"
	if err != nil {
		result = "error"
	}
	
	m.RecordCacheOperation(operation, result, duration)
	return err
}

// TimedDatabaseOperation measures database operation duration
func (m *Metrics) TimedDatabaseOperation(operation, table string, fn func() error) error {
	start := time.Now()
	err := fn()
	duration := time.Since(start)
	
	result := "success"
	if err != nil {
		result = "error"
	}
	
	m.RecordDatabaseOperation(operation, table, result, duration)
	return err
}

// TimedProviderOperation measures provider operation duration
func (m *Metrics) TimedProviderOperation(provider string, fn func() error) error {
	start := time.Now()
	err := fn()
	duration := time.Since(start)
	
	result := "success"
	if err != nil {
		result = "error"
	}
	
	m.RecordProviderRequest(provider, result, duration)
	return err
}