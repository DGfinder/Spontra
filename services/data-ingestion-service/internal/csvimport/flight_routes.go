package csvimport

import (
	"context"
	"encoding/csv"
	"fmt"
	"io"
	"log"
	"os"
	"strconv"
	"strings"

	"spontra/data-ingestion-service/internal/models"
)

// FlightRouteImporter handles CSV import of flight route duration data
type FlightRouteImporter struct {
	filePath string
}

// NewFlightRouteImporter creates a new flight route importer
func NewFlightRouteImporter(filePath string) *FlightRouteImporter {
	return &FlightRouteImporter{
		filePath: filePath,
	}
}

// ImportFromCSV reads the CSV file and returns FlightRoute models
func (f *FlightRouteImporter) ImportFromCSV(ctx context.Context) ([]models.FlightRoute, error) {
	file, err := os.Open(f.filePath)
	if err != nil {
		return nil, fmt.Errorf("failed to open CSV file: %w", err)
	}
	defer file.Close()

	reader := csv.NewReader(file)
	reader.TrimLeadingSpace = true

	// Read header row
	header, err := reader.Read()
	if err != nil {
		return nil, fmt.Errorf("failed to read header row: %w", err)
	}

	// Validate expected header format
	expectedHeaders := []string{"Origin_Airport_Code", "Destination_Airport_Code", "Estimated_Duration_Hours", "Estimated_Duration_Minutes"}
	if !validateHeaders(header, expectedHeaders) {
		return nil, fmt.Errorf("invalid CSV header format. Expected: %v, Got: %v", expectedHeaders, header)
	}

	var routes []models.FlightRoute
	lineNumber := 1 // Start from 1 since we already read the header

	for {
		record, err := reader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			log.Printf("Error reading line %d: %v", lineNumber+1, err)
			lineNumber++
			continue
		}

		route, err := f.parseRouteRecord(record, lineNumber+1)
		if err != nil {
			log.Printf("Error parsing line %d: %v", lineNumber+1, err)
			lineNumber++
			continue
		}

		routes = append(routes, *route)
		lineNumber++

		// Log progress every 1000 records
		if lineNumber%1000 == 0 {
			log.Printf("Processed %d flight routes", lineNumber-1)
		}
	}

	log.Printf("Successfully imported %d flight routes from CSV", len(routes))
	return routes, nil
}

// parseRouteRecord converts a CSV record into a FlightRoute model
func (f *FlightRouteImporter) parseRouteRecord(record []string, lineNumber int) (*models.FlightRoute, error) {
	if len(record) < 4 {
		return nil, fmt.Errorf("insufficient columns in record")
	}

	// Parse and validate origin airport code
	origin := strings.TrimSpace(strings.ToUpper(record[0]))
	if len(origin) != 3 {
		return nil, fmt.Errorf("invalid origin airport code: %s", origin)
	}

	// Parse and validate destination airport code
	destination := strings.TrimSpace(strings.ToUpper(record[1]))
	if len(destination) != 3 {
		return nil, fmt.Errorf("invalid destination airport code: %s", destination)
	}

	// Parse duration hours
	hoursStr := strings.TrimSpace(record[2])
	hours, err := strconv.Atoi(hoursStr)
	if err != nil {
		return nil, fmt.Errorf("invalid hours value: %s", hoursStr)
	}
	if hours < 0 || hours > 24 {
		return nil, fmt.Errorf("hours out of valid range (0-24): %d", hours)
	}

	// Parse duration minutes
	minutesStr := strings.TrimSpace(record[3])
	minutes, err := strconv.Atoi(minutesStr)
	if err != nil {
		return nil, fmt.Errorf("invalid minutes value: %s", minutesStr)
	}
	if minutes < 0 || minutes >= 60 {
		return nil, fmt.Errorf("minutes out of valid range (0-59): %d", minutes)
	}

	// Skip invalid routes (same origin and destination)
	if origin == destination {
		return nil, fmt.Errorf("origin and destination are the same: %s", origin)
	}

	// Create FlightRoute model
	route := models.NewFlightRoute(origin, destination, hours, minutes)
	return route, nil
}

// validateHeaders checks if the CSV headers match expected format
func validateHeaders(actual, expected []string) bool {
	if len(actual) != len(expected) {
		return false
	}

	for i, expectedHeader := range expected {
		actualHeader := strings.TrimSpace(actual[i])
		if actualHeader != expectedHeader {
			return false
		}
	}

	return true
}

// GetImportSummary returns a summary of the import process
type ImportSummary struct {
	TotalRoutes    int                 `json:"total_routes"`
	UniqueOrigins  int                 `json:"unique_origins"`
	UniqueDestinations int             `json:"unique_destinations"`
	DurationStats  DurationStatistics  `json:"duration_stats"`
	PopularRoutes  []RouteInfo         `json:"popular_routes"`
}

// DurationStatistics contains statistics about flight durations
type DurationStatistics struct {
	MinDurationMinutes int     `json:"min_duration_minutes"`
	MaxDurationMinutes int     `json:"max_duration_minutes"`
	AvgDurationMinutes float64 `json:"avg_duration_minutes"`
}

