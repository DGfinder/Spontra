package models

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

// EventType represents different types of analytics events
type EventType string

const (
	// User Events
	EventUserRegistered        EventType = "user_registered"
	EventUserLoggedIn         EventType = "user_logged_in"
	EventUserLoggedOut        EventType = "user_logged_out"
	EventUserProfileUpdated   EventType = "user_profile_updated"
	EventUserPreferencesUpdated EventType = "user_preferences_updated"

	// Search Events
	EventSearchInitiated      EventType = "search_initiated"
	EventSearchCompleted      EventType = "search_completed"
	EventSearchFailed         EventType = "search_failed"
	EventSearchFiltered       EventType = "search_filtered"
	EventSearchSorted         EventType = "search_sorted"
	EventAutocompleteUsed     EventType = "autocomplete_used"

	// Flight Events
	EventFlightViewed         EventType = "flight_viewed"
	EventFlightDetailsOpened  EventType = "flight_details_opened"
	EventFlightCompared       EventType = "flight_compared"
	EventFlightBookmarked     EventType = "flight_bookmarked"
	EventFlightShared         EventType = "flight_shared"

	// Conversion Events
	EventBookingInitiated     EventType = "booking_initiated"
	EventBookingCompleted     EventType = "booking_completed"
	EventBookingAbandoned     EventType = "booking_abandoned"
	EventPaymentInitiated     EventType = "payment_initiated"
	EventPaymentCompleted     EventType = "payment_completed"
	EventPaymentFailed        EventType = "payment_failed"

	// Engagement Events
	EventPageViewed           EventType = "page_viewed"
	EventButtonClicked        EventType = "button_clicked"
	EventFormSubmitted        EventType = "form_submitted"
	EventEmailOpened          EventType = "email_opened"
	EventEmailClicked         EventType = "email_clicked"
	EventNotificationSent     EventType = "notification_sent"
	EventNotificationOpened   EventType = "notification_opened"

	// Business Events
	EventSubscriptionCreated  EventType = "subscription_created"
	EventSubscriptionCanceled EventType = "subscription_canceled"
	EventSupportTicketCreated EventType = "support_ticket_created"
	EventFeedbackSubmitted    EventType = "feedback_submitted"
)

// Event represents a single analytics event
type Event struct {
	ID          uuid.UUID              `json:"id" db:"id"`
	Type        EventType              `json:"type" db:"type"`
	UserID      *uuid.UUID             `json:"user_id,omitempty" db:"user_id"`
	SessionID   string                 `json:"session_id" db:"session_id"`
	Timestamp   time.Time              `json:"timestamp" db:"timestamp"`
	Properties  map[string]interface{} `json:"properties" db:"properties"`
	Context     EventContext           `json:"context" db:"context"`
	Source      string                 `json:"source" db:"source"`
	Version     string                 `json:"version" db:"version"`
	CreatedAt   time.Time              `json:"created_at" db:"created_at"`
}

// EventContext contains contextual information about the event
type EventContext struct {
	UserAgent    string            `json:"user_agent"`
	IPAddress    string            `json:"ip_address"`
	Country      string            `json:"country,omitempty"`
	City         string            `json:"city,omitempty"`
	Device       DeviceInfo        `json:"device"`
	Page         PageInfo          `json:"page"`
	Referrer     string            `json:"referrer,omitempty"`
	UTMSource    string            `json:"utm_source,omitempty"`
	UTMCampaign  string            `json:"utm_campaign,omitempty"`
	UTMMedium    string            `json:"utm_medium,omitempty"`
	UTMTerm      string            `json:"utm_term,omitempty"`
	UTMContent   string            `json:"utm_content,omitempty"`
	Experiments  map[string]string `json:"experiments,omitempty"`
}

// DeviceInfo contains device-specific information
type DeviceInfo struct {
	Type        string `json:"type"`         // desktop, mobile, tablet
	OS          string `json:"os"`           // Windows, macOS, iOS, Android
	OSVersion   string `json:"os_version"`
	Browser     string `json:"browser"`      // Chrome, Firefox, Safari
	BrowserVersion string `json:"browser_version"`
	ScreenWidth int    `json:"screen_width"`
	ScreenHeight int   `json:"screen_height"`
	Language    string `json:"language"`
	Timezone    string `json:"timezone"`
}

// PageInfo contains page-specific information
type PageInfo struct {
	URL       string `json:"url"`
	Path      string `json:"path"`
	Title     string `json:"title"`
	Category  string `json:"category,omitempty"`
	Tags      []string `json:"tags,omitempty"`
}

