package elasticsearch

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/olivere/elastic/v7"
	"spontra/search-service/internal/models"
)

// SearchAggregations contains aggregated search data
type SearchAggregations struct {
	PriceRanges      []PriceRange      `json:"price_ranges"`
	Airlines         []AirlineCount    `json:"airlines"`
	DepartureTimes   []TimeSlot        `json:"departure_times"`
	DurationRanges   []DurationRange   `json:"duration_ranges"`
	StopsDistribution []StopsCount     `json:"stops_distribution"`
	PopularRoutes    []RouteCount      `json:"popular_routes"`
}

type PriceRange struct {
	Min   float64 `json:"min"`
	Max   float64 `json:"max"`
	Count int64   `json:"count"`
}

type AirlineCount struct {
	Airline string `json:"airline"`
	Count   int64  `json:"count"`
	AvgPrice float64 `json:"avg_price"`
}

type TimeSlot struct {
	Hour  int   `json:"hour"`
	Count int64 `json:"count"`
}

type DurationRange struct {
	MinHours float64 `json:"min_hours"`
	MaxHours float64 `json:"max_hours"`
	Count    int64   `json:"count"`
}

type StopsCount struct {
	Stops int   `json:"stops"`
	Count int64 `json:"count"`
}

type RouteCount struct {
	Origin      string `json:"origin"`
	Destination string `json:"destination"`
	Count       int64  `json:"count"`
	AvgPrice    float64 `json:"avg_price"`
}

// GetSearchAggregations returns aggregated data for search filters and insights
func (c *Client) GetSearchAggregations(req *models.FlightSearchRequest) (*SearchAggregations, error) {
	// Build base query (same as search but without pagination)
	baseQuery := c.buildFlightSearchQuery(req)

	// Create aggregations
	aggs := elastic.NewSearchService(c.client).
		Index(c.getFlightIndex()).
		Query(baseQuery).
		Size(0) // We only want aggregations, not documents

	// Price ranges aggregation
	priceHistogram := elastic.NewHistogramAggregation().
		Field("price").
		Interval(50).
		MinDocCount(1)
	aggs.Aggregation("price_ranges", priceHistogram)

	// Airlines aggregation with average price
	airlinesAgg := elastic.NewTermsAggregation().
		Field("airline").
		Size(20).
		SubAggregation("avg_price", elastic.NewAvgAggregation().Field("price"))
	aggs.Aggregation("airlines", airlinesAgg)

	// Departure time slots (by hour)
	departureTimeAgg := elastic.NewDateHistogramAggregation().
		Field("departure_time").
		CalendarInterval("hour").
		Format("HH")
	aggs.Aggregation("departure_times", departureTimeAgg)

	// Duration ranges
	durationHistogram := elastic.NewHistogramAggregation().
		Field("duration_minutes").
		Interval(60). // 1-hour intervals
		MinDocCount(1)
	aggs.Aggregation("duration_ranges", durationHistogram)

	// Stops distribution
	stopsAgg := elastic.NewTermsAggregation().
		Field("stops").
		Size(5)
	aggs.Aggregation("stops_distribution", stopsAgg)

	// Execute aggregation query
	searchResult, err := aggs.Do(context.Background())
	if err != nil {
		return nil, fmt.Errorf("aggregation search failed: %w", err)
	}

	// Parse aggregation results
	aggregations := &SearchAggregations{}

	// Parse price ranges
	if priceAgg, found := searchResult.Aggregations.Histogram("price_ranges"); found {
		for _, bucket := range priceAgg.Buckets {
			aggregations.PriceRanges = append(aggregations.PriceRanges, PriceRange{
				Min:   *bucket.Key,
				Max:   *bucket.Key + 50,
				Count: bucket.DocCount,
			})
		}
	}

	// Parse airlines
	if airlinesAgg, found := searchResult.Aggregations.Terms("airlines"); found {
		for _, bucket := range airlinesAgg.Buckets {
			airline := AirlineCount{
				Airline: bucket.Key.(string),
				Count:   bucket.DocCount,
			}
			if avgPrice, found := bucket.Avg("avg_price"); found && avgPrice.Value != nil {
				airline.AvgPrice = *avgPrice.Value
			}
			aggregations.Airlines = append(aggregations.Airlines, airline)
		}
	}

	// Parse departure times
	if timeAgg, found := searchResult.Aggregations.DateHistogram("departure_times"); found {
		for _, bucket := range timeAgg.Buckets {
			if timeStr, ok := bucket.KeyAsString; ok && *timeStr != "" {
				// Parse hour from the time string
				var hour int
				fmt.Sscanf(*timeStr, "%d", &hour)
				aggregations.DepartureTimes = append(aggregations.DepartureTimes, TimeSlot{
					Hour:  hour,
					Count: bucket.DocCount,
				})
			}
		}
	}

	// Parse duration ranges
	if durationAgg, found := searchResult.Aggregations.Histogram("duration_ranges"); found {
		for _, bucket := range durationAgg.Buckets {
			minHours := *bucket.Key / 60
			maxHours := (*bucket.Key + 60) / 60
			aggregations.DurationRanges = append(aggregations.DurationRanges, DurationRange{
				MinHours: minHours,
				MaxHours: maxHours,
				Count:    bucket.DocCount,
			})
		}
	}

	// Parse stops distribution
	if stopsAgg, found := searchResult.Aggregations.Terms("stops_distribution"); found {
		for _, bucket := range stopsAgg.Buckets {
			stops := int(bucket.Key.(float64))
			aggregations.StopsDistribution = append(aggregations.StopsDistribution, StopsCount{
				Stops: stops,
				Count: bucket.DocCount,
			})
		}
	}

	return aggregations, nil
}

