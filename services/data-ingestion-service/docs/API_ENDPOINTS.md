# Theme-Based Destination API Documentation

## Overview

The Theme-Based Destination API provides endpoints for retrieving travel destinations based on specific travel themes, recreating the original Spontra vision with modern scalability. The API supports 100 curated destinations across 5 expanded themes with multi-theme scoring.

**Base URL:** `http://localhost:8080/api/v1`

---

## 🎯 Theme Endpoints

### 1. Get Theme Definitions

Retrieves all available theme definitions with descriptions and keywords.

**Endpoint:** `GET /themes/definitions`

**Response:**
```json
{
  "themes": [
    {
      "key": "party",
      "name": "Social & Entertainment",
      "description": "Nightlife, bars, clubs, music festivals, food scenes, social dining experiences",
      "keywords": ["nightlife", "bars", "clubs", "restaurants", "music", "festivals", "social"]
    },
    {
      "key": "adventure",
      "name": "Active & Outdoor", 
      "description": "Hiking, extreme sports, nature activities, budget backpacking, outdoor wellness",
      "keywords": ["hiking", "sports", "nature", "outdoor", "backpacking", "adventure", "mountains"]
    },
    {
      "key": "learn",
      "name": "Cultural & Creative",
      "description": "Museums, history, arts districts, creative scenes, digital nomad hubs, education", 
      "keywords": ["museums", "history", "culture", "arts", "creative", "learning", "architecture"]
    },
    {
      "key": "shopping",
      "name": "Luxury & Indulgent",
      "description": "Fashion, luxury shopping, spas, wellness experiences, romantic getaways, premium services",
      "keywords": ["shopping", "luxury", "fashion", "spas", "wellness", "romance", "premium"]
    },
    {
      "key": "beach",
      "name": "Relaxation & Family",
      "description": "Coastal destinations, family activities, leisure travel, beach wellness, water sports",
      "keywords": ["beach", "coast", "family", "relaxation", "water", "leisure", "islands"]
    }
  ],
  "total": 5,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 2. Get Destinations by Theme

Retrieves destinations optimized for a specific theme with advanced filtering.

**Endpoint:** `POST /themes/destinations`

**Request Body:**
```json
{
  "origin": "LHR",
  "theme": "party",
  "max_flight_time": 4,
  "min_score": 70,
  "price_range": "mid-range",
  "limit": 10,
  "include_countries": ["ES", "IT", "FR"],
  "exclude_countries": ["GB"]
}
```

**Parameters:**
- `origin` (required): 3-letter IATA airport code
- `theme` (required): One of `party`, `adventure`, `learn`, `shopping`, `beach`
- `max_flight_time` (optional): Maximum flight time in hours
- `min_score` (optional): Minimum theme score (0-100), default: 60
- `price_range` (optional): `budget`, `mid-range`, or `luxury`
- `limit` (optional): Maximum results to return, default: 20
- `include_countries` (optional): Array of country codes to include
- `exclude_countries` (optional): Array of country codes to exclude

**Response:**
```json
{
  "request_id": "theme_20240115_103045",
  "theme": "party",
  "origin": "LHR",
  "total_results": 45,
  "filtered_results": 10,
  "processing_time_ms": 127,
  "cache_hit": false,
  "destinations": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "iata_code": "IBZ",
      "city_name": "Ibiza", 
      "country_name": "Spain",
      "country_code": "ES",
      "theme_score": 98,
      "all_theme_scores": {
        "party": 98,
        "adventure": 30,
        "learn": 25,
        "shopping": 40,
        "beach": 95
      },
      "highlights": [
        "Electronic music capital",
        "Sunset parties",
        "Superstar DJs",
        "Crystal clear waters",
        "Beach parties"
      ],
      "description": "The ultimate party destination with world-renowned clubs and beautiful beaches.",
      "average_flight_time": 2.5,
      "price_range": "luxury",
      "best_months": ["May", "Jun", "Jul", "Aug", "Sep"],
      "popularity_score": 98.0,
      "reason_for_match": "Exceptional choice for party - featuring Electronic music capital",
      "estimated_price": {
        "currency": "EUR",
        "min_price": 275,
        "max_price": 400,
        "average_price": 337,
        "confidence": "medium"
      }
    }
  ],
  "country_aggregations": [
    {
      "country_code": "ES",
      "country_name": "Spain",
      "destination_count": 5,
      "average_score": 78.4,
      "best_score": 98,
      "average_flight_time": 2.7,
      "price_ranges": ["mid-range", "luxury"]
    }
  ],
  "metadata": {
    "theme_definition": {
      "key": "party",
      "name": "Social & Entertainment", 
      "description": "Nightlife, bars, clubs, music festivals, food scenes, social dining experiences",
      "keywords": ["nightlife", "bars", "clubs", "restaurants", "music", "festivals", "social"]
    },
    "search_strategy": "theme_score_descending_with_filters",
    "filters_applied": [
      "theme_score >= 70",
      "flight_time <= 4h", 
      "price_range = mid-range",
      "include_countries: ES,IT,FR"
    ],
    "recommendations": [
      "Results are sorted by theme score (highest first)",
      "Consider multiple themes for diverse experiences",
      "Price estimates are based on historical data",
      "Best visited during summer months for outdoor events"
    ]
  }
}
```

### 3. Get Destinations by Country

Retrieves all destinations for a specific country.

**Endpoint:** `GET /themes/countries/{country}/destinations`

**Parameters:**
- `country`: 2-letter country code (e.g., `ES`, `IT`, `FR`)

**Response:**
```json
{
  "country_code": "ES",
  "destinations": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "iata_code": "BCN",
      "city_name": "Barcelona",
      "country_name": "Spain",
      "country_code": "ES",
      "theme_scores": {
        "party": 85,
        "adventure": 45,
        "learn": 75,
        "shopping": 65,
        "beach": 90
      },
      "price_range": "mid-range",
      "average_flight_time": 2.5,
      "popularity_score": 90.0
    }
  ],
  "total": 8,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## 🔍 Legacy Endpoints (Enhanced)