// SearchEventProperties contains properties specific to search events
type SearchEventProperties struct {
	Query          string                 `json:"query"`
	Origin         string                 `json:"origin"`
	Destination    string                 `json:"destination"`
	DepartureDate  string                 `json:"departure_date"`
	ReturnDate     string                 `json:"return_date,omitempty"`
	Passengers     int                    `json:"passengers"`
	CabinClass     string                 `json:"cabin_class"`
	Filters        map[string]interface{} `json:"filters,omitempty"`
	SortBy         string                 `json:"sort_by,omitempty"`
	ResultsCount   int                    `json:"results_count,omitempty"`
	ResponseTime   int                    `json:"response_time_ms,omitempty"`
	ErrorMessage   string                 `json:"error_message,omitempty"`
}

// FlightEventProperties contains properties specific to flight events
type FlightEventProperties struct {
	FlightID      string  `json:"flight_id"`
	Airline       string  `json:"airline"`
	FlightNumber  string  `json:"flight_number"`
	Origin        string  `json:"origin"`
	Destination   string  `json:"destination"`
	DepartureTime string  `json:"departure_time"`
	ArrivalTime   string  `json:"arrival_time"`
	Price         float64 `json:"price"`
	Currency      string  `json:"currency"`
	CabinClass    string  `json:"cabin_class"`
	Duration      int     `json:"duration_minutes"`
	Stops         int     `json:"stops"`
	Position      int     `json:"position,omitempty"` // Position in search results
}

// BookingEventProperties contains properties specific to booking events
type BookingEventProperties struct {
	BookingID     string                 `json:"booking_id,omitempty"`
	FlightID      string                 `json:"flight_id"`
	TotalPrice    float64                `json:"total_price"`
	Currency      string                 `json:"currency"`
	Passengers    int                    `json:"passengers"`
	PaymentMethod string                 `json:"payment_method,omitempty"`
	PromoCode     string                 `json:"promo_code,omitempty"`
	Discount      float64                `json:"discount,omitempty"`
	Taxes         float64                `json:"taxes,omitempty"`
	Stage         string                 `json:"stage,omitempty"` // selection, details, payment, confirmation
	ErrorMessage  string                 `json:"error_message,omitempty"`
	Metadata      map[string]interface{} `json:"metadata,omitempty"`
}

// UserEventProperties contains properties specific to user events
type UserEventProperties struct {
	Email         string            `json:"email,omitempty"`
	FirstName     string            `json:"first_name,omitempty"`
	LastName      string            `json:"last_name,omitempty"`
	Country       string            `json:"country,omitempty"`
	SignupMethod  string            `json:"signup_method,omitempty"` // email, google, facebook
	Referrer      string            `json:"referrer,omitempty"`
	UTMSource     string            `json:"utm_source,omitempty"`
	Preferences   map[string]interface{} `json:"preferences,omitempty"`
	IsFirstLogin  bool              `json:"is_first_login,omitempty"`
}

// PageEventProperties contains properties specific to page view events
type PageEventProperties struct {
	Category      string `json:"category,omitempty"`
	LoadTime      int    `json:"load_time_ms,omitempty"`
	PreviousPage  string `json:"previous_page,omitempty"`
	TimeOnPage    int    `json:"time_on_page_ms,omitempty"`
	ScrollDepth   int    `json:"scroll_depth_percent,omitempty"`
	ExitPage      bool   `json:"exit_page,omitempty"`
}

// Funnel represents a conversion funnel
type Funnel struct {
	ID          uuid.UUID    `json:"id" db:"id"`
	Name        string       `json:"name" db:"name"`
	Description string       `json:"description" db:"description"`
	Steps       []FunnelStep `json:"steps" db:"steps"`
	IsActive    bool         `json:"is_active" db:"is_active"`
	CreatedAt   time.Time    `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time    `json:"updated_at" db:"updated_at"`
}

// FunnelStep represents a single step in a conversion funnel
type FunnelStep struct {
	Order       int               `json:"order"`
	Name        string            `json:"name"`
	EventType   EventType         `json:"event_type"`
	Conditions  map[string]interface{} `json:"conditions,omitempty"`
	IsOptional  bool              `json:"is_optional"`
}

// UserJourney tracks a user's journey through the application
type UserJourney struct {
	ID           uuid.UUID `json:"id" db:"id"`
	UserID       *uuid.UUID `json:"user_id,omitempty" db:"user_id"`
	SessionID    string    `json:"session_id" db:"session_id"`
	StartTime    time.Time `json:"start_time" db:"start_time"`
	EndTime      *time.Time `json:"end_time,omitempty" db:"end_time"`
	Duration     *int      `json:"duration_seconds,omitempty" db:"duration_seconds"`
	EventCount   int       `json:"event_count" db:"event_count"`
	Converted    bool      `json:"converted" db:"converted"`
	ConversionType string  `json:"conversion_type,omitempty" db:"conversion_type"`
	TotalValue   *float64  `json:"total_value,omitempty" db:"total_value"`
	FirstPage    string    `json:"first_page" db:"first_page"`
	LastPage     string    `json:"last_page" db:"last_page"`
	Referrer     string    `json:"referrer,omitempty" db:"referrer"`
	UTMSource    string    `json:"utm_source,omitempty" db:"utm_source"`
	UTMCampaign  string    `json:"utm_campaign,omitempty" db:"utm_campaign"`
	Device       DeviceInfo `json:"device" db:"device"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time `json:"updated_at" db:"updated_at"`
}

