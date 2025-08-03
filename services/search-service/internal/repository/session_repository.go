package repository

import (
	"database/sql"
	"fmt"
	"time"

	"spontra/search-service/internal/models"
	"github.com/google/uuid"
)

// SessionRepository handles search session data access
type SessionRepository struct {
	db *sql.DB
}

// NewSessionRepository creates a new session repository
func NewSessionRepository(db *sql.DB) *SessionRepository {
	return &SessionRepository{db: db}
}

// CreateSearchSession creates a new search session
func (r *SessionRepository) CreateSearchSession(session *models.SearchSession) error {
	query := `
		INSERT INTO search_sessions (id, user_id, session_id, created_at, expires_at, is_active, search_count, ip_address, user_agent)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`

	_, err := r.db.Exec(query,
		session.ID,
		session.UserID,
		session.SessionID,
		session.CreatedAt,
		session.ExpiresAt,
		session.IsActive,
		session.SearchCount,
		session.IPAddress,
		session.UserAgent,
	)

	if err != nil {
		return fmt.Errorf("failed to create search session: %w", err)
	}

	return nil
}

// GetSearchSession retrieves a search session by session ID
func (r *SessionRepository) GetSearchSession(sessionID string) (*models.SearchSession, error) {
	query := `
		SELECT id, user_id, session_id, created_at, expires_at, is_active, search_count, last_search_at, ip_address, user_agent
		FROM search_sessions 
		WHERE session_id = $1 AND is_active = true AND expires_at > CURRENT_TIMESTAMP`

	var session models.SearchSession
	err := r.db.QueryRow(query, sessionID).Scan(
		&session.ID,
		&session.UserID,
		&session.SessionID,
		&session.CreatedAt,
		&session.ExpiresAt,
		&session.IsActive,
		&session.SearchCount,
		&session.LastSearchAt,
		&session.IPAddress,
		&session.UserAgent,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("search session not found")
		}
		return nil, fmt.Errorf("failed to get search session: %w", err)
	}

	return &session, nil
}

// UpdateSearchSession updates a search session
func (r *SessionRepository) UpdateSearchSession(session *models.SearchSession) error {
	query := `
		UPDATE search_sessions 
		SET search_count = $1, last_search_at = $2, is_active = $3, expires_at = $4
		WHERE id = $5`

	_, err := r.db.Exec(query,
		session.SearchCount,
		session.LastSearchAt,
		session.IsActive,
		session.ExpiresAt,
		session.ID,
	)

	if err != nil {
		return fmt.Errorf("failed to update search session: %w", err)
	}

	return nil
}

// IncrementSearchCount increments the search count for a session
func (r *SessionRepository) IncrementSearchCount(sessionID string) error {
	query := `
		UPDATE search_sessions 
		SET search_count = search_count + 1, last_search_at = CURRENT_TIMESTAMP
		WHERE session_id = $1 AND is_active = true`

	_, err := r.db.Exec(query, sessionID)
	if err != nil {
		return fmt.Errorf("failed to increment search count: %w", err)
	}

	return nil
}

// GetUserSearchSessions retrieves all search sessions for a user
func (r *SessionRepository) GetUserSearchSessions(userID uuid.UUID, limit int) ([]models.SearchSession, error) {
	query := `
		SELECT id, user_id, session_id, created_at, expires_at, is_active, search_count, last_search_at, ip_address, user_agent
		FROM search_sessions 
		WHERE user_id = $1 
		ORDER BY created_at DESC 
		LIMIT $2`

	rows, err := r.db.Query(query, userID, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to get user search sessions: %w", err)
	}
	defer rows.Close()

	var sessions []models.SearchSession
	for rows.Next() {
		var session models.SearchSession
		err := rows.Scan(
			&session.ID,
			&session.UserID,
			&session.SessionID,
			&session.CreatedAt,
			&session.ExpiresAt,
			&session.IsActive,
			&session.SearchCount,
			&session.LastSearchAt,
			&session.IPAddress,
			&session.UserAgent,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan search session: %w", err)
		}
		sessions = append(sessions, session)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("failed to iterate search sessions: %w", err)
	}

	return sessions, nil
}

