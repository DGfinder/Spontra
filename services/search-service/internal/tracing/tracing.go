package tracing

import (
	"context"
	"log"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/exporters/jaeger"
	"go.opentelemetry.io/otel/propagation"
	"go.opentelemetry.io/otel/sdk/resource"
	"go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.17.0"
	oteltrace "go.opentelemetry.io/otel/trace"
)

// TracingConfig holds tracing configuration
type TracingConfig struct {
	ServiceName    string
	ServiceVersion string
	Environment    string
	JaegerEndpoint string
}

// InitTracing initializes OpenTelemetry tracing
func InitTracing(config TracingConfig) (func(), error) {
	// Create Jaeger exporter
	exp, err := jaeger.New(jaeger.WithCollectorEndpoint(jaeger.WithEndpoint(config.JaegerEndpoint)))
	if err != nil {
		return nil, err
	}

	// Create trace provider
	tp := trace.NewTracerProvider(
		trace.WithBatcher(exp),
		trace.WithResource(resource.NewWithAttributes(
			semconv.SchemaURL,
			semconv.ServiceName(config.ServiceName),
			semconv.ServiceVersion(config.ServiceVersion),
			semconv.DeploymentEnvironment(config.Environment),
			attribute.String("service.namespace", "spontra"),
		)),
		trace.WithSampler(trace.AlwaysSample()), // Use AlwaysSample for development
	)

	// Set global providers
	otel.SetTracerProvider(tp)
	otel.SetTextMapPropagator(propagation.NewCompositeTextMapPropagator(
		propagation.TraceContext{},
		propagation.Baggage{},
	))

	log.Printf("Tracing initialized for service: %s", config.ServiceName)

	// Return cleanup function
	return func() {
		if err := tp.Shutdown(context.Background()); err != nil {
			log.Printf("Error shutting down tracer provider: %v", err)
		}
	}, nil
}

// StartSpan starts a new span with the given name and returns it along with a context
func StartSpan(ctx context.Context, spanName string, attributes ...attribute.KeyValue) (context.Context, oteltrace.Span) {
	tracer := otel.Tracer("spontra-search-service")
	spanCtx, span := tracer.Start(ctx, spanName)
	
	// Add default attributes
	span.SetAttributes(
		attribute.String("service.name", "search-service"),
		attribute.String("service.namespace", "spontra"),
	)
	
	// Add custom attributes
	span.SetAttributes(attributes...)
	
	return spanCtx, span
}

// StartSpanFromContext starts a new span from the given context
func StartSpanFromContext(ctx context.Context, spanName string, attributes ...attribute.KeyValue) (context.Context, oteltrace.Span) {
	return StartSpan(ctx, spanName, attributes...)
}

// AddSpanEvent adds an event to the current span
func AddSpanEvent(ctx context.Context, eventName string, attributes ...attribute.KeyValue) {
	span := oteltrace.SpanFromContext(ctx)
	span.AddEvent(eventName, oteltrace.WithAttributes(attributes...))
}

// SetSpanAttributes sets attributes on the current span
func SetSpanAttributes(ctx context.Context, attributes ...attribute.KeyValue) {
	span := oteltrace.SpanFromContext(ctx)
	span.SetAttributes(attributes...)
}

// SetSpanError sets an error on the current span
func SetSpanError(ctx context.Context, err error) {
	span := oteltrace.SpanFromContext(ctx)
	span.RecordError(err)
	span.SetStatus(oteltrace.StatusError, err.Error())
}

// SetSpanSuccess marks the current span as successful
func SetSpanSuccess(ctx context.Context) {
	span := oteltrace.SpanFromContext(ctx)
	span.SetStatus(oteltrace.StatusOK, "")
}

// TraceWrapper wraps a function with tracing
func TraceWrapper(ctx context.Context, spanName string, fn func(context.Context) error, attributes ...attribute.KeyValue) error {
	spanCtx, span := StartSpan(ctx, spanName, attributes...)
	defer span.End()
	
	err := fn(spanCtx)
	if err != nil {
		SetSpanError(spanCtx, err)
	} else {
		SetSpanSuccess(spanCtx)
	}
	
	return err
}

