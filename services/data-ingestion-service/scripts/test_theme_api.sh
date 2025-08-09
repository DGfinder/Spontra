#!/bin/bash

# Theme-Based Destination API Test Suite
# Tests all the new theme-based endpoints

set -e

echo "🚀 Testing Theme-Based Destination API"
echo "====================================="

# Configuration
API_BASE="http://localhost:8080/api/v1"
TIMEOUT=10

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counter
TESTS_TOTAL=0
TESTS_PASSED=0
TESTS_FAILED=0

# Helper function for making requests
make_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    local expected_status=${4:-200}
    
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    
    echo -e "${BLUE}Testing: $method $endpoint${NC}"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X GET "$API_BASE$endpoint" --max-time $TIMEOUT)
    else
        response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X POST "$API_BASE$endpoint" \
                   -H "Content-Type: application/json" \
                   -d "$data" --max-time $TIMEOUT)
    fi
    
    # Extract status code and body
    status_code=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
    body=$(echo "$response" | sed -E 's/HTTPSTATUS:[0-9]*$//')
    
    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}✅ PASS: HTTP $status_code${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        
        # Pretty print JSON if possible
        if command -v jq &> /dev/null; then
            echo "$body" | jq -C '.' | head -20
            if [ $(echo "$body" | jq -r '. | length' 2>/dev/null || echo 0) -gt 20 ]; then
                echo -e "${YELLOW}... (truncated)${NC}"
            fi
        else
            echo "$body" | head -5
        fi
    else
        echo -e "${RED}❌ FAIL: Expected HTTP $expected_status, got HTTP $status_code${NC}"
        echo -e "${RED}Response: $body${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    
    echo ""
    sleep 1  # Rate limiting
}

# Test 1: Health Check
echo "🏥 Test 1: Health Check"
make_request "GET" "/health"

# Test 2: Get Theme Definitions
echo "📚 Test 2: Get Theme Definitions"
make_request "GET" "/themes/definitions"

# Test 3: Get Party Destinations from London
echo "🎉 Test 3: Get Party Destinations from London"
party_request='{
  "origin": "LHR",
  "theme": "party",
  "min_score": 70,
  "limit": 10
}'
make_request "POST" "/themes/destinations" "$party_request"

# Test 4: Get Adventure Destinations with Flight Time Filter
echo "🏔️ Test 4: Get Adventure Destinations (Max 3h Flight)"
adventure_request='{
  "origin": "CDG",
  "theme": "adventure", 
  "max_flight_time": 3,
  "min_score": 60,
  "limit": 5
}'
make_request "POST" "/themes/destinations" "$adventure_request"

# Test 5: Get Cultural Destinations with Price Filter
echo "🏛️ Test 5: Get Cultural Destinations (Budget Only)"
cultural_request='{
  "origin": "FRA",
  "theme": "learn",
  "price_range": "budget",
  "min_score": 65,
  "limit": 8
}'
make_request "POST" "/themes/destinations" "$cultural_request"

# Test 6: Get Shopping Destinations with Country Filter
echo "🛍️ Test 6: Get Shopping Destinations (Include Specific Countries)"
shopping_request='{
  "origin": "AMS",
  "theme": "shopping",
  "include_countries": ["IT", "FR", "GB"],
  "min_score": 70,
  "limit": 6
}'
make_request "POST" "/themes/destinations" "$shopping_request"

# Test 7: Get Beach Destinations Excluding Countries
echo "🏖️ Test 7: Get Beach Destinations (Exclude Some Countries)"
beach_request='{
  "origin": "MUC",
  "theme": "beach",
  "exclude_countries": ["GB", "NL"],
  "min_score": 75,
  "limit": 12
}'
make_request "POST" "/themes/destinations" "$beach_request"

# Test 8: Get Destinations by Country (Spain)
echo "🇪🇸 Test 8: Get All Destinations in Spain"
make_request "GET" "/themes/countries/ES/destinations"

# Test 9: Get Destinations by Country (Italy)
echo "🇮🇹 Test 9: Get All Destinations in Italy"
make_request "GET" "/themes/countries/IT/destinations"

# Test 10: Invalid Theme (Should Fail)
echo "❌ Test 10: Invalid Theme (Expected to Fail)"
invalid_request='{
  "origin": "LHR",
  "theme": "invalid_theme",
  "min_score": 60
}'
make_request "POST" "/themes/destinations" "$invalid_request" "400"

# Test 11: Invalid Origin (Should Fail)
echo "❌ Test 11: Invalid Origin Code (Expected to Fail)"
invalid_origin_request='{
  "origin": "INVALID",
  "theme": "party",
  "min_score": 60
}'
make_request "POST" "/themes/destinations" "$invalid_origin_request" "400"

# Test 12: Empty Theme Request (Should Fail)
echo "❌ Test 12: Missing Required Fields (Expected to Fail)"
empty_request='{
  "min_score": 60
}'
make_request "POST" "/themes/destinations" "$empty_request" "400"

# Test 13: Legacy Destination Exploration (If Available)
echo "🔄 Test 13: Legacy Destination Exploration Endpoint"
legacy_request='{
  "origin_airport_code": "LHR",
  "min_flight_duration_hours": 1,
  "max_flight_duration_hours": 4,
  "preferred_activities": ["nightlife", "restaurants"],
  "budget_level": "mid-range",
  "max_results": 10
}'
make_request "POST" "/explore/destinations" "$legacy_request"

# Advanced Tests with Complex Filters
echo "🔬 Advanced Tests: Complex Filtering"

# Test 14: Multiple Constraints
echo "🎯 Test 14: Multiple Constraints (Theme + Time + Price + Countries)"
complex_request='{
  "origin": "VIE",
  "theme": "party",
  "max_flight_time": 2,
  "price_range": "mid-range",
  "include_countries": ["ES", "IT"],
  "min_score": 80,
  "limit": 3
}'
make_request "POST" "/themes/destinations" "$complex_request"

# Test 15: High Score Threshold
echo "🏆 Test 15: High Score Threshold (95+ Only)"
high_score_request='{
  "origin": "LHR",
  "theme": "beach",
  "min_score": 95,
  "limit": 5
}'
make_request "POST" "/themes/destinations" "$high_score_request"

# Performance Test
echo "⚡ Performance Test: Large Request"
large_request='{
  "origin": "LHR",
  "theme": "learn",
  "min_score": 50,
  "limit": 50
}'
start_time=$(date +%s%N)
make_request "POST" "/themes/destinations" "$large_request"
end_time=$(date +%s%N)
duration=$(( (end_time - start_time) / 1000000 ))
echo -e "${YELLOW}Performance: Request took ${duration}ms${NC}"

# Summary
echo ""
echo "📊 Test Summary"
echo "==============="
echo -e "Total Tests: $TESTS_TOTAL"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! Your Theme-Based Destination API is working perfectly!${NC}"
    exit 0
else
    echo -e "${RED}⚠️  Some tests failed. Please check the API implementation.${NC}"
    exit 1
fi

echo ""
echo "🌟 Theme-Based Destination API Testing Complete!"
echo ""
echo "Next steps:"
echo "1. 🔧 Run the migration: cd scripts && ./run_migration.sh"
echo "2. 🚀 Start the service: go run main.go"
echo "3. 🧪 Test with real data using these endpoints"
echo "4. 🔗 Integrate with your frontend application"
echo ""
echo "Your original 10-year-old Spontra vision is now a modern, scalable API! ✈️🌍"