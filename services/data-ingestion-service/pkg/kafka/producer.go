package kafka

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/segmentio/kafka-go"
	"github.com/google/uuid"
)

// Producer represents a Kafka producer
type Producer struct {
	writers map[string]*kafka.Writer
	config  ProducerConfig
}

// ProducerConfig represents Kafka producer configuration
type ProducerConfig struct {
	Brokers       []string
	Topics        map[string]string
	BatchSize     int
	BatchTimeout  time.Duration
	RetryAttempts int
	RetryDelay    time.Duration
}

// Message represents a Kafka message
type Message struct {
	Topic     string
	Key       string
	Value     interface{}
	Headers   map[string]string
	Timestamp time.Time
}

// NewProducer creates a new Kafka producer
func NewProducer(config ProducerConfig) (*Producer, error) {
	writers := make(map[string]*kafka.Writer)

	for name, topic := range config.Topics {
		writer := &kafka.Writer{
			Addr:         kafka.TCP(config.Brokers...),
			Topic:        topic,
			Balancer:     &kafka.LeastBytes{},
			BatchSize:    config.BatchSize,
			BatchTimeout: config.BatchTimeout,
			RequiredAcks: kafka.RequireOne,
			Async:        false,
		}
		writers[name] = writer
	}

	return &Producer{
		writers: writers,
		config:  config,
	}, nil
}

// PublishMessage publishes a message to a Kafka topic
func (p *Producer) PublishMessage(ctx context.Context, message Message) error {
	writer, exists := p.writers[message.Topic]
	if !exists {
		return fmt.Errorf("topic %s not configured", message.Topic)
	}

	// Convert value to JSON
	valueBytes, err := json.Marshal(message.Value)
	if err != nil {
		return fmt.Errorf("failed to marshal message value: %w", err)
	}

	// Create Kafka message
	kafkaMessage := kafka.Message{
		Key:   []byte(message.Key),
		Value: valueBytes,
		Time:  message.Timestamp,
	}

	// Add headers
	for key, value := range message.Headers {
		kafkaMessage.Headers = append(kafkaMessage.Headers, kafka.Header{
			Key:   key,
			Value: []byte(value),
		})
	}

	// Add trace headers
	kafkaMessage.Headers = append(kafkaMessage.Headers, kafka.Header{
		Key:   "message_id",
		Value: []byte(uuid.New().String()),
	})

	kafkaMessage.Headers = append(kafkaMessage.Headers, kafka.Header{
		Key:   "produced_at",
		Value: []byte(time.Now().Format(time.RFC3339)),
	})

	// Publish with retry logic
	var lastErr error
	for attempt := 0; attempt <= p.config.RetryAttempts; attempt++ {
		if attempt > 0 {
			select {
			case <-ctx.Done():
				return ctx.Err()
			case <-time.After(p.config.RetryDelay * time.Duration(attempt)):
			}
		}

		err := writer.WriteMessages(ctx, kafkaMessage)
		if err == nil {
			return nil
		}

		lastErr = err
		log.Printf("Failed to publish message (attempt %d/%d): %v", attempt+1, p.config.RetryAttempts+1, err)
	}

	return fmt.Errorf("failed to publish message after %d attempts: %w", p.config.RetryAttempts+1, lastErr)
}

