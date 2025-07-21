package services

import (
	"context"
	"fmt"
	"log"
	"time"

	"spontra/data-ingestion-service/internal/cassandra"
	"spontra/data-ingestion-service/internal/csvimport"
	"spontra/data-ingestion-service/internal/models"
)

// CSVImportService handles importing CSV data and storing it in the database
type CSVImportService struct {
	cassandraClient *cassandra.Client
}

// NewCSVImportService creates a new CSV import service
func NewCSVImportService(cassandraClient *cassandra.Client) *CSVImportService {
	return &CSVImportService{
		cassandraClient: cassandraClient,
	}
}

// ImportFlightRoutesFromCSV imports flight routes from a CSV file and stores them in the database
func (s *CSVImportService) ImportFlightRoutesFromCSV(ctx context.Context, csvFilePath string) (*ImportResult, error) {
	startTime := time.Now()
	log.Printf("Starting flight routes import from: %s", csvFilePath)

	// Create CSV importer
	importer := csvimport.NewFlightRouteImporter(csvFilePath)

	// Import routes from CSV
	routes, err := importer.ImportFromCSV(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to import routes from CSV: %w", err)
	}

	if len(routes) == 0 {
		return &ImportResult{
			Success:      true,
			TotalRoutes:  0,
			ProcessedAt:  startTime,
			Duration:     time.Since(startTime),
			Message:      "No routes found in CSV file",
		}, nil
	}

	// Validate routes
	warnings, err := importer.ValidateRoutes(routes)
	if err != nil {
		return nil, fmt.Errorf("failed to validate routes: %w", err)
	}

	// Log validation warnings
	for _, warning := range warnings {
		log.Printf("Validation warning: %s", warning)
	}

	// Analyze routes for statistics
	summary := importer.AnalyzeRoutes(routes)
	log.Printf("Import analysis: %d total routes, %d unique origins, %d unique destinations", 
		summary.TotalRoutes, summary.UniqueOrigins, summary.UniqueDestinations)
	log.Printf("Duration stats: min=%dm, max=%dm, avg=%.1fm", 
		summary.DurationStats.MinDurationMinutes, 
		summary.DurationStats.MaxDurationMinutes, 
		summary.DurationStats.AvgDurationMinutes)

	// Store routes in database
	log.Printf("Storing %d flight routes in database...", len(routes))
	if err := s.cassandraClient.StoreFlightRoutes(ctx, routes); err != nil {
		return nil, fmt.Errorf("failed to store flight routes in database: %w", err)
	}

	duration := time.Since(startTime)
	log.Printf("Successfully imported %d flight routes in %v", len(routes), duration)

	return &ImportResult{
		Success:      true,
		TotalRoutes:  len(routes),
		ProcessedAt:  startTime,
		Duration:     duration,
		Summary:      summary,
		Warnings:     warnings,
		Message:      fmt.Sprintf("Successfully imported %d flight routes", len(routes)),
	}, nil
}

