package handlers

import (
    "database/sql"
    "encoding/json"
    "fmt"
    "log"
    "net/http"
    "os"
    "strings"
    "time"

    _ "github.com/lib/pq"
    "github.com/gin-gonic/gin"
    "github.com/google/uuid"
    "spontra/data-ingestion-service/internal/cassandra"
)

type seedAirport struct {
    Code        string
    City        string
    Country     string
    CountryCode string
}

// minimal starter list; expand as needed
var seedAirports = []seedAirport{
    {"LHR", "London", "United Kingdom", "GB"},
    {"LGW", "London", "United Kingdom", "GB"},
    {"CDG", "Paris", "France", "FR"},
    {"ORY", "Paris", "France", "FR"},
    {"NCE", "Nice", "France", "FR"},
    {"AMS", "Amsterdam", "Netherlands", "NL"},
    {"FRA", "Frankfurt", "Germany", "DE"},
    {"MUC", "Munich", "Germany", "DE"},
    {"BER", "Berlin", "Germany", "DE"},
    {"MAD", "Madrid", "Spain", "ES"},
    {"BCN", "Barcelona", "Spain", "ES"},
    {"VIE", "Vienna", "Austria", "AT"},
    {"ZUR", "Zurich", "Switzerland", "CH"},
    {"GVA", "Geneva", "Switzerland", "CH"},
    {"FCO", "Rome", "Italy", "IT"},
    {"MXP", "Milan", "Italy", "IT"},
    {"ATH", "Athens", "Greece", "GR"},
    {"LIS", "Lisbon", "Portugal", "PT"},
    {"OPO", "Porto", "Portugal", "PT"},
    {"DUB", "Dublin", "Ireland", "IE"},
}

// SeedDestinations seeds destinations in Cassandra using real flight times from search-service
func (a *App) SeedDestinations(c *gin.Context) {
    // Read origin and DB URL
    origin := strings.ToUpper(c.DefaultQuery("origin", "LHR"))
    pgURL := os.Getenv("DATABASE_URL")
    if pgURL == "" {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "DATABASE_URL environment variable not set"})
        return
    }

    // Connect to Postgres
    db, err := sql.Open("postgres", pgURL)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("failed to connect postgres: %v", err)})
        return
    }
    defer db.Close()

    // Query average durations joined with airports metadata
    const q = `
        SELECT a.iata_code, COALESCE(a.city, ''), COALESCE(a.country, ''), COALESCE(a.country_code, ''), AVG(fr.total_duration_minutes)::int as avg_minutes
        FROM flight_routes fr
        JOIN airports a ON a.iata_code = fr.destination_airport_code
        WHERE fr.origin_airport_code = $1
        GROUP BY a.iata_code, a.city, a.country, a.country_code
        ORDER BY avg_minutes ASC
        LIMIT 1000`

    rows, err := db.QueryContext(c.Request.Context(), q, origin)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("query failed: %v", err)})
        return
    }
    defer rows.Close()

    seeded := 0
    failed := 0

    for rows.Next() {
        var code, city, country, ccode string
        var avgMinutes int
        if err := rows.Scan(&code, &city, &country, &ccode, &avgMinutes); err != nil {
            failed++
            continue
        }

        dest := cassandra.ThemeDestination{
            ID:                uuid.New(),
            IataCode:          strings.ToUpper(code),
            CityName:          city,
            CountryName:       country,
            CountryCode:       ccode,
            ThemeScores:       map[string]int{},
            Highlights:        []string{},
            Description:       fmt.Sprintf("%s, %s.", city, country),
            AverageFlightTime: float64(avgMinutes) / 60.0,
            PriceRange:        "",
            BestMonths:        []string{"Apr", "May", "Sep", "Oct"},
            ImageURL:          "",
            PopularityScore:   0,
            Timezone:          "",
            Language:          []string{},
            Currency:          "",
            VisaRequired:      false,
            CreatedAt:         time.Now(),
            UpdatedAt:         time.Now(),
        }

        if err := a.cassandra.StoreThemeDestination(c.Request.Context(), dest); err != nil {
            log.Printf("Seed failed for %s: %v", code, err)
            failed++
            continue
        }
        seeded++
    }

    if err := rows.Err(); err != nil {
        log.Printf("Row iteration error: %v", err)
    }

    c.JSON(http.StatusOK, gin.H{
        "seeded": seeded,
        "failed": failed,
        "origin": origin,
    })
}


