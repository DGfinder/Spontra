package main

import (
	"database/sql"
	"fmt"
	"log"
	"math"
	"os"

	_ "github.com/lib/pq"
)

// EuropeanAirport represents major European airports with coordinates
type EuropeanAirport struct {
	Code      string
	Name      string
	City      string
	Country   string
	Latitude  float64
	Longitude float64
}

// FlightDuration represents a flight duration record
type FlightDuration struct {
	OriginAirport      string
	DestinationAirport string
	DurationMinutes    int
	DistanceKM         int
	IsDirect           bool
	TypicalStops       int
}

// Major European airports with coordinates for distance calculation
var europeanAirports = []EuropeanAirport{
	// UK & Ireland
	{"LHR", "London Heathrow", "London", "United Kingdom", 51.4700, -0.4543},
	{"LGW", "London Gatwick", "London", "United Kingdom", 51.1537, -0.1821},
	{"STN", "London Stansted", "London", "United Kingdom", 51.8860, 0.2389},
	{"MAN", "Manchester", "Manchester", "United Kingdom", 53.3537, -2.2750},
	{"EDI", "Edinburgh", "Edinburgh", "United Kingdom", 55.9500, -3.3725},
	{"DUB", "Dublin", "Dublin", "Ireland", 53.4213, -6.2701},
	
	// France
	{"CDG", "Charles de Gaulle", "Paris", "France", 49.0097, 2.5479},
	{"ORY", "Orly", "Paris", "France", 48.7233, 2.3794},
	{"NCE", "Nice Côte d'Azur", "Nice", "France", 43.6584, 7.2159},
	{"LYS", "Lyon Saint-Exupéry", "Lyon", "France", 45.7256, 5.0811},
	{"MRS", "Marseille Provence", "Marseille", "France", 43.4393, 5.2214},
	
	// Germany
	{"FRA", "Frankfurt am Main", "Frankfurt", "Germany", 50.0379, 8.5622},
	{"MUC", "Munich", "Munich", "Germany", 48.3538, 11.7861},
	{"BER", "Berlin Brandenburg", "Berlin", "Germany", 52.3667, 13.5033},
	{"DUS", "Düsseldorf", "Düsseldorf", "Germany", 51.2895, 6.7668},
	{"HAM", "Hamburg", "Hamburg", "Germany", 53.6304, 9.9882},
	{"CGN", "Cologne Bonn", "Cologne", "Germany", 50.8659, 7.1427},
	
	// Spain
	{"MAD", "Madrid-Barajas", "Madrid", "Spain", 40.4983, -3.5676},
	{"BCN", "Barcelona-El Prat", "Barcelona", "Spain", 41.2974, 2.0833},
	{"PMI", "Palma de Mallorca", "Palma", "Spain", 39.5517, 2.7388},
	{"SVQ", "Sevilla", "Seville", "Spain", 37.4180, -5.8931},
	{"VLC", "Valencia", "Valencia", "Spain", 39.4893, -0.4816},
	{"BIO", "Bilbao", "Bilbao", "Spain", 43.3011, -2.9106},
	
	// Italy
	{"FCO", "Rome Fiumicino", "Rome", "Italy", 41.8003, 12.2389},
	{"MXP", "Milan Malpensa", "Milan", "Italy", 45.6306, 8.7281},
	{"LIN", "Milan Linate", "Milan", "Italy", 45.4451, 9.2767},
	{"NAP", "Naples", "Naples", "Italy", 40.8860, 14.2908},
	{"VCE", "Venice Marco Polo", "Venice", "Italy", 45.5053, 12.3519},
	{"BGY", "Milan Bergamo", "Bergamo", "Italy", 45.6739, 9.7042},
	
	// Netherlands
	{"AMS", "Amsterdam Schiphol", "Amsterdam", "Netherlands", 52.3105, 4.7683},
	{"EIN", "Eindhoven", "Eindhoven", "Netherlands", 51.4500, 5.3747},
	
	// Belgium
	{"BRU", "Brussels", "Brussels", "Belgium", 50.9014, 4.4844},
	{"CRL", "Brussels South Charleroi", "Charleroi", "Belgium", 50.4592, 4.4638},
	
	// Switzerland
	{"ZUR", "Zurich", "Zurich", "Switzerland", 47.4647, 8.5492},
	{"GVA", "Geneva", "Geneva", "Switzerland", 46.2381, 6.1089},
	{"BSL", "Basel-Mulhouse-Freiburg", "Basel", "Switzerland", 47.5900, 7.5291},
	
	// Austria
	{"VIE", "Vienna", "Vienna", "Austria", 48.1103, 16.5697},
	{"SZG", "Salzburg", "Salzburg", "Austria", 47.7933, 13.0043},
	
	// Scandinavia
	{"ARN", "Stockholm Arlanda", "Stockholm", "Sweden", 59.6519, 17.9186},
	{"CPH", "Copenhagen", "Copenhagen", "Denmark", 55.6181, 12.6561},
	{"OSL", "Oslo Gardermoen", "Oslo", "Norway", 60.1939, 11.1004},
	{"HEL", "Helsinki-Vantaa", "Helsinki", "Finland", 60.3172, 24.9633},
	{"GOT", "Gothenburg-Landvetter", "Gothenburg", "Sweden", 57.6628, 12.2798},
	
	// Eastern Europe
	{"WAW", "Warsaw Chopin", "Warsaw", "Poland", 52.1657, 20.9671},
	{"KRK", "Kraków", "Kraków", "Poland", 50.0777, 19.7848},
	{"PRG", "Prague Václav Havel", "Prague", "Czech Republic", 50.1008, 14.2632},
	{"BUD", "Budapest Ferenc Liszt", "Budapest", "Hungary", 47.4394, 19.2556},
	{"OTP", "Bucharest Henri Coandă", "Bucharest", "Romania", 44.5711, 26.085},
	
	// Portugal
	{"LIS", "Lisbon Portela", "Lisbon", "Portugal", 38.7813, -9.1361},
	{"OPO", "Porto", "Porto", "Portugal", 41.2481, -8.6814},
	
	// Greece
	{"ATH", "Athens Eleftherios Venizelos", "Athens", "Greece", 37.9364, 23.9445},
	{"SKG", "Thessaloniki", "Thessaloniki", "Greece", 40.5197, 22.9709},
	
	// Turkey (European part)
	{"IST", "Istanbul", "Istanbul", "Turkey", 41.2753, 28.7519},
	
	// Croatia
	{"ZAG", "Zagreb", "Zagreb", "Croatia", 45.7429, 16.0688},
	{"SPU", "Split", "Split", "Croatia", 43.5389, 16.2972},
	
	// Slovenia
	{"LJU", "Ljubljana Jože Pučnik", "Ljubljana", "Slovenia", 46.2237, 14.4576},
}

