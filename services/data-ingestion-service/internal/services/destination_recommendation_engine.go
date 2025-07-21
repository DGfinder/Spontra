package services

import (
	"context"
	"fmt"
	"log"
	"math"
	"sort"
	"time"

	"spontra/data-ingestion-service/internal/cassandra"
	"spontra/data-ingestion-service/internal/models"
)

// DestinationRecommendationEngine provides intelligent destination recommendations
type DestinationRecommendationEngine struct {
	cassandraClient *cassandra.Client
	csvImportService *CSVImportService
}

// NewDestinationRecommendationEngine creates a new recommendation engine
func NewDestinationRecommendationEngine(cassandraClient *cassandra.Client, csvImportService *CSVImportService) *DestinationRecommendationEngine {
	return &DestinationRecommendationEngine{
		cassandraClient:  cassandraClient,
		csvImportService: csvImportService,
	}
}

// RecommendDestinations finds and ranks destinations based on user preferences
func (e *DestinationRecommendationEngine) RecommendDestinations(ctx context.Context, request models.DestinationExploreRequest) (*models.DestinationExploreResponse, error) {
	startTime := time.Now()
	log.Printf("Starting destination recommendation for origin: %s, duration: %d-%d hours, activities: %v", 
		request.OriginAirportCode, request.MinFlightDurationHours, request.MaxFlightDurationHours, request.PreferredActivities)

	// Step 1: Get flight routes within the time range
	routes, err := e.csvImportService.GetFlightRoutesByTimeRange(ctx, 
		request.OriginAirportCode, 
		request.MinFlightDurationHours, 
		request.MaxFlightDurationHours)
	if err != nil {
		return nil, fmt.Errorf("failed to get flight routes: %w", err)
	}

	if len(routes) == 0 {
		return &models.DestinationExploreResponse{
			ID:                      request.ID + "_response",
			ExploreRequestID:        request.ID,
			RecommendedDestinations: []models.DestinationRecommendation{},
			TotalResults:            0,
			SearchedAt:              time.Now(),
			ProcessingTimeMs:        int(time.Since(startTime).Milliseconds()),
		}, nil
	}

	log.Printf("Found %d flight routes within time range", len(routes))

	// Step 2: Get destinations for each route and calculate recommendations
	var recommendations []models.DestinationRecommendation
	destinationCache := make(map[string]*models.Destination)

	for _, route := range routes {
		// Skip if we've already processed this destination
		if _, exists := destinationCache[route.DestinationAirportCode]; exists {
			continue
		}

		// Get destination information
		destination, err := e.csvImportService.GetDestination(ctx, route.DestinationAirportCode)
		if err != nil {
			log.Printf("Error getting destination info for %s: %v", route.DestinationAirportCode, err)
			continue
		}

		// If no destination data, create a basic one or skip
		if destination == nil {
			log.Printf("No destination data found for %s, skipping", route.DestinationAirportCode)
			continue
		}

		destinationCache[route.DestinationAirportCode] = destination

		// Calculate recommendation
		recommendation := e.calculateRecommendation(*destination, route, request)
		if recommendation.MatchScore > 0 {
			recommendations = append(recommendations, recommendation)
		}
	}

	// Step 3: Sort recommendations by match score
	sort.Slice(recommendations, func(i, j int) bool {
		return recommendations[i].MatchScore > recommendations[j].MatchScore
	})

	// Step 4: Limit results
	if len(recommendations) > request.MaxResults {
		recommendations = recommendations[:request.MaxResults]
	}

	log.Printf("Generated %d destination recommendations in %v", len(recommendations), time.Since(startTime))

	return &models.DestinationExploreResponse{
		ID:                      request.ID + "_response",
		ExploreRequestID:        request.ID,
		RecommendedDestinations: recommendations,
		TotalResults:            len(recommendations),
		SearchedAt:              time.Now(),
		ProcessingTimeMs:        int(time.Since(startTime).Milliseconds()),
	}, nil
}