// PublishBatch publishes multiple messages in a batch
func (p *Producer) PublishBatch(ctx context.Context, messages []Message) error {
	// Group messages by topic
	messagesByTopic := make(map[string][]kafka.Message)

	for _, msg := range messages {
		valueBytes, err := json.Marshal(msg.Value)
		if err != nil {
			return fmt.Errorf("failed to marshal message value: %w", err)
		}

		kafkaMessage := kafka.Message{
			Key:   []byte(msg.Key),
			Value: valueBytes,
			Time:  msg.Timestamp,
		}

		// Add headers
		for key, value := range msg.Headers {
			kafkaMessage.Headers = append(kafkaMessage.Headers, kafka.Header{
				Key:   key,
				Value: []byte(value),
			})
		}

		// Add trace headers
		kafkaMessage.Headers = append(kafkaMessage.Headers, kafka.Header{
			Key:   "message_id",
			Value: []byte(uuid.New().String()),
		})

		kafkaMessage.Headers = append(kafkaMessage.Headers, kafka.Header{
			Key:   "produced_at",
			Value: []byte(time.Now().Format(time.RFC3339)),
		})

		messagesByTopic[msg.Topic] = append(messagesByTopic[msg.Topic], kafkaMessage)
	}

	// Publish messages for each topic
	for topic, topicMessages := range messagesByTopic {
		writer, exists := p.writers[topic]
		if !exists {
			return fmt.Errorf("topic %s not configured", topic)
		}

		var lastErr error
		for attempt := 0; attempt <= p.config.RetryAttempts; attempt++ {
			if attempt > 0 {
				select {
				case <-ctx.Done():
					return ctx.Err()
				case <-time.After(p.config.RetryDelay * time.Duration(attempt)):
				}
			}

			err := writer.WriteMessages(ctx, topicMessages...)
			if err == nil {
				break
			}

			lastErr = err
			log.Printf("Failed to publish batch to topic %s (attempt %d/%d): %v", topic, attempt+1, p.config.RetryAttempts+1, err)
		}

		if lastErr != nil {
			return fmt.Errorf("failed to publish batch to topic %s after %d attempts: %w", topic, p.config.RetryAttempts+1, lastErr)
		}
	}

	return nil
}

// PublishFlightSearchRequest publishes a flight search request
func (p *Producer) PublishFlightSearchRequest(ctx context.Context, request interface{}) error {
	return p.PublishMessage(ctx, Message{
		Topic:     "flight_search_requests",
		Key:       generateMessageKey("search_request", ""),
		Value:     request,
		Timestamp: time.Now(),
		Headers: map[string]string{
			"event_type": "flight_search_request",
			"version":    "1.0",
		},
	})
}

// PublishFlightSearchResponse publishes a flight search response
func (p *Producer) PublishFlightSearchResponse(ctx context.Context, response interface{}) error {
	return p.PublishMessage(ctx, Message{
		Topic:     "flight_search_responses",
		Key:       generateMessageKey("search_response", ""),
		Value:     response,
		Timestamp: time.Now(),
		Headers: map[string]string{
			"event_type": "flight_search_response",
			"version":    "1.0",
		},
	})
}

// PublishFlightOffers publishes flight offers
func (p *Producer) PublishFlightOffers(ctx context.Context, offers interface{}) error {
	return p.PublishMessage(ctx, Message{
		Topic:     "flight_offers",
		Key:       generateMessageKey("flight_offers", ""),
		Value:     offers,
		Timestamp: time.Now(),
		Headers: map[string]string{
			"event_type": "flight_offers",
			"version":    "1.0",
		},
	})
}

// PublishPriceUpdate publishes a price update
func (p *Producer) PublishPriceUpdate(ctx context.Context, update interface{}) error {
	return p.PublishMessage(ctx, Message{
		Topic:     "price_updates",
		Key:       generateMessageKey("price_update", ""),
		Value:     update,
		Timestamp: time.Now(),
		Headers: map[string]string{
			"event_type": "price_update",
			"version":    "1.0",
		},
	})
}

// PublishFlightUpdate publishes a flight update
func (p *Producer) PublishFlightUpdate(ctx context.Context, update interface{}) error {
	return p.PublishMessage(ctx, Message{
		Topic:     "flight_updates",
		Key:       generateMessageKey("flight_update", ""),
		Value:     update,
		Timestamp: time.Now(),
		Headers: map[string]string{
			"event_type": "flight_update",
			"version":    "1.0",
		},
	})
}

// PublishErrorEvent publishes an error event
func (p *Producer) PublishErrorEvent(ctx context.Context, errorEvent interface{}) error {
	return p.PublishMessage(ctx, Message{
		Topic:     "error_events",
		Key:       generateMessageKey("error_event", ""),
		Value:     errorEvent,
		Timestamp: time.Now(),
		Headers: map[string]string{
			"event_type": "error_event",
			"version":    "1.0",
		},
	})
}

