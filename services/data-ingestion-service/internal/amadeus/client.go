package amadeus

import (
	"context"
	"encoding/json"
	"fmt"
	"net/url"
	"strconv"
	"strings"
	"sync"
	"time"

	"spontra/data-ingestion-service/internal/config"
	"spontra/data-ingestion-service/internal/models"
	"spontra/data-ingestion-service/pkg/httpclient"
)

// Client represents the Amadeus API client
type Client struct {
	config     config.AmadeusConfig
	httpClient *httpclient.HTTPClient
	token      *AccessToken
	tokenMutex sync.RWMutex
}

// AccessToken represents an OAuth2 access token
type AccessToken struct {
	Token     string    `json:"access_token"`
	Type      string    `json:"token_type"`
	ExpiresIn int       `json:"expires_in"`
	ExpiresAt time.Time `json:"-"`
}

// FlightSearchRequest represents Amadeus flight search request
type AmadeusFlightSearchRequest struct {
	CurrencyCode          string                `json:"currencyCode"`
	OriginDestinations    []OriginDestination   `json:"originDestinations"`
	Travelers             []Traveler            `json:"travelers"`
	Sources               []string              `json:"sources"`
	SearchCriteria        SearchCriteria        `json:"searchCriteria"`
	AdditionalInformation AdditionalInformation `json:"additionalInformation,omitempty"`
}

// OriginDestination represents origin and destination for flight search
type OriginDestination struct {
	ID                     string     `json:"id"`
	OriginLocationCode     string     `json:"originLocationCode"`
	DestinationLocationCode string    `json:"destinationLocationCode"`
	DepartureDateTimeRange DateTimeRange `json:"departureDateTimeRange"`
}

// DateTimeRange represents date and time range
type DateTimeRange struct {
	Date     string `json:"date"`
	Time     string `json:"time,omitempty"`
	TimeWindow string `json:"timeWindow,omitempty"`
}

// Traveler represents a traveler
type Traveler struct {
	ID               string `json:"id"`
	TravelerType     string `json:"travelerType"`
	AssociatedAdultID string `json:"associatedAdultId,omitempty"`
}

// SearchCriteria represents search criteria
type SearchCriteria struct {
	MaxFlightOffers               int                     `json:"maxFlightOffers,omitempty"`
	FlightFilters                 FlightFilters           `json:"flightFilters,omitempty"`
	AdditionalInformation         SearchAdditionalInfo    `json:"additionalInformation,omitempty"`
}

// FlightFilters represents flight filters
type FlightFilters struct {
	CabinRestrictions            []CabinRestriction       `json:"cabinRestrictions,omitempty"`
	CarrierRestrictions          CarrierRestrictions      `json:"carrierRestrictions,omitempty"`
	ConnectionRestriction        ConnectionRestriction    `json:"connectionRestriction,omitempty"`
	MaxFlightTime                string                   `json:"maxFlightTime,omitempty"`
	ReturnToDepartureAirport     bool                     `json:"returnToDepartureAirport,omitempty"`
	RailSegmentAllowed           bool                     `json:"railSegmentAllowed,omitempty"`
	BusSegmentAllowed            bool                     `json:"busSegmentAllowed,omitempty"`
}

// CabinRestriction represents cabin restrictions
type CabinRestriction struct {
	Cabin                string   `json:"cabin"`
	Coverage             string   `json:"coverage"`
	OriginDestinationIds []string `json:"originDestinationIds"`
}

// CarrierRestrictions represents carrier restrictions
type CarrierRestrictions struct {
	BlacklistedInEUorEEA bool     `json:"blacklistedInEUorEEA,omitempty"`
	ExcludedCarrierCodes []string `json:"excludedCarrierCodes,omitempty"`
	IncludedCarrierCodes []string `json:"includedCarrierCodes,omitempty"`
}

