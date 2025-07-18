package models

import (
	"time"

	"github.com/google/uuid"
	"github.com/shopspring/decimal"
)

// FlightSearchRequest represents a flight search request
type FlightSearchRequest struct {
	ID              string    `json:"id"`
	OriginCode      string    `json:"origin_code" validate:"required,len=3"`
	DestinationCode string    `json:"destination_code" validate:"required,len=3"`
	DepartureDate   time.Time `json:"departure_date" validate:"required"`
	ReturnDate      *time.Time `json:"return_date,omitempty"`
	Adults          int       `json:"adults" validate:"required,min=1,max=9"`
	Children        int       `json:"children" validate:"min=0,max=9"`
	Infants         int       `json:"infants" validate:"min=0,max=9"`
	CabinClass      string    `json:"cabin_class" validate:"oneof=ECONOMY PREMIUM_ECONOMY BUSINESS FIRST"`
	Currency        string    `json:"currency" validate:"required,len=3"`
	MaxResults      int       `json:"max_results" validate:"min=1,max=250"`
	CreatedAt       time.Time `json:"created_at"`
}

// FlightSearchResponse represents the response from a flight search
type FlightSearchResponse struct {
	ID               string         `json:"id"`
	SearchRequestID  string         `json:"search_request_id"`
	Provider         string         `json:"provider"`
	FlightOffers     []FlightOffer  `json:"flight_offers"`
	TotalResults     int            `json:"total_results"`
	Currency         string         `json:"currency"`
	SearchedAt       time.Time      `json:"searched_at"`
	ExpiresAt        time.Time      `json:"expires_at"`
	ProcessingTimeMs int            `json:"processing_time_ms"`
	Errors           []SearchError  `json:"errors,omitempty"`
}

// FlightOffer represents a complete flight offer
type FlightOffer struct {
	ID                  string             `json:"id"`
	Type                string             `json:"type"`
	Source              string             `json:"source"`
	InstantTicketingRequired bool          `json:"instant_ticketing_required"`
	NonHomogeneous      bool               `json:"non_homogeneous"`
	OneWay              bool               `json:"one_way"`
	PaymentCardRequired bool               `json:"payment_card_required"`
	LastTicketingDate   *time.Time         `json:"last_ticketing_date,omitempty"`
	LastTicketingDateTime *time.Time       `json:"last_ticketing_datetime,omitempty"`
	NumberOfBookableSeats int              `json:"number_of_bookable_seats"`
	Itineraries         []Itinerary        `json:"itineraries"`
	Price               Price              `json:"price"`
	PricingOptions      PricingOptions     `json:"pricing_options"`
	ValidatingAirlineCodes []string        `json:"validating_airline_codes"`
	TravelerPricings    []TravelerPricing  `json:"traveler_pricings"`
	BookingUrl          string             `json:"booking_url,omitempty"`
	DeepLink            string             `json:"deep_link,omitempty"`
	CreatedAt           time.Time          `json:"created_at"`
	UpdatedAt           time.Time          `json:"updated_at"`
}

// Itinerary represents a flight itinerary (outbound or return)
type Itinerary struct {
	Duration string     `json:"duration"`
	Segments []Segment  `json:"segments"`
}

// Segment represents a flight segment
type Segment struct {
	ID                string              `json:"id"`
	Departure         FlightEndpoint      `json:"departure"`
	Arrival           FlightEndpoint      `json:"arrival"`
	CarrierCode       string              `json:"carrier_code"`
	Number            string              `json:"number"`
	Aircraft          Aircraft            `json:"aircraft"`
	Operating         *OperatingFlight    `json:"operating,omitempty"`
	Duration          string              `json:"duration"`
	Stops             []Stop              `json:"stops,omitempty"`
	Co2Emissions      []Co2Emission       `json:"co2_emissions,omitempty"`
	PricingDetailPerAdult *PricingDetail  `json:"pricing_detail_per_adult,omitempty"`
}

// FlightEndpoint represents departure or arrival information
type FlightEndpoint struct {
	IataCode string     `json:"iata_code"`
	Terminal string     `json:"terminal,omitempty"`
	At       time.Time  `json:"at"`
	Airport  Airport    `json:"airport"`
}

