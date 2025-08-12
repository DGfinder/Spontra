#!/bin/bash

# Theme Cities Migration Script
# Exports TypeScript theme cities data and migrates it to Cassandra

set -e

echo "🚀 Starting Theme Cities Migration Pipeline"
echo "==========================================="

# Configuration
FRONTEND_DIR="../../frontend"
THEME_CITIES_FILE="$FRONTEND_DIR/src/data/themeCities.ts"
JSON_OUTPUT_FILE="theme_cities_export.json"
MIGRATION_SCRIPT="migrate_theme_cities.go"

# Step 1: Check if TypeScript file exists
if [ ! -f "$THEME_CITIES_FILE" ]; then
    echo "❌ Theme cities file not found: $THEME_CITIES_FILE"
    exit 1
fi

echo "📂 Found theme cities file: $THEME_CITIES_FILE"

# Step 2: Export TypeScript data to JSON
echo "🔄 Exporting TypeScript data to JSON..."
node export_theme_cities_json.js "$THEME_CITIES_FILE" "$JSON_OUTPUT_FILE"

if [ ! -f "$JSON_OUTPUT_FILE" ]; then
    echo "❌ JSON export failed"
    exit 1
fi

echo "✅ JSON export completed: $JSON_OUTPUT_FILE"

# Step 3: Check if Cassandra is running (optional)
echo "🔍 Checking Cassandra connectivity..."
if command -v cqlsh &> /dev/null; then
    echo "📡 Testing Cassandra connection..."
    if timeout 5 cqlsh -e "DESCRIBE keyspaces;" &> /dev/null; then
        echo "✅ Cassandra is accessible"
    else
        echo "⚠️  Warning: Cannot connect to Cassandra. Make sure it's running on localhost:9042"
        echo "   You can start Cassandra with Docker:"
        echo "   docker run --name cassandra -p 9042:9042 -d cassandra:latest"
        echo ""
        read -p "Continue with migration anyway? (y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
else
    echo "⚠️  cqlsh not found. Cassandra connectivity cannot be verified."
fi

# Step 4: Run the Go migration script
echo "🚀 Running Go migration script..."
echo "   This will:"
echo "   - Connect to Cassandra"
echo "   - Initialize theme-based schema"
echo "   - Migrate all $( jq '.ALL_CITIES | length' "$JSON_OUTPUT_FILE" 2>/dev/null || echo "100" ) cities"
echo "   - Create theme-optimized indexes"
echo ""

# Build and run the Go migration
echo "🔨 Building migration script..."
go mod tidy
go build -o migrate_theme_cities "$MIGRATION_SCRIPT"

echo "📥 Starting data migration..."
./migrate_theme_cities "$JSON_OUTPUT_FILE"

# Step 5: Cleanup and summary
echo ""
echo "🧹 Cleaning up temporary files..."
rm -f migrate_theme_cities "$JSON_OUTPUT_FILE"

echo ""
echo "🎉 Migration Pipeline Completed Successfully!"
echo "============================================"
echo ""
echo "✅ Your theme-based destination database is now ready in Cassandra!"
echo ""
echo "Next steps:"
echo "1. 🔧 Update your backend API to use the new Cassandra schema"
echo "2. 🔗 Connect frontend to backend API endpoints"
echo "3. 🧪 Test theme-based destination queries"
echo "4. 📈 Monitor performance with your 100-city database"
echo ""
echo "Database schema includes:"
echo "• destinations - Main table with theme scores"
echo "• destinations_by_theme - Optimized for theme queries"
echo "• destinations_by_country - Country aggregations"
echo "• destination_recommendations_cache - Query caching"
echo ""
echo "Happy travels! ✈️🌍"