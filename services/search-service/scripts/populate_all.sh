#!/bin/bash

# Populate Search Service Database and Elasticsearch
# This script runs both flight duration and airport data population

set -e  # Exit on any error

echo "🚀 Starting Search Service Data Population..."
echo "========================================"

# Check if we're in the right directory
if [ ! -f "populate_flight_durations.go" ] || [ ! -f "populate_airports.go" ]; then
    echo "❌ Error: Script files not found. Please run from the scripts directory."
    exit 1
fi

# Set default environment variables if not provided
export DATABASE_URL=${DATABASE_URL:-"postgres://postgres:password@localhost/spontra_search?sslmode=disable"}
export ELASTICSEARCH_URL=${ELASTICSEARCH_URL:-"http://localhost:9200"}

echo "📊 Configuration:"
echo "  Database URL: $DATABASE_URL"
echo "  Elasticsearch URL: $ELASTICSEARCH_URL"
echo ""

# Build the executables
echo "🔨 Building scripts..."
go build -o populate_flight_durations populate_flight_durations.go
go build -o populate_airports populate_airports.go
echo "✅ Scripts built successfully"
echo ""

# Run flight duration population
echo "✈️  Populating Flight Duration Database..."
echo "========================================="
./populate_flight_durations
echo ""

# Run airport data population
echo "🏢 Populating Airport Search Index..."
echo "===================================="
./populate_airports
echo ""

# Verification
echo "🔍 Verifying Data Population..."
echo "==============================="

# Check PostgreSQL data
echo "Checking PostgreSQL flight durations..."
DURATION_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM flight_durations;" 2>/dev/null | tr -d ' ' || echo "0")
echo "  ✅ Flight duration records: $DURATION_COUNT"

# Check Elasticsearch data
echo "Checking Elasticsearch airport index..."
AIRPORT_COUNT=$(curl -s -X GET "$ELASTICSEARCH_URL/spontra_airports/_count" | grep -o '"count":[0-9]*' | cut -d: -f2 || echo "0")
echo "  ✅ Airport records: $AIRPORT_COUNT"

echo ""
echo "🎉 Data Population Complete!"
echo "=========================="
echo "Your search service is now ready with:"
echo "  • $DURATION_COUNT flight duration records"
echo "  • $AIRPORT_COUNT airport records"
echo ""
echo "Next steps:"
echo "  1. Start the search service: 'go run main.go'"
echo "  2. Test flight search: 'curl -X POST localhost:8081/api/v1/search/flights'"
echo "  3. Test airport suggestions: 'curl localhost:8081/api/v1/search/suggestions/airports?q=london'"

# Cleanup
rm -f populate_flight_durations populate_airports

echo ""
echo "🚀 Ready for takeoff!"