package analytics

import (
	"context"
	"fmt"
	"sort"
	"time"

	"spontra/analytics-service/internal/models"
	"spontra/analytics-service/internal/storage"
)

// CohortAnalyzer analyzes user cohorts
type CohortAnalyzer struct {
	storage storage.Storage
}

// NewCohortAnalyzer creates a new cohort analyzer
func NewCohortAnalyzer(storage storage.Storage) *CohortAnalyzer {
	return &CohortAnalyzer{
		storage: storage,
	}
}

// CohortAnalysis represents the result of a cohort analysis
type CohortAnalysis struct {
	Cohort            *models.Cohort         `json:"cohort"`
	Periods           []CohortPeriod         `json:"periods"`
	RetentionMatrix   [][]RetentionCell      `json:"retention_matrix"`
	Summary           CohortSummary          `json:"summary"`
	GeneratedAt       time.Time              `json:"generated_at"`
}

// CohortPeriod represents a time period in cohort analysis
type CohortPeriod struct {
	Period      int       `json:"period"`
	StartDate   time.Time `json:"start_date"`
	EndDate     time.Time `json:"end_date"`
	UserCount   int       `json:"user_count"`
	NewUsers    int       `json:"new_users"`
}

// RetentionCell represents a cell in the retention matrix
type RetentionCell struct {
	CohortPeriod   int     `json:"cohort_period"`
	ReturnPeriod   int     `json:"return_period"`
	UsersReturned  int     `json:"users_returned"`
	TotalUsers     int     `json:"total_users"`
	RetentionRate  float64 `json:"retention_rate"`
}

// CohortSummary provides summary statistics for a cohort
type CohortSummary struct {
	TotalUsers        int     `json:"total_users"`
	AvgRetentionDay1  float64 `json:"avg_retention_day_1"`
	AvgRetentionDay7  float64 `json:"avg_retention_day_7"`
	AvgRetentionDay30 float64 `json:"avg_retention_day_30"`
	LifetimeValue     float64 `json:"lifetime_value"`
	ChurnRate         float64 `json:"churn_rate"`
}

// CohortQuery represents parameters for cohort analysis
type CohortQuery struct {
	CohortID       string                 `json:"cohort_id,omitempty"`
	StartDate      time.Time              `json:"start_date"`
	EndDate        time.Time              `json:"end_date"`
	Period         string                 `json:"period"` // daily, weekly, monthly
	RetentionEvent models.EventType       `json:"retention_event"`
	Criteria       map[string]interface{} `json:"criteria,omitempty"`
	MaxPeriods     int                    `json:"max_periods"`
}

// AnalyzeCohort analyzes user cohorts based on the query parameters
func (ca *CohortAnalyzer) AnalyzeCohort(ctx context.Context, query CohortQuery) (*CohortAnalysis, error) {
	// Get or create cohort definition
	var cohort *models.Cohort
	var err error

	if query.CohortID != "" {
		cohort, err = ca.storage.GetCohort(query.CohortID)
		if err != nil {
			return nil, fmt.Errorf("failed to get cohort: %w", err)
		}
	} else {
		// Create temporary cohort from query parameters
		cohort = &models.Cohort{
			Name:        "Temporary Cohort",
			Period:      query.Period,
			StartDate:   query.StartDate,
			EndDate:     &query.EndDate,
			Criteria:    query.Criteria,
		}
	}

	// Calculate cohort periods
	periods := ca.calculateCohortPeriods(cohort, query.MaxPeriods)

	// Analyze each cohort period
	retentionMatrix := make([][]RetentionCell, len(periods))
	for i := range retentionMatrix {
		retentionMatrix[i] = make([]RetentionCell, query.MaxPeriods)
	}

	// Fill retention matrix
	for cohortPeriod, period := range periods {
		// Get users who first appeared in this cohort period
		cohortUsers, err := ca.getCohortUsers(ctx, period, cohort.Criteria)
		if err != nil {
			return nil, fmt.Errorf("failed to get cohort users for period %d: %w", cohortPeriod, err)
		}

		periods[cohortPeriod].UserCount = len(cohortUsers)
		periods[cohortPeriod].NewUsers = len(cohortUsers) // For now, assume all are new

		// Analyze retention for each subsequent period
		for returnPeriod := 0; returnPeriod < query.MaxPeriods && cohortPeriod+returnPeriod < len(periods); returnPeriod++ {
			retentionPeriod := periods[cohortPeriod+returnPeriod]
			usersReturned := ca.countReturningUsers(ctx, cohortUsers, retentionPeriod, query.RetentionEvent)

			retentionRate := float64(0)
			if len(cohortUsers) > 0 {
				retentionRate = float64(usersReturned) / float64(len(cohortUsers)) * 100
			}

			retentionMatrix[cohortPeriod][returnPeriod] = RetentionCell{
				CohortPeriod:  cohortPeriod,
				ReturnPeriod:  returnPeriod,
				UsersReturned: usersReturned,
				TotalUsers:    len(cohortUsers),
				RetentionRate: retentionRate,
			}
		}
	}

	// Calculate summary statistics
	summary := ca.calculateCohortSummary(retentionMatrix, periods)

	analysis := &CohortAnalysis{
		Cohort:          cohort,
		Periods:         periods,
		RetentionMatrix: retentionMatrix,
		Summary:         summary,
		GeneratedAt:     time.Now().UTC(),
	}

	return analysis, nil
}

