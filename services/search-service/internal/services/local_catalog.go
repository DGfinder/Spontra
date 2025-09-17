package services

import (
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/shopspring/decimal"

	"spontra/search-service/internal/models"
)

type localCatalogEntry struct {
	Origin          string
	Destination     string
	Airline         string
	FlightNumber    string
	DurationMinutes int
	BasePrice       int64
	Currency        string
	CabinClass      string
	Stops           int
	Atmosphere      string
	Activities      []string
	BudgetLevel     string
}

var localCatalogEntries = []localCatalogEntry{
	{
		Origin:          "LHR",
		Destination:     "BCN",
		Airline:         "Vueling",
		FlightNumber:    "VY7825",
		DurationMinutes: 140,
		BasePrice:       118,
		Currency:        "EUR",
		CabinClass:      "economy",
		Stops:           0,
		Atmosphere:      "mediterranean",
		Activities:      []string{"nightlife", "food", "culture"},
		BudgetLevel:     "mid",
	},
	{
		Origin:          "LHR",
		Destination:     "KEF",
		Airline:         "Icelandair",
		FlightNumber:    "FI455",
		DurationMinutes: 185,
		BasePrice:       245,
		Currency:        "EUR",
		CabinClass:      "economy",
		Stops:           0,
		Atmosphere:      "aurora",
		Activities:      []string{"adventure", "wellness"},
		BudgetLevel:     "premium",
	},
	{
		Origin:          "JFK",
		Destination:     "SJU",
		Airline:         "JetBlue",
		FlightNumber:    "B61253",
		DurationMinutes: 216,
		BasePrice:       198,
		Currency:        "USD",
		CabinClass:      "economy",
		Stops:           0,
		Atmosphere:      "tropical",
		Activities:      []string{"beach", "food", "nightlife"},
		BudgetLevel:     "mid",
	},
	{
		Origin:          "JFK",
		Destination:     "YVR",
		Airline:         "Delta",
		FlightNumber:    "DL489",
		DurationMinutes: 366,
		BasePrice:       327,
		Currency:        "USD",
		CabinClass:      "economy",
		Stops:           1,
		Atmosphere:      "mountain",
		Activities:      []string{"adventure", "culture"},
		BudgetLevel:     "premium",
	},
	{
		Origin:          "CDG",
		Destination:     "RAK",
		Airline:         "Transavia",
		FlightNumber:    "HV6203",
		DurationMinutes: 195,
		BasePrice:       161,
		Currency:        "EUR",
		CabinClass:      "economy",
		Stops:           0,
		Atmosphere:      "desert",
		Activities:      []string{"culture", "food", "wellness"},
		BudgetLevel:     "mid",
	},
	{
		Origin:          "SYD",
		Destination:     "MEL",
		Airline:         "Qantas",
		FlightNumber:    "QF437",
		DurationMinutes: 95,
		BasePrice:       132,
		Currency:        "AUD",
		CabinClass:      "economy",
		Stops:           0,
		Atmosphere:      "urban",
		Activities:      []string{"culture", "nightlife"},
		BudgetLevel:     "mid",
	},
}

var localAirportCatalog = []models.AirportSuggestion{
	{Code: "LHR", Name: "Heathrow", City: "London", Country: "United Kingdom", CountryCode: "GB", Relevance: 0.98, Type: "airport"},
	{Code: "BCN", Name: "Barcelona El Prat", City: "Barcelona", Country: "Spain", CountryCode: "ES", Relevance: 0.94, Type: "airport"},
	{Code: "KEF", Name: "Keflavik", City: "Reykjavik", Country: "Iceland", CountryCode: "IS", Relevance: 0.90, Type: "airport"},
	{Code: "JFK", Name: "John F Kennedy", City: "New York", Country: "United States", CountryCode: "US", Relevance: 0.99, Type: "airport"},
	{Code: "SJU", Name: "Luis Munoz Marin", City: "San Juan", Country: "United States", CountryCode: "US", Relevance: 0.92, Type: "airport"},
	{Code: "YVR", Name: "Vancouver International", City: "Vancouver", Country: "Canada", CountryCode: "CA", Relevance: 0.93, Type: "airport"},
	{Code: "CDG", Name: "Charles de Gaulle", City: "Paris", Country: "France", CountryCode: "FR", Relevance: 0.97, Type: "airport"},
	{Code: "RAK", Name: "Marrakesh Menara", City: "Marrakesh", Country: "Morocco", CountryCode: "MA", Relevance: 0.90, Type: "airport"},
	{Code: "SYD", Name: "Sydney Kingsford Smith", City: "Sydney", Country: "Australia", CountryCode: "AU", Relevance: 0.96, Type: "airport"},
	{Code: "MEL", Name: "Melbourne Tullamarine", City: "Melbourne", Country: "Australia", CountryCode: "AU", Relevance: 0.94, Type: "airport"},
}

