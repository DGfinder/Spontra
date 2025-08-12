package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"time"

	"github.com/google/uuid"

	"spontra/data-ingestion-service/internal/cassandra"
	"spontra/data-ingestion-service/internal/config"
)

// ThemeCity represents the TypeScript theme city structure
type ThemeCity struct {
	IataCode          string            `json:"iataCode"`
	CityName          string            `json:"cityName"`
	CountryName       string            `json:"countryName"`
	CountryCode       string            `json:"countryCode"`
	ThemeScores       map[string]int    `json:"themeScores"`
	Highlights        []string          `json:"highlights"`
	AverageFlightTime float64           `json:"averageFlightTime"`
	PriceRange        string            `json:"priceRange"`
	BestMonths        []string          `json:"bestMonths"`
	Description       string            `json:"description"`
}

// ThemeCitiesData represents the structure of the exported TypeScript data
type ThemeCitiesData struct {
	AllCities []ThemeCity `json:"ALL_CITIES"`
}

func main() {
	log.Println("🚀 Starting Theme Cities Migration to Cassandra")

	// Parse command line arguments
	if len(os.Args) < 2 {
		log.Fatal("Usage: go run migrate_theme_cities.go <theme_cities_json_file>")
	}

	jsonFile := os.Args[1]
	log.Printf("📂 Reading theme cities from: %s", jsonFile)

	// Read and parse the JSON file
	themeCities, err := readThemeCitiesFromJSON(jsonFile)
	if err != nil {
		log.Fatalf("❌ Failed to read theme cities: %v", err)
	}

	log.Printf("📊 Loaded %d cities from JSON", len(themeCities))

	// Initialize Cassandra client
	cassandraConfig := config.CassandraConfig{
		Hosts:    []string{"localhost"},
		Keyspace: "spontra_destinations",
		Username: "",
		Password: "",
	}

	client, err := cassandra.NewClient(cassandraConfig)
	if err != nil {
		log.Fatalf("❌ Failed to create Cassandra client: %v", err)
	}
	defer client.Close()

	log.Println("✅ Connected to Cassandra")

	// Initialize theme definitions
	ctx := context.Background()
	if err := client.InitializeThemeDefinitions(ctx); err != nil {
		log.Printf("⚠️  Warning: Failed to initialize theme definitions: %v", err)
	}

	// Convert TypeScript cities to Cassandra format
	cassandraDestinations := convertToCassandraFormat(themeCities)
	log.Printf("🔄 Converted %d destinations to Cassandra format", len(cassandraDestinations))

	// Store destinations in batches
	batchSize := 20
	for i := 0; i < len(cassandraDestinations); i += batchSize {
		end := i + batchSize
		if end > len(cassandraDestinations) {
			end = len(cassandraDestinations)
		}

		batch := cassandraDestinations[i:end]
		log.Printf("📦 Storing batch %d-%d (%d destinations)", i+1, end, len(batch))

		if err := client.StoreThemeDestinations(ctx, batch); err != nil {
			log.Fatalf("❌ Failed to store destinations batch: %v", err)
		}

		// Small delay between batches
		time.Sleep(100 * time.Millisecond)
	}

	log.Println("✅ Migration completed successfully!")

	// Verify the migration
	log.Println("🔍 Verifying migration...")
	if err := verifyMigration(ctx, client, themeCities); err != nil {
		log.Printf("⚠️  Verification warning: %v", err)
	} else {
		log.Println("✅ Migration verification passed")
	}

	log.Println("🎉 Theme Cities Migration Complete!")
	log.Printf("📈 Successfully migrated %d destinations with multi-theme scoring", len(themeCities))
}

// readThemeCitiesFromJSON reads theme cities from a JSON file
func readThemeCitiesFromJSON(filename string) ([]ThemeCity, error) {
	data, err := ioutil.ReadFile(filename)
	if err != nil {
		return nil, fmt.Errorf("failed to read file: %w", err)
	}

	var themeCitiesData ThemeCitiesData
	if err := json.Unmarshal(data, &themeCitiesData); err != nil {
		return nil, fmt.Errorf("failed to unmarshal JSON: %w", err)
	}

	return themeCitiesData.AllCities, nil
}

// convertToCassandraFormat converts TypeScript ThemeCity to Cassandra ThemeDestination
func convertToCassandraFormat(themeCities []ThemeCity) []cassandra.ThemeDestination {
	var destinations []cassandra.ThemeDestination
	now := time.Now()

	for _, city := range themeCities {
		// Calculate popularity score from theme scores
		popularityScore := 0.0
		for _, score := range city.ThemeScores {
			if float64(score) > popularityScore {
				popularityScore = float64(score)
			}
		}

		dest := cassandra.ThemeDestination{
			ID:                uuid.New(),
			IataCode:          city.IataCode,
			CityName:          city.CityName,
			CountryName:       city.CountryName,
			CountryCode:       city.CountryCode,
			ThemeScores:       city.ThemeScores,
			Highlights:        city.Highlights,
			Description:       city.Description,
			AverageFlightTime: city.AverageFlightTime,
			PriceRange:        city.PriceRange,
			BestMonths:        city.BestMonths,
			ImageURL:          "", // Empty for now, can be populated later
			PopularityScore:   popularityScore,
			Timezone:          getTimezoneForCountry(city.CountryCode),
			Language:          getLanguagesForCountry(city.CountryCode),
			Currency:          getCurrencyForCountry(city.CountryCode),
			VisaRequired:      false, // Default to false, can be updated based on requirements
			CreatedAt:         now,
			UpdatedAt:         now,
		}

		destinations = append(destinations, dest)
	}

	return destinations
}

