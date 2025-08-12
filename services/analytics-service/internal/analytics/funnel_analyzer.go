package analytics

import (
	"context"
	"fmt"
	"log"
	"sort"
	"time"

	"spontra/analytics-service/internal/models"
	"spontra/analytics-service/internal/storage"
)

// FunnelAnalyzer analyzes conversion funnels
type FunnelAnalyzer struct {
	storage storage.Storage
}

// NewFunnelAnalyzer creates a new funnel analyzer
func NewFunnelAnalyzer(storage storage.Storage) *FunnelAnalyzer {
	return &FunnelAnalyzer{
		storage: storage,
	}
}

// FunnelAnalysis represents the result of a funnel analysis
type FunnelAnalysis struct {
	Funnel          *models.Funnel    `json:"funnel"`
	Steps           []FunnelStepResult `json:"steps"`
	TotalUsers      int               `json:"total_users"`
	ConversionRate  float64           `json:"conversion_rate"`
	DropoffRate     float64           `json:"dropoff_rate"`
	TimeRange       TimeRange         `json:"time_range"`
	Filters         map[string]interface{} `json:"filters,omitempty"`
	GeneratedAt     time.Time         `json:"generated_at"`
}

// FunnelStepResult represents the result for a single funnel step
type FunnelStepResult struct {
	Step           models.FunnelStep `json:"step"`
	Users          int               `json:"users"`
	ConversionRate float64           `json:"conversion_rate"`
	DropoffRate    float64           `json:"dropoff_rate"`
	AvgTimeToStep  *time.Duration    `json:"avg_time_to_step,omitempty"`
	MedianTimeToStep *time.Duration  `json:"median_time_to_step,omitempty"`
}

// TimeRange represents a time range for analysis
type TimeRange struct {
	Start time.Time `json:"start"`
	End   time.Time `json:"end"`
}

// FunnelQuery represents parameters for funnel analysis
type FunnelQuery struct {
	FunnelID     string                 `json:"funnel_id"`
	TimeRange    TimeRange              `json:"time_range"`
	Filters      map[string]interface{} `json:"filters,omitempty"`
	GroupBy      []string               `json:"group_by,omitempty"`
	IncludeTime  bool                   `json:"include_time"`
}

// AnalyzeFunnel analyzes a specific funnel
func (fa *FunnelAnalyzer) AnalyzeFunnel(ctx context.Context, query FunnelQuery) (*FunnelAnalysis, error) {
	// Get funnel definition
	funnel, err := fa.storage.GetFunnel(query.FunnelID)
	if err != nil {
		return nil, fmt.Errorf("failed to get funnel: %w", err)
	}

	// Sort steps by order
	sort.Slice(funnel.Steps, func(i, j int) bool {
		return funnel.Steps[i].Order < funnel.Steps[j].Order
	})

	// Get events for the time range
	events, err := fa.getEventsForFunnel(ctx, funnel, query.TimeRange, query.Filters)
	if err != nil {
		return nil, fmt.Errorf("failed to get events: %w", err)
	}

	// Group events by user/session
	userJourneys := fa.groupEventsByUser(events)

	// Analyze each step
	stepResults := make([]FunnelStepResult, len(funnel.Steps))
	totalUsers := len(userJourneys)

	for i, step := range funnel.Steps {
		stepResult := fa.analyzeStep(step, userJourneys, i == 0)
		stepResults[i] = stepResult
	}

	// Calculate overall conversion rate
	var conversionRate float64
	if totalUsers > 0 && len(stepResults) > 0 {
		conversionRate = float64(stepResults[len(stepResults)-1].Users) / float64(totalUsers) * 100
	}

	dropoffRate := 100 - conversionRate

	analysis := &FunnelAnalysis{
		Funnel:         funnel,
		Steps:          stepResults,
		TotalUsers:     totalUsers,
		ConversionRate: conversionRate,
		DropoffRate:    dropoffRate,
		TimeRange:      query.TimeRange,
		Filters:        query.Filters,
		GeneratedAt:    time.Now().UTC(),
	}

	return analysis, nil
}