// Airport represents airport information
type Airport struct {
	IataCode    string  `json:"iata_code"`
	IcaoCode    string  `json:"icao_code,omitempty"`
	Name        string  `json:"name"`
	City        string  `json:"city"`
	Country     string  `json:"country"`
	CountryCode string  `json:"country_code"`
	Timezone    string  `json:"timezone"`
	Latitude    float64 `json:"latitude,omitempty"`
	Longitude   float64 `json:"longitude,omitempty"`
}

// Aircraft represents aircraft information
type Aircraft struct {
	Code string `json:"code"`
	Name string `json:"name,omitempty"`
}

// OperatingFlight represents operating flight information
type OperatingFlight struct {
	CarrierCode string `json:"carrier_code"`
	Number      string `json:"number"`
}

// Stop represents a stop during a flight
type Stop struct {
	IataCode     string        `json:"iata_code"`
	Duration     string        `json:"duration"`
	ArrivalAt    time.Time     `json:"arrival_at"`
	DepartureAt  time.Time     `json:"departure_at"`
	Airport      Airport       `json:"airport"`
}

// Co2Emission represents CO2 emission data
type Co2Emission struct {
	Weight     int    `json:"weight"`
	WeightUnit string `json:"weight_unit"`
	Cabin      string `json:"cabin"`
}

// Price represents pricing information
type Price struct {
	Currency         string          `json:"currency"`
	Total            decimal.Decimal `json:"total"`
	Base             decimal.Decimal `json:"base"`
	Taxes            []Tax           `json:"taxes"`
	Fees             []Fee           `json:"fees,omitempty"`
	GrandTotal       decimal.Decimal `json:"grand_total"`
	AdditionalServices []AdditionalService `json:"additional_services,omitempty"`
}

// Tax represents tax information
type Tax struct {
	Amount decimal.Decimal `json:"amount"`
	Code   string          `json:"code"`
	Name   string          `json:"name,omitempty"`
}

// Fee represents fee information
type Fee struct {
	Amount decimal.Decimal `json:"amount"`
	Type   string          `json:"type"`
	Name   string          `json:"name,omitempty"`
}

// AdditionalService represents additional service pricing
type AdditionalService struct {
	Amount decimal.Decimal `json:"amount"`
	Type   string          `json:"type"`
	Name   string          `json:"name"`
}

// PricingOptions represents pricing options
type PricingOptions struct {
	FareType                []string `json:"fare_type"`
	IncludedCheckedBagsOnly bool     `json:"included_checked_bags_only"`
}

// TravelerPricing represents pricing per traveler
type TravelerPricing struct {
	TravelerID            string         `json:"traveler_id"`
	FareOption            string         `json:"fare_option"`
	TravelerType          string         `json:"traveler_type"`
	Price                 Price          `json:"price"`
	FareDetailsBySegment  []FareDetails  `json:"fare_details_by_segment"`
}

// FareDetails represents fare details per segment
type FareDetails struct {
	SegmentID     string `json:"segment_id"`
	Cabin         string `json:"cabin"`
	FareBasis     string `json:"fare_basis"`
	BookingClass  string `json:"booking_class"`
	BrandedFare   string `json:"branded_fare,omitempty"`
	Class         string `json:"class"`
	IncludedCheckedBags *CheckedBags `json:"included_checked_bags,omitempty"`
}

// CheckedBags represents checked baggage allowance
type CheckedBags struct {
	Quantity int `json:"quantity"`
	Weight   int `json:"weight,omitempty"`
	WeightUnit string `json:"weight_unit,omitempty"`
}

// PricingDetail represents pricing detail
type PricingDetail struct {
	TravelClass          string          `json:"travel_class"`
	FareClass            string          `json:"fare_class"`
	Availability         int             `json:"availability"`
	FareBasis            string          `json:"fare_basis"`
	BookingClass         string          `json:"booking_class"`
	BrandedFare          string          `json:"branded_fare,omitempty"`
	BrandedFareLabel     string          `json:"branded_fare_label,omitempty"`
	IncludedCheckedBags  *CheckedBags    `json:"included_checked_bags,omitempty"`
	AmenityType          string          `json:"amenity_type,omitempty"`
	AmenityDescription   string          `json:"amenity_description,omitempty"`
	AmenityProvider      string          `json:"amenity_provider,omitempty"`
}

