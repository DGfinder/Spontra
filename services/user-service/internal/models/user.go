package models

import (
	"time"
	"github.com/google/uuid"
)

// User represents the main user entity
type User struct {
	ID           uuid.UUID `json:"id" db:"id"`
	Email        string    `json:"email" db:"email"`
	PasswordHash string    `json:"-" db:"password_hash"`
	FirstName    string    `json:"first_name" db:"first_name"`
	LastName     string    `json:"last_name" db:"last_name"`
	DateOfBirth  *time.Time `json:"date_of_birth,omitempty" db:"date_of_birth"`
	PhoneNumber  *string   `json:"phone_number,omitempty" db:"phone_number"`
	ProfileImage *string   `json:"profile_image,omitempty" db:"profile_image"`
	IsVerified   bool      `json:"is_verified" db:"is_verified"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time `json:"updated_at" db:"updated_at"`
	LastLoginAt  *time.Time `json:"last_login_at,omitempty" db:"last_login_at"`
}

// UserPreferences represents user travel preferences
type UserPreferences struct {
	ID                    uuid.UUID `json:"id" db:"id"`
	UserID                uuid.UUID `json:"user_id" db:"user_id"`
	PreferredActivities   []string  `json:"preferred_activities" db:"preferred_activities"`
	PreferredBudgetLevel  string    `json:"preferred_budget_level" db:"preferred_budget_level"`
	PreferredFlightDuration struct {
		MinHours int `json:"min_hours"`
		MaxHours int `json:"max_hours"`
	} `json:"preferred_flight_duration" db:"preferred_flight_duration"`
	PreferredDepartureTimeRanges []string `json:"preferred_departure_time_ranges" db:"preferred_departure_time_ranges"`
	PreferredAirports     []string  `json:"preferred_airports" db:"preferred_airports"`
	AvoidedDestinations   []string  `json:"avoided_destinations" db:"avoided_destinations"`
	PreferredLanguages    []string  `json:"preferred_languages" db:"preferred_languages"`
	NotificationSettings  struct {
		EmailAlerts       bool `json:"email_alerts"`
		PriceAlerts       bool `json:"price_alerts"`
		NewDestinations   bool `json:"new_destinations"`
		WeeklyDigest      bool `json:"weekly_digest"`
	} `json:"notification_settings" db:"notification_settings"`
	PrivacySettings struct {
		ProfileVisibility   string `json:"profile_visibility"`
		SearchHistoryShared bool   `json:"search_history_shared"`
		TravelHistoryShared bool   `json:"travel_history_shared"`
	} `json:"privacy_settings" db:"privacy_settings"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}

// RegisterRequest represents the registration request payload
type RegisterRequest struct {
	Email     string `json:"email" binding:"required,email"`
	Password  string `json:"password" binding:"required,min=8"`
	FirstName string `json:"first_name" binding:"required,min=2"`
	LastName  string `json:"last_name" binding:"required,min=2"`
}

// LoginRequest represents the login request payload
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// LoginResponse represents the successful login response
type LoginResponse struct {
	User         User   `json:"user"`
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    int64  `json:"expires_in"`
}

// RefreshTokenRequest represents the token refresh request
type RefreshTokenRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
}

// UpdateUserRequest represents the user update request payload
type UpdateUserRequest struct {
	FirstName    *string    `json:"first_name,omitempty"`
	LastName     *string    `json:"last_name,omitempty"`
	DateOfBirth  *time.Time `json:"date_of_birth,omitempty"`
	PhoneNumber  *string    `json:"phone_number,omitempty"`
	ProfileImage *string    `json:"profile_image,omitempty"`
}

// Session represents an active user session
type Session struct {
	ID           uuid.UUID `json:"id" db:"id"`
	UserID       uuid.UUID `json:"user_id" db:"user_id"`
	RefreshToken string    `json:"refresh_token" db:"refresh_token"`
	IsActive     bool      `json:"is_active" db:"is_active"`
	ExpiresAt    time.Time `json:"expires_at" db:"expires_at"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
	IPAddress    *string   `json:"ip_address,omitempty" db:"ip_address"`
	UserAgent    *string   `json:"user_agent,omitempty" db:"user_agent"`
}