// verifyMigration verifies that the migration was successful
func verifyMigration(ctx context.Context, client *cassandra.Client, originalCities []ThemeCity) error {
	log.Println("🔍 Checking sample destinations...")

	// Test a few sample destinations
	sampleIATA := []string{"BCN", "IBZ", "AMS", "LAS", "FLR"}

	for _, iata := range sampleIATA {
		dest, err := client.GetDestinationByIataCode(ctx, iata)
		if err != nil {
			return fmt.Errorf("failed to get destination %s: %w", iata, err)
		}

		if dest == nil {
			return fmt.Errorf("destination %s not found in database", iata)
		}

		log.Printf("✅ %s (%s): %d theme scores", dest.CityName, dest.IataCode, len(dest.ThemeScores))
	}

	// Test theme-based queries
	log.Println("🔍 Testing theme-based queries...")
	themes := []string{"party", "adventure", "learn", "shopping", "beach"}

	for _, theme := range themes {
		destinations, err := client.GetDestinationsByTheme(ctx, theme, 10, 60)
		if err != nil {
			return fmt.Errorf("failed to get destinations for theme %s: %w", theme, err)
		}

		log.Printf("✅ Theme '%s': %d destinations found", theme, len(destinations))
	}

	return nil
}

// Helper functions for setting default metadata
func getTimezoneForCountry(countryCode string) string {
	timezones := map[string]string{
		"ES": "Europe/Madrid",
		"IT": "Europe/Rome",
		"FR": "Europe/Paris",
		"DE": "Europe/Berlin",
		"NL": "Europe/Amsterdam",
		"BE": "Europe/Brussels",
		"CH": "Europe/Zurich",
		"AT": "Europe/Vienna",
		"GB": "Europe/London",
		"PT": "Europe/Lisbon",
		"GR": "Europe/Athens",
		"CZ": "Europe/Prague",
		"HU": "Europe/Budapest",
		"PL": "Europe/Warsaw",
		"SE": "Europe/Stockholm",
		"NO": "Europe/Oslo",
		"DK": "Europe/Copenhagen",
		"FI": "Europe/Helsinki",
		"EE": "Europe/Tallinn",
		"LV": "Europe/Riga",
		"LT": "Europe/Vilnius",
		"HR": "Europe/Zagreb",
		"SI": "Europe/Ljubljana",
		"SK": "Europe/Bratislava",
		"RO": "Europe/Bucharest",
		"MT": "Europe/Malta",
		"US": "America/New_York",
		"JP": "Asia/Tokyo",
		"AE": "Asia/Dubai",
		"TH": "Asia/Bangkok",
		"SG": "Asia/Singapore",
		"MX": "America/Mexico_City",
		"BR": "America/Sao_Paulo",
		"EG": "Africa/Cairo",
	}

	if tz, exists := timezones[countryCode]; exists {
		return tz
	}
	return "UTC"
}

func getLanguagesForCountry(countryCode string) []string {
	languages := map[string][]string{
		"ES": {"Spanish"},
		"IT": {"Italian"},
		"FR": {"French"},
		"DE": {"German"},
		"NL": {"Dutch"},
		"BE": {"Dutch", "French"},
		"CH": {"German", "French", "Italian"},
		"AT": {"German"},
		"GB": {"English"},
		"PT": {"Portuguese"},
		"GR": {"Greek"},
		"CZ": {"Czech"},
		"HU": {"Hungarian"},
		"PL": {"Polish"},
		"SE": {"Swedish"},
		"NO": {"Norwegian"},
		"DK": {"Danish"},
		"FI": {"Finnish"},
		"EE": {"Estonian"},
		"LV": {"Latvian"},
		"LT": {"Lithuanian"},
		"HR": {"Croatian"},
		"SI": {"Slovenian"},
		"SK": {"Slovak"},
		"RO": {"Romanian"},
		"MT": {"Maltese", "English"},
		"US": {"English"},
		"JP": {"Japanese"},
		"AE": {"Arabic", "English"},
		"TH": {"Thai"},
		"SG": {"English", "Mandarin", "Malay", "Tamil"},
		"MX": {"Spanish"},
		"BR": {"Portuguese"},
		"EG": {"Arabic"},
	}

	if langs, exists := languages[countryCode]; exists {
		return langs
	}
	return []string{"English"}
}

func getCurrencyForCountry(countryCode string) string {
	currencies := map[string]string{
		"ES": "EUR", "IT": "EUR", "FR": "EUR", "DE": "EUR", "NL": "EUR", "BE": "EUR",
		"CH": "CHF", "AT": "EUR", "GB": "GBP", "PT": "EUR", "GR": "EUR", "CZ": "CZK",
		"HU": "HUF", "PL": "PLN", "SE": "SEK", "NO": "NOK", "DK": "DKK", "FI": "EUR",
		"EE": "EUR", "LV": "EUR", "LT": "EUR", "HR": "EUR", "SI": "EUR", "SK": "EUR",
		"RO": "RON", "MT": "EUR", "US": "USD", "JP": "JPY", "AE": "AED", "TH": "THB",
		"SG": "SGD", "MX": "MXN", "BR": "BRL", "EG": "EGP",
	}

	if currency, exists := currencies[countryCode]; exists {
		return currency
	}
	return "EUR"
}