// Cohort represents a group of users for cohort analysis
type Cohort struct {
	ID          uuid.UUID              `json:"id" db:"id"`
	Name        string                 `json:"name" db:"name"`
	Description string                 `json:"description" db:"description"`
	Period      string                 `json:"period" db:"period"` // daily, weekly, monthly
	StartDate   time.Time              `json:"start_date" db:"start_date"`
	EndDate     *time.Time             `json:"end_date,omitempty" db:"end_date"`
	Criteria    map[string]interface{} `json:"criteria" db:"criteria"`
	UserCount   int                    `json:"user_count" db:"user_count"`
	IsActive    bool                   `json:"is_active" db:"is_active"`
	CreatedAt   time.Time              `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time              `json:"updated_at" db:"updated_at"`
}

// Metric represents a calculated metric
type Metric struct {
	ID          uuid.UUID              `json:"id" db:"id"`
	Name        string                 `json:"name" db:"name"`
	Type        string                 `json:"type" db:"type"` // count, sum, avg, unique
	EventType   EventType              `json:"event_type" db:"event_type"`
	Filters     map[string]interface{} `json:"filters,omitempty" db:"filters"`
	Grouping    []string               `json:"grouping,omitempty" db:"grouping"`
	Period      string                 `json:"period" db:"period"` // hour, day, week, month
	Value       float64                `json:"value" db:"value"`
	Timestamp   time.Time              `json:"timestamp" db:"timestamp"`
	CreatedAt   time.Time              `json:"created_at" db:"created_at"`
}

// Helper methods

// NewEvent creates a new event with default values
func NewEvent(eventType EventType, userID *uuid.UUID, sessionID string) *Event {
	return &Event{
		ID:        uuid.New(),
		Type:      eventType,
		UserID:    userID,
		SessionID: sessionID,
		Timestamp: time.Now().UTC(),
		Properties: make(map[string]interface{}),
		Source:    "spontra-web",
		Version:   "1.0.0",
		CreatedAt: time.Now().UTC(),
	}
}

// SetProperty sets a property on the event
func (e *Event) SetProperty(key string, value interface{}) {
	if e.Properties == nil {
		e.Properties = make(map[string]interface{})
	}
	e.Properties[key] = value
}

// GetProperty gets a property from the event
func (e *Event) GetProperty(key string) (interface{}, bool) {
	if e.Properties == nil {
		return nil, false
	}
	value, exists := e.Properties[key]
	return value, exists
}

// IsConversionEvent checks if the event is a conversion event
func (e *Event) IsConversionEvent() bool {
	conversionEvents := []EventType{
		EventBookingCompleted,
		EventPaymentCompleted,
		EventSubscriptionCreated,
		EventUserRegistered,
	}
	
	for _, eventType := range conversionEvents {
		if e.Type == eventType {
			return true
		}
	}
	return false
}

// GetRevenue extracts revenue value from the event properties
func (e *Event) GetRevenue() float64 {
	if value, exists := e.GetProperty("total_price"); exists {
		if revenue, ok := value.(float64); ok {
			return revenue
		}
	}
	if value, exists := e.GetProperty("value"); exists {
		if revenue, ok := value.(float64); ok {
			return revenue
		}
	}
	return 0.0
}

// ToJSON converts the event to JSON
func (e *Event) ToJSON() ([]byte, error) {
	return json.Marshal(e)
}

// FromJSON creates an event from JSON
func (e *Event) FromJSON(data []byte) error {
	return json.Unmarshal(data, e)
}

// Validate validates the event
func (e *Event) Validate() error {
	if e.Type == "" {
		return fmt.Errorf("event type is required")
	}
	if e.SessionID == "" {
		return fmt.Errorf("session ID is required")
	}
	if e.Timestamp.IsZero() {
		return fmt.Errorf("timestamp is required")
	}
	return nil
}