// GetPopularRoutes returns the most popular routes in the system
func (c *Client) GetPopularRoutes(limit int) ([]RouteCount, error) {
	if limit <= 0 {
		limit = 20
	}

	// Create composite aggregation for origin-destination pairs
	compositeAgg := elastic.NewCompositeAggregation().
		Size(limit).
		Sources(
			elastic.NewCompositeAggregationTermsValuesSource("origin").
				Field("origin_airport"),
			elastic.NewCompositeAggregationTermsValuesSource("destination").
				Field("destination_airport"),
		).
		SubAggregation("avg_price", elastic.NewAvgAggregation().Field("price"))

	searchResult, err := c.client.Search().
		Index(c.getFlightIndex()).
		Query(elastic.NewMatchAllQuery()).
		Aggregation("popular_routes", compositeAgg).
		Size(0).
		Do(context.Background())

	if err != nil {
		return nil, fmt.Errorf("popular routes aggregation failed: %w", err)
	}

	var routes []RouteCount
	if routesAgg, found := searchResult.Aggregations.Composite("popular_routes"); found {
		for _, bucket := range routesAgg.Buckets {
			route := RouteCount{
				Origin:      bucket.Key["origin"].(string),
				Destination: bucket.Key["destination"].(string),
				Count:       bucket.DocCount,
			}
			if avgPrice, found := bucket.Avg("avg_price"); found && avgPrice.Value != nil {
				route.AvgPrice = *avgPrice.Value
			}
			routes = append(routes, route)
		}
	}

	return routes, nil
}