// calculateRecommendation creates a recommendation with match scoring
func (e *DestinationRecommendationEngine) calculateRecommendation(destination models.Destination, route models.FlightRoute, request models.DestinationExploreRequest) models.DestinationRecommendation {
	// Calculate base match score using the destination's own method
	baseScore := destination.MatchesPreferences(&request)

	// Apply additional scoring factors
	enhancedScore := e.enhanceMatchScore(baseScore, destination, route, request)

	// Get matching activities
	matchingActivities := destination.GetMatchingActivities(request.PreferredActivities)

	// Generate reason for recommendation
	reason := e.generateRecommendationReason(destination, route, request, matchingActivities)

	// Estimate flight price (placeholder - could integrate with real pricing API)
	estimatedPrice := e.estimateFlightPrice(route, destination)

	return models.DestinationRecommendation{
		Destination:             destination,
		FlightRoute:             route,
		MatchScore:              enhancedScore,
		ActivityMatches:         matchingActivities,
		ReasonForRecommendation: reason,
		EstimatedFlightPrice:    estimatedPrice,
	}
}

// enhanceMatchScore applies additional factors to improve match scoring
func (e *DestinationRecommendationEngine) enhanceMatchScore(baseScore float64, destination models.Destination, route models.FlightRoute, request models.DestinationExploreRequest) float64 {
	score := baseScore

	// Flight duration preference bonus (prefer shorter flights slightly)
	durationHours := route.GetTotalDurationHours()
	rangeHours := float64(request.MaxFlightDurationHours - request.MinFlightDurationHours)
	if rangeHours > 0 {
		// Give slight preference to flights in the lower half of the time range
		relativeDuration := (durationHours - float64(request.MinFlightDurationHours)) / rangeHours
		durationBonus := (1.0 - relativeDuration*0.2) * 5.0 // Up to 5 point bonus
		score += durationBonus
	}

	// Activity quality bonus
	if len(request.PreferredActivities) > 0 {
		totalActivityScore := 0.0
		matchingActivities := 0
		
		for _, prefActivity := range request.PreferredActivities {
			activityScore := destination.GetActivityScore(prefActivity)
			if activityScore > 0 {
				totalActivityScore += activityScore
				matchingActivities++
			}
		}
		
		if matchingActivities > 0 {
			avgActivityScore := totalActivityScore / float64(matchingActivities)
			// Scale activity score (0-10) to bonus points (0-10)
			activityBonus := avgActivityScore
			score += activityBonus
		}
	}

	// Popular destination bonus
	popularityBonus := (destination.PopularityScore / 100.0) * 3.0 // Up to 3 point bonus
	score += popularityBonus

	// Ensure score doesn't exceed 100
	if score > 100 {
		score = 100
	}

	return math.Round(score*10) / 10 // Round to 1 decimal place
}

// generateRecommendationReason creates a human-readable reason for the recommendation
func (e *DestinationRecommendationEngine) generateRecommendationReason(destination models.Destination, route models.FlightRoute, request models.DestinationExploreRequest, matchingActivities []models.ActivityType) string {
	durationText := fmt.Sprintf("%.1fh flight", route.GetTotalDurationHours())
	
	if len(matchingActivities) == 0 {
		return fmt.Sprintf("Perfect for a short getaway - just a %s to %s", durationText, destination.CityName)
	}
	
	if len(matchingActivities) == 1 {
		activityText := e.getActivityDisplayName(matchingActivities[0])
		return fmt.Sprintf("Great for %s - %s with excellent %s options", activityText, durationText, activityText)
	}
	
	if len(matchingActivities) == 2 {
		activity1 := e.getActivityDisplayName(matchingActivities[0])
		activity2 := e.getActivityDisplayName(matchingActivities[1])
		return fmt.Sprintf("Perfect for %s and %s - %s to %s", activity1, activity2, durationText, destination.CityName)
	}
	
	// Multiple activities
	activity1 := e.getActivityDisplayName(matchingActivities[0])
	return fmt.Sprintf("Ideal for %s and %d other activities - %s to %s", activity1, len(matchingActivities)-1, durationText, destination.CityName)
}