func (s *SearchService) searchLocalCatalog(req *models.FlightSearchRequest) ([]models.Flight, error) {
	origin := strings.ToUpper(strings.TrimSpace(req.OriginAirport))
	destination := strings.ToUpper(strings.TrimSpace(req.DestinationAirport))
	passengers := req.PassengerCount
	if passengers <= 0 {
		passengers = 1
	}

	limit := req.MaxResults
	if limit <= 0 || limit > 50 {
		limit = 50
	}

	var flights []models.Flight

	for idx, entry := range localCatalogEntries {
		if entry.Origin != origin {
			continue
		}
		if destination != "" && entry.Destination != destination {
			continue
		}
		if req.BudgetLevel != "" && entry.BudgetLevel != "" && !strings.EqualFold(req.BudgetLevel, entry.BudgetLevel) {
			continue
		}

		departure := req.DepartureDate.Add(time.Duration(idx) * 90 * time.Minute)
		flight := buildFlightFromEntry(entry, req, departure, passengers)

		if len(req.PreferredActivities) > 0 {
			match := activityMatch(req.PreferredActivities, entry.Activities)
			if match <= 0 {
				continue
			}
			flight.ActivityMatch = match
			flight.RelevanceScore = 0.6 + (match * 0.4)
		} else {
			flight.RelevanceScore = 0.6
			flight.ActivityMatch = 0.5
		}

		flights = append(flights, flight)
		if len(flights) >= limit {
			break
		}
	}

	if len(flights) == 0 {
		flights = append(flights, fallbackFlight(origin, destination, req, passengers))
	}

	return flights, nil
}

func buildFlightFromEntry(entry localCatalogEntry, req *models.FlightSearchRequest, departure time.Time, passengers int) models.Flight {
	duration := time.Duration(entry.DurationMinutes) * time.Minute
	arrival := departure.Add(duration)

	base := decimal.NewFromInt(entry.BasePrice).Mul(decimal.NewFromInt(int64(passengers)))
	taxes := base.Mul(decimal.NewFromFloat(0.18)).Round(2)
	fees := decimal.NewFromInt(18 * int64(passengers))
	total := base.Add(taxes).Add(fees)

	pax := decimal.NewFromInt(int64(passengers))
	pricePerPax := decimal.Zero
	if passengers > 0 {
		pricePerPax = total.Div(pax)
	}

	seats := 4 + (passengers % 3)

	flight := models.Flight{
		ID:                 uuid.New(),
		Provider:           "local-catalog",
		OriginAirport:      entry.Origin,
		DestinationAirport: entry.Destination,
		DepartureTime:      departure,
		ArrivalTime:        arrival,
		Duration:           entry.DurationMinutes,
		Price:              total,
		Currency:           entry.Currency,
		CabinClass:         entry.CabinClass,
		Airline:            entry.Airline,
		FlightNumber:       entry.FlightNumber,
		Stops:              entry.Stops,
		IsRefundable:       true,
		BaggageIncluded:    true,
		BookingURL:         fmt.Sprintf("https://book.spontra.com/%s-%s/%s", entry.Origin, entry.Destination, req.DepartureDate.Format("20060102")),
		BookingDeepLink:    fmt.Sprintf("spontra://search?origin=%s&destination=%s&atmosphere=%s", entry.Origin, entry.Destination, entry.Atmosphere),
		ValidUntil:         time.Now().Add(48 * time.Hour),
		SeatsAvailable:     intPointer(seats),
		PriceBreakdown: models.PriceBreakdown{
			BaseFare:    base,
			Taxes:       taxes,
			Fees:        fees,
			Total:       total,
			Currency:    entry.Currency,
			PricePerPax: pricePerPax,
		},
	}

	if strings.EqualFold(req.CabinClass, "business") {
		multiplier := decimal.NewFromFloat(1.6)
		flight.Price = flight.Price.Mul(multiplier).Round(2)
		flight.PriceBreakdown.Total = flight.Price
		flight.PriceBreakdown.PricePerPax = flight.Price.Div(decimal.NewFromInt(int64(passengers)))
		flight.CabinClass = "business"
		flight.IsRefundable = true
		flight.BaggageIncluded = true
	}

	if strings.EqualFold(req.TripType, "return") {
		returnDeparture := departure.Add(72 * time.Hour)
		if req.ReturnDate != nil {
			returnDeparture = req.ReturnDate.Add(time.Duration(passengers%3*45) * time.Minute)
		}
		returnFlight := flight
		returnFlight.ID = uuid.New()
		returnFlight.OriginAirport = entry.Destination
		returnFlight.DestinationAirport = entry.Origin
		returnFlight.DepartureTime = returnDeparture
		returnFlight.ArrivalTime = returnDeparture.Add(duration)
		returnFlight.ReturnFlight = nil
		flight.ReturnFlight = &returnFlight
	}

	return flight
}

