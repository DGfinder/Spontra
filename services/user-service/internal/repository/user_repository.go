package repository

import (
	"database/sql"
	"fmt"
	"encoding/json"

	"spontra/user-service/internal/database"
	"spontra/user-service/internal/models"
	"github.com/google/uuid"
	"github.com/lib/pq"
)

// UserRepository handles user-related database operations
type UserRepository struct {
	db *database.DB
}

// NewUserRepository creates a new user repository
func NewUserRepository(db *database.DB) *UserRepository {
	return &UserRepository{db: db}
}

// CreateUser creates a new user in the database
func (r *UserRepository) CreateUser(user *models.User) error {
	query := `
		INSERT INTO users (id, email, password_hash, first_name, last_name, date_of_birth, phone_number, profile_image, is_verified)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING created_at, updated_at`
	
	err := r.db.QueryRow(
		query,
		user.ID,
		user.Email,
		user.PasswordHash,
		user.FirstName,
		user.LastName,
		user.DateOfBirth,
		user.PhoneNumber,
		user.ProfileImage,
		user.IsVerified,
	).Scan(&user.CreatedAt, &user.UpdatedAt)
	
	if err != nil {
		if pqErr, ok := err.(*pq.Error); ok && pqErr.Code == "23505" {
			return fmt.Errorf("user with email %s already exists", user.Email)
		}
		return fmt.Errorf("failed to create user: %w", err)
	}
	
	return nil
}

// GetUserByID retrieves a user by ID
func (r *UserRepository) GetUserByID(userID uuid.UUID) (*models.User, error) {
	user := &models.User{}
	query := `
		SELECT id, email, password_hash, first_name, last_name, date_of_birth, 
		       phone_number, profile_image, is_verified, created_at, updated_at, last_login_at
		FROM users 
		WHERE id = $1`
	
	err := r.db.QueryRow(query, userID).Scan(
		&user.ID,
		&user.Email,
		&user.PasswordHash,
		&user.FirstName,
		&user.LastName,
		&user.DateOfBirth,
		&user.PhoneNumber,
		&user.ProfileImage,
		&user.IsVerified,
		&user.CreatedAt,
		&user.UpdatedAt,
		&user.LastLoginAt,
	)
	
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("user not found")
		}
		return nil, fmt.Errorf("failed to get user: %w", err)
	}
	
	return user, nil
}

// GetUserByEmail retrieves a user by email
func (r *UserRepository) GetUserByEmail(email string) (*models.User, error) {
	user := &models.User{}
	query := `
		SELECT id, email, password_hash, first_name, last_name, date_of_birth, 
		       phone_number, profile_image, is_verified, created_at, updated_at, last_login_at
		FROM users 
		WHERE email = $1`
	
	err := r.db.QueryRow(query, email).Scan(
		&user.ID,
		&user.Email,
		&user.PasswordHash,
		&user.FirstName,
		&user.LastName,
		&user.DateOfBirth,
		&user.PhoneNumber,
		&user.ProfileImage,
		&user.IsVerified,
		&user.CreatedAt,
		&user.UpdatedAt,
		&user.LastLoginAt,
	)
	
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("user not found")
		}
		return nil, fmt.Errorf("failed to get user: %w", err)
	}
	
	return user, nil
}

// UpdateUser updates a user's information
func (r *UserRepository) UpdateUser(userID uuid.UUID, updates *models.UpdateUserRequest) (*models.User, error) {
	// Build dynamic query based on provided fields
	setParts := []string{}
	args := []interface{}{}
	argIndex := 1
	
	if updates.FirstName != nil {
		setParts = append(setParts, fmt.Sprintf("first_name = $%d", argIndex))
		args = append(args, *updates.FirstName)
		argIndex++
	}
	
	if updates.LastName != nil {
		setParts = append(setParts, fmt.Sprintf("last_name = $%d", argIndex))
		args = append(args, *updates.LastName)
		argIndex++
	}
	
	if updates.DateOfBirth != nil {
		setParts = append(setParts, fmt.Sprintf("date_of_birth = $%d", argIndex))
		args = append(args, *updates.DateOfBirth)
		argIndex++
	}
	
	if updates.PhoneNumber != nil {
		setParts = append(setParts, fmt.Sprintf("phone_number = $%d", argIndex))
		args = append(args, *updates.PhoneNumber)
		argIndex++
	}
	
	if updates.ProfileImage != nil {
		setParts = append(setParts, fmt.Sprintf("profile_image = $%d", argIndex))
		args = append(args, *updates.ProfileImage)
		argIndex++
	}
	
	if len(setParts) == 0 {
		return nil, fmt.Errorf("no fields to update")
	}
	
	// Add user ID as the last argument
	args = append(args, userID)
	whereClause := fmt.Sprintf("WHERE id = $%d", argIndex)
	
	query := fmt.Sprintf(`
		UPDATE users 
		SET %s, updated_at = CURRENT_TIMESTAMP
		%s
		RETURNING id, email, password_hash, first_name, last_name, date_of_birth, 
		          phone_number, profile_image, is_verified, created_at, updated_at, last_login_at`,
		joinStrings(setParts, ", "), whereClause)
	
	user := &models.User{}
	err := r.db.QueryRow(query, args...).Scan(
		&user.ID,
		&user.Email,
		&user.PasswordHash,
		&user.FirstName,
		&user.LastName,
		&user.DateOfBirth,
		&user.PhoneNumber,
		&user.ProfileImage,
		&user.IsVerified,
		&user.CreatedAt,
		&user.UpdatedAt,
		&user.LastLoginAt,
	)
	
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("user not found")
		}
		return nil, fmt.Errorf("failed to update user: %w", err)
	}
	
	return user, nil
}