// DeactivateSearchSession deactivates a search session
func (r *SessionRepository) DeactivateSearchSession(sessionID string) error {
	query := `
		UPDATE search_sessions 
		SET is_active = false 
		WHERE session_id = $1`

	_, err := r.db.Exec(query, sessionID)
	if err != nil {
		return fmt.Errorf("failed to deactivate search session: %w", err)
	}

	return nil
}

// CleanupExpiredSessions removes expired search sessions
func (r *SessionRepository) CleanupExpiredSessions() (int, error) {
	query := `
		DELETE FROM search_sessions 
		WHERE expires_at < CURRENT_TIMESTAMP`

	result, err := r.db.Exec(query)
	if err != nil {
		return 0, fmt.Errorf("failed to cleanup expired sessions: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return 0, fmt.Errorf("failed to get rows affected: %w", err)
	}

	return int(rowsAffected), nil
}

// GetSessionStats returns search session statistics
func (r *SessionRepository) GetSessionStats() (map[string]interface{}, error) {
	query := `
		SELECT 
			COUNT(*) as total_sessions,
			COUNT(CASE WHEN is_active = true THEN 1 END) as active_sessions,
			COUNT(CASE WHEN expires_at > CURRENT_TIMESTAMP THEN 1 END) as valid_sessions,
			COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as authenticated_sessions,
			COUNT(CASE WHEN user_id IS NULL THEN 1 END) as anonymous_sessions,
			AVG(search_count) as avg_searches_per_session,
			MAX(search_count) as max_searches_per_session
		FROM search_sessions`

	var stats struct {
		TotalSessions          int64   `json:"total_sessions"`
		ActiveSessions         int64   `json:"active_sessions"`
		ValidSessions          int64   `json:"valid_sessions"`
		AuthenticatedSessions  int64   `json:"authenticated_sessions"`
		AnonymousSessions      int64   `json:"anonymous_sessions"`
		AvgSearchesPerSession  float64 `json:"avg_searches_per_session"`
		MaxSearchesPerSession  int64   `json:"max_searches_per_session"`
	}

	err := r.db.QueryRow(query).Scan(
		&stats.TotalSessions,
		&stats.ActiveSessions,
		&stats.ValidSessions,
		&stats.AuthenticatedSessions,
		&stats.AnonymousSessions,
		&stats.AvgSearchesPerSession,
		&stats.MaxSearchesPerSession,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to get session stats: %w", err)
	}

	result := map[string]interface{}{
		"total_sessions":           stats.TotalSessions,
		"active_sessions":          stats.ActiveSessions,
		"valid_sessions":           stats.ValidSessions,
		"authenticated_sessions":   stats.AuthenticatedSessions,
		"anonymous_sessions":       stats.AnonymousSessions,
		"avg_searches_per_session": stats.AvgSearchesPerSession,
		"max_searches_per_session": stats.MaxSearchesPerSession,
	}

	return result, nil
}

// GetOrCreateSearchSession gets an existing session or creates a new one
func (r *SessionRepository) GetOrCreateSearchSession(sessionID string, userID *uuid.UUID, ipAddress, userAgent string, sessionTimeout time.Duration) (*models.SearchSession, error) {
	// Try to get existing session first
	session, err := r.GetSearchSession(sessionID)
	if err == nil {
		return session, nil
	}

	// Create new session if not found
	newSession := &models.SearchSession{
		ID:           uuid.New(),
		UserID:       userID,
		SessionID:    sessionID,
		CreatedAt:    time.Now(),
		ExpiresAt:    time.Now().Add(sessionTimeout),
		IsActive:     true,
		SearchCount:  0,
		IPAddress:    &ipAddress,
		UserAgent:    &userAgent,
	}

	if err := r.CreateSearchSession(newSession); err != nil {
		return nil, fmt.Errorf("failed to create new search session: %w", err)
	}

	return newSession, nil
}