// getEventsForFunnel gets all relevant events for a funnel
func (fa *FunnelAnalyzer) getEventsForFunnel(ctx context.Context, funnel *models.Funnel, timeRange TimeRange, filters map[string]interface{}) ([]*models.Event, error) {
	// Build event type filter
	eventTypes := make([]models.EventType, 0, len(funnel.Steps))
	for _, step := range funnel.Steps {
		eventTypes = append(eventTypes, step.EventType)
	}

	// Query events from storage
	query := &storage.EventQuery{
		EventTypes: eventTypes,
		StartTime:  &timeRange.Start,
		EndTime:    &timeRange.End,
		Filters:    filters,
		OrderBy:    "timestamp",
		Limit:      100000, // TODO: implement pagination for large datasets
	}

	return fa.storage.QueryEvents(ctx, query)
}

// groupEventsByUser groups events by user or session
func (fa *FunnelAnalyzer) groupEventsByUser(events []*models.Event) map[string][]*models.Event {
	userJourneys := make(map[string][]*models.Event)

	for _, event := range events {
		// Use user ID if available, otherwise use session ID
		key := event.SessionID
		if event.UserID != nil {
			key = event.UserID.String()
		}

		userJourneys[key] = append(userJourneys[key], event)
	}

	// Sort events by timestamp for each user
	for key := range userJourneys {
		sort.Slice(userJourneys[key], func(i, j int) bool {
			return userJourneys[key][i].Timestamp.Before(userJourneys[key][j].Timestamp)
		})
	}

	return userJourneys
}

// analyzeStep analyzes a single funnel step
func (fa *FunnelAnalyzer) analyzeStep(step models.FunnelStep, userJourneys map[string][]*models.Event, isFirstStep bool) FunnelStepResult {
	usersCompleted := 0
	var timesToStep []time.Duration

	for userKey, events := range userJourneys {
		// Check if user completed this step
		completed, timeToStep := fa.userCompletedStep(step, events, isFirstStep)
		if completed {
			usersCompleted++
			if timeToStep != nil {
				timesToStep = append(timesToStep, *timeToStep)
			}
		}
	}

	result := FunnelStepResult{
		Step:  step,
		Users: usersCompleted,
	}

	// Calculate conversion rate (relative to total users)
	if len(userJourneys) > 0 {
		result.ConversionRate = float64(usersCompleted) / float64(len(userJourneys)) * 100
		result.DropoffRate = 100 - result.ConversionRate
	}

	// Calculate time statistics if we have timing data
	if len(timesToStep) > 0 {
		// Average time
		var totalTime time.Duration
		for _, t := range timesToStep {
			totalTime += t
		}
		avgTime := totalTime / time.Duration(len(timesToStep))
		result.AvgTimeToStep = &avgTime

		// Median time
		sort.Slice(timesToStep, func(i, j int) bool {
			return timesToStep[i] < timesToStep[j]
		})
		medianTime := timesToStep[len(timesToStep)/2]
		result.MedianTimeToStep = &medianTime
	}

	return result
}

// userCompletedStep checks if a user completed a specific step
func (fa *FunnelAnalyzer) userCompletedStep(step models.FunnelStep, events []*models.Event, isFirstStep bool) (bool, *time.Duration) {
	var firstEventTime *time.Time
	if isFirstStep && len(events) > 0 {
		firstEventTime = &events[0].Timestamp
	}

	for _, event := range events {
		if event.Type == step.EventType {
			// Check step conditions if specified
			if fa.eventMatchesConditions(event, step.Conditions) {
				if firstEventTime != nil {
					timeToStep := event.Timestamp.Sub(*firstEventTime)
					return true, &timeToStep
				}
				return true, nil
			}
		}
	}

	return false, nil
}