### 4. Explore Destinations (Enhanced with Theme Support)

**Endpoint:** `POST /explore/destinations`

Enhanced to support theme-based filtering with the original destination recommendation engine.

**Request Body:**
```json
{
  "origin_airport_code": "LHR",
  "min_flight_duration_hours": 1,
  "max_flight_duration_hours": 5,
  "preferred_activities": ["nightlife", "restaurants"],
  "budget_level": "mid-range",
  "max_results": 15
}
```

### 5. Get Destination Insights

**Endpoint:** `GET /explore/destinations/{airport}/insights`

Provides analytical insights about destinations reachable from an origin.

### 6. Find Similar Destinations

**Endpoint:** `GET /explore/destinations/{airport}/similar?origin={origin}`

Finds destinations similar to a target destination.

---

## 📊 Data Management Endpoints

### 7. Health Check

**Endpoint:** `GET /health`

Returns service health status including Cassandra and theme database connectivity.

### 8. Import Flight Routes

**Endpoint:** `POST /data/import/flight-routes`

Import flight route data from CSV files.

---

## 🚀 Usage Examples

### Example 1: Find Party Destinations from London

```bash
curl -X POST http://localhost:8080/api/v1/themes/destinations \
  -H "Content-Type: application/json" \
  -d '{
    "origin": "LHR",
    "theme": "party", 
    "min_score": 80,
    "limit": 5
  }'
```

### Example 2: Get All Themes

```bash
curl http://localhost:8080/api/v1/themes/definitions
```

### Example 3: Find Adventure Destinations within 3 Hours

```bash
curl -X POST http://localhost:8080/api/v1/themes/destinations \
  -H "Content-Type: application/json" \
  -d '{
    "origin": "CDG",
    "theme": "adventure",
    "max_flight_time": 3,
    "min_score": 70
  }'
```

---

## 🏗️ Response Codes

- `200 OK`: Successful request
- `400 Bad Request`: Invalid request parameters
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error
- `503 Service Unavailable`: Database connectivity issues

---

## 🔒 Authentication

Currently, the API does not require authentication for development purposes. In production, implement appropriate authentication mechanisms.

---

## ⚡ Performance Notes

- **Caching**: Responses are cached for 1 hour for identical requests
- **Batch Processing**: Multiple destinations processed efficiently
- **Database Optimization**: Theme-optimized queries with clustering
- **Rate Limiting**: Consider implementing rate limiting in production

---

## 🌍 Supported Countries

The database includes destinations from:
- **Western Europe**: Spain, Italy, France, Germany, Netherlands, Belgium, Switzerland, Austria, UK, Portugal
- **Northern Europe**: Sweden, Norway, Denmark, Finland
- **Eastern Europe**: Czech Republic, Hungary, Poland, Romania, Croatia, Slovenia, Slovakia
- **Baltics**: Estonia, Latvia, Lithuania
- **Mediterranean**: Greece, Malta
- **International**: USA (Las Vegas, Miami, New York), Japan (Tokyo), UAE (Dubai), Thailand (Bangkok), Singapore, Mexico, Brazil, Egypt

---

This API recreates your original 10-year-old Spontra vision with modern scalability, supporting theme-based destination discovery across 100 carefully curated cities! 🎉✈️