// DeleteUser deletes a user from the database
func (r *UserRepository) DeleteUser(userID uuid.UUID) error {
	query := "DELETE FROM users WHERE id = $1"
	result, err := r.db.Exec(query, userID)
	if err != nil {
		return fmt.Errorf("failed to delete user: %w", err)
	}
	
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}
	
	if rowsAffected == 0 {
		return fmt.Errorf("user not found")
	}
	
	return nil
}

// UpdateLastLogin updates the user's last login timestamp
func (r *UserRepository) UpdateLastLogin(userID uuid.UUID) error {
	query := "UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1"
	_, err := r.db.Exec(query, userID)
	if err != nil {
		return fmt.Errorf("failed to update last login: %w", err)
	}
	return nil
}

// GetUserPreferences retrieves user preferences
func (r *UserRepository) GetUserPreferences(userID uuid.UUID) (*models.UserPreferences, error) {
	prefs := &models.UserPreferences{}
	var flightDurationJSON, notificationJSON, privacyJSON []byte
	
	query := `
		SELECT id, user_id, preferred_activities, preferred_budget_level, 
		       preferred_flight_duration, preferred_departure_time_ranges, 
		       preferred_airports, avoided_destinations, preferred_languages,
		       notification_settings, privacy_settings, created_at, updated_at
		FROM user_preferences 
		WHERE user_id = $1`
	
	err := r.db.QueryRow(query, userID).Scan(
		&prefs.ID,
		&prefs.UserID,
		pq.Array(&prefs.PreferredActivities),
		&prefs.PreferredBudgetLevel,
		&flightDurationJSON,
		pq.Array(&prefs.PreferredDepartureTimeRanges),
		pq.Array(&prefs.PreferredAirports),
		pq.Array(&prefs.AvoidedDestinations),
		pq.Array(&prefs.PreferredLanguages),
		&notificationJSON,
		&privacyJSON,
		&prefs.CreatedAt,
		&prefs.UpdatedAt,
	)
	
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("user preferences not found")
		}
		return nil, fmt.Errorf("failed to get user preferences: %w", err)
	}
	
	// Unmarshal JSON fields
	if err := json.Unmarshal(flightDurationJSON, &prefs.PreferredFlightDuration); err != nil {
		return nil, fmt.Errorf("failed to unmarshal flight duration: %w", err)
	}
	
	if err := json.Unmarshal(notificationJSON, &prefs.NotificationSettings); err != nil {
		return nil, fmt.Errorf("failed to unmarshal notification settings: %w", err)
	}
	
	if err := json.Unmarshal(privacyJSON, &prefs.PrivacySettings); err != nil {
		return nil, fmt.Errorf("failed to unmarshal privacy settings: %w", err)
	}
	
	return prefs, nil
}