// Close closes all Kafka writers
func (p *Producer) Close() error {
	var errs []error
	for _, writer := range p.writers {
		if err := writer.Close(); err != nil {
			errs = append(errs, err)
		}
	}

	if len(errs) > 0 {
		return fmt.Errorf("failed to close some writers: %v", errs)
	}

	return nil
}

// GetStats returns statistics for all writers
func (p *Producer) GetStats() map[string]kafka.WriterStats {
	stats := make(map[string]kafka.WriterStats)
	for name, writer := range p.writers {
		stats[name] = writer.Stats()
	}
	return stats
}

// generateMessageKey generates a message key for partitioning
func generateMessageKey(prefix, suffix string) string {
	key := prefix
	if suffix != "" {
		key += "_" + suffix
	}
	return key + "_" + uuid.New().String()[:8]
}

// MessageHandler represents a message handler function
type MessageHandler func(ctx context.Context, message kafka.Message) error

// Consumer represents a Kafka consumer
type Consumer struct {
	readers map[string]*kafka.Reader
	config  ConsumerConfig
}

// ConsumerConfig represents Kafka consumer configuration
type ConsumerConfig struct {
	Brokers       []string
	GroupID       string
	Topics        map[string]string
	RetryAttempts int
	RetryDelay    time.Duration
}

// NewConsumer creates a new Kafka consumer
func NewConsumer(config ConsumerConfig) (*Consumer, error) {
	readers := make(map[string]*kafka.Reader)

	for name, topic := range config.Topics {
		reader := kafka.NewReader(kafka.ReaderConfig{
			Brokers:     config.Brokers,
			GroupID:     config.GroupID,
			Topic:       topic,
			MinBytes:    10e3, // 10KB
			MaxBytes:    10e6, // 10MB
			MaxWait:     1 * time.Second,
			ReadTimeout: 10 * time.Second,
		})
		readers[name] = reader
	}

	return &Consumer{
		readers: readers,
		config:  config,
	}, nil
}

// Consume consumes messages from a topic
func (c *Consumer) Consume(ctx context.Context, topicName string, handler MessageHandler) error {
	reader, exists := c.readers[topicName]
	if !exists {
		return fmt.Errorf("topic %s not configured", topicName)
	}

	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		default:
			message, err := reader.ReadMessage(ctx)
			if err != nil {
				log.Printf("Failed to read message from topic %s: %v", topicName, err)
				continue
			}

			// Process message with retry logic
			var lastErr error
			for attempt := 0; attempt <= c.config.RetryAttempts; attempt++ {
				if attempt > 0 {
					select {
					case <-ctx.Done():
						return ctx.Err()
					case <-time.After(c.config.RetryDelay * time.Duration(attempt)):
					}
				}

				err := handler(ctx, message)
				if err == nil {
					break
				}

				lastErr = err
				log.Printf("Failed to process message (attempt %d/%d): %v", attempt+1, c.config.RetryAttempts+1, err)
			}

			if lastErr != nil {
				log.Printf("Failed to process message after %d attempts, skipping: %v", c.config.RetryAttempts+1, lastErr)
				// In a production system, you might want to send this to a dead letter queue
			}
		}
	}
}

// Close closes all Kafka readers
func (c *Consumer) Close() error {
	var errs []error
	for _, reader := range c.readers {
		if err := reader.Close(); err != nil {
			errs = append(errs, err)
		}
	}

	if len(errs) > 0 {
		return fmt.Errorf("failed to close some readers: %v", errs)
	}

	return nil
}

// GetStats returns statistics for all readers
func (c *Consumer) GetStats() map[string]kafka.ReaderStats {
	stats := make(map[string]kafka.ReaderStats)
	for name, reader := range c.readers {
		stats[name] = reader.Stats()
	}
	return stats
}