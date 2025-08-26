package handlers

import (
    "net/http"
    "strconv"
    "strings"

    "github.com/gin-gonic/gin"
    "spontra/search-service/internal/repository"
)

// DurationHandler serves flight duration data
type DurationHandler struct {
    durations *repository.DurationRepository
}

func NewDurationHandler(repo *repository.DurationRepository) *DurationHandler {
    return &DurationHandler{durations: repo}
}

// GetRouteDuration returns duration for a specific route
func (h *DurationHandler) GetRouteDuration(c *gin.Context) {
    origin := strings.ToUpper(strings.TrimSpace(c.Query("origin")))
    destination := strings.ToUpper(strings.TrimSpace(c.Query("destination")))
    if origin == "" || destination == "" {
        c.JSON(http.StatusBadRequest, gin.H{"error": "origin and destination are required"})
        return
    }

    d, err := h.durations.GetFlightDuration(origin, destination)
    if err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
        return
    }
    c.JSON(http.StatusOK, gin.H{"duration": d})
}

// ListByOrigin returns durations for an origin
func (h *DurationHandler) ListByOrigin(c *gin.Context) {
    origin := strings.ToUpper(c.Param("origin"))
    if origin == "" {
        c.JSON(http.StatusBadRequest, gin.H{"error": "origin is required"})
        return
    }
    limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
    list, err := h.durations.GetFlightDurationsForOrigin(origin, limit)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    c.JSON(http.StatusOK, gin.H{"items": list, "count": len(list)})
}

// GetDirect returns direct flight duration for a route
func (h *DurationHandler) GetDirect(c *gin.Context) {
    origin := strings.ToUpper(strings.TrimSpace(c.Query("origin")))
    destination := strings.ToUpper(strings.TrimSpace(c.Query("destination")))
    if origin == "" || destination == "" {
        c.JSON(http.StatusBadRequest, gin.H{"error": "origin and destination are required"})
        return
    }
    d, err := h.durations.GetDirectFlights(origin, destination)
    if err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
        return
    }
    c.JSON(http.StatusOK, gin.H{"duration": d})
}

// ListByRange returns flights within duration range
func (h *DurationHandler) ListByRange(c *gin.Context) {
    origin := strings.ToUpper(strings.TrimSpace(c.Query("origin")))
    min, _ := strconv.Atoi(c.DefaultQuery("min", "0"))
    max, _ := strconv.Atoi(c.DefaultQuery("max", "1440"))
    limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
    if origin == "" {
        c.JSON(http.StatusBadRequest, gin.H{"error": "origin is required"})
        return
    }
    list, err := h.durations.GetFlightsByDurationRange(origin, min, max, limit)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    c.JSON(http.StatusOK, gin.H{"items": list, "count": len(list)})
}

// PopularDestinations returns popular destinations from an origin
func (h *DurationHandler) PopularDestinations(c *gin.Context) {
    origin := strings.ToUpper(strings.TrimSpace(c.Query("origin")))
    directOnly := c.DefaultQuery("directOnly", "false") == "true"
    limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
    if origin == "" {
        c.JSON(http.StatusBadRequest, gin.H{"error": "origin is required"})
        return
    }
    list, err := h.durations.GetPopularDestinations(origin, directOnly, limit)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    c.JSON(http.StatusOK, gin.H{"items": list, "count": len(list)})
}

// RouteStats returns aggregated route statistics
func (h *DurationHandler) RouteStats(c *gin.Context) {
    stats, err := h.durations.GetRouteStatistics()
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    c.JSON(http.StatusOK, stats)
}

// Connectivity returns connectivity metrics for an airport
func (h *DurationHandler) Connectivity(c *gin.Context) {
    airport := strings.ToUpper(c.Param("airport"))
    if airport == "" {
        c.JSON(http.StatusBadRequest, gin.H{"error": "airport is required"})
        return
    }
    stats, err := h.durations.GetAirportConnectivity(airport)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    c.JSON(http.StatusOK, stats)
}


