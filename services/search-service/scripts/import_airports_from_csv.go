package main

import (
    "database/sql"
    "encoding/csv"
    "errors"
    "flag"
    "fmt"
    "io"
    "log"
    "os"
    "path/filepath"
    "strconv"
    "strings"

    _ "github.com/lib/pq"
    "golang.org/x/text/language"
    "golang.org/x/text/language/display"
)

func main() {
    airportsPath := flag.String("airports", "", "Path to airports.csv from the Airports dataset")
    cityCodesPath := flag.String("citycodes", "", "Optional path to citycodes.csv for city name lookups")
    dbURL := flag.String("db", os.Getenv("DATABASE_URL"), "Postgres connection string")
    flag.Parse()

    if *airportsPath == "" {
        log.Fatal("-airports path is required")
    }

    if *dbURL == "" {
        *dbURL = "postgres://spontra:development@localhost:15432/search_service_db?sslmode=disable"
    }

    if err := run(*dbURL, *airportsPath, *cityCodesPath); err != nil {
        log.Fatal(err)
    }
}

func run(connStr, airportsPath, cityCodesPath string) error {
    if _, err := os.Stat(airportsPath); err != nil {
        return fmt.Errorf("airports csv: %w", err)
    }

    cityLookup, err := buildCityLookup(cityCodesPath)
    if err != nil {
        return err
    }

    db, err := sql.Open("postgres", connStr)
    if err != nil {
        return fmt.Errorf("open db: %w", err)
    }
    defer db.Close()

    if err := db.Ping(); err != nil {
        return fmt.Errorf("ping db: %w", err)
    }

    file, err := os.Open(airportsPath)
    if err != nil {
        return fmt.Errorf("open airports csv: %w", err)
    }
    defer file.Close()

    reader := csv.NewReader(file)
    reader.FieldsPerRecord = -1

    header, err := reader.Read()
    if err != nil {
        return fmt.Errorf("read header: %w", err)
    }

    idx := make(map[string]int)
    for i, name := range header {
        idx[strings.ToLower(strings.TrimSpace(name))] = i
    }

    requiredCols := []string{"code", "name", "country", "type"}
    for _, col := range requiredCols {
        if _, ok := idx[col]; !ok {
            return fmt.Errorf("airports csv missing required column %q", col)
        }
    }

    tx, err := db.Begin()
    if err != nil {
        return fmt.Errorf("begin tx: %w", err)
    }

    stmt, err := tx.Prepare(`
        INSERT INTO airports (
            iata_code, icao_code, name, city, country, country_code,
            latitude, longitude, timezone, altitude_ft, website, city_code, is_active, updated_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,true,NOW())
        ON CONFLICT (iata_code) DO UPDATE SET
            icao_code = EXCLUDED.icao_code,
            name = EXCLUDED.name,
            city = EXCLUDED.city,
            country = EXCLUDED.country,
            country_code = EXCLUDED.country_code,
            latitude = EXCLUDED.latitude,
            longitude = EXCLUDED.longitude,
            timezone = EXCLUDED.timezone,
            altitude_ft = EXCLUDED.altitude_ft,
            website = EXCLUDED.website,
            city_code = EXCLUDED.city_code,
            is_active = true,
            updated_at = NOW();`)
    if err != nil {
        tx.Rollback()
        return fmt.Errorf("prepare stmt: %w", err)
    }
    defer stmt.Close()

    var inserted, skipped int

    for {
        record, err := reader.Read()
        if errors.Is(err, io.EOF) {
            break
        }
        if err != nil {
            tx.Rollback()
            return fmt.Errorf("read record: %w", err)
        }

        rec := csvRecord{row: record, idx: idx}

        iata := strings.ToUpper(strings.TrimSpace(rec.get("code")))
        if len(iata) != 3 {
            skipped++
            continue
        }

        recordType := strings.ToUpper(strings.TrimSpace(rec.get("type")))
        if recordType != "AP" && recordType != "AH" && recordType != "AF" && recordType != "HP" {
            skipped++
            continue
        }

        name := strings.TrimSpace(rec.get("name"))
        if name == "" {
            skipped++
            continue
        }

        icao := strings.ToUpper(strings.TrimSpace(rec.get("icao")))
        city := strings.TrimSpace(rec.get("city"))
        if city == "" {
            cityCode := strings.ToUpper(strings.TrimSpace(rec.get("city_code")))
            if mapped, ok := cityLookup[cityCode]; ok {
                city = mapped
            } else if cityCode != "" {
                city = cityCode
            } else {
                city = name
            }
        }

        countryCode := strings.ToUpper(strings.TrimSpace(rec.get("country")))
        countryName := countryFromISO(countryCode)
        if countryName == "" {
            countryName = countryCode
        }

        timezone := strings.TrimSpace(rec.get("time_zone"))
        website := strings.TrimSpace(rec.get("url"))

        latitude := parseNullableFloat(rec.get("latitude"))
        longitude := parseNullableFloat(rec.get("longitude"))
        altitude := parseNullableInt(rec.get("elevation"))

        cityCode := strings.ToUpper(strings.TrimSpace(rec.get("city_code")))

        if _, err := stmt.Exec(iata, icao, name, city, countryName, countryCode, latitude, longitude, timezone, altitude, website, cityCode); err != nil {
            tx.Rollback()
            return fmt.Errorf("upsert %s: %w", iata, err)
        }
        inserted++
    }

    if err := tx.Commit(); err != nil {
        return fmt.Errorf("commit: %w", err)
    }

    fmt.Printf("Imported %d airports (%d skipped) from %s\n", inserted, skipped, filepath.Base(airportsPath))
    return nil
}

