package collector

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"strings"
	"sync"
	"time"

	"github.com/confluentinc/confluent-kafka-go/kafka"
	"github.com/google/uuid"
	"spontra/analytics-service/internal/config"
	"spontra/analytics-service/internal/models"
	"spontra/analytics-service/internal/storage"
)

// EventCollector handles incoming analytics events
type EventCollector struct {
	config      *config.Config
	storage     storage.Storage
	producer    *kafka.Producer
	buffer      []*models.Event
	bufferMutex sync.RWMutex
	stopChan    chan struct{}
	wg          sync.WaitGroup
}

// NewEventCollector creates a new event collector
func NewEventCollector(cfg *config.Config, storage storage.Storage) (*EventCollector, error) {
	// Create Kafka producer
	producer, err := kafka.NewProducer(&kafka.ConfigMap{
		"bootstrap.servers": cfg.KafkaBootstrapServers,
		"client.id":         "analytics-event-collector",
		"acks":              "all",
		"retries":           3,
		"retry.backoff.ms":  100,
		"batch.size":        16384,
		"linger.ms":         10,
		"compression.type":  "snappy",
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create Kafka producer: %w", err)
	}

	collector := &EventCollector{
		config:   cfg,
		storage:  storage,
		producer: producer,
		buffer:   make([]*models.Event, 0, cfg.BatchSize),
		stopChan: make(chan struct{}),
	}

	return collector, nil
}

// Start starts the event collector
func (ec *EventCollector) Start() error {
	log.Println("Starting event collector...")

	// Start batch processing goroutine
	ec.wg.Add(1)
	go ec.batchProcessor()

	// Start delivery report handler
	ec.wg.Add(1)
	go ec.deliveryReportHandler()

	log.Println("Event collector started successfully")
	return nil
}

// Stop stops the event collector
func (ec *EventCollector) Stop() error {
	log.Println("Stopping event collector...")

	close(ec.stopChan)
	ec.wg.Wait()

	// Flush any remaining events
	if err := ec.flush(); err != nil {
		log.Printf("Error flushing events during shutdown: %v", err)
	}

	// Close Kafka producer
	ec.producer.Close()

	log.Println("Event collector stopped")
	return nil
}

// CollectEvent collects a single event
func (ec *EventCollector) CollectEvent(event *models.Event) error {
	// Validate event
	if err := event.Validate(); err != nil {
		return fmt.Errorf("invalid event: %w", err)
	}

	// Set default values
	if event.ID == uuid.Nil {
		event.ID = uuid.New()
	}
	if event.Timestamp.IsZero() {
		event.Timestamp = time.Now().UTC()
	}
	if event.CreatedAt.IsZero() {
		event.CreatedAt = time.Now().UTC()
	}

	// Anonymize PII if enabled
	if ec.config.EnableDataAnonymization {
		ec.anonymizeEvent(event)
	}

	// Add to buffer
	ec.bufferMutex.Lock()
	ec.buffer = append(ec.buffer, event)
	shouldFlush := len(ec.buffer) >= ec.config.BatchSize
	ec.bufferMutex.Unlock()

	// Flush if buffer is full
	if shouldFlush {
		return ec.flush()
	}

	// Send to Kafka for real-time processing if enabled
	if ec.config.EnableRealTimeProcessing {
		return ec.sendToKafka(event)
	}

	return nil
}

// CollectEvents collects multiple events in batch
func (ec *EventCollector) CollectEvents(events []*models.Event) error {
	for _, event := range events {
		if err := ec.CollectEvent(event); err != nil {
			return err
		}
	}
	return nil
}

// batchProcessor processes events in batches
func (ec *EventCollector) batchProcessor() {
	defer ec.wg.Done()

	ticker := time.NewTicker(ec.config.BatchTimeout)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			if err := ec.flush(); err != nil {
				log.Printf("Error flushing events: %v", err)
			}
		case <-ec.stopChan:
			return
		}
	}
}

// flush flushes buffered events to storage
func (ec *EventCollector) flush() error {
	ec.bufferMutex.Lock()
	if len(ec.buffer) == 0 {
		ec.bufferMutex.Unlock()
		return nil
	}

	// Get events to process
	events := make([]*models.Event, len(ec.buffer))
	copy(events, ec.buffer)
	
	// Clear buffer
	ec.buffer = ec.buffer[:0]
	ec.bufferMutex.Unlock()

	// Store events
	if err := ec.storage.StoreEvents(events); err != nil {
		log.Printf("Failed to store %d events: %v", len(events), err)
		return err
	}

	log.Printf("Successfully stored %d events", len(events))
	return nil
}

// sendToKafka sends an event to Kafka for real-time processing
func (ec *EventCollector) sendToKafka(event *models.Event) error {
	eventJSON, err := json.Marshal(event)
	if err != nil {
		return fmt.Errorf("failed to marshal event: %w", err)
	}

	message := &kafka.Message{
		TopicPartition: kafka.TopicPartition{
			Topic:     &ec.config.KafkaEventsTopic,
			Partition: kafka.PartitionAny,
		},
		Key:   []byte(event.SessionID),
		Value: eventJSON,
		Headers: []kafka.Header{
			{Key: "event_type", Value: []byte(event.Type)},
			{Key: "timestamp", Value: []byte(event.Timestamp.Format(time.RFC3339))},
		},
	}

	// Send asynchronously
	return ec.producer.Produce(message, nil)
}