// RouteInfo represents information about a flight route
type RouteInfo struct {
	Origin      string `json:"origin"`
	Destination string `json:"destination"`
	Duration    string `json:"duration"`
	Count       int    `json:"count"`
}

// AnalyzeRoutes analyzes the imported routes and returns summary statistics
func (f *FlightRouteImporter) AnalyzeRoutes(routes []models.FlightRoute) ImportSummary {
	if len(routes) == 0 {
		return ImportSummary{}
	}

	// Track unique airports and route counts
	origins := make(map[string]bool)
	destinations := make(map[string]bool)
	routeCounts := make(map[string]int)

	// Calculate duration statistics
	minDuration := routes[0].TotalDurationMinutes
	maxDuration := routes[0].TotalDurationMinutes
	totalDuration := 0

	for _, route := range routes {
		// Track unique airports
		origins[route.OriginAirportCode] = true
		destinations[route.DestinationAirportCode] = true

		// Track route counts
		routeKey := fmt.Sprintf("%s-%s", route.OriginAirportCode, route.DestinationAirportCode)
		routeCounts[routeKey]++

		// Update duration statistics
		if route.TotalDurationMinutes < minDuration {
			minDuration = route.TotalDurationMinutes
		}
		if route.TotalDurationMinutes > maxDuration {
			maxDuration = route.TotalDurationMinutes
		}
		totalDuration += route.TotalDurationMinutes
	}

	avgDuration := float64(totalDuration) / float64(len(routes))

	// Find most popular routes (routes with multiple entries)
	var popularRoutes []RouteInfo
	for routeKey, count := range routeCounts {
		if count > 1 {
			parts := strings.Split(routeKey, "-")
			if len(parts) == 2 {
				// Find a route example to get duration
				var exampleRoute *models.FlightRoute
				for _, route := range routes {
					if route.OriginAirportCode == parts[0] && route.DestinationAirportCode == parts[1] {
						exampleRoute = &route
						break
					}
				}

				if exampleRoute != nil {
					duration := fmt.Sprintf("%dh %dm", exampleRoute.EstimatedDurationHours, exampleRoute.EstimatedDurationMinutes)
					popularRoutes = append(popularRoutes, RouteInfo{
						Origin:      parts[0],
						Destination: parts[1],
						Duration:    duration,
						Count:       count,
					})
				}
			}
		}
	}

	return ImportSummary{
		TotalRoutes:    len(routes),
		UniqueOrigins:  len(origins),
		UniqueDestinations: len(destinations),
		DurationStats: DurationStatistics{
			MinDurationMinutes: minDuration,
			MaxDurationMinutes: maxDuration,
			AvgDurationMinutes: avgDuration,
		},
		PopularRoutes: popularRoutes,
	}
}

// ValidateRoutes performs additional validation on imported routes
func (f *FlightRouteImporter) ValidateRoutes(routes []models.FlightRoute) ([]string, error) {
	var warnings []string

	// Check for duplicate routes
	seen := make(map[string]bool)
	duplicates := 0

	for _, route := range routes {
		routeKey := fmt.Sprintf("%s-%s", route.OriginAirportCode, route.DestinationAirportCode)
		if seen[routeKey] {
			duplicates++
		} else {
			seen[routeKey] = true
		}
	}

	if duplicates > 0 {
		warnings = append(warnings, fmt.Sprintf("Found %d duplicate routes", duplicates))
	}

	// Check for unrealistic durations
	shortFlights := 0
	longFlights := 0

	for _, route := range routes {
		if route.TotalDurationMinutes < 30 {
			shortFlights++
		}
		if route.TotalDurationMinutes > 12*60 { // More than 12 hours
			longFlights++
		}
	}

	if shortFlights > 0 {
		warnings = append(warnings, fmt.Sprintf("Found %d flights shorter than 30 minutes", shortFlights))
	}

	if longFlights > 0 {
		warnings = append(warnings, fmt.Sprintf("Found %d flights longer than 12 hours", longFlights))
	}

	// Check for common European airport codes
	europeanAirports := map[string]bool{
		"LHR": true, "CDG": true, "AMS": true, "FRA": true, "MAD": true, "FCO": true,
		"BCN": true, "MUC": true, "ZUR": true, "VIE": true, "BRU": true, "CPH": true,
		"ARN": true, "OSL": true, "HEL": true, "DUB": true, "LIS": true, "ATH": true,
		"IST": true, "WAW": true, "PRG": true, "BUD": true, "AGP": true, "PMI": true,
		"LGW": true, "MAN": true, "MXP": true, "DUS": true, "GVA": true, "ALC": true,
	}

	unknownAirports := make(map[string]bool)
	for _, route := range routes {
		if !europeanAirports[route.OriginAirportCode] {
			unknownAirports[route.OriginAirportCode] = true
		}
		if !europeanAirports[route.DestinationAirportCode] {
			unknownAirports[route.DestinationAirportCode] = true
		}
	}

	if len(unknownAirports) > 0 {
		var unknownList []string
		for airport := range unknownAirports {
			unknownList = append(unknownList, airport)
		}
		warnings = append(warnings, fmt.Sprintf("Found %d unknown airport codes: %v", len(unknownAirports), unknownList))
	}

	return warnings, nil
}