// Middleware attributes for common operations
var (
	// HTTP attributes
	HTTPMethodKey     = attribute.Key("http.method")
	HTTPURLKey        = attribute.Key("http.url")
	HTTPStatusCodeKey = attribute.Key("http.status_code")
	HTTPUserAgentKey  = attribute.Key("http.user_agent")
	
	// Search attributes
	SearchOriginKey      = attribute.Key("search.origin")
	SearchDestinationKey = attribute.Key("search.destination")
	SearchDateKey        = attribute.Key("search.date")
	SearchPassengersKey  = attribute.Key("search.passengers")
	SearchProviderKey    = attribute.Key("search.provider")
	SearchResultsKey     = attribute.Key("search.results_count")
	
	// Database attributes
	DBSystemKey      = attribute.Key("db.system")
	DBNameKey        = attribute.Key("db.name")
	DBOperationKey   = attribute.Key("db.operation")
	DBTableKey       = attribute.Key("db.sql.table")
	
	// Cache attributes
	CacheSystemKey   = attribute.Key("cache.system")
	CacheOperationKey = attribute.Key("cache.operation")
	CacheKeyKey      = attribute.Key("cache.key")
	CacheHitKey      = attribute.Key("cache.hit")
	
	// Business attributes
	UserIDKey        = attribute.Key("user.id")
	SessionIDKey     = attribute.Key("session.id")
	OperationKey     = attribute.Key("operation")
	ResourceKey      = attribute.Key("resource")
)

// Common attribute constructors
func HTTPMethod(method string) attribute.KeyValue {
	return HTTPMethodKey.String(method)
}

func HTTPURL(url string) attribute.KeyValue {
	return HTTPURLKey.String(url)
}

func HTTPStatusCode(code int) attribute.KeyValue {
	return HTTPStatusCodeKey.Int(code)
}

func HTTPUserAgent(userAgent string) attribute.KeyValue {
	return HTTPUserAgentKey.String(userAgent)
}

func SearchOrigin(origin string) attribute.KeyValue {
	return SearchOriginKey.String(origin)
}

func SearchDestination(destination string) attribute.KeyValue {
	return SearchDestinationKey.String(destination)
}

func SearchDate(date string) attribute.KeyValue {
	return SearchDateKey.String(date)
}

func SearchPassengers(passengers int) attribute.KeyValue {
	return SearchPassengersKey.Int(passengers)
}

func SearchProvider(provider string) attribute.KeyValue {
	return SearchProviderKey.String(provider)
}

func SearchResults(count int) attribute.KeyValue {
	return SearchResultsKey.Int(count)
}

func DBSystem(system string) attribute.KeyValue {
	return DBSystemKey.String(system)
}

func DBName(name string) attribute.KeyValue {
	return DBNameKey.String(name)
}

func DBOperation(operation string) attribute.KeyValue {
	return DBOperationKey.String(operation)
}

func DBTable(table string) attribute.KeyValue {
	return DBTableKey.String(table)
}

func CacheSystem(system string) attribute.KeyValue {
	return CacheSystemKey.String(system)
}

func CacheOperation(operation string) attribute.KeyValue {
	return CacheOperationKey.String(operation)
}

func CacheKey(key string) attribute.KeyValue {
	return CacheKeyKey.String(key)
}

func CacheHit(hit bool) attribute.KeyValue {
	return CacheHitKey.Bool(hit)
}

func UserID(userID string) attribute.KeyValue {
	return UserIDKey.String(userID)
}

func SessionID(sessionID string) attribute.KeyValue {
	return SessionIDKey.String(sessionID)
}

func Operation(operation string) attribute.KeyValue {
	return OperationKey.String(operation)
}

func Resource(resource string) attribute.KeyValue {
	return ResourceKey.String(resource)
}