// ConnectionRestriction represents connection restrictions
type ConnectionRestriction struct {
	MaxNumberOfConnections int      `json:"maxNumberOfConnections,omitempty"`
	NonStopPreferred       bool     `json:"nonStopPreferred,omitempty"`
	AirportChangeAllowed   bool     `json:"airportChangeAllowed,omitempty"`
	TechnicalStopsAllowed  bool     `json:"technicalStopsAllowed,omitempty"`
}

// SearchAdditionalInfo represents additional search information
type SearchAdditionalInfo struct {
	BrandedFares   bool `json:"brandedFares,omitempty"`
	ChargeableCheckedBags bool `json:"chargeableCheckedBags,omitempty"`
}

// AdditionalInformation represents additional information
type AdditionalInformation struct {
	ChargeableCheckedBags bool `json:"chargeableCheckedBags,omitempty"`
	BrandedFares         bool `json:"brandedFares,omitempty"`
}

// AmadeusFlightSearchResponse represents Amadeus flight search response
type AmadeusFlightSearchResponse struct {
	Meta         Meta                    `json:"meta"`
	Data         []AmadeusFlightOffer    `json:"data"`
	Dictionaries Dictionaries            `json:"dictionaries"`
	Warnings     []Warning               `json:"warnings,omitempty"`
	Errors       []AmadeusError          `json:"errors,omitempty"`
}

// Meta represents response metadata
type Meta struct {
	Count int    `json:"count"`
	Links Links  `json:"links"`
}

// Links represents response links
type Links struct {
	Self string `json:"self"`
}

// AmadeusFlightOffer represents Amadeus flight offer
type AmadeusFlightOffer struct {
	Type                     string                  `json:"type"`
	ID                       string                  `json:"id"`
	Source                   string                  `json:"source"`
	InstantTicketingRequired bool                    `json:"instantTicketingRequired"`
	NonHomogeneous          bool                    `json:"nonHomogeneous"`
	OneWay                  bool                    `json:"oneWay"`
	LastTicketingDate       string                  `json:"lastTicketingDate"`
	LastTicketingDateTime   string                  `json:"lastTicketingDateTime"`
	NumberOfBookableSeats   int                     `json:"numberOfBookableSeats"`
	Itineraries             []AmadeusItinerary      `json:"itineraries"`
	Price                   AmadeusPrice            `json:"price"`
	PricingOptions          AmadeusPricingOptions   `json:"pricingOptions"`
	ValidatingAirlineCodes  []string                `json:"validatingAirlineCodes"`
	TravelerPricings        []AmadeusTravelerPricing `json:"travelerPricings"`
}

// AmadeusItinerary represents Amadeus itinerary
type AmadeusItinerary struct {
	Duration string            `json:"duration"`
	Segments []AmadeusSegment  `json:"segments"`
}

// AmadeusSegment represents Amadeus segment
type AmadeusSegment struct {
	Departure         AmadeusFlightEndpoint `json:"departure"`
	Arrival           AmadeusFlightEndpoint `json:"arrival"`
	CarrierCode       string                `json:"carrierCode"`
	Number            string                `json:"number"`
	Aircraft          AmadeusAircraft       `json:"aircraft"`
	Operating         *AmadeusOperating     `json:"operating,omitempty"`
	Duration          string                `json:"duration"`
	ID                string                `json:"id"`
	NumberOfStops     int                   `json:"numberOfStops"`
	BlacklistedInEU   bool                  `json:"blacklistedInEU"`
	Co2Emissions      []AmadeusCo2Emission  `json:"co2Emissions,omitempty"`
}

// AmadeusFlightEndpoint represents Amadeus flight endpoint
type AmadeusFlightEndpoint struct {
	IataCode string `json:"iataCode"`
	Terminal string `json:"terminal,omitempty"`
	At       string `json:"at"`
}

// AmadeusAircraft represents Amadeus aircraft
type AmadeusAircraft struct {
	Code string `json:"code"`
}

// AmadeusOperating represents Amadeus operating information
type AmadeusOperating struct {
	CarrierCode string `json:"carrierCode"`
	Number      string `json:"number"`
}