// calculateCohortPeriods calculates the time periods for cohort analysis
func (ca *CohortAnalyzer) calculateCohortPeriods(cohort *models.Cohort, maxPeriods int) []CohortPeriod {
	var periods []CohortPeriod
	var duration time.Duration

	switch cohort.Period {
	case "daily":
		duration = 24 * time.Hour
	case "weekly":
		duration = 7 * 24 * time.Hour
	case "monthly":
		duration = 30 * 24 * time.Hour // Approximation
	default:
		duration = 7 * 24 * time.Hour // Default to weekly
	}

	current := cohort.StartDate
	endDate := cohort.StartDate.Add(time.Duration(maxPeriods) * duration)
	if cohort.EndDate != nil && cohort.EndDate.Before(endDate) {
		endDate = *cohort.EndDate
	}

	periodIndex := 0
	for current.Before(endDate) && periodIndex < maxPeriods {
		periodEnd := current.Add(duration)
		if periodEnd.After(endDate) {
			periodEnd = endDate
		}

		period := CohortPeriod{
			Period:    periodIndex,
			StartDate: current,
			EndDate:   periodEnd,
		}

		periods = append(periods, period)
		current = periodEnd
		periodIndex++
	}

	return periods
}

// getCohortUsers gets users who first appeared in a specific cohort period
func (ca *CohortAnalyzer) getCohortUsers(ctx context.Context, period CohortPeriod, criteria map[string]interface{}) ([]string, error) {
	// Query for user registration events in this period
	query := &storage.EventQuery{
		EventTypes: []models.EventType{models.EventUserRegistered},
		StartTime:  &period.StartDate,
		EndTime:    &period.EndDate,
		Filters:    criteria,
		OrderBy:    "timestamp",
	}

	events, err := ca.storage.QueryEvents(ctx, query)
	if err != nil {
		return nil, err
	}

	// Extract unique user IDs
	userSet := make(map[string]bool)
	for _, event := range events {
		if event.UserID != nil {
			userSet[event.UserID.String()] = true
		}
	}

	users := make([]string, 0, len(userSet))
	for userID := range userSet {
		users = append(users, userID)
	}

	return users, nil
}

// countReturningUsers counts how many users from a cohort returned in a specific period
func (ca *CohortAnalyzer) countReturningUsers(ctx context.Context, cohortUsers []string, period CohortPeriod, retentionEvent models.EventType) int {
	if len(cohortUsers) == 0 {
		return 0
	}

	// Query for retention events in this period for cohort users
	query := &storage.EventQuery{
		EventTypes: []models.EventType{retentionEvent},
		StartTime:  &period.StartDate,
		EndTime:    &period.EndDate,
		UserIDs:    cohortUsers,
		OrderBy:    "timestamp",
	}

	events, err := ca.storage.QueryEvents(ctx, query)
	if err != nil {
		return 0
	}

	// Count unique users who had retention events
	userSet := make(map[string]bool)
	for _, event := range events {
		if event.UserID != nil {
			userSet[event.UserID.String()] = true
		}
	}

	return len(userSet)
}

