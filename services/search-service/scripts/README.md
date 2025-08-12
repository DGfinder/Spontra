# Search Service Data Population Scripts

This directory contains scripts to populate the search service database and Elasticsearch indices with comprehensive European flight and airport data.

## Scripts Overview

### 1. Flight Duration Population (`populate_flight_durations.go`)
Populates the PostgreSQL database with comprehensive flight duration data for European routes.

**Features:**
- ✈️ **75+ Major European Airports**: Covers all major hubs and regional airports
- 🌍 **5,600+ Route Combinations**: All possible routes between European cities
- ⏱️ **Accurate Duration Calculations**: Based on great circle distance + realistic taxi/procedures time
- 🛂 **Direct vs Connection Logic**: Intelligent routing for long-haul European routes
- 📊 **Real-world Data**: Reflects actual aviation patterns and typical flight times

**Data Generated:**
- Origin/destination airport pairs
- Flight duration in minutes (45 min - 8 hours)
- Distance in kilometers
- Direct flight availability
- Typical number of stops

### 2. Airport Data Population (`populate_airports.go`)
Populates Elasticsearch with searchable airport data for real-time suggestions.

**Features:**
- 🔍 **100+ European Airports**: Comprehensive airport database
- 🌐 **Multi-language Support**: Fuzzy search with accent folding
- 🎯 **Smart Relevance**: Code boosting for exact matches
- 🏙️ **Geographic Coverage**: All major European cities and regions
- ⚡ **Fast Search**: Optimized for sub-second response times

**Data Indexed:**
- IATA airport codes (LHR, CDG, FRA, etc.)
- Full airport names
- City and country information
- Country codes for filtering

## Usage

### Prerequisites
```bash
# PostgreSQL database running (for flight durations)
export DATABASE_URL="postgres://postgres:password@localhost/spontra_search?sslmode=disable"

# Elasticsearch running (for airports)
export ELASTICSEARCH_URL="http://localhost:9200"
```

### Run Flight Duration Population
```bash
cd scripts
go run populate_flight_durations.go
```

**Expected Output:**
```
Connected to database successfully
Clearing existing flight duration data...
Existing data cleared successfully
Generating flight durations for 75 airports...
Inserted 100 flight durations...
Inserted 200 flight durations...
...
Successfully inserted 5,550 flight duration records
Flight duration database populated successfully!
```

### Run Airport Data Population
```bash
cd scripts
go run populate_airports.go
```

**Expected Output:**
```
Elasticsearch connection successful (code 200): 8.11.0
Index spontra_airports already exists, deleting...
Created index spontra_airports (acknowledged: true)
Indexing 100 airports...
Successfully indexed 100 airports
Airport data populated successfully!
```

### Run Both Scripts
```bash
cd scripts
./populate_all.sh
```

## Database Schema