// AmadeusCo2Emission represents Amadeus CO2 emission
type AmadeusCo2Emission struct {
	Weight     int    `json:"weight"`
	WeightUnit string `json:"weightUnit"`
	Cabin      string `json:"cabin"`
}

// AmadeusPrice represents Amadeus price
type AmadeusPrice struct {
	Currency         string             `json:"currency"`
	Total            string             `json:"total"`
	Base             string             `json:"base"`
	Taxes            []AmadeusTax       `json:"taxes"`
	Fees             []AmadeusFee       `json:"fees,omitempty"`
	GrandTotal       string             `json:"grandTotal"`
	AdditionalServices []AmadeusAdditionalService `json:"additionalServices,omitempty"`
}

// AmadeusTax represents Amadeus tax
type AmadeusTax struct {
	Amount string `json:"amount"`
	Code   string `json:"code"`
}

// AmadeusFee represents Amadeus fee
type AmadeusFee struct {
	Amount string `json:"amount"`
	Type   string `json:"type"`
}

// AmadeusAdditionalService represents Amadeus additional service
type AmadeusAdditionalService struct {
	Amount string `json:"amount"`
	Type   string `json:"type"`
}

// AmadeusPricingOptions represents Amadeus pricing options
type AmadeusPricingOptions struct {
	FareType                []string `json:"fareType"`
	IncludedCheckedBagsOnly bool     `json:"includedCheckedBagsOnly"`
}

// AmadeusTravelerPricing represents Amadeus traveler pricing
type AmadeusTravelerPricing struct {
	TravelerID           string                        `json:"travelerId"`
	FareOption           string                        `json:"fareOption"`
	TravelerType         string                        `json:"travelerType"`
	Price                AmadeusPrice                  `json:"price"`
	FareDetailsBySegment []AmadeusFareDetailsBySegment `json:"fareDetailsBySegment"`
}

// AmadeusFareDetailsBySegment represents Amadeus fare details by segment
type AmadeusFareDetailsBySegment struct {
	SegmentID       string                     `json:"segmentId"`
	Cabin           string                     `json:"cabin"`
	FareBasis       string                     `json:"fareBasis"`
	BrandedFare     string                     `json:"brandedFare,omitempty"`
	Class           string                     `json:"class"`
	IncludedCheckedBags *AmadeusCheckedBags    `json:"includedCheckedBags,omitempty"`
	Amenities       []AmadeusAmenity           `json:"amenities,omitempty"`
}

// AmadeusCheckedBags represents Amadeus checked bags
type AmadeusCheckedBags struct {
	Quantity int    `json:"quantity"`
	Weight   int    `json:"weight,omitempty"`
	WeightUnit string `json:"weightUnit,omitempty"`
}

// AmadeusAmenity represents Amadeus amenity
type AmadeusAmenity struct {
	Description string `json:"description"`
	IsChargeable bool   `json:"isChargeable"`
	AmenityType  string `json:"amenityType"`
	AmenityProvider AmadeusAmenityProvider `json:"amenityProvider"`
}

// AmadeusAmenityProvider represents Amadeus amenity provider
type AmadeusAmenityProvider struct {
	Name string `json:"name"`
}

// Dictionaries represents response dictionaries
type Dictionaries struct {
	Locations  map[string]Location  `json:"locations"`
	Aircraft   map[string]Aircraft  `json:"aircraft"`
	Currencies map[string]Currency  `json:"currencies"`
	Carriers   map[string]Carrier   `json:"carriers"`
}

// Location represents location dictionary
type Location struct {
	CityCode    string `json:"cityCode"`
	CountryCode string `json:"countryCode"`
}

// Aircraft represents aircraft dictionary
type Aircraft struct {
	Code string `json:"code"`
	Name string `json:"name"`
}

// Currency represents currency dictionary
type Currency struct {
	Code string `json:"code"`
	Name string `json:"name"`
}

// Carrier represents carrier dictionary
type Carrier struct {
	Code string `json:"code"`
	Name string `json:"name"`
}

// Warning represents API warning
type Warning struct {
	Code   string `json:"code"`
	Title  string `json:"title"`
	Detail string `json:"detail"`
}

