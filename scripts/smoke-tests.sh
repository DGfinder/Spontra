#!/bin/bash

# Spontra Database Smoke Tests
# Prevents accidental data loss and ensures core functionality

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DATABASE_URL=${DATABASE_URL:-"postgres://spontra:development@localhost:15432/search_service_db?sslmode=disable"}
SEARCH_SERVICE_URL=${SEARCH_SERVICE_URL:-"http://localhost:8084"}
MINIMUM_AIRPORTS=5000
MINIMUM_FLIGHT_DURATIONS=3000
MINIMUM_API_RESPONSE_TIME=5000  # 5 seconds max

echo "🧪 Starting Spontra Smoke Tests..."
echo "=================================="

# Test 1: Database Connection
echo -n "📡 Testing database connection... "
if psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PASS${NC}"
else
    echo -e "${RED}❌ FAIL - Cannot connect to database${NC}"
    exit 1
fi

# Test 2: Airports Data Integrity
echo -n "🛫 Checking airports data... "
AIRPORT_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM airports;" | tr -d ' ')
if [ "$AIRPORT_COUNT" -ge "$MINIMUM_AIRPORTS" ]; then
    echo -e "${GREEN}✅ PASS${NC} ($AIRPORT_COUNT airports)"
else
    echo -e "${RED}❌ FAIL - Only $AIRPORT_COUNT airports (minimum: $MINIMUM_AIRPORTS)${NC}"
    exit 1
fi

# Test 3: Flight Durations Data Integrity  
echo -n "⏱️  Checking flight durations data... "
DURATION_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM flight_durations;" | tr -d ' ')
if [ "$DURATION_COUNT" -ge "$MINIMUM_FLIGHT_DURATIONS" ]; then
    echo -e "${GREEN}✅ PASS${NC} ($DURATION_COUNT routes)"
else
    echo -e "${RED}❌ FAIL - Only $DURATION_COUNT routes (minimum: $MINIMUM_FLIGHT_DURATIONS)${NC}"
    exit 1
fi

# Test 4: Data Quality Checks
echo -n "🔍 Checking data quality... "
INVALID_DATA=$(psql "$DATABASE_URL" -t -c "
    SELECT COUNT(*) FROM flight_durations 
    WHERE duration_minutes <= 0 
    OR distance_km <= 0 
    OR origin_airport = destination_airport
    OR length(origin_airport) != 3 
    OR length(destination_airport) != 3;
" | tr -d ' ')

if [ "$INVALID_DATA" -eq "0" ]; then
    echo -e "${GREEN}✅ PASS${NC}"
else
    echo -e "${YELLOW}⚠️  WARNING - $INVALID_DATA invalid records found${NC}"
fi

# Test 5: Search Service Health
echo -n "🔍 Testing search service health... "
if curl -s --max-time 10 "$SEARCH_SERVICE_URL/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PASS${NC}"
else
    echo -e "${RED}❌ FAIL - Search service not responding${NC}"
    exit 1
fi

# Test 6: Core API Endpoints
echo -n "🌐 Testing core API endpoints... "
START_TIME=$(date +%s%3N)

# Test route duration endpoint
ROUTE_TEST=$(curl -s --max-time 5 "$SEARCH_SERVICE_URL/api/v1/durations/route?origin=LHR&destination=CDG" || echo "ERROR")
if echo "$ROUTE_TEST" | grep -q "duration" && ! echo "$ROUTE_TEST" | grep -q "ERROR"; then
    END_TIME=$(date +%s%3N)
    RESPONSE_TIME=$((END_TIME - START_TIME))
    
    if [ "$RESPONSE_TIME" -le "$MINIMUM_API_RESPONSE_TIME" ]; then
        echo -e "${GREEN}✅ PASS${NC} (${RESPONSE_TIME}ms)"
    else
        echo -e "${YELLOW}⚠️  SLOW - ${RESPONSE_TIME}ms response time${NC}"
    fi
else
    echo -e "${RED}❌ FAIL - API not returning valid data${NC}"
    exit 1
fi

# Test 7: Sample Data Verification
echo -n "📊 Verifying sample routes... "
SAMPLE_ROUTES=(
    "LHR,CDG"  # London to Paris
    "FRA,FCO"  # Frankfurt to Rome  
    "AMS,BCN"  # Amsterdam to Barcelona
)

FAILED_ROUTES=0
for route in "${SAMPLE_ROUTES[@]}"; do
    IFS=',' read -r origin dest <<< "$route"
    RESULT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM flight_durations WHERE origin_airport='$origin' AND destination_airport='$dest';" | tr -d ' ')
    if [ "$RESULT" -eq "0" ]; then
        ((FAILED_ROUTES++))
    fi
done

if [ "$FAILED_ROUTES" -eq "0" ]; then
    echo -e "${GREEN}✅ PASS${NC}"
else
    echo -e "${YELLOW}⚠️  WARNING - $FAILED_ROUTES sample routes missing${NC}"
fi

# Test 8: Database Indexes
echo -n "⚡ Checking database indexes... "
INDEX_COUNT=$(psql "$DATABASE_URL" -t -c "
    SELECT COUNT(*) FROM pg_indexes 
    WHERE tablename IN ('airports', 'flight_durations') 
    AND indexname LIKE 'idx_%';
" | tr -d ' ')

if [ "$INDEX_COUNT" -ge "2" ]; then
    echo -e "${GREEN}✅ PASS${NC} ($INDEX_COUNT indexes)"
else
    echo -e "${YELLOW}⚠️  WARNING - Only $INDEX_COUNT performance indexes found${NC}"
fi

# Test 9: Memory and Performance
echo -n "💾 Checking system resources... "
if command -v free > /dev/null; then
    AVAILABLE_MEM=$(free -m | awk 'NR==2{printf "%.0f", $7}')
    if [ "$AVAILABLE_MEM" -gt "512" ]; then
        echo -e "${GREEN}✅ PASS${NC} (${AVAILABLE_MEM}MB available)"
    else
        echo -e "${YELLOW}⚠️  WARNING - Low memory: ${AVAILABLE_MEM}MB${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  SKIP - Cannot check memory on this system${NC}"
fi

# Test 10: Data Freshness
echo -n "🕒 Checking data freshness... "
OLDEST_DATA=$(psql "$DATABASE_URL" -t -c "
    SELECT EXTRACT(DAYS FROM NOW() - MIN(created_at)) 
    FROM flight_durations;
" | tr -d ' ')

if [ "${OLDEST_DATA%.*}" -le "7" ]; then  # Remove decimal part and check if <= 7 days
    echo -e "${GREEN}✅ PASS${NC} (${OLDEST_DATA%.*} days old)"
else
    echo -e "${YELLOW}⚠️  WARNING - Data is ${OLDEST_DATA%.*} days old${NC}"
fi

echo "=================================="
echo -e "${GREEN}🎉 All critical tests passed!${NC}"
echo ""
echo "📈 Summary:"
echo "  • Airports: $AIRPORT_COUNT"
echo "  • Flight Routes: $DURATION_COUNT"  
echo "  • API Response Time: ${RESPONSE_TIME}ms"
echo "  • Data Age: ${OLDEST_DATA%.*} days"
echo ""
echo "🚀 System is ready for development/production!"