func main() {
	// Get database URL from environment or use default
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		databaseURL = "postgres://postgres:password@localhost/spontra_search?sslmode=disable"
	}

	// Connect to database
	db, err := sql.Open("postgres", databaseURL)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer db.Close()

	// Test connection
	if err := db.Ping(); err != nil {
		log.Fatal("Failed to ping database:", err)
	}

	log.Println("Connected to database successfully")

	// Clear existing data
	if err := clearExistingData(db); err != nil {
		log.Fatal("Failed to clear existing data:", err)
	}

	// Generate and insert flight durations
	if err := populateFlightDurations(db); err != nil {
		log.Fatal("Failed to populate flight durations:", err)
	}

	log.Println("Flight duration database populated successfully!")
}

// clearExistingData removes existing flight duration records
func clearExistingData(db *sql.DB) error {
	log.Println("Clearing existing flight duration data...")
	
	_, err := db.Exec("DELETE FROM flight_durations")
	if err != nil {
		return fmt.Errorf("failed to clear existing data: %w", err)
	}
	
	log.Println("Existing data cleared successfully")
	return nil
}

// populateFlightDurations generates and inserts flight duration data
func populateFlightDurations(db *sql.DB) error {
	log.Printf("Generating flight durations for %d airports...", len(europeanAirports))
	
	// Prepare insert statement
	stmt, err := db.Prepare(`
		INSERT INTO flight_durations 
		(origin_airport, destination_airport, duration_minutes, distance_km, is_direct, typical_stops) 
		VALUES ($1, $2, $3, $4, $5, $6)
	`)
	if err != nil {
		return fmt.Errorf("failed to prepare statement: %w", err)
	}
	defer stmt.Close()

	count := 0
	
	// Generate durations between all airport pairs
	for i, origin := range europeanAirports {
		for j, destination := range europeanAirports {
			if i == j {
				continue // Skip same airport
			}
			
			duration := calculateFlightDuration(origin, destination)
			
			_, err := stmt.Exec(
				origin.Code,
				destination.Code,
				duration.DurationMinutes,
				duration.DistanceKM,
				duration.IsDirect,
				duration.TypicalStops,
			)
			if err != nil {
				log.Printf("Failed to insert duration for %s -> %s: %v", origin.Code, destination.Code, err)
				continue
			}
			
			count++
			if count%100 == 0 {
				log.Printf("Inserted %d flight durations...", count)
			}
		}
	}
	
	log.Printf("Successfully inserted %d flight duration records", count)
	return nil
}