// AmadeusError represents Amadeus API error
type AmadeusError struct {
	Code   string `json:"code"`
	Title  string `json:"title"`
	Detail string `json:"detail"`
	Status int    `json:"status"`
}

// NewClient creates a new Amadeus API client
func NewClient(config config.AmadeusConfig) *Client {
	httpClientConfig := httpclient.HTTPClientConfig{
		Timeout:             config.Timeout,
		MaxRetries:          config.MaxRetries,
		RetryDelay:          config.RetryDelay,
		RateLimitRPS:        config.RateLimit.RequestsPerSecond,
		RateLimitBurst:      config.RateLimit.BurstSize,
		MaxIdleConns:        100,
		MaxIdleConnsPerHost: 10,
		IdleConnTimeout:     90 * time.Second,
	}

	return &Client{
		config:     config,
		httpClient: httpclient.NewHTTPClient(httpClientConfig),
	}
}

// authenticate gets or refreshes the access token
func (c *Client) authenticate(ctx context.Context) error {
	c.tokenMutex.RLock()
	if c.token != nil && time.Now().Before(c.token.ExpiresAt.Add(-5*time.Minute)) {
		c.tokenMutex.RUnlock()
		return nil
	}
	c.tokenMutex.RUnlock()

	c.tokenMutex.Lock()
	defer c.tokenMutex.Unlock()

	// Double-check after acquiring write lock
	if c.token != nil && time.Now().Before(c.token.ExpiresAt.Add(-5*time.Minute)) {
		return nil
	}

	tokenURL := c.config.BaseURL + "/v1/security/oauth2/token"
	
	data := url.Values{}
	data.Set("grant_type", "client_credentials")
	data.Set("client_id", c.config.ClientID)
	data.Set("client_secret", c.config.ClientSecret)

	headers := map[string]string{
		"Content-Type": "application/x-www-form-urlencoded",
	}

	req := httpclient.Request{
		Method:  "POST",
		URL:     tokenURL,
		Headers: headers,
		Body:    strings.NewReader(data.Encode()),
	}

	resp, err := c.httpClient.Do(ctx, req)
	if err != nil {
		return fmt.Errorf("failed to authenticate: %w", err)
	}

	if resp.StatusCode != 200 {
		return fmt.Errorf("authentication failed with status %d: %s", resp.StatusCode, string(resp.Body))
	}

	var token AccessToken
	if err := json.Unmarshal(resp.Body, &token); err != nil {
		return fmt.Errorf("failed to parse token response: %w", err)
	}

	token.ExpiresAt = time.Now().Add(time.Duration(token.ExpiresIn) * time.Second)
	c.token = &token

	return nil
}

// getAuthHeaders returns authentication headers
func (c *Client) getAuthHeaders() map[string]string {
	c.tokenMutex.RLock()
	defer c.tokenMutex.RUnlock()

	if c.token == nil {
		return nil
	}

	return map[string]string{
		"Authorization": fmt.Sprintf("Bearer %s", c.token.Token),
		"Content-Type":  "application/json",
	}
}

// SearchFlights searches for flights using the Amadeus API
func (c *Client) SearchFlights(ctx context.Context, searchReq *models.FlightSearchRequest) (*models.FlightSearchResponse, error) {
	// Authenticate first
	if err := c.authenticate(ctx); err != nil {
		return nil, fmt.Errorf("authentication failed: %w", err)
	}

	// Convert to Amadeus request format
	amadeusReq := c.convertToAmadeusRequest(searchReq)

	// Make the API call
	searchURL := c.config.BaseURL + "/v2/shopping/flight-offers"
	
	headers := c.getAuthHeaders()
	
	var amadeusResp AmadeusFlightSearchResponse
	if err := c.httpClient.PostJSON(ctx, searchURL, amadeusReq, headers, &amadeusResp); err != nil {
		return nil, fmt.Errorf("flight search failed: %w", err)
	}

	// Convert response to internal format
	response := c.convertFromAmadeusResponse(&amadeusResp, searchReq)
	return response, nil
}