### Flight Durations Table
```sql
CREATE TABLE flight_durations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    origin_airport VARCHAR(3) NOT NULL,
    destination_airport VARCHAR(3) NOT NULL,
    duration_minutes INTEGER NOT NULL,
    distance_km INTEGER,
    is_direct BOOLEAN DEFAULT TRUE,
    typical_stops INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Elasticsearch Airport Index
```json
{
  "mappings": {
    "properties": {
      "code": {"type": "keyword"},
      "name": {"type": "text", "analyzer": "standard_folding"},
      "city": {"type": "text", "analyzer": "standard_folding"},
      "country": {"type": "text", "analyzer": "standard_folding"},
      "country_code": {"type": "keyword"},
      "type": {"type": "keyword"}
    }
  }
}
```

## Geographic Coverage

### Countries Included
- 🇬🇧 United Kingdom & 🇮🇪 Ireland
- 🇫🇷 France
- 🇩🇪 Germany
- 🇪🇸 Spain
- 🇮🇹 Italy
- 🇳🇱 Netherlands
- 🇧🇪 Belgium
- 🇨🇭 Switzerland
- 🇦🇹 Austria
- 🇸🇪 Sweden, 🇩🇰 Denmark, 🇳🇴 Norway, 🇫🇮 Finland
- 🇵🇱 Poland, 🇨🇿 Czech Republic, 🇭🇺 Hungary
- 🇵🇹 Portugal
- 🇬🇷 Greece
- 🇹🇷 Turkey (European part)
- 🇭🇷 Croatia, 🇸🇮 Slovenia
- And more...

### Major Airport Hubs Covered
- **London**: LHR, LGW, STN, LTN
- **Paris**: CDG, ORY
- **Frankfurt**: FRA
- **Amsterdam**: AMS
- **Madrid**: MAD
- **Rome**: FCO
- **Munich**: MUC
- **Barcelona**: BCN
- **Milan**: MXP, LIN, BGY
- **Zurich**: ZUR

## Data Quality

### Flight Duration Accuracy
- **Distance Calculation**: Haversine formula for great circle distance
- **Speed Assumptions**: 850 km/h cruise speed (realistic for commercial aviation)
- **Procedure Time**: 35 minutes added for taxi, takeoff, climb, descent, landing
- **Connection Logic**: Routes > 3000km or specific regional patterns get connections
- **Bounds Checking**: 45 minutes minimum, 8 hours maximum within Europe

### Real-world Patterns
- Direct flights prioritized for major hub connections
- Connection flights for Nordic ↔ Southern Europe routes
- Regional routing reflects actual airline network patterns
- Distance-based connection logic mirrors aviation economics

## Integration with Search Service

Once populated, this data enables:

### Flight Search Features
- ⚡ **Duration Filtering**: "Show flights under 3 hours"
- 🎯 **Direct Flight Preference**: "Non-stop flights only"
- 📊 **Realistic Estimates**: Accurate time expectations for users
- 🔄 **Connection Handling**: Proper routing for multi-leg journeys

### Airport Search Features
- 🔍 **Instant Suggestions**: Type "Lon" → see London airports
- 🌐 **Fuzzy Matching**: "Parris" → finds "Paris"
- 🏙️ **City Search**: "Berlin" → shows BER airport
- 🎯 **Code Priority**: "LHR" ranks higher than text matches

## Performance Metrics

### Expected Performance
- **Flight Duration Queries**: < 1ms (indexed on route)
- **Airport Suggestions**: < 50ms (Elasticsearch)
- **Database Size**: ~5,600 flight duration records
- **Index Size**: ~100 airport documents
- **Memory Usage**: < 10MB for all data

## Troubleshooting

### Common Issues

**Database Connection Error**
```bash
# Check PostgreSQL is running
pg_isready -h localhost -p 5432

# Verify database exists
psql -h localhost -U postgres -l | grep spontra_search
```

**Elasticsearch Connection Error**
```bash
# Check Elasticsearch is running
curl -X GET "localhost:9200/_cluster/health"

# Verify index creation
curl -X GET "localhost:9200/spontra_airports/_mapping"
```

**Incomplete Data Population**
```bash
# Check flight durations count
psql -h localhost -U postgres -d spontra_search -c "SELECT COUNT(*) FROM flight_durations;"

# Check airport index count
curl -X GET "localhost:9200/spontra_airports/_count"
```

## Next Steps

After running these scripts:

1. **Start Search Service**: The service will use this data for flight searches
2. **Test Search Endpoints**: Verify duration filtering and airport suggestions work
3. **Monitor Performance**: Check query times and cache hit rates
4. **Add More Data**: Extend with additional European routes or global coverage
5. **Update Regularly**: Refresh data as airline routes change

## Data Maintenance

### Recommended Updates
- **Quarterly**: Review and update flight duration assumptions
- **Annually**: Add new airports and routes
- **As Needed**: Adjust connection logic based on airline network changes

### Monitoring
- Track search query patterns to identify missing routes
- Monitor duration accuracy against real booking data
- Update airport data when new airports open or codes change