// calculateFlightDuration calculates flight duration between two airports
func calculateFlightDuration(origin, destination EuropeanAirport) FlightDuration {
	// Calculate great circle distance
	distance := calculateDistance(origin.Latitude, origin.Longitude, destination.Latitude, destination.Longitude)
	
	// Average commercial aircraft speed: 850 km/h
	// Add time for taxi, takeoff, climb, descent, landing: 30-45 minutes
	avgSpeed := 850.0 // km/h
	baseTime := 35.0  // minutes for taxi, takeoff, landing procedures
	
	flightTime := (distance / avgSpeed) * 60 // Convert to minutes
	totalTime := int(flightTime + baseTime)
	
	// Determine if direct flight is typical
	isDirect := true
	stops := 0
	
	// Routes over 3000km or between certain regions often have stops
	if distance > 3000 {
		isDirect = false
		stops = 1
		totalTime += 60 // Add connection time
	}
	
	// Some specific route adjustments based on real-world aviation
	if isLongHaulEuropeanRoute(origin.Code, destination.Code) {
		isDirect = false
		stops = 1
		totalTime += 60
	}
	
	// Minimum flight time of 45 minutes (short hops)
	if totalTime < 45 {
		totalTime = 45
	}
	
	// Maximum reasonable flight time within Europe: 8 hours
	if totalTime > 480 {
		totalTime = 480
	}
	
	return FlightDuration{
		OriginAirport:      origin.Code,
		DestinationAirport: destination.Code,
		DurationMinutes:    totalTime,
		DistanceKM:         int(distance),
		IsDirect:           isDirect,
		TypicalStops:       stops,
	}
}

// calculateDistance calculates the great circle distance between two points
func calculateDistance(lat1, lon1, lat2, lon2 float64) float64 {
	const earthRadius = 6371 // Earth's radius in kilometers
	
	// Convert degrees to radians
	lat1Rad := lat1 * math.Pi / 180
	lon1Rad := lon1 * math.Pi / 180
	lat2Rad := lat2 * math.Pi / 180
	lon2Rad := lon2 * math.Pi / 180
	
	// Haversine formula
	dlat := lat2Rad - lat1Rad
	dlon := lon2Rad - lon1Rad
	
	a := math.Sin(dlat/2)*math.Sin(dlat/2) +
		math.Cos(lat1Rad)*math.Cos(lat2Rad)*
			math.Sin(dlon/2)*math.Sin(dlon/2)
	
	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))
	
	return earthRadius * c
}

// isLongHaulEuropeanRoute determines if a route typically requires connections
func isLongHaulEuropeanRoute(origin, destination string) bool {
	// Routes that typically require connections due to limited direct service
	longHaulRoutes := map[string][]string{
		"LIS": {"HEL", "OSL", "ARN", "WAW", "BUD", "OTP"}, // Lisbon to Nordic/Eastern Europe
		"OPO": {"HEL", "OSL", "ARN", "WAW", "BUD", "OTP"}, // Porto to Nordic/Eastern Europe
		"ATH": {"OSL", "ARN", "GOT", "EDI", "DUB"},        // Athens to Nordic/UK
		"SKG": {"LHR", "CDG", "FRA", "AMS", "OSL"},        // Thessaloniki often connects
		"HEL": {"LIS", "OPO", "PMI", "SVQ", "NAP"},        // Helsinki to Southern Europe
		"OSL": {"ATH", "SKG", "NAP", "PMI", "SVQ"},        // Oslo to Southern Europe
	}
	
	if destinations, exists := longHaulRoutes[origin]; exists {
		for _, dest := range destinations {
			if dest == destination {
				return true
			}
		}
	}
	
	// Check reverse direction
	if destinations, exists := longHaulRoutes[destination]; exists {
		for _, dest := range destinations {
			if dest == origin {
				return true
			}
		}
	}
	
	return false
}