package handlers

import (
    "database/sql"
    "net/http"
    "strings"

    "github.com/gin-gonic/gin"
)

// ReferenceHandler serves reference data (airlines, aircraft)
type ReferenceHandler struct {
    db *sql.DB
}

func NewReferenceHandler(db *sql.DB) *ReferenceHandler {
    return &ReferenceHandler{db: db}
}

// GetAirlines returns airlines matching query by code or name
func (h *ReferenceHandler) GetAirlines(c *gin.Context) {
    q := strings.TrimSpace(c.Query("q"))
    if q == "" {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Query parameter 'q' is required"})
        return
    }
    limit := 50
    rows, err := h.db.Query(`
        SELECT iata_code, icao_code, name, country
        FROM airlines
        WHERE LOWER(iata_code) LIKE LOWER($1) || '%' OR LOWER(icao_code) LIKE LOWER($1) || '%' OR LOWER(name) LIKE '%' || LOWER($1) || '%'
        ORDER BY name ASC
        LIMIT $2
    `, q, limit)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query airlines"})
        return
    }
    defer rows.Close()

    type Airline struct {
        IataCode string `json:"iataCode"`
        IcaoCode string `json:"icaoCode"`
        Name     string `json:"name"`
        Country  string `json:"country"`
    }
    var items []Airline
    for rows.Next() {
        var a Airline
        if err := rows.Scan(&a.IataCode, &a.IcaoCode, &a.Name, &a.Country); err == nil {
            items = append(items, a)
        }
    }
    c.JSON(http.StatusOK, gin.H{"items": items, "count": len(items)})
}

// GetAircraft returns aircraft types matching query by code/manufacturer/model
func (h *ReferenceHandler) GetAircraft(c *gin.Context) {
    q := strings.TrimSpace(c.Query("q"))
    if q == "" {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Query parameter 'q' is required"})
        return
    }
    limit := 50
    rows, err := h.db.Query(`
        SELECT code, manufacturer, model
        FROM aircraft_types
        WHERE LOWER(code) LIKE LOWER($1) || '%' OR LOWER(manufacturer) LIKE '%' || LOWER($1) || '%' OR LOWER(model) LIKE '%' || LOWER($1) || '%'
        ORDER BY manufacturer, model
        LIMIT $2
    `, q, limit)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query aircraft types"})
        return
    }
    defer rows.Close()

    type Aircraft struct {
        IcaoCode     string `json:"icaoCode"`
        Manufacturer string `json:"manufacturer"`
        Model        string `json:"name"`
    }
    var items []Aircraft
    for rows.Next() {
        var a Aircraft
        if err := rows.Scan(&a.IcaoCode, &a.Manufacturer, &a.Model); err == nil {
            items = append(items, a)
        }
    }
    c.JSON(http.StatusOK, gin.H{"items": items, "count": len(items)})
}