// convertToAmadeusRequest converts internal request to Amadeus format
func (c *Client) convertToAmadeusRequest(req *models.FlightSearchRequest) *AmadeusFlightSearchRequest {
	originDestinations := []OriginDestination{
		{
			ID:                      "1",
			OriginLocationCode:      req.OriginCode,
			DestinationLocationCode: req.DestinationCode,
			DepartureDateTimeRange: DateTimeRange{
				Date: req.DepartureDate.Format("2006-01-02"),
			},
		},
	}

	// Add return flight if round trip
	if req.ReturnDate != nil {
		originDestinations = append(originDestinations, OriginDestination{
			ID:                      "2",
			OriginLocationCode:      req.DestinationCode,
			DestinationLocationCode: req.OriginCode,
			DepartureDateTimeRange: DateTimeRange{
				Date: req.ReturnDate.Format("2006-01-02"),
			},
		})
	}

	travelers := []Traveler{}
	travelerID := 1

	// Add adults
	for i := 0; i < req.Adults; i++ {
		travelers = append(travelers, Traveler{
			ID:           strconv.Itoa(travelerID),
			TravelerType: "ADULT",
		})
		travelerID++
	}

	// Add children
	for i := 0; i < req.Children; i++ {
		travelers = append(travelers, Traveler{
			ID:           strconv.Itoa(travelerID),
			TravelerType: "CHILD",
		})
		travelerID++
	}

	// Add infants
	for i := 0; i < req.Infants; i++ {
		travelers = append(travelers, Traveler{
			ID:           strconv.Itoa(travelerID),
			TravelerType: "HELD_INFANT",
			AssociatedAdultID: "1", // Associate with first adult
		})
		travelerID++
	}

	searchCriteria := SearchCriteria{
		MaxFlightOffers: req.MaxResults,
		FlightFilters: FlightFilters{
			CabinRestrictions: []CabinRestriction{
				{
					Cabin:                req.CabinClass,
					Coverage:             "MOST_SEGMENTS",
					OriginDestinationIds: []string{"1"},
				},
			},
		},
		AdditionalInformation: SearchAdditionalInfo{
			BrandedFares:          true,
			ChargeableCheckedBags: true,
		},
	}

	return &AmadeusFlightSearchRequest{
		CurrencyCode:       req.Currency,
		OriginDestinations: originDestinations,
		Travelers:          travelers,
		Sources:            []string{"GDS"},
		SearchCriteria:     searchCriteria,
		AdditionalInformation: AdditionalInformation{
			ChargeableCheckedBags: true,
			BrandedFares:         true,
		},
	}
}

// convertFromAmadeusResponse converts Amadeus response to internal format
func (c *Client) convertFromAmadeusResponse(amadeusResp *AmadeusFlightSearchResponse, searchReq *models.FlightSearchRequest) *models.FlightSearchResponse {
	response := &models.FlightSearchResponse{
		ID:              fmt.Sprintf("search_%d", time.Now().Unix()),
		SearchRequestID: searchReq.ID,
		Provider:        "amadeus",
		Currency:        searchReq.Currency,
		SearchedAt:      time.Now(),
		ExpiresAt:       time.Now().Add(15 * time.Minute),
		TotalResults:    amadeusResp.Meta.Count,
		FlightOffers:    make([]models.FlightOffer, 0, len(amadeusResp.Data)),
	}

	// Convert errors
	for _, err := range amadeusResp.Errors {
		response.Errors = append(response.Errors, models.SearchError{
			Code:   err.Code,
			Title:  err.Title,
			Detail: err.Detail,
			Status: err.Status,
		})
	}

	// Convert flight offers
	for _, amadeusOffer := range amadeusResp.Data {
		offer := c.convertFlightOffer(&amadeusOffer, &amadeusResp.Dictionaries)
		response.FlightOffers = append(response.FlightOffers, offer)
	}

	return response
}