func fallbackFlight(origin, destination string, req *models.FlightSearchRequest, passengers int) models.Flight {
	if destination == "" {
		destination = "EXP"
	}
	if origin == "" {
		origin = "HOME"
	}

	departure := req.DepartureDate
	if departure.IsZero() {
		departure = time.Now().Add(48 * time.Hour)
	}

	durationMinutes := 150
	arrival := departure.Add(time.Duration(durationMinutes) * time.Minute)

	base := decimal.NewFromInt(150).Mul(decimal.NewFromInt(int64(passengers)))
	taxes := base.Mul(decimal.NewFromFloat(0.15)).Round(2)
	total := base.Add(taxes)

	seats := 6

	flight := models.Flight{
		ID:                 uuid.New(),
		Provider:           "local-catalog",
		OriginAirport:      origin,
		DestinationAirport: destination,
		DepartureTime:      departure,
		ArrivalTime:        arrival,
		Duration:           durationMinutes,
		Price:              total,
		Currency:           "EUR",
		CabinClass:         firstNonEmpty(req.CabinClass, "economy"),
		Airline:            "Spontra Air",
		FlightNumber:       fmt.Sprintf("SP%s%s", safeCode(origin), safeCode(destination)),
		Stops:              0,
		IsRefundable:       true,
		BaggageIncluded:    true,
		BookingURL:         fmt.Sprintf("https://book.spontra.com/%s-%s/%s", origin, destination, departure.Format("20060102")),
		BookingDeepLink:    fmt.Sprintf("spontra://search?origin=%s&destination=%s", origin, destination),
		ValidUntil:         time.Now().Add(24 * time.Hour),
		SeatsAvailable:     intPointer(seats),
		RelevanceScore:     0.55,
		ActivityMatch:      0.5,
		PriceBreakdown: models.PriceBreakdown{
			BaseFare:    base,
			Taxes:       taxes,
			Fees:        decimal.Zero,
			Total:       total,
			Currency:    "EUR",
			PricePerPax: decimal.Zero,
		},
	}

	if passengers > 0 {
		flight.PriceBreakdown.PricePerPax = total.Div(decimal.NewFromInt(int64(passengers)))
	}

	if strings.EqualFold(req.TripType, "return") {
		returnDeparture := departure.Add(72 * time.Hour)
		if req.ReturnDate != nil {
			returnDeparture = req.ReturnDate.Add(2 * time.Hour)
		}
		returnFlight := flight
		returnFlight.ID = uuid.New()
		returnFlight.OriginAirport = destination
		returnFlight.DestinationAirport = origin
		returnFlight.DepartureTime = returnDeparture
		returnFlight.ArrivalTime = returnDeparture.Add(time.Duration(durationMinutes) * time.Minute)
		returnFlight.ReturnFlight = nil
		flight.ReturnFlight = &returnFlight
	}

	return flight
}

func activityMatch(preferred, available []string) float64 {
	if len(preferred) == 0 || len(available) == 0 {
		return 0.0
	}

	availableSet := make(map[string]struct{}, len(available))
	for _, a := range available {
		availableSet[strings.ToLower(strings.TrimSpace(a))] = struct{}{}
	}

	var matches int
	for _, pref := range preferred {
		if _, ok := availableSet[strings.ToLower(strings.TrimSpace(pref))]; ok {
			matches++
		}
	}

	if matches == 0 {
		return 0.0
	}
	return float64(matches) / float64(len(preferred))
}

func intPointer(v int) *int {
	value := v
	return &value
}

func safeCode(code string) string {
	code = strings.ToUpper(strings.TrimSpace(code))
	if len(code) >= 3 {
		return code[:3]
	}
	if len(code) == 0 {
		return "XXX"
	}
	if len(code) == 1 {
		return code + "XX"
	}
	return code + "X"
}

func firstNonEmpty(values ...string) string {
	for _, v := range values {
		if strings.TrimSpace(v) != "" {
			return strings.ToLower(strings.TrimSpace(v))
		}
	}
	return ""
}

func GetLocalAirportSuggestions(query string, limit int) []models.AirportSuggestion {
	q := strings.ToUpper(strings.TrimSpace(query))
	if q == "" {
		return nil
	}
	if limit <= 0 {
		limit = 10
	}

	var suggestions []models.AirportSuggestion
	for _, airport := range localAirportCatalog {
		if strings.Contains(strings.ToUpper(airport.Code), q) ||
			strings.Contains(strings.ToUpper(airport.Name), q) ||
			strings.Contains(strings.ToUpper(airport.City), q) ||
			strings.Contains(strings.ToUpper(airport.Country), q) {
			suggestions = append(suggestions, airport)
			if len(suggestions) >= limit {
				break
			}
		}
	}

	return suggestions
}