// SearchError represents an error in search response
type SearchError struct {
	Code    string `json:"code"`
	Title   string `json:"title"`
	Detail  string `json:"detail"`
	Source  string `json:"source,omitempty"`
	Status  int    `json:"status"`
}

// Airline represents airline information
type Airline struct {
	IataCode string `json:"iata_code"`
	IcaoCode string `json:"icao_code,omitempty"`
	Name     string `json:"name"`
	Country  string `json:"country,omitempty"`
	Logo     string `json:"logo,omitempty"`
}

// NewFlightSearchRequest creates a new flight search request
func NewFlightSearchRequest(origin, destination string, departureDate time.Time, returnDate *time.Time) *FlightSearchRequest {
	return &FlightSearchRequest{
		ID:              uuid.New().String(),
		OriginCode:      origin,
		DestinationCode: destination,
		DepartureDate:   departureDate,
		ReturnDate:      returnDate,
		Adults:          1,
		Children:        0,
		Infants:         0,
		CabinClass:      "ECONOMY",
		Currency:        "USD",
		MaxResults:      250,
		CreatedAt:       time.Now(),
	}
}

// IsRoundTrip returns true if the search is for a round trip
func (r *FlightSearchRequest) IsRoundTrip() bool {
	return r.ReturnDate != nil
}

// TotalPassengers returns the total number of passengers
func (r *FlightSearchRequest) TotalPassengers() int {
	return r.Adults + r.Children + r.Infants
}

// IsExpired returns true if the search response has expired
func (r *FlightSearchResponse) IsExpired() bool {
	return time.Now().After(r.ExpiresAt)
}

// HasErrors returns true if the response contains errors
func (r *FlightSearchResponse) HasErrors() bool {
	return len(r.Errors) > 0
}

// TotalDuration returns the total duration of the itinerary
func (i *Itinerary) TotalDuration() string {
	return i.Duration
}

// NumberOfStops returns the number of stops in the itinerary
func (i *Itinerary) NumberOfStops() int {
	stops := 0
	for _, segment := range i.Segments {
		stops += len(segment.Stops)
	}
	return stops
}

// IsDirectFlight returns true if the itinerary is a direct flight
func (i *Itinerary) IsDirectFlight() bool {
	return len(i.Segments) == 1 && len(i.Segments[0].Stops) == 0
}

// GetMainCarrier returns the main carrier for the flight offer
func (f *FlightOffer) GetMainCarrier() string {
	if len(f.ValidatingAirlineCodes) > 0 {
		return f.ValidatingAirlineCodes[0]
	}
	if len(f.Itineraries) > 0 && len(f.Itineraries[0].Segments) > 0 {
		return f.Itineraries[0].Segments[0].CarrierCode
	}
	return ""
}

// GetOutboundItinerary returns the outbound itinerary
func (f *FlightOffer) GetOutboundItinerary() *Itinerary {
	if len(f.Itineraries) > 0 {
		return &f.Itineraries[0]
	}
	return nil
}

// GetReturnItinerary returns the return itinerary if it exists
func (f *FlightOffer) GetReturnItinerary() *Itinerary {
	if len(f.Itineraries) > 1 {
		return &f.Itineraries[1]
	}
	return nil
}

// IsRefundable returns true if the flight offer is refundable
func (f *FlightOffer) IsRefundable() bool {
	// This would need to be determined based on fare rules
	// For now, we'll return false as a conservative default
	return false
}

// GetCabinClass returns the cabin class for the flight
func (f *FlightOffer) GetCabinClass() string {
	if len(f.TravelerPricings) > 0 && len(f.TravelerPricings[0].FareDetailsBySegment) > 0 {
		return f.TravelerPricings[0].FareDetailsBySegment[0].Cabin
	}
	return "ECONOMY"
}