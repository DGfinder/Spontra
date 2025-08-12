package repository

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"time"

	"spontra/search-service/internal/models"
	"github.com/google/uuid"
)

// HistoryRepository handles search history data access
type HistoryRepository struct {
	db *sql.DB
}

// NewHistoryRepository creates a new history repository
func NewHistoryRepository(db *sql.DB) *HistoryRepository {
	return &HistoryRepository{db: db}
}

// CreateSearchHistory creates a new search history record
func (r *HistoryRepository) CreateSearchHistory(history *models.SearchHistory) error {
	requestJSON, err := json.Marshal(history.Request)
	if err != nil {
		return fmt.Errorf("failed to marshal request: %w", err)
	}

	query := `
		INSERT INTO search_history (id, search_id, user_id, session_id, request, result_count, best_price, currency, created_at, expires_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`

	_, err = r.db.Exec(query,
		history.ID,
		history.SearchID,
		history.UserID,
		history.SessionID,
		requestJSON,
		history.ResultCount,
		history.BestPrice,
		history.Currency,
		history.CreatedAt,
		history.ExpiresAt,
	)

	if err != nil {
		return fmt.Errorf("failed to create search history: %w", err)
	}

	return nil
}

// GetSearchHistory retrieves a search history record by ID
func (r *HistoryRepository) GetSearchHistory(historyID uuid.UUID) (*models.SearchHistory, error) {
	query := `
		SELECT id, search_id, user_id, session_id, request, result_count, best_price, currency, created_at, expires_at
		FROM search_history 
		WHERE id = $1`

	var history models.SearchHistory
	var requestJSON []byte

	err := r.db.QueryRow(query, historyID).Scan(
		&history.ID,
		&history.SearchID,
		&history.UserID,
		&history.SessionID,
		&requestJSON,
		&history.ResultCount,
		&history.BestPrice,
		&history.Currency,
		&history.CreatedAt,
		&history.ExpiresAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("search history not found")
		}
		return nil, fmt.Errorf("failed to get search history: %w", err)
	}

	// Unmarshal the request JSON
	if err := json.Unmarshal(requestJSON, &history.Request); err != nil {
		return nil, fmt.Errorf("failed to unmarshal request: %w", err)
	}

	return &history, nil
}

// GetUserSearchHistory retrieves search history for a user
func (r *HistoryRepository) GetUserSearchHistory(userID uuid.UUID, limit, offset int) ([]models.SearchHistory, error) {
	query := `
		SELECT id, search_id, user_id, session_id, request, result_count, best_price, currency, created_at, expires_at
		FROM search_history 
		WHERE user_id = $1 
		ORDER BY created_at DESC 
		LIMIT $2 OFFSET $3`

	rows, err := r.db.Query(query, userID, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to get user search history: %w", err)
	}
	defer rows.Close()

	var histories []models.SearchHistory
	for rows.Next() {
		var history models.SearchHistory
		var requestJSON []byte

		err := rows.Scan(
			&history.ID,
			&history.SearchID,
			&history.UserID,
			&history.SessionID,
			&requestJSON,
			&history.ResultCount,
			&history.BestPrice,
			&history.Currency,
			&history.CreatedAt,
			&history.ExpiresAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan search history: %w", err)
		}

		// Unmarshal the request JSON
		if err := json.Unmarshal(requestJSON, &history.Request); err != nil {
			return nil, fmt.Errorf("failed to unmarshal request: %w", err)
		}

		histories = append(histories, history)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("failed to iterate search history: %w", err)
	}

	return histories, nil
}

// GetSessionSearchHistory retrieves search history for a session
func (r *HistoryRepository) GetSessionSearchHistory(sessionID string, limit int) ([]models.SearchHistory, error) {
	query := `
		SELECT id, search_id, user_id, session_id, request, result_count, best_price, currency, created_at, expires_at
		FROM search_history 
		WHERE session_id = $1 
		ORDER BY created_at DESC 
		LIMIT $2`

	rows, err := r.db.Query(query, sessionID, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to get session search history: %w", err)
	}
	defer rows.Close()

	var histories []models.SearchHistory
	for rows.Next() {
		var history models.SearchHistory
		var requestJSON []byte

		err := rows.Scan(
			&history.ID,
			&history.SearchID,
			&history.UserID,
			&history.SessionID,
			&requestJSON,
			&history.ResultCount,
			&history.BestPrice,
			&history.Currency,
			&history.CreatedAt,
			&history.ExpiresAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan search history: %w", err)
		}

		// Unmarshal the request JSON
		if err := json.Unmarshal(requestJSON, &history.Request); err != nil {
			return nil, fmt.Errorf("failed to unmarshal request: %w", err)
		}

		histories = append(histories, history)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("failed to iterate search history: %w", err)
	}

	return histories, nil
}