// CreateSampleDestinations creates sample destination data for European airports
func (s *CSVImportService) CreateSampleDestinations(ctx context.Context) error {
	log.Println("Creating sample destination data...")

	sampleDestinations := []models.Destination{
		{
			ID:          "dest-lhr",
			AirportCode: "LHR",
			CityName:    "London",
			CountryName: "United Kingdom",
			CountryCode: "GB",
			Description: "The vibrant capital of England, known for its rich history, world-class museums, royal palaces, and diverse neighborhoods.",
			ImageURL:    "https://example.com/london.jpg",
			Activities: []models.ActivityInfo{
				{Type: models.ActivityTypeCulture, Score: 9.5, Description: "World-renowned museums, theaters, and historical sites", PopularSpots: []string{"British Museum", "Tate Modern", "West End"}, AveragePrice: "£15-30", RecommendedDays: 3},
				{Type: models.ActivityTypeShopping, Score: 9.0, Description: "From luxury shopping to vintage markets", PopularSpots: []string{"Oxford Street", "Camden Market", "Covent Garden"}, AveragePrice: "£20-200", RecommendedDays: 1},
				{Type: models.ActivityTypeRestaurants, Score: 8.5, Description: "Diverse culinary scene from traditional pubs to Michelin stars", PopularSpots: []string{"Borough Market", "Shoreditch", "Mayfair"}, AveragePrice: "£25-80", RecommendedDays: 2},
				{Type: models.ActivityTypeSightseeing, Score: 9.0, Description: "Iconic landmarks and royal attractions", PopularSpots: []string{"Big Ben", "Tower Bridge", "Buckingham Palace"}, AveragePrice: "£20-40", RecommendedDays: 2},
			},
			PopularityScore: 95.0,
			ClimateInfo: models.ClimateInfo{
				AverageTemperature: "8-22°C",
				RainyMonths:        []string{"October", "November", "December", "January", "February"},
				SunnyMonths:        []string{"May", "June", "July", "August"},
				ClimateType:        "Oceanic",
			},
			BestTimeToVisit: []string{"May", "June", "July", "August", "September"},
			Budget: models.BudgetInfo{
				Level:            "luxury",
				DailyBudgetRange: "£80-150",
				Currency:         "GBP",
			},
			TimeZone:     "Europe/London",
			Language:     []string{"English"},
			Currency:     "GBP",
			VisaRequired: false,
			CreatedAt:    time.Now(),
			UpdatedAt:    time.Now(),
		},
		{
			ID:          "dest-bcn",
			AirportCode: "BCN",
			CityName:    "Barcelona",
			CountryName: "Spain",
			CountryCode: "ES",
			Description: "A Mediterranean coastal city famous for its unique architecture, beaches, vibrant nightlife, and rich Catalonian culture.",
			ImageURL:    "https://example.com/barcelona.jpg",
			Activities: []models.ActivityInfo{
				{Type: models.ActivityTypeCulture, Score: 9.0, Description: "Gaudí's architectural masterpieces and vibrant art scene", PopularSpots: []string{"Sagrada Familia", "Park Güell", "Picasso Museum"}, AveragePrice: "€15-25", RecommendedDays: 2},
				{Type: models.ActivityTypeBeaches, Score: 8.0, Description: "Urban beaches and Mediterranean coastline", PopularSpots: []string{"Barceloneta Beach", "Bogatell Beach"}, AveragePrice: "Free-€15", RecommendedDays: 1},
				{Type: models.ActivityTypeNightlife, Score: 9.5, Description: "World-famous nightlife and beach clubs", PopularSpots: []string{"El Born", "Gothic Quarter", "Port Olimpic"}, AveragePrice: "€20-50", RecommendedDays: 2},
				{Type: models.ActivityTypeRestaurants, Score: 8.5, Description: "Tapas culture and innovative Catalonian cuisine", PopularSpots: []string{"La Boqueria", "El Born", "Gracia"}, AveragePrice: "€20-60", RecommendedDays: 2},
			},
			PopularityScore: 90.0,
			ClimateInfo: models.ClimateInfo{
				AverageTemperature: "13-26°C",
				RainyMonths:        []string{"September", "October", "November"},
				SunnyMonths:        []string{"April", "May", "June", "July", "August"},
				ClimateType:        "Mediterranean",
			},
			BestTimeToVisit: []string{"April", "May", "June", "September", "October"},
			Budget: models.BudgetInfo{
				Level:            "mid-range",
				DailyBudgetRange: "€50-90",
				Currency:         "EUR",
			},
			TimeZone:     "Europe/Madrid",
			Language:     []string{"Spanish", "Catalan"},
			Currency:     "EUR",
			VisaRequired: false,
			CreatedAt:    time.Now(),
			UpdatedAt:    time.Now(),
		},
		{
			ID:          "dest-ams",
			AirportCode: "AMS",
			CityName:    "Amsterdam",
			CountryName: "Netherlands",
			CountryCode: "NL",
			Description: "The charming capital of the Netherlands, famous for its canals, museums, liberal atmosphere, and cycling culture.",
			ImageURL:    "https://example.com/amsterdam.jpg",
			Activities: []models.ActivityInfo{
				{Type: models.ActivityTypeCulture, Score: 8.5, Description: "World-class museums and historic architecture", PopularSpots: []string{"Van Gogh Museum", "Rijksmuseum", "Anne Frank House"}, AveragePrice: "€18-30", RecommendedDays: 2},
				{Type: models.ActivityTypeActivities, Score: 9.0, Description: "Canal tours, cycling, and unique experiences", PopularSpots: []string{"Canal Ring", "Vondelpark", "Jordaan District"}, AveragePrice: "€15-40", RecommendedDays: 2},
				{Type: models.ActivityTypeNightlife, Score: 8.0, Description: "Diverse nightlife from brown cafes to clubs", PopularSpots: []string{"Leidseplein", "Rembrandtplein", "Red Light District"}, AveragePrice: "€25-45", RecommendedDays: 1},
				{Type: models.ActivityTypeRestaurants, Score: 7.5, Description: "International cuisine and Dutch specialties", PopularSpots: []string{"De Pijp", "Jordaan", "Noord"}, AveragePrice: "€25-55", RecommendedDays: 1},
			},
			PopularityScore: 85.0,
			ClimateInfo: models.ClimateInfo{
				AverageTemperature: "6-22°C",
				RainyMonths:        []string{"October", "November", "December", "January"},
				SunnyMonths:        []string{"May", "June", "July", "August"},
				ClimateType:        "Oceanic",
			},
			BestTimeToVisit: []string{"April", "May", "June", "July", "August", "September"},
			Budget: models.BudgetInfo{
				Level:            "mid-range",
				DailyBudgetRange: "€60-100",
				Currency:         "EUR",
			},
			TimeZone:     "Europe/Amsterdam",
			Language:     []string{"Dutch", "English"},
			Currency:     "EUR",
			VisaRequired: false,
			CreatedAt:    time.Now(),
			UpdatedAt:    time.Now(),
		},
		{
			ID:          "dest-prg",
			AirportCode: "PRG",
			CityName:    "Prague",
			CountryName: "Czech Republic",
			CountryCode: "CZ",
			Description: "The enchanting capital known as the 'City of a Hundred Spires', featuring stunning medieval architecture and rich history.",
			ImageURL:    "https://example.com/prague.jpg",
			Activities: []models.ActivityInfo{
				{Type: models.ActivityTypeCulture, Score: 9.5, Description: "Medieval architecture and rich history", PopularSpots: []string{"Prague Castle", "Charles Bridge", "Old Town Square"}, AveragePrice: "€10-20", RecommendedDays: 3},
				{Type: models.ActivityTypeRestaurants, Score: 8.0, Description: "Traditional Czech cuisine and famous beer culture", PopularSpots: []string{"Old Town", "Lesser Town", "Vinohrady"}, AveragePrice: "€15-35", RecommendedDays: 2},
				{Type: models.ActivityTypeNightlife, Score: 7.5, Description: "Historic pubs and vibrant bar scene", PopularSpots: []string{"Wenceslas Square", "Vinohrady", "Karlín"}, AveragePrice: "€15-30", RecommendedDays: 1},
				{Type: models.ActivityTypeSightseeing, Score: 9.0, Description: "Fairytale architecture and panoramic views", PopularSpots: []string{"Petřín Hill", "Vltava River", "Jewish Quarter"}, AveragePrice: "€8-18", RecommendedDays: 2},
			},
			PopularityScore: 80.0,
			ClimateInfo: models.ClimateInfo{
				AverageTemperature: "2-24°C",
				RainyMonths:        []string{"May", "June", "July", "August"},
				SunnyMonths:        []string{"April", "May", "September", "October"},
				ClimateType:        "Continental",
			},
			BestTimeToVisit: []string{"April", "May", "June", "September", "October"},
			Budget: models.BudgetInfo{
				Level:            "budget",
				DailyBudgetRange: "€30-60",
				Currency:         "EUR",
			},
			TimeZone:     "Europe/Prague",
			Language:     []string{"Czech", "English"},
			Currency:     "CZK",
			VisaRequired: false,
			CreatedAt:    time.Now(),
			UpdatedAt:    time.Now(),
		},
	}

	// Store each destination
	for _, destination := range sampleDestinations {
		if err := s.cassandraClient.StoreDestination(ctx, destination); err != nil {
			return fmt.Errorf("failed to store destination %s: %w", destination.AirportCode, err)
		}
		log.Printf("Stored destination: %s (%s)", destination.CityName, destination.AirportCode)
	}

	log.Printf("Successfully created %d sample destinations", len(sampleDestinations))
	return nil
}