// getActivityDisplayName converts activity type to display name
func (e *DestinationRecommendationEngine) getActivityDisplayName(activity models.ActivityType) string {
	switch activity {
	case models.ActivityTypeActivities:
		return "activities"
	case models.ActivityTypeShopping:
		return "shopping"
	case models.ActivityTypeRestaurants:
		return "dining"
	case models.ActivityTypeNature:
		return "nature"
	case models.ActivityTypeCulture:
		return "culture"
	case models.ActivityTypeNightlife:
		return "nightlife"
	case models.ActivityTypeBeaches:
		return "beaches"
	case models.ActivityTypeSightseeing:
		return "sightseeing"
	case models.ActivityTypeAdventure:
		return "adventure"
	case models.ActivityTypeRelaxation:
		return "relaxation"
	default:
		return string(activity)
	}
}

// estimateFlightPrice provides a rough price estimate (placeholder for real pricing integration)
func (e *DestinationRecommendationEngine) estimateFlightPrice(route models.FlightRoute, destination models.Destination) string {
	durationHours := route.GetTotalDurationHours()
	
	// Very basic price estimation based on duration and destination popularity
	basePrice := 50.0 + (durationHours * 30.0) // Base price increases with duration
	popularityMultiplier := 1.0 + (destination.PopularityScore / 200.0) // Popular destinations cost more
	
	estimatedPrice := basePrice * popularityMultiplier
	
	// Round to nearest 10
	estimatedPrice = math.Round(estimatedPrice/10) * 10
	
	// Format based on currency
	switch destination.Currency {
	case "GBP":
		return fmt.Sprintf("£%.0f-%.0f", estimatedPrice*0.8, estimatedPrice*1.2)
	case "USD":
		return fmt.Sprintf("$%.0f-%.0f", estimatedPrice*0.8, estimatedPrice*1.2)
	case "CZK":
		return fmt.Sprintf("%.0f-%.0f CZK", estimatedPrice*20*0.8, estimatedPrice*20*1.2)
	default:
		return fmt.Sprintf("€%.0f-%.0f", estimatedPrice*0.8, estimatedPrice*1.2)
	}
}

// GetDestinationInsights provides insights about available destinations from an origin
func (e *DestinationRecommendationEngine) GetDestinationInsights(ctx context.Context, origin string) (*DestinationInsights, error) {
	// Get all routes from origin
	routes, err := e.cassandraClient.GetFlightRoutesFromOrigin(ctx, origin)
	if err != nil {
		return nil, fmt.Errorf("failed to get routes from origin: %w", err)
	}

	insights := &DestinationInsights{
		OriginAirport:     origin,
		TotalDestinations: len(routes),
		DurationRanges:    make(map[string]int),
		PopularActivities: make(map[models.ActivityType]int),
		Countries:         make(map[string]int),
		BudgetLevels:      make(map[string]int),
	}

	// Analyze routes and destinations
	for _, route := range routes {
		// Duration analysis
		durationHours := int(route.GetTotalDurationHours())
		var durationRange string
		switch {
		case durationHours < 2:
			durationRange = "0-2h"
		case durationHours < 4:
			durationRange = "2-4h"
		case durationHours < 6:
			durationRange = "4-6h"
		case durationHours < 8:
			durationRange = "6-8h"
		default:
			durationRange = "8h+"
		}
		insights.DurationRanges[durationRange]++

		// Get destination data for further analysis
		destination, err := e.csvImportService.GetDestination(ctx, route.DestinationAirportCode)
		if err != nil || destination == nil {
			continue
		}

		// Country analysis
		insights.Countries[destination.CountryName]++

		// Budget analysis
		insights.BudgetLevels[destination.Budget.Level]++

		// Activity analysis
		for _, activity := range destination.Activities {
			if activity.Score >= 7.0 { // Only count high-rated activities
				insights.PopularActivities[activity.Type]++
			}
		}
	}

	return insights, nil
}

// DestinationInsights provides analytical insights about destinations reachable from an origin
type DestinationInsights struct {
	OriginAirport     string                           `json:"origin_airport"`
	TotalDestinations int                              `json:"total_destinations"`
	DurationRanges    map[string]int                   `json:"duration_ranges"`
	PopularActivities map[models.ActivityType]int      `json:"popular_activities"`
	Countries         map[string]int                   `json:"countries"`
	BudgetLevels      map[string]int                   `json:"budget_levels"`
}