// GetPriceInsights returns price analysis for a specific route
func (c *Client) GetPriceInsights(origin, destination string, days int) (map[string]interface{}, error) {
	if days <= 0 {
		days = 30
	}

	// Date range for the last N days
	endDate := time.Now()
	startDate := endDate.AddDate(0, 0, -days)

	query := elastic.NewBoolQuery().
		Filter(elastic.NewTermQuery("origin_airport", origin)).
		Filter(elastic.NewTermQuery("destination_airport", destination)).
		Filter(elastic.NewRangeQuery("departure_time").
			Gte(startDate).
			Lte(endDate))

	// Price statistics aggregations
	searchResult, err := c.client.Search().
		Index(c.getFlightIndex()).
		Query(query).
		Aggregation("min_price", elastic.NewMinAggregation().Field("price")).
		Aggregation("max_price", elastic.NewMaxAggregation().Field("price")).
		Aggregation("avg_price", elastic.NewAvgAggregation().Field("price")).
		Aggregation("price_percentiles", elastic.NewPercentilesAggregation().
			Field("price").
			Percentiles(25, 50, 75, 90, 95)).
		Aggregation("price_trend", elastic.NewDateHistogramAggregation().
			Field("departure_time").
			CalendarInterval("day").
			SubAggregation("daily_avg", elastic.NewAvgAggregation().Field("price"))).
		Size(0).
		Do(context.Background())

	if err != nil {
		return nil, fmt.Errorf("price insights aggregation failed: %w", err)
	}

	insights := make(map[string]interface{})

	// Basic price statistics
	if minPrice, found := searchResult.Aggregations.Min("min_price"); found && minPrice.Value != nil {
		insights["min_price"] = *minPrice.Value
	}
	if maxPrice, found := searchResult.Aggregations.Max("max_price"); found && maxPrice.Value != nil {
		insights["max_price"] = *maxPrice.Value
	}
	if avgPrice, found := searchResult.Aggregations.Avg("avg_price"); found && avgPrice.Value != nil {
		insights["avg_price"] = *avgPrice.Value
	}

	// Price percentiles
	if percentiles, found := searchResult.Aggregations.Percentiles("price_percentiles"); found {
		insights["percentiles"] = percentiles.Values
	}

	// Price trend over time
	if trendAgg, found := searchResult.Aggregations.DateHistogram("price_trend"); found {
		var trend []map[string]interface{}
		for _, bucket := range trendAgg.Buckets {
			trendPoint := map[string]interface{}{
				"date":  bucket.KeyAsString,
				"count": bucket.DocCount,
			}
			if dailyAvg, found := bucket.Avg("daily_avg"); found && dailyAvg.Value != nil {
				trendPoint["avg_price"] = *dailyAvg.Value
			}
			trend = append(trend, trendPoint)
		}
		insights["price_trend"] = trend
	}

	insights["total_flights"] = searchResult.TotalHits()
	insights["date_range"] = map[string]interface{}{
		"from": startDate.Format("2006-01-02"),
		"to":   endDate.Format("2006-01-02"),
		"days": days,
	}

	return insights, nil
}

// GetAirlineComparison compares airlines for a specific route
func (c *Client) GetAirlineComparison(origin, destination string) ([]map[string]interface{}, error) {
	query := elastic.NewBoolQuery().
		Filter(elastic.NewTermQuery("origin_airport", origin)).
		Filter(elastic.NewTermQuery("destination_airport", destination))

	searchResult, err := c.client.Search().
		Index(c.getFlightIndex()).
		Query(query).
		Aggregation("airlines", elastic.NewTermsAggregation().
			Field("airline").
			Size(20).
			SubAggregation("avg_price", elastic.NewAvgAggregation().Field("price")).
			SubAggregation("min_price", elastic.NewMinAggregation().Field("price")).
			SubAggregation("avg_duration", elastic.NewAvgAggregation().Field("duration_minutes")).
			SubAggregation("stops_avg", elastic.NewAvgAggregation().Field("stops"))).
		Size(0).
		Do(context.Background())

	if err != nil {
		return nil, fmt.Errorf("airline comparison aggregation failed: %w", err)
	}

	var airlines []map[string]interface{}
	if airlinesAgg, found := searchResult.Aggregations.Terms("airlines"); found {
		for _, bucket := range airlinesAgg.Buckets {
			airline := map[string]interface{}{
				"airline":      bucket.Key.(string),
				"flight_count": bucket.DocCount,
			}

			if avgPrice, found := bucket.Avg("avg_price"); found && avgPrice.Value != nil {
				airline["avg_price"] = *avgPrice.Value
			}
			if minPrice, found := bucket.Min("min_price"); found && minPrice.Value != nil {
				airline["min_price"] = *minPrice.Value
			}
			if avgDuration, found := bucket.Avg("avg_duration"); found && avgDuration.Value != nil {
				airline["avg_duration_hours"] = *avgDuration.Value / 60
			}
			if stopsAvg, found := bucket.Avg("stops_avg"); found && stopsAvg.Value != nil {
				airline["avg_stops"] = *stopsAvg.Value
			}

			airlines = append(airlines, airline)
		}
	}

	return airlines, nil
}