// eventMatchesConditions checks if an event matches the step conditions
func (fa *FunnelAnalyzer) eventMatchesConditions(event *models.Event, conditions map[string]interface{}) bool {
	if conditions == nil || len(conditions) == 0 {
		return true
	}

	for key, expectedValue := range conditions {
		// Check event properties
		if actualValue, exists := event.Properties[key]; exists {
			if !fa.valuesMatch(actualValue, expectedValue) {
				return false
			}
		} else {
			// Check event context
			if !fa.checkContextValue(event.Context, key, expectedValue) {
				return false
			}
		}
	}

	return true
}

// valuesMatch checks if two values match (with type coercion)
func (fa *FunnelAnalyzer) valuesMatch(actual, expected interface{}) bool {
	// Simple string comparison for now
	return fmt.Sprintf("%v", actual) == fmt.Sprintf("%v", expected)
}

// checkContextValue checks a value in the event context
func (fa *FunnelAnalyzer) checkContextValue(context models.EventContext, key string, expectedValue interface{}) bool {
	switch key {
	case "device_type":
		return context.Device.Type == fmt.Sprintf("%v", expectedValue)
	case "country":
		return context.Country == fmt.Sprintf("%v", expectedValue)
	case "utm_source":
		return context.UTMSource == fmt.Sprintf("%v", expectedValue)
	case "utm_campaign":
		return context.UTMCampaign == fmt.Sprintf("%v", expectedValue)
	default:
		return false
	}
}