// CreateUserPreferences creates initial user preferences
func (r *UserRepository) CreateUserPreferences(userID uuid.UUID) (*models.UserPreferences, error) {
	prefs := &models.UserPreferences{
		ID:                  uuid.New(),
		UserID:              userID,
		PreferredActivities: []string{},
		PreferredBudgetLevel: "any",
		PreferredFlightDuration: struct {
			MinHours int `json:"min_hours"`
			MaxHours int `json:"max_hours"`
		}{MinHours: 1, MaxHours: 12},
		PreferredDepartureTimeRanges: []string{},
		PreferredAirports:           []string{},
		AvoidedDestinations:         []string{},
		PreferredLanguages:          []string{"en"},
		NotificationSettings: struct {
			EmailAlerts       bool `json:"email_alerts"`
			PriceAlerts       bool `json:"price_alerts"`
			NewDestinations   bool `json:"new_destinations"`
			WeeklyDigest      bool `json:"weekly_digest"`
		}{EmailAlerts: true, PriceAlerts: true, NewDestinations: true, WeeklyDigest: false},
		PrivacySettings: struct {
			ProfileVisibility   string `json:"profile_visibility"`
			SearchHistoryShared bool   `json:"search_history_shared"`
			TravelHistoryShared bool   `json:"travel_history_shared"`
		}{ProfileVisibility: "public", SearchHistoryShared: false, TravelHistoryShared: false},
	}
	
	// Marshal JSON fields
	flightDurationJSON, _ := json.Marshal(prefs.PreferredFlightDuration)
	notificationJSON, _ := json.Marshal(prefs.NotificationSettings)
	privacyJSON, _ := json.Marshal(prefs.PrivacySettings)
	
	query := `
		INSERT INTO user_preferences (
			id, user_id, preferred_activities, preferred_budget_level, 
			preferred_flight_duration, preferred_departure_time_ranges, 
			preferred_airports, avoided_destinations, preferred_languages,
			notification_settings, privacy_settings
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		RETURNING created_at, updated_at`
	
	err := r.db.QueryRow(
		query,
		prefs.ID,
		prefs.UserID,
		pq.Array(prefs.PreferredActivities),
		prefs.PreferredBudgetLevel,
		flightDurationJSON,
		pq.Array(prefs.PreferredDepartureTimeRanges),
		pq.Array(prefs.PreferredAirports),
		pq.Array(prefs.AvoidedDestinations),
		pq.Array(prefs.PreferredLanguages),
		notificationJSON,
		privacyJSON,
	).Scan(&prefs.CreatedAt, &prefs.UpdatedAt)
	
	if err != nil {
		return nil, fmt.Errorf("failed to create user preferences: %w", err)
	}
	
	return prefs, nil
}

// UpdateUserPreferences updates user preferences
func (r *UserRepository) UpdateUserPreferences(userID uuid.UUID, prefs *models.UserPreferences) (*models.UserPreferences, error) {
	// Marshal JSON fields
	flightDurationJSON, _ := json.Marshal(prefs.PreferredFlightDuration)
	notificationJSON, _ := json.Marshal(prefs.NotificationSettings)
	privacyJSON, _ := json.Marshal(prefs.PrivacySettings)
	
	query := `
		UPDATE user_preferences 
		SET preferred_activities = $1, preferred_budget_level = $2, 
		    preferred_flight_duration = $3, preferred_departure_time_ranges = $4,
		    preferred_airports = $5, avoided_destinations = $6, preferred_languages = $7,
		    notification_settings = $8, privacy_settings = $9, updated_at = CURRENT_TIMESTAMP
		WHERE user_id = $10
		RETURNING id, user_id, preferred_activities, preferred_budget_level, 
		          preferred_flight_duration, preferred_departure_time_ranges, 
		          preferred_airports, avoided_destinations, preferred_languages,
		          notification_settings, privacy_settings, created_at, updated_at`
	
	var updatedPrefs models.UserPreferences
	var flightDurationJSONResult, notificationJSONResult, privacyJSONResult []byte
	
	err := r.db.QueryRow(
		query,
		pq.Array(prefs.PreferredActivities),
		prefs.PreferredBudgetLevel,
		flightDurationJSON,
		pq.Array(prefs.PreferredDepartureTimeRanges),
		pq.Array(prefs.PreferredAirports),
		pq.Array(prefs.AvoidedDestinations),
		pq.Array(prefs.PreferredLanguages),
		notificationJSON,
		privacyJSON,
		userID,
	).Scan(
		&updatedPrefs.ID,
		&updatedPrefs.UserID,
		pq.Array(&updatedPrefs.PreferredActivities),
		&updatedPrefs.PreferredBudgetLevel,
		&flightDurationJSONResult,
		pq.Array(&updatedPrefs.PreferredDepartureTimeRanges),
		pq.Array(&updatedPrefs.PreferredAirports),
		pq.Array(&updatedPrefs.AvoidedDestinations),
		pq.Array(&updatedPrefs.PreferredLanguages),
		&notificationJSONResult,
		&privacyJSONResult,
		&updatedPrefs.CreatedAt,
		&updatedPrefs.UpdatedAt,
	)
	
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("user preferences not found")
		}
		return nil, fmt.Errorf("failed to update user preferences: %w", err)
	}
	
	// Unmarshal JSON fields
	json.Unmarshal(flightDurationJSONResult, &updatedPrefs.PreferredFlightDuration)
	json.Unmarshal(notificationJSONResult, &updatedPrefs.NotificationSettings)
	json.Unmarshal(privacyJSONResult, &updatedPrefs.PrivacySettings)
	
	return &updatedPrefs, nil
}

// Helper function to join strings
func joinStrings(strings []string, separator string) string {
	if len(strings) == 0 {
		return ""
	}
	
	result := strings[0]
	for i := 1; i < len(strings); i++ {
		result += separator + strings[i]
	}
	return result
}