// convertFlightOffer converts Amadeus flight offer to internal format
func (c *Client) convertFlightOffer(amadeusOffer *AmadeusFlightOffer, dictionaries *Dictionaries) models.FlightOffer {
	now := time.Now()
	
	offer := models.FlightOffer{
		ID:                       amadeusOffer.ID,
		Type:                     amadeusOffer.Type,
		Source:                   amadeusOffer.Source,
		InstantTicketingRequired: amadeusOffer.InstantTicketingRequired,
		NonHomogeneous:          amadeusOffer.NonHomogeneous,
		OneWay:                  amadeusOffer.OneWay,
		NumberOfBookableSeats:   amadeusOffer.NumberOfBookableSeats,
		ValidatingAirlineCodes:  amadeusOffer.ValidatingAirlineCodes,
		CreatedAt:               now,
		UpdatedAt:               now,
	}

	// Parse dates
	if amadeusOffer.LastTicketingDate != "" {
		if t, err := time.Parse("2006-01-02", amadeusOffer.LastTicketingDate); err == nil {
			offer.LastTicketingDate = &t
		}
	}

	if amadeusOffer.LastTicketingDateTime != "" {
		if t, err := time.Parse(time.RFC3339, amadeusOffer.LastTicketingDateTime); err == nil {
			offer.LastTicketingDateTime = &t
		}
	}

	// Convert itineraries
	for _, amadeusItinerary := range amadeusOffer.Itineraries {
		itinerary := models.Itinerary{
			Duration: amadeusItinerary.Duration,
			Segments: make([]models.Segment, 0, len(amadeusItinerary.Segments)),
		}

		for _, amadeusSegment := range amadeusItinerary.Segments {
			segment := c.convertSegment(&amadeusSegment, dictionaries)
			itinerary.Segments = append(itinerary.Segments, segment)
		}

		offer.Itineraries = append(offer.Itineraries, itinerary)
	}

	// Convert price
	offer.Price = c.convertPrice(&amadeusOffer.Price)

	// Convert pricing options
	offer.PricingOptions = models.PricingOptions{
		FareType:                amadeusOffer.PricingOptions.FareType,
		IncludedCheckedBagsOnly: amadeusOffer.PricingOptions.IncludedCheckedBagsOnly,
	}

	// Convert traveler pricings
	for _, amadeusTP := range amadeusOffer.TravelerPricings {
		tp := models.TravelerPricing{
			TravelerID:   amadeusTP.TravelerID,
			FareOption:   amadeusTP.FareOption,
			TravelerType: amadeusTP.TravelerType,
			Price:        c.convertPrice(&amadeusTP.Price),
		}

		for _, amadeusFS := range amadeusTP.FareDetailsBySegment {
			fs := models.FareDetails{
				SegmentID:    amadeusFS.SegmentID,
				Cabin:        amadeusFS.Cabin,
				FareBasis:    amadeusFS.FareBasis,
				BrandedFare:  amadeusFS.BrandedFare,
				Class:        amadeusFS.Class,
			}

			if amadeusFS.IncludedCheckedBags != nil {
				fs.IncludedCheckedBags = &models.CheckedBags{
					Quantity:   amadeusFS.IncludedCheckedBags.Quantity,
					Weight:     amadeusFS.IncludedCheckedBags.Weight,
					WeightUnit: amadeusFS.IncludedCheckedBags.WeightUnit,
				}
			}

			tp.FareDetailsBySegment = append(tp.FareDetailsBySegment, fs)
		}

		offer.TravelerPricings = append(offer.TravelerPricings, tp)
	}

	return offer
}