// deliveryReportHandler handles Kafka delivery reports
func (ec *EventCollector) deliveryReportHandler() {
	defer ec.wg.Done()

	for {
		select {
		case e := <-ec.producer.Events():
			switch ev := e.(type) {
			case *kafka.Message:
				if ev.Opaque != nil {
					if ev.TopicPartition.Error != nil {
						log.Printf("Failed to deliver message: %v", ev.TopicPartition.Error)
					}
				}
			case kafka.Error:
				log.Printf("Kafka error: %v", ev)
			}
		case <-ec.stopChan:
			return
		}
	}
}

// anonymizeEvent anonymizes PII fields in an event
func (ec *EventCollector) anonymizeEvent(event *models.Event) {
	// Anonymize context fields
	if contains(ec.config.PiiFields, "ip_address") {
		event.Context.IPAddress = ec.anonymizeIP(event.Context.IPAddress)
	}

	// Anonymize properties
	for _, field := range ec.config.PiiFields {
		if _, exists := event.Properties[field]; exists {
			event.Properties[field] = ec.anonymizeValue(event.Properties[field], field)
		}
	}
}

// anonymizeIP anonymizes an IP address by zeroing the last octet
func (ec *EventCollector) anonymizeIP(ip string) string {
	if ip == "" {
		return ip
	}

	parts := strings.Split(ip, ".")
	if len(parts) == 4 {
		// IPv4: zero the last octet
		parts[3] = "0"
		return strings.Join(parts, ".")
	}

	// For IPv6 or other formats, replace with placeholder
	return "anonymized"
}

// anonymizeValue anonymizes a value based on its field type
func (ec *EventCollector) anonymizeValue(value interface{}, field string) interface{} {
	switch field {
	case "email":
		if email, ok := value.(string); ok {
			return ec.anonymizeEmail(email)
		}
	case "first_name", "last_name":
		if name, ok := value.(string); ok {
			return ec.anonymizeName(name)
		}
	default:
		return "anonymized"
	}
	return value
}

// anonymizeEmail anonymizes an email address
func (ec *EventCollector) anonymizeEmail(email string) string {
	if email == "" {
		return email
	}

	parts := strings.Split(email, "@")
	if len(parts) != 2 {
		return "anonymized@example.com"
	}

	// Keep first character and domain
	local := parts[0]
	if len(local) > 1 {
		local = string(local[0]) + strings.Repeat("*", len(local)-1)
	}

	return local + "@" + parts[1]
}

// anonymizeName anonymizes a name
func (ec *EventCollector) anonymizeName(name string) string {
	if name == "" {
		return name
	}

	if len(name) <= 1 {
		return "*"
	}

	return string(name[0]) + strings.Repeat("*", len(name)-1)
}

// contains checks if a slice contains a string
func contains(slice []string, item string) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}

// EventCollectorStats represents statistics about the event collector
type EventCollectorStats struct {
	BufferSize      int       `json:"buffer_size"`
	EventsCollected int64     `json:"events_collected"`
	EventsStored    int64     `json:"events_stored"`
	EventsFailed    int64     `json:"events_failed"`
	LastFlush       time.Time `json:"last_flush"`
	IsRunning       bool      `json:"is_running"`
}

// GetStats returns collector statistics
func (ec *EventCollector) GetStats() EventCollectorStats {
	ec.bufferMutex.RLock()
	bufferSize := len(ec.buffer)
	ec.bufferMutex.RUnlock()

	return EventCollectorStats{
		BufferSize: bufferSize,
		IsRunning:  true, // TODO: track actual running state
	}
}

// EnrichEvent enriches an event with additional context
func (ec *EventCollector) EnrichEvent(event *models.Event, userAgent, ipAddress string) {
	// Parse user agent for device info
	deviceInfo := ec.parseUserAgent(userAgent)
	event.Context.Device = deviceInfo
	event.Context.UserAgent = userAgent

	// Set IP address if not anonymized
	if !ec.config.EnableDataAnonymization || !contains(ec.config.PiiFields, "ip_address") {
		event.Context.IPAddress = ipAddress
	}

	// TODO: Add geolocation based on IP
	// TODO: Add A/B testing experiment assignments
}

// parseUserAgent parses user agent string to extract device information
func (ec *EventCollector) parseUserAgent(userAgent string) models.DeviceInfo {
	// Simple user agent parsing - in production, use a proper library
	deviceInfo := models.DeviceInfo{
		Type: "desktop",
	}

	ua := strings.ToLower(userAgent)

	// Detect device type
	if strings.Contains(ua, "mobile") || strings.Contains(ua, "android") || strings.Contains(ua, "iphone") {
		deviceInfo.Type = "mobile"
	} else if strings.Contains(ua, "tablet") || strings.Contains(ua, "ipad") {
		deviceInfo.Type = "tablet"
	}

	// Detect OS
	if strings.Contains(ua, "windows") {
		deviceInfo.OS = "Windows"
	} else if strings.Contains(ua, "mac") {
		deviceInfo.OS = "macOS"
	} else if strings.Contains(ua, "linux") {
		deviceInfo.OS = "Linux"
	} else if strings.Contains(ua, "android") {
		deviceInfo.OS = "Android"
	} else if strings.Contains(ua, "ios") || strings.Contains(ua, "iphone") || strings.Contains(ua, "ipad") {
		deviceInfo.OS = "iOS"
	}

	// Detect browser
	if strings.Contains(ua, "chrome") {
		deviceInfo.Browser = "Chrome"
	} else if strings.Contains(ua, "firefox") {
		deviceInfo.Browser = "Firefox"
	} else if strings.Contains(ua, "safari") {
		deviceInfo.Browser = "Safari"
	} else if strings.Contains(ua, "edge") {
		deviceInfo.Browser = "Edge"
	}

	return deviceInfo
}