// FindSimilarDestinations finds destinations similar to a given destination
func (e *DestinationRecommendationEngine) FindSimilarDestinations(ctx context.Context, targetAirportCode string, origin string) ([]models.DestinationRecommendation, error) {
	// Get the target destination
	targetDestination, err := e.csvImportService.GetDestination(ctx, targetAirportCode)
	if err != nil || targetDestination == nil {
		return nil, fmt.Errorf("target destination not found: %s", targetAirportCode)
	}

	// Get all routes from origin
	routes, err := e.cassandraClient.GetFlightRoutesFromOrigin(ctx, origin)
	if err != nil {
		return nil, fmt.Errorf("failed to get routes from origin: %w", err)
	}

	var similarities []models.DestinationRecommendation

	for _, route := range routes {
		if route.DestinationAirportCode == targetAirportCode {
			continue // Skip the target destination itself
		}

		destination, err := e.csvImportService.GetDestination(ctx, route.DestinationAirportCode)
		if err != nil || destination == nil {
			continue
		}

		// Calculate similarity score
		similarityScore := e.calculateSimilarityScore(*targetDestination, *destination)
		
		if similarityScore > 50.0 { // Only include reasonably similar destinations
			recommendation := models.DestinationRecommendation{
				Destination:             *destination,
				FlightRoute:             route,
				MatchScore:              similarityScore,
				ActivityMatches:         e.getCommonActivities(*targetDestination, *destination),
				ReasonForRecommendation: fmt.Sprintf("Similar to %s - comparable %s experience", targetDestination.CityName, e.getSimilarityReason(*targetDestination, *destination)),
				EstimatedFlightPrice:    e.estimateFlightPrice(route, *destination),
			}
			similarities = append(similarities, recommendation)
		}
	}

	// Sort by similarity score
	sort.Slice(similarities, func(i, j int) bool {
		return similarities[i].MatchScore > similarities[j].MatchScore
	})

	return similarities, nil
}

// calculateSimilarityScore calculates how similar two destinations are
func (e *DestinationRecommendationEngine) calculateSimilarityScore(target, candidate models.Destination) float64 {
	score := 0.0

	// Budget level similarity (30%)
	if target.Budget.Level == candidate.Budget.Level {
		score += 30.0
	}

	// Activity similarity (40%)
	commonActivities := e.getCommonActivities(target, candidate)
	if len(target.Activities) > 0 {
		activitySimilarity := float64(len(commonActivities)) / float64(len(target.Activities))
		score += activitySimilarity * 40.0
	}

	// Climate similarity (15%)
	if target.ClimateInfo.ClimateType == candidate.ClimateInfo.ClimateType {
		score += 15.0
	}

	// Popularity similarity (15%)
	popularityDiff := math.Abs(target.PopularityScore - candidate.PopularityScore)
	popularitySimilarity := 1.0 - (popularityDiff / 100.0)
	score += popularitySimilarity * 15.0

	return math.Round(score*10) / 10
}

// getCommonActivities finds activities common to both destinations
func (e *DestinationRecommendationEngine) getCommonActivities(dest1, dest2 models.Destination) []models.ActivityType {
	var common []models.ActivityType
	
	for _, activity1 := range dest1.Activities {
		for _, activity2 := range dest2.Activities {
			if activity1.Type == activity2.Type && activity1.Score >= 6.0 && activity2.Score >= 6.0 {
				common = append(common, activity1.Type)
				break
			}
		}
	}
	
	return common
}

// getSimilarityReason generates a reason for why destinations are similar
func (e *DestinationRecommendationEngine) getSimilarityReason(target, candidate models.Destination) string {
	commonActivities := e.getCommonActivities(target, candidate)
	
	if len(commonActivities) > 0 {
		return e.getActivityDisplayName(commonActivities[0])
	}
	
	if target.Budget.Level == candidate.Budget.Level {
		return target.Budget.Level + " travel"
	}
	
	if target.ClimateInfo.ClimateType == candidate.ClimateInfo.ClimateType {
		return target.ClimateInfo.ClimateType + " climate"
	}
	
	return "travel experience"
}