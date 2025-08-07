package repository

import (
	"database/sql"
	"fmt"
	"time"

	"spontra/user-service/internal/database"
	"spontra/user-service/internal/models"
	"github.com/google/uuid"
)

// SessionRepository handles session-related database operations
type SessionRepository struct {
	db *database.DB
}

// NewSessionRepository creates a new session repository
func NewSessionRepository(db *database.DB) *SessionRepository {
	return &SessionRepository{db: db}
}

// CreateSession creates a new session in the database
func (r *SessionRepository) CreateSession(session *models.Session) error {
	query := `
		INSERT INTO sessions (id, user_id, refresh_token, is_active, expires_at, ip_address, user_agent)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING created_at`
	
	err := r.db.QueryRow(
		query,
		session.ID,
		session.UserID,
		session.RefreshToken,
		session.IsActive,
		session.ExpiresAt,
		session.IPAddress,
		session.UserAgent,
	).Scan(&session.CreatedAt)
	
	if err != nil {
		return fmt.Errorf("failed to create session: %w", err)
	}
	
	return nil
}

// GetSessionByRefreshToken retrieves a session by refresh token
func (r *SessionRepository) GetSessionByRefreshToken(refreshToken string) (*models.Session, error) {
	session := &models.Session{}
	query := `
		SELECT id, user_id, refresh_token, is_active, expires_at, created_at, ip_address, user_agent
		FROM sessions 
		WHERE refresh_token = $1 AND is_active = true AND expires_at > CURRENT_TIMESTAMP`
	
	err := r.db.QueryRow(query, refreshToken).Scan(
		&session.ID,
		&session.UserID,
		&session.RefreshToken,
		&session.IsActive,
		&session.ExpiresAt,
		&session.CreatedAt,
		&session.IPAddress,
		&session.UserAgent,
	)
	
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("session not found or expired")
		}
		return nil, fmt.Errorf("failed to get session: %w", err)
	}
	
	return session, nil
}

// GetSessionsByUserID retrieves all active sessions for a user
func (r *SessionRepository) GetSessionsByUserID(userID uuid.UUID) ([]*models.Session, error) {
	query := `
		SELECT id, user_id, refresh_token, is_active, expires_at, created_at, ip_address, user_agent
		FROM sessions 
		WHERE user_id = $1 AND is_active = true AND expires_at > CURRENT_TIMESTAMP
		ORDER BY created_at DESC`
	
	rows, err := r.db.Query(query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get sessions: %w", err)
	}
	defer rows.Close()
	
	var sessions []*models.Session
	for rows.Next() {
		session := &models.Session{}
		err := rows.Scan(
			&session.ID,
			&session.UserID,
			&session.RefreshToken,
			&session.IsActive,
			&session.ExpiresAt,
			&session.CreatedAt,
			&session.IPAddress,
			&session.UserAgent,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan session: %w", err)
		}
		sessions = append(sessions, session)
	}
	
	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating sessions: %w", err)
	}
	
	return sessions, nil
}

// InvalidateSession invalidates a session by refresh token
func (r *SessionRepository) InvalidateSession(refreshToken string) error {
	query := "UPDATE sessions SET is_active = false WHERE refresh_token = $1"
	result, err := r.db.Exec(query, refreshToken)
	if err != nil {
		return fmt.Errorf("failed to invalidate session: %w", err)
	}
	
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}
	
	if rowsAffected == 0 {
		return fmt.Errorf("session not found")
	}
	
	return nil
}

// InvalidateAllUserSessions invalidates all sessions for a user
func (r *SessionRepository) InvalidateAllUserSessions(userID uuid.UUID) error {
	query := "UPDATE sessions SET is_active = false WHERE user_id = $1 AND is_active = true"
	_, err := r.db.Exec(query, userID)
	if err != nil {
		return fmt.Errorf("failed to invalidate user sessions: %w", err)
	}
	
	return nil
}

// CleanupExpiredSessions removes expired sessions from the database
func (r *SessionRepository) CleanupExpiredSessions() error {
	query := "DELETE FROM sessions WHERE expires_at < CURRENT_TIMESTAMP OR is_active = false"
	result, err := r.db.Exec(query)
	if err != nil {
		return fmt.Errorf("failed to cleanup expired sessions: %w", err)
	}
	
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}
	
	if rowsAffected > 0 {
		fmt.Printf("Cleaned up %d expired sessions\n", rowsAffected)
	}
	
	return nil
}

// UpdateSessionActivity updates the last activity time for a session
func (r *SessionRepository) UpdateSessionActivity(refreshToken string) error {
	query := `
		UPDATE sessions 
		SET expires_at = $1 
		WHERE refresh_token = $2 AND is_active = true`
	
	// Extend expiry by 30 days from now
	newExpiry := time.Now().Add(30 * 24 * time.Hour)
	
	result, err := r.db.Exec(query, newExpiry, refreshToken)
	if err != nil {
		return fmt.Errorf("failed to update session activity: %w", err)
	}
	
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}
	
	if rowsAffected == 0 {
		return fmt.Errorf("session not found or inactive")
	}
	
	return nil
}

// GetSessionStats returns session statistics for monitoring
func (r *SessionRepository) GetSessionStats() (map[string]interface{}, error) {
	stats := make(map[string]interface{})
	
	// Count active sessions
	var activeSessions int
	err := r.db.QueryRow("SELECT COUNT(*) FROM sessions WHERE is_active = true AND expires_at > CURRENT_TIMESTAMP").Scan(&activeSessions)
	if err != nil {
		return nil, fmt.Errorf("failed to count active sessions: %w", err)
	}
	stats["active_sessions"] = activeSessions
	
	// Count expired sessions
	var expiredSessions int
	err = r.db.QueryRow("SELECT COUNT(*) FROM sessions WHERE expires_at <= CURRENT_TIMESTAMP").Scan(&expiredSessions)
	if err != nil {
		return nil, fmt.Errorf("failed to count expired sessions: %w", err)
	}
	stats["expired_sessions"] = expiredSessions
	
	// Count total sessions
	var totalSessions int
	err = r.db.QueryRow("SELECT COUNT(*) FROM sessions").Scan(&totalSessions)
	if err != nil {
		return nil, fmt.Errorf("failed to count total sessions: %w", err)
	}
	stats["total_sessions"] = totalSessions
	
	return stats, nil
}