// SearchWithFacets performs a search and returns both results and facets for filtering
func (c *Client) SearchWithFacets(req *models.FlightSearchRequest) (*models.FlightSearchResponse, *SearchAggregations, error) {
	baseQuery := c.buildFlightSearchQuery(req)

	searchService := c.client.Search().
		Index(c.getFlightIndex()).
		Query(baseQuery).
		Size(req.MaxResults).
		Sort(c.getSortField(req.SortBy), req.SortOrder == "asc")

	// Add aggregations for faceted search
	searchService.
		Aggregation("airlines", elastic.NewTermsAggregation().Field("airline").Size(10)).
		Aggregation("stops", elastic.NewTermsAggregation().Field("stops").Size(5)).
		Aggregation("cabin_class", elastic.NewTermsAggregation().Field("cabin_class").Size(5)).
		Aggregation("price_ranges", elastic.NewHistogramAggregation().Field("price").Interval(100))

	searchResult, err := searchService.Do(context.Background())
	if err != nil {
		return nil, nil, fmt.Errorf("faceted search failed: %w", err)
	}

	// Parse search results
	flights := make([]models.Flight, 0, len(searchResult.Hits.Hits))
	for _, hit := range searchResult.Hits.Hits {
		var flight models.Flight
		if err := json.Unmarshal(hit.Source, &flight); err != nil {
			continue
		}
		flights = append(flights, flight)
	}

	response := &models.FlightSearchResponse{
		SearchID:      req.ID,
		SearchRequest: *req,
		Flights:       flights,
		SearchMetadata: models.SearchMetadata{
			TotalResults:    int(searchResult.TotalHits()),
			ResultsReturned: len(flights),
			SearchTime:      time.Duration(searchResult.TookInMillis) * time.Millisecond,
		},
		CreatedAt: time.Now(),
		ExpiresAt: time.Now().Add(c.cfg.CacheTimeout),
	}

	// Parse facets/aggregations
	facets := &SearchAggregations{}

	// Airlines facet
	if airlinesAgg, found := searchResult.Aggregations.Terms("airlines"); found {
		for _, bucket := range airlinesAgg.Buckets {
			facets.Airlines = append(facets.Airlines, AirlineCount{
				Airline: bucket.Key.(string),
				Count:   bucket.DocCount,
			})
		}
	}

	// Stops facet
	if stopsAgg, found := searchResult.Aggregations.Terms("stops"); found {
		for _, bucket := range stopsAgg.Buckets {
			facets.StopsDistribution = append(facets.StopsDistribution, StopsCount{
				Stops: int(bucket.Key.(float64)),
				Count: bucket.DocCount,
			})
		}
	}

	// Price ranges facet
	if priceAgg, found := searchResult.Aggregations.Histogram("price_ranges"); found {
		for _, bucket := range priceAgg.Buckets {
			facets.PriceRanges = append(facets.PriceRanges, PriceRange{
				Min:   *bucket.Key,
				Max:   *bucket.Key + 100,
				Count: bucket.DocCount,
			})
		}
	}

	return response, facets, nil
}