// calculateCohortSummary calculates summary statistics for the cohort analysis
func (ca *CohortAnalyzer) calculateCohortSummary(retentionMatrix [][]RetentionCell, periods []CohortPeriod) CohortSummary {
	totalUsers := 0
	for _, period := range periods {
		totalUsers += period.UserCount
	}

	var day1Rates, day7Rates, day30Rates []float64

	// Calculate average retention rates
	for i := range retentionMatrix {
		if len(retentionMatrix[i]) > 1 {
			day1Rates = append(day1Rates, retentionMatrix[i][1].RetentionRate)
		}
		if len(retentionMatrix[i]) > 7 {
			day7Rates = append(day7Rates, retentionMatrix[i][7].RetentionRate)
		}
		if len(retentionMatrix[i]) > 30 {
			day30Rates = append(day30Rates, retentionMatrix[i][30].RetentionRate)
		}
	}

	summary := CohortSummary{
		TotalUsers: totalUsers,
	}

	if len(day1Rates) > 0 {
		summary.AvgRetentionDay1 = ca.calculateAverage(day1Rates)
	}
	if len(day7Rates) > 0 {
		summary.AvgRetentionDay7 = ca.calculateAverage(day7Rates)
	}
	if len(day30Rates) > 0 {
		summary.AvgRetentionDay30 = ca.calculateAverage(day30Rates)
	}

	// Calculate churn rate (inverse of retention)
	if summary.AvgRetentionDay30 > 0 {
		summary.ChurnRate = 100 - summary.AvgRetentionDay30
	} else if summary.AvgRetentionDay7 > 0 {
		summary.ChurnRate = 100 - summary.AvgRetentionDay7
	}

	return summary
}

// calculateAverage calculates the average of a slice of float64 values
func (ca *CohortAnalyzer) calculateAverage(values []float64) float64 {
	if len(values) == 0 {
		return 0
	}

	sum := float64(0)
	for _, value := range values {
		sum += value
	}

	return sum / float64(len(values))
}

// CohortComparison compares two cohort analyses
type CohortComparison struct {
	CohortA           *CohortAnalysis `json:"cohort_a"`
	CohortB           *CohortAnalysis `json:"cohort_b"`
	RetentionDiff     [][]float64     `json:"retention_diff"`
	SummaryComparison SummaryComparison `json:"summary_comparison"`
	GeneratedAt       time.Time       `json:"generated_at"`
}

// SummaryComparison compares summary statistics between cohorts
type SummaryComparison struct {
	UserCountDiff      int     `json:"user_count_diff"`
	Day1RetentionDiff  float64 `json:"day1_retention_diff"`
	Day7RetentionDiff  float64 `json:"day7_retention_diff"`
	Day30RetentionDiff float64 `json:"day30_retention_diff"`
	ChurnRateDiff      float64 `json:"churn_rate_diff"`
}

// CompareCohorts compares two cohort analyses
func (ca *CohortAnalyzer) CompareCohorts(cohortA, cohortB *CohortAnalysis) *CohortComparison {
	// Calculate retention rate differences
	maxRows := len(cohortA.RetentionMatrix)
	if len(cohortB.RetentionMatrix) > maxRows {
		maxRows = len(cohortB.RetentionMatrix)
	}

	maxCols := 0
	if len(cohortA.RetentionMatrix) > 0 {
		maxCols = len(cohortA.RetentionMatrix[0])
	}
	if len(cohortB.RetentionMatrix) > 0 && len(cohortB.RetentionMatrix[0]) > maxCols {
		maxCols = len(cohortB.RetentionMatrix[0])
	}

	retentionDiff := make([][]float64, maxRows)
	for i := range retentionDiff {
		retentionDiff[i] = make([]float64, maxCols)
		for j := range retentionDiff[i] {
			rateA := float64(0)
			rateB := float64(0)

			if i < len(cohortA.RetentionMatrix) && j < len(cohortA.RetentionMatrix[i]) {
				rateA = cohortA.RetentionMatrix[i][j].RetentionRate
			}
			if i < len(cohortB.RetentionMatrix) && j < len(cohortB.RetentionMatrix[i]) {
				rateB = cohortB.RetentionMatrix[i][j].RetentionRate
			}

			retentionDiff[i][j] = rateA - rateB
		}
	}

	// Compare summary statistics
	summaryComparison := SummaryComparison{
		UserCountDiff:      cohortA.Summary.TotalUsers - cohortB.Summary.TotalUsers,
		Day1RetentionDiff:  cohortA.Summary.AvgRetentionDay1 - cohortB.Summary.AvgRetentionDay1,
		Day7RetentionDiff:  cohortA.Summary.AvgRetentionDay7 - cohortB.Summary.AvgRetentionDay7,
		Day30RetentionDiff: cohortA.Summary.AvgRetentionDay30 - cohortB.Summary.AvgRetentionDay30,
		ChurnRateDiff:      cohortA.Summary.ChurnRate - cohortB.Summary.ChurnRate,
	}

	return &CohortComparison{
		CohortA:           cohortA,
		CohortB:           cohortB,
		RetentionDiff:     retentionDiff,
		SummaryComparison: summaryComparison,
		GeneratedAt:       time.Now().UTC(),
	}
}