type csvRecord struct {
    row []string
    idx map[string]int
}

func (r csvRecord) get(column string) string {
    if idx, ok := r.idx[column]; ok && idx < len(r.row) {
        return r.row[idx]
    }
    return ""
}

func buildCityLookup(path string) (map[string]string, error) {
    lookup := make(map[string]string)
    if strings.TrimSpace(path) == "" {
        return lookup, nil
    }

    file, err := os.Open(path)
    if err != nil {
        return nil, fmt.Errorf("open citycodes csv: %w", err)
    }
    defer file.Close()

    reader := csv.NewReader(file)
    reader.FieldsPerRecord = -1

    header, err := reader.Read()
    if err != nil {
        return nil, fmt.Errorf("read citycodes header: %w", err)
    }

    idx := make(map[string]int)
    for i, name := range header {
        idx[strings.ToLower(strings.TrimSpace(name))] = i
    }

    codeIdx, ok := idx["code"]
    if !ok {
        return nil, fmt.Errorf("citycodes csv missing column 'code'")
    }

    cityIdx, ok := idx["city"]
    if !ok {
        cityIdx = -1
    }

    nameIdx, ok := idx["name"]
    if !ok {
        nameIdx = -1
    }

    for {
        record, err := reader.Read()
        if errors.Is(err, io.EOF) {
            break
        }
        if err != nil {
            return nil, fmt.Errorf("read citycodes record: %w", err)
        }

        if codeIdx >= len(record) {
            continue
        }
        code := strings.ToUpper(strings.TrimSpace(record[codeIdx]))
        if code == "" {
            continue
        }

        city := ""
        if cityIdx >= 0 && cityIdx < len(record) {
            city = strings.TrimSpace(record[cityIdx])
        }
        if city == "" && nameIdx >= 0 && nameIdx < len(record) {
            city = strings.TrimSpace(record[nameIdx])
        }
        if city != "" {
            lookup[code] = city
        }
    }

    return lookup, nil
}

func parseNullableFloat(value string) interface{} {
    value = strings.TrimSpace(value)
    if value == "" {
        return nil
    }
    f, err := strconv.ParseFloat(value, 64)
    if err != nil {
        return nil
    }
    return f
}

func parseNullableInt(value string) interface{} {
    value = strings.TrimSpace(value)
    if value == "" {
        return nil
    }
    i, err := strconv.Atoi(value)
    if err != nil {
        return nil
    }
    return i
}

func countryFromISO(code string) string {
    if code == "" {
        return ""
    }
    region, err := language.ParseRegion(code)
    if err != nil {
        return code
    }
    if namer := display.English.Regions(); namer != nil {
        if name := namer.Name(region); name != "" {
            return name
        }
    }
    return code
}