// convertSegment converts Amadeus segment to internal format
func (c *Client) convertSegment(amadeusSegment *AmadeusSegment, dictionaries *Dictionaries) models.Segment {
	segment := models.Segment{
		ID:          amadeusSegment.ID,
		CarrierCode: amadeusSegment.CarrierCode,
		Number:      amadeusSegment.Number,
		Duration:    amadeusSegment.Duration,
	}

	// Convert departure
	if departureTime, err := time.Parse(time.RFC3339, amadeusSegment.Departure.At); err == nil {
		segment.Departure = models.FlightEndpoint{
			IataCode: amadeusSegment.Departure.IataCode,
			Terminal: amadeusSegment.Departure.Terminal,
			At:       departureTime,
			Airport:  c.getAirportInfo(amadeusSegment.Departure.IataCode, dictionaries),
		}
	}

	// Convert arrival
	if arrivalTime, err := time.Parse(time.RFC3339, amadeusSegment.Arrival.At); err == nil {
		segment.Arrival = models.FlightEndpoint{
			IataCode: amadeusSegment.Arrival.IataCode,
			Terminal: amadeusSegment.Arrival.Terminal,
			At:       arrivalTime,
			Airport:  c.getAirportInfo(amadeusSegment.Arrival.IataCode, dictionaries),
		}
	}

	// Convert aircraft
	segment.Aircraft = models.Aircraft{
		Code: amadeusSegment.Aircraft.Code,
		Name: c.getAircraftName(amadeusSegment.Aircraft.Code, dictionaries),
	}

	// Convert operating flight
	if amadeusSegment.Operating != nil {
		segment.Operating = &models.OperatingFlight{
			CarrierCode: amadeusSegment.Operating.CarrierCode,
			Number:      amadeusSegment.Operating.Number,
		}
	}

	// Convert CO2 emissions
	for _, amadeusEmission := range amadeusSegment.Co2Emissions {
		segment.Co2Emissions = append(segment.Co2Emissions, models.Co2Emission{
			Weight:     amadeusEmission.Weight,
			WeightUnit: amadeusEmission.WeightUnit,
			Cabin:      amadeusEmission.Cabin,
		})
	}

	return segment
}

// convertPrice converts Amadeus price to internal format
func (c *Client) convertPrice(amadeusPrice *AmadeusPrice) models.Price {
	price := models.Price{
		Currency: amadeusPrice.Currency,
	}

	// Convert amounts (Amadeus returns strings, we need decimals)
	if total, err := decimal.NewFromString(amadeusPrice.Total); err == nil {
		price.Total = total
	}

	if base, err := decimal.NewFromString(amadeusPrice.Base); err == nil {
		price.Base = base
	}

	if grandTotal, err := decimal.NewFromString(amadeusPrice.GrandTotal); err == nil {
		price.GrandTotal = grandTotal
	}

	// Convert taxes
	for _, amadeusTag := range amadeusPrice.Taxes {
		if amount, err := decimal.NewFromString(amadeusTag.Amount); err == nil {
			price.Taxes = append(price.Taxes, models.Tax{
				Amount: amount,
				Code:   amadeusTag.Code,
			})
		}
	}

	// Convert fees
	for _, amadeusFee := range amadeusPrice.Fees {
		if amount, err := decimal.NewFromString(amadeusFee.Amount); err == nil {
			price.Fees = append(price.Fees, models.Fee{
				Amount: amount,
				Type:   amadeusFee.Type,
			})
		}
	}

	// Convert additional services
	for _, amadeusService := range amadeusPrice.AdditionalServices {
		if amount, err := decimal.NewFromString(amadeusService.Amount); err == nil {
			price.AdditionalServices = append(price.AdditionalServices, models.AdditionalService{
				Amount: amount,
				Type:   amadeusService.Type,
			})
		}
	}

	return price
}

// getAirportInfo retrieves airport information from dictionaries
func (c *Client) getAirportInfo(iataCode string, dictionaries *Dictionaries) models.Airport {
	airport := models.Airport{
		IataCode: iataCode,
	}

	if location, exists := dictionaries.Locations[iataCode]; exists {
		airport.City = location.CityCode
		airport.CountryCode = location.CountryCode
	}

	return airport
}

// getAircraftName retrieves aircraft name from dictionaries
func (c *Client) getAircraftName(code string, dictionaries *Dictionaries) string {
	if aircraft, exists := dictionaries.Aircraft[code]; exists {
		return aircraft.Name
	}
	return ""
}

import (
	"io"
	"github.com/google/uuid"
	"github.com/shopspring/decimal"
)