// CreateCohort creates a new cohort definition
func (ca *CohortAnalyzer) CreateCohort(ctx context.Context, cohort *models.Cohort) error {
	// Validate cohort configuration
	if err := ca.validateCohort(cohort); err != nil {
		return fmt.Errorf("invalid cohort: %w", err)
	}

	return ca.storage.CreateCohort(ctx, cohort)
}

// validateCohort validates cohort configuration
func (ca *CohortAnalyzer) validateCohort(cohort *models.Cohort) error {
	if cohort.Name == "" {
		return fmt.Errorf("cohort name is required")
	}

	validPeriods := []string{"daily", "weekly", "monthly"}
	isValidPeriod := false
	for _, period := range validPeriods {
		if cohort.Period == period {
			isValidPeriod = true
			break
		}
	}
	if !isValidPeriod {
		return fmt.Errorf("invalid period: must be one of %v", validPeriods)
	}

	if cohort.StartDate.IsZero() {
		return fmt.Errorf("start date is required")
	}

	if cohort.EndDate != nil && cohort.EndDate.Before(cohort.StartDate) {
		return fmt.Errorf("end date must be after start date")
	}

	return nil
}

// GetCohortTrends gets trend data for cohort performance over time
func (ca *CohortAnalyzer) GetCohortTrends(ctx context.Context, cohortID string, metric string) ([]CohortTrend, error) {
	cohort, err := ca.storage.GetCohort(cohortID)
	if err != nil {
		return nil, fmt.Errorf("failed to get cohort: %w", err)
	}

	// Analyze cohort over multiple time windows
	endDate := time.Now()
	if cohort.EndDate != nil {
		endDate = *cohort.EndDate
	}

	// Create monthly windows for trend analysis
	trends := make([]CohortTrend, 0)
	current := cohort.StartDate

	for current.Before(endDate) {
		windowEnd := current.AddDate(0, 1, 0) // Add one month
		if windowEnd.After(endDate) {
			windowEnd = endDate
		}

		query := CohortQuery{
			StartDate:      current,
			EndDate:        windowEnd,
			Period:         cohort.Period,
			RetentionEvent: models.EventUserLoggedIn, // Default retention event
			Criteria:       cohort.Criteria,
			MaxPeriods:     30, // Analyze 30 periods
		}

		analysis, err := ca.AnalyzeCohort(ctx, query)
		if err != nil {
			return nil, fmt.Errorf("failed to analyze cohort for trend: %w", err)
		}

		trend := CohortTrend{
			Date:  current,
			Value: ca.extractTrendValue(analysis, metric),
		}
		trends = append(trends, trend)

		current = windowEnd
	}

	return trends, nil
}

// CohortTrend represents a data point in cohort trend analysis
type CohortTrend struct {
	Date  time.Time `json:"date"`
	Value float64   `json:"value"`
}

// extractTrendValue extracts a specific metric value from cohort analysis
func (ca *CohortAnalyzer) extractTrendValue(analysis *CohortAnalysis, metric string) float64 {
	switch metric {
	case "retention_day_1":
		return analysis.Summary.AvgRetentionDay1
	case "retention_day_7":
		return analysis.Summary.AvgRetentionDay7
	case "retention_day_30":
		return analysis.Summary.AvgRetentionDay30
	case "churn_rate":
		return analysis.Summary.ChurnRate
	case "total_users":
		return float64(analysis.Summary.TotalUsers)
	default:
		return analysis.Summary.AvgRetentionDay7 // Default metric
	}
}