// ImportResult represents the result of a CSV import operation
type ImportResult struct {
	Success     bool                         `json:"success"`
	TotalRoutes int                          `json:"total_routes"`
	ProcessedAt time.Time                    `json:"processed_at"`
	Duration    time.Duration                `json:"duration"`
	Summary     csvimport.ImportSummary      `json:"summary"`
	Warnings    []string                     `json:"warnings"`
	Message     string                       `json:"message"`
}

// GetFlightRoutesByTimeRange retrieves flight routes within a time range from an origin
func (s *CSVImportService) GetFlightRoutesByTimeRange(ctx context.Context, origin string, minHours, maxHours int) ([]models.FlightRoute, error) {
	minMinutes := minHours * 60
	maxMinutes := maxHours * 60
	
	routes, err := s.cassandraClient.GetFlightRoutesByDuration(ctx, origin, minMinutes, maxMinutes)
	if err != nil {
		return nil, fmt.Errorf("failed to get flight routes by time range: %w", err)
	}
	
	return routes, nil
}

// GetDestination retrieves destination information by airport code
func (s *CSVImportService) GetDestination(ctx context.Context, airportCode string) (*models.Destination, error) {
	destination, err := s.cassandraClient.GetDestination(ctx, airportCode)
	if err != nil {
		return nil, fmt.Errorf("failed to get destination: %w", err)
	}
	
	return destination, nil
}