package metrics

import (
	"time"

	"github.com/gin-gonic/gin"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

// Metrics contains all Prometheus metrics for the user service
type Metrics struct {
	// HTTP metrics
	httpRequestsTotal        *prometheus.CounterVec
	httpRequestDuration      *prometheus.HistogramVec
	httpRequestsInFlight     prometheus.Gauge
	httpResponseSize         *prometheus.HistogramVec

	// Business metrics
	userRegistrations        prometheus.Counter
	userLogins               prometheus.Counter
	userLoginFailures        prometheus.Counter
	authTokensGenerated      prometheus.Counter
	authTokenValidations     *prometheus.CounterVec
	passwordResets           prometheus.Counter
	emailVerifications       prometheus.Counter

	// Cache metrics
	cacheOperations          *prometheus.CounterVec
	cacheHitRate             *prometheus.GaugeVec
	cacheDuration            *prometheus.HistogramVec

	// Database metrics
	dbConnections            prometheus.Gauge
	dbOperations             *prometheus.CounterVec
	dbDuration               *prometheus.HistogramVec

	// System metrics
	activeUsers              prometheus.Gauge
	userSessions             prometheus.Gauge
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
		userRegistrations: promauto.NewCounter(
			prometheus.CounterOpts{
				Name: "spontra_user_registrations_total",
				Help: "Total number of user registrations",
			},
		),
		userLogins: promauto.NewCounter(
			prometheus.CounterOpts{
				Name: "spontra_user_logins_total",
				Help: "Total number of successful user logins",
			},
		),
		userLoginFailures: promauto.NewCounter(
			prometheus.CounterOpts{
				Name: "spontra_user_login_failures_total",
				Help: "Total number of failed login attempts",
			},
		),
		authTokensGenerated: promauto.NewCounter(
			prometheus.CounterOpts{
				Name: "spontra_auth_tokens_generated_total",
				Help: "Total number of authentication tokens generated",
			},
		),
		authTokenValidations: promauto.NewCounterVec(
			prometheus.CounterOpts{
				Name: "spontra_auth_token_validations_total",
				Help: "Total number of authentication token validations",
			},
			[]string{"result"}, // valid, invalid, expired
		),
		passwordResets: promauto.NewCounter(
			prometheus.CounterOpts{
				Name: "spontra_password_resets_total",
				Help: "Total number of password reset requests",
			},
		),
		emailVerifications: promauto.NewCounter(
			prometheus.CounterOpts{
				Name: "spontra_email_verifications_total",
				Help: "Total number of email verification attempts",
			},
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
			[]string{"operation", "table", "result"}, // select, insert, update, delete | users, sessions, etc. | success, error
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
		activeUsers: promauto.NewGauge(
			prometheus.GaugeOpts{
				Name: "spontra_active_users",
				Help: "Number of currently active users",
			},
		),
		userSessions: promauto.NewGauge(
			prometheus.GaugeOpts{
				Name: "spontra_user_sessions_active",
				Help: "Number of active user sessions",
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

// RecordUserRegistration increments user registration counter
func (m *Metrics) RecordUserRegistration() {
	m.userRegistrations.Inc()
}

// RecordUserLogin increments successful login counter
func (m *Metrics) RecordUserLogin() {
	m.userLogins.Inc()
}

// RecordUserLoginFailure increments failed login counter
func (m *Metrics) RecordUserLoginFailure() {
	m.userLoginFailures.Inc()
}

// RecordAuthTokenGenerated increments auth token generation counter
func (m *Metrics) RecordAuthTokenGenerated() {
	m.authTokensGenerated.Inc()
}

// RecordAuthTokenValidation records auth token validation result
func (m *Metrics) RecordAuthTokenValidation(result string) {
	m.authTokenValidations.WithLabelValues(result).Inc()
}

// RecordPasswordReset increments password reset counter
func (m *Metrics) RecordPasswordReset() {
	m.passwordResets.Inc()
}

// RecordEmailVerification increments email verification counter
func (m *Metrics) RecordEmailVerification() {
	m.emailVerifications.Inc()
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

// SetActiveUsers sets the number of currently active users
func (m *Metrics) SetActiveUsers(count float64) {
	m.activeUsers.Set(count)
}

// SetUserSessions sets the number of active user sessions
func (m *Metrics) SetUserSessions(count float64) {
	m.userSessions.Set(count)
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

// GetBusinessMetrics returns current business metrics values
func (m *Metrics) GetBusinessMetrics() map[string]interface{} {
	return map[string]interface{}{
		"user_registrations":      m.userRegistrations,
		"user_logins":            m.userLogins,
		"user_login_failures":    m.userLoginFailures,
		"auth_tokens_generated":  m.authTokensGenerated,
		"password_resets":        m.passwordResets,
		"email_verifications":    m.emailVerifications,
		"active_users":           m.activeUsers,
		"user_sessions":          m.userSessions,
	}
}