// GetPopularRoutes returns the most searched routes
func (r *HistoryRepository) GetPopularRoutes(limit int, since time.Time) ([]map[string]interface{}, error) {
	query := `
		SELECT 
			request->>'origin_airport' as origin,
			request->>'destination_airport' as destination,
			COUNT(*) as search_count,
			AVG(COALESCE(best_price, 0)) as avg_price,
			MIN(COALESCE(best_price, 0)) as min_price,
			MAX(COALESCE(best_price, 0)) as max_price,
			MAX(created_at) as last_searched
		FROM search_history 
		WHERE created_at >= $1 
			AND request->>'origin_airport' IS NOT NULL 
			AND request->>'destination_airport' IS NOT NULL
		GROUP BY request->>'origin_airport', request->>'destination_airport'
		ORDER BY search_count DESC, last_searched DESC
		LIMIT $2`

	rows, err := r.db.Query(query, since, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to get popular routes: %w", err)
	}
	defer rows.Close()

	var routes []map[string]interface{}
	for rows.Next() {
		var origin, destination string
		var searchCount int
		var avgPrice, minPrice, maxPrice float64
		var lastSearched time.Time

		err := rows.Scan(
			&origin,
			&destination,
			&searchCount,
			&avgPrice,
			&minPrice,
			&maxPrice,
			&lastSearched,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan popular route: %w", err)
		}

		route := map[string]interface{}{
			"origin":       origin,
			"destination":  destination,
			"route":        fmt.Sprintf("%s-%s", origin, destination),
			"search_count": searchCount,
			"avg_price":    avgPrice,
			"min_price":    minPrice,
			"max_price":    maxPrice,
			"last_searched": lastSearched,
		}

		routes = append(routes, route)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("failed to iterate popular routes: %w", err)
	}

	return routes, nil
}

// GetSearchStats returns search statistics
func (r *HistoryRepository) GetSearchStats() (map[string]interface{}, error) {
	query := `
		SELECT 
			COUNT(*) as total_searches,
			COUNT(DISTINCT user_id) as unique_users,
			COUNT(DISTINCT session_id) as unique_sessions,
			AVG(result_count) as avg_results_per_search,
			AVG(COALESCE(best_price, 0)) as avg_best_price,
			COUNT(CASE WHEN created_at >= CURRENT_DATE THEN 1 END) as searches_today,
			COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as searches_this_week,
			COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as searches_this_month
		FROM search_history`

	var stats struct {
		TotalSearches        int64   `json:"total_searches"`
		UniqueUsers          int64   `json:"unique_users"`
		UniqueSessions       int64   `json:"unique_sessions"`
		AvgResultsPerSearch  float64 `json:"avg_results_per_search"`
		AvgBestPrice         float64 `json:"avg_best_price"`
		SearchesToday        int64   `json:"searches_today"`
		SearchesThisWeek     int64   `json:"searches_this_week"`
		SearchesThisMonth    int64   `json:"searches_this_month"`
	}

	err := r.db.QueryRow(query).Scan(
		&stats.TotalSearches,
		&stats.UniqueUsers,
		&stats.UniqueSessions,
		&stats.AvgResultsPerSearch,
		&stats.AvgBestPrice,
		&stats.SearchesToday,
		&stats.SearchesThisWeek,
		&stats.SearchesThisMonth,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to get search stats: %w", err)
	}

	result := map[string]interface{}{
		"total_searches":         stats.TotalSearches,
		"unique_users":           stats.UniqueUsers,
		"unique_sessions":        stats.UniqueSessions,
		"avg_results_per_search": stats.AvgResultsPerSearch,
		"avg_best_price":         stats.AvgBestPrice,
		"searches_today":         stats.SearchesToday,
		"searches_this_week":     stats.SearchesThisWeek,
		"searches_this_month":    stats.SearchesThisMonth,
	}

	return result, nil
}

// DeleteExpiredHistory removes expired search history records
func (r *HistoryRepository) DeleteExpiredHistory() (int, error) {
	query := `
		DELETE FROM search_history 
		WHERE expires_at < CURRENT_TIMESTAMP`

	result, err := r.db.Exec(query)
	if err != nil {
		return 0, fmt.Errorf("failed to delete expired history: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return 0, fmt.Errorf("failed to get rows affected: %w", err)
	}

	return int(rowsAffected), nil
}

// GetSearchTrends returns search trends over time
func (r *HistoryRepository) GetSearchTrends(days int) ([]map[string]interface{}, error) {
	query := `
		SELECT 
			DATE(created_at) as search_date,
			COUNT(*) as search_count,
			COUNT(DISTINCT user_id) as unique_users,
			COUNT(DISTINCT session_id) as unique_sessions,
			AVG(result_count) as avg_results
		FROM search_history 
		WHERE created_at >= CURRENT_DATE - INTERVAL '%d days'
		GROUP BY DATE(created_at)
		ORDER BY search_date DESC`

	rows, err := r.db.Query(fmt.Sprintf(query, days))
	if err != nil {
		return nil, fmt.Errorf("failed to get search trends: %w", err)
	}
	defer rows.Close()

	var trends []map[string]interface{}
	for rows.Next() {
		var searchDate time.Time
		var searchCount, uniqueUsers, uniqueSessions int
		var avgResults float64

		err := rows.Scan(
			&searchDate,
			&searchCount,
			&uniqueUsers,
			&uniqueSessions,
			&avgResults,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan search trend: %w", err)
		}

		trend := map[string]interface{}{
			"date":             searchDate.Format("2006-01-02"),
			"search_count":     searchCount,
			"unique_users":     uniqueUsers,
			"unique_sessions":  uniqueSessions,
			"avg_results":      avgResults,
		}

		trends = append(trends, trend)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("failed to iterate search trends: %w", err)
	}

	return trends, nil
}