// GetFunnelInsights gets insights for a specific funnel
func (fa *FunnelAnalyzer) GetFunnelInsights(ctx context.Context, funnelID string, timeRange TimeRange) (*FunnelInsights, error) {
	// Analyze current period
	currentAnalysis, err := fa.AnalyzeFunnel(ctx, FunnelQuery{
		FunnelID:  funnelID,
		TimeRange: timeRange,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to analyze current period: %w", err)
	}

	// Analyze previous period for comparison
	duration := timeRange.End.Sub(timeRange.Start)
	previousTimeRange := TimeRange{
		Start: timeRange.Start.Add(-duration),
		End:   timeRange.Start,
	}

	previousAnalysis, err := fa.AnalyzeFunnel(ctx, FunnelQuery{
		FunnelID:  funnelID,
		TimeRange: previousTimeRange,
	})
	if err != nil {
		log.Printf("Failed to analyze previous period: %v", err)
		// Continue without comparison
	}

	insights := &FunnelInsights{
		Current:     currentAnalysis,
		Previous:    previousAnalysis,
		Comparison:  fa.compareAnalyses(currentAnalysis, previousAnalysis),
		GeneratedAt: time.Now().UTC(),
	}

	return insights, nil
}

// FunnelInsights provides insights and comparisons for a funnel
type FunnelInsights struct {
	Current     *FunnelAnalysis    `json:"current"`
	Previous    *FunnelAnalysis    `json:"previous,omitempty"`
	Comparison  *FunnelComparison  `json:"comparison,omitempty"`
	Trends      []FunnelTrend      `json:"trends,omitempty"`
	GeneratedAt time.Time          `json:"generated_at"`
}

// FunnelComparison compares two funnel analyses
type FunnelComparison struct {
	ConversionRateChange float64            `json:"conversion_rate_change"`
	UserCountChange      int                `json:"user_count_change"`
	StepChanges          []StepComparison   `json:"step_changes"`
}

// StepComparison compares two funnel steps
type StepComparison struct {
	StepOrder            int     `json:"step_order"`
	ConversionRateChange float64 `json:"conversion_rate_change"`
	UserCountChange      int     `json:"user_count_change"`
}

// FunnelTrend represents a trend in funnel performance
type FunnelTrend struct {
	Date           time.Time `json:"date"`
	ConversionRate float64   `json:"conversion_rate"`
	UserCount      int       `json:"user_count"`
}

// compareAnalyses compares two funnel analyses
func (fa *FunnelAnalyzer) compareAnalyses(current, previous *FunnelAnalysis) *FunnelComparison {
	if previous == nil {
		return nil
	}

	comparison := &FunnelComparison{
		ConversionRateChange: current.ConversionRate - previous.ConversionRate,
		UserCountChange:      current.TotalUsers - previous.TotalUsers,
		StepChanges:          make([]StepComparison, len(current.Steps)),
	}

	// Compare each step
	for i, currentStep := range current.Steps {
		stepComparison := StepComparison{
			StepOrder: currentStep.Step.Order,
		}

		if i < len(previous.Steps) {
			previousStep := previous.Steps[i]
			stepComparison.ConversionRateChange = currentStep.ConversionRate - previousStep.ConversionRate
			stepComparison.UserCountChange = currentStep.Users - previousStep.Users
		}

		comparison.StepChanges[i] = stepComparison
	}

	return comparison
}

// CreateFunnel creates a new funnel definition
func (fa *FunnelAnalyzer) CreateFunnel(ctx context.Context, funnel *models.Funnel) error {
	// Validate funnel steps
	if err := fa.validateFunnelSteps(funnel.Steps); err != nil {
		return fmt.Errorf("invalid funnel steps: %w", err)
	}

	return fa.storage.CreateFunnel(ctx, funnel)
}

// validateFunnelSteps validates funnel step configuration
func (fa *FunnelAnalyzer) validateFunnelSteps(steps []models.FunnelStep) error {
	if len(steps) == 0 {
		return fmt.Errorf("funnel must have at least one step")
	}

	orderMap := make(map[int]bool)
	for _, step := range steps {
		if step.Order < 1 {
			return fmt.Errorf("step order must be positive")
		}
		if orderMap[step.Order] {
			return fmt.Errorf("duplicate step order: %d", step.Order)
		}
		orderMap[step.Order] = true

		if step.Name == "" {
			return fmt.Errorf("step name is required")
		}
		if step.EventType == "" {
			return fmt.Errorf("step event type is required")
		}
	}

	return nil
}

// GetFunnelTrends gets trend data for a funnel over time
func (fa *FunnelAnalyzer) GetFunnelTrends(ctx context.Context, funnelID string, timeRange TimeRange, granularity string) ([]FunnelTrend, error) {
	// Calculate time intervals based on granularity
	intervals := fa.calculateTimeIntervals(timeRange, granularity)
	trends := make([]FunnelTrend, 0, len(intervals))

	for _, interval := range intervals {
		analysis, err := fa.AnalyzeFunnel(ctx, FunnelQuery{
			FunnelID:  funnelID,
			TimeRange: interval,
		})
		if err != nil {
			log.Printf("Failed to analyze interval %v: %v", interval, err)
			continue
		}

		trend := FunnelTrend{
			Date:           interval.Start,
			ConversionRate: analysis.ConversionRate,
			UserCount:      analysis.TotalUsers,
		}
		trends = append(trends, trend)
	}

	return trends, nil
}

// calculateTimeIntervals calculates time intervals for trend analysis
func (fa *FunnelAnalyzer) calculateTimeIntervals(timeRange TimeRange, granularity string) []TimeRange {
	var intervals []TimeRange
	var duration time.Duration

	switch granularity {
	case "hour":
		duration = time.Hour
	case "day":
		duration = 24 * time.Hour
	case "week":
		duration = 7 * 24 * time.Hour
	case "month":
		duration = 30 * 24 * time.Hour // Approximation
	default:
		duration = 24 * time.Hour // Default to daily
	}

	current := timeRange.Start
	for current.Before(timeRange.End) {
		end := current.Add(duration)
		if end.After(timeRange.End) {
			end = timeRange.End
		}

		intervals = append(intervals, TimeRange{
			Start: current,
			End:   end,
		})

		current = end
	}

	return intervals
}