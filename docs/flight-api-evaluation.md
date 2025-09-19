# Flight Data API Provider Evaluation

## Executive Summary

This document evaluates major flight data providers for integrating real scheduled flight data into Spontra, replacing the current estimated duration calculations with actual airline timetables.

## Provider Comparison Matrix

| Provider | Coverage | Real-time | Pricing Model | Integration Complexity | Recommendation |
|----------|----------|-----------|---------------|----------------------|----------------|
| **Amadeus** | Global (500+ airlines) | Yes | Pay-per-request | Medium | ⭐⭐⭐⭐⭐ **Top Choice** |
| **Sabre** | Global (400+ airlines) | Yes | Subscription + usage | High | ⭐⭐⭐⭐ **Enterprise** |
| **Travelport** | Global (350+ airlines) | Yes | Subscription | High | ⭐⭐⭐ **Complex** |
| **FlightStats** | Global (300+ airlines) | Yes | Subscription | Low | ⭐⭐⭐⭐ **Simple** |
| **Skyscanner** | Global (1000+ airlines) | Yes | Partnership only | Low | ⭐⭐ **Limited** |

## Detailed Analysis

### 1. Amadeus for Developers ⭐⭐⭐⭐⭐

**Best Overall Choice for Spontra**

#### Strengths:
- **Comprehensive Coverage**: 500+ airlines, 5000+ airports worldwide
- **Developer-Friendly**: Excellent REST APIs with OpenAPI specs
- **Free Tier**: 2,000 API calls/month for development
- **Real-time Data**: Live pricing, availability, and schedules
- **European Focus**: Strong coverage of European routes (perfect for current dataset)

#### API Endpoints:
```javascript
// Flight Offers Search - Real-time pricing and availability
GET /v2/shopping/flight-offers?originLocationCode=LHR&destinationLocationCode=CDG&departureDate=2025-09-20

// Flight Schedules - Timetable data
GET /v1/reference-data/airlines/{airlineCode}/destinations?origin=LHR

// Airport Search - Enhanced airport data
GET /v1/reference-data/locations?subType=AIRPORT&keyword=london

// Flight Status - Real-time delays/cancellations
GET /v2/schedule/flights?carrierCode=BA&flightNumber=123&scheduledDepartureDate=2025-09-20
```

#### Data Format Example:
```json
{
  "data": [
    {
      "type": "flight-offer",
      "id": "1",
      "oneWay": false,
      "lastTicketingDate": "2025-09-20",
      "itineraries": [
        {
          "duration": "PT1H25M",
          "segments": [
            {
              "departure": {
                "iataCode": "LHR",
                "terminal": "5",
                "at": "2025-09-20T08:15:00"
              },
              "arrival": {
                "iataCode": "CDG",
                "terminal": "2A", 
                "at": "2025-09-20T10:40:00"
              },
              "carrierCode": "BA",
              "number": "0308",
              "aircraft": {
                "code": "320"
              },
              "operating": {
                "carrierCode": "BA"
              },
              "duration": "PT1H25M",
              "numberOfStops": 0
            }
          ]
        }
      ],
      "price": {
        "currency": "EUR",
        "total": "89.00",
        "base": "67.00"
      }
    }
  ]
}
```

#### Pricing:
- **Free Tier**: 2,000 calls/month
- **Pay-as-you-go**: €0.35 per search request
- **Monthly Plans**: €99/month (10,000 calls), €299/month (50,000 calls)

#### Integration Effort: **2-3 weeks**

### 2. Sabre Dev Studio ⭐⭐⭐⭐

**Enterprise-Grade Solution**

#### Strengths:
- **GDS Access**: Direct access to Global Distribution System
- **Historical Data**: Extensive historical flight performance data
- **Advanced Features**: Fare rules, seat maps, baggage policies
- **Enterprise Support**: Dedicated support for high-volume users

#### API Endpoints:
```javascript
// InstaFlights Search
GET /v1/shop/flights?origin=LHR&destination=CDG&departuredate=2025-09-20

// Schedules
GET /v1/lists/supported/shop/flights/origins-destinations?origin=LHR

// Flight Status
GET /v2/flight/status/{flight}/{date}
```

#### Pricing:
- **Certification Required**: Must complete Sabre certification
- **Monthly Minimum**: $500/month minimum commitment
- **Usage-based**: $0.50-2.00 per transaction depending on volume

#### Integration Effort: **4-6 weeks**

### 3. FlightStats by Cirium ⭐⭐⭐⭐

**Simplest Integration**

#### Strengths:
- **Simple REST APIs**: Easy to integrate and understand
- **Flight Status Focus**: Excellent real-time flight tracking
- **Flexible Pricing**: Multiple pricing tiers
- **Good Documentation**: Clear API documentation and examples

#### API Endpoints:
```javascript
// Schedules
GET /flex/schedules/rest/v1/json/from/{origin}/to/{destination}/departing/{year}/{month}/{day}

// Flight Status  
GET /flex/flightstatus/rest/v2/json/flight/status/{carrier}/{flight}/dep/{year}/{month}/{day}
```

#### Pricing:
- **Starter**: $99/month (10,000 calls)
- **Professional**: $299/month (50,000 calls)
- **Enterprise**: Custom pricing

#### Integration Effort: **1-2 weeks**

### 4. OpenSky Network ⭐⭐⭐

**Free Alternative (Limited)**

#### Strengths:
- **Free**: Open-source flight tracking data
- **Real-time**: Live aircraft positions and flight data
- **No API Keys**: Simple REST API without authentication

#### Limitations:
- **No Pricing**: Position data only, no fare information
- **Limited Schedules**: No comprehensive timetable data
- **Best Effort**: No SLA or guaranteed uptime

#### Use Case: **Flight tracking visualization, not booking**

## Recommended Implementation Strategy

### Phase 1: Amadeus Integration (Month 1)

1. **Setup & Authentication**
   ```bash
   # Get API credentials
   curl -X POST "https://test.api.amadeus.com/v1/security/oauth2/token" \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "grant_type=client_credentials&client_id=YOUR_CLIENT_ID&client_secret=YOUR_CLIENT_SECRET"
   ```

2. **Core Endpoints Integration**
   - Flight Offers Search (real-time pricing)
   - Flight Schedules (timetable data)
   - Airport/Airline reference data

3. **Database Population**
   - Import airline reference data
   - Populate scheduled_flights table
   - Set up daily schedule refresh

### Phase 2: Enhanced Features (Month 2)

4. **Advanced Search Features**
   - Multi-city routes
   - Flexible date searches
   - Price tracking and alerts

5. **Caching Strategy**
   ```javascript
   // Cache schedule data for 24 hours
   // Cache pricing data for 15 minutes
   // Cache reference data for 7 days
   ```

### Phase 3: Production Optimization (Month 3)

6. **Rate Limiting & Optimization**
   - Request batching
   - Smart caching
   - Fallback to estimates when API unavailable

7. **Cost Management**
   - Monitor API usage
   - Implement request deduplication
   - Cache popular routes longer

## Integration Code Template

### Amadeus Service Implementation

```typescript
// services/amadeus-client.ts
export class AmadeusClient {
  private accessToken: string
  private baseUrl = 'https://api.amadeus.com'
  
  async authenticate(): Promise<void> {
    const response = await fetch(`${this.baseUrl}/v1/security/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: process.env.AMADEUS_CLIENT_ID!,
        client_secret: process.env.AMADEUS_CLIENT_SECRET!
      })
    })
    const data = await response.json()
    this.accessToken = data.access_token
  }
  
  async searchFlights(params: FlightSearchParams): Promise<FlightOffer[]> {
    const url = new URL(`${this.baseUrl}/v2/shopping/flight-offers`)
    url.searchParams.set('originLocationCode', params.origin)
    url.searchParams.set('destinationLocationCode', params.destination)
    url.searchParams.set('departureDate', params.departureDate)
    
    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${this.accessToken}` }
    })
    
    const data = await response.json()
    return this.transformToFlightOffers(data)
  }
  
  async getSchedules(origin: string, destination: string): Promise<ScheduledFlight[]> {
    // Implementation for schedule data
  }
}
```

### Database Migration

```sql
-- Create new tables
\i docs/scheduled-flights-schema.sql

-- Populate airlines from Amadeus
INSERT INTO airlines (iata_code, name, country_code)
SELECT DISTINCT carrier_code, carrier_name, country
FROM amadeus_airlines_import;

-- Populate scheduled flights
INSERT INTO scheduled_flights (...)
SELECT ... FROM amadeus_schedules_import;
```

## Cost Analysis

### Monthly API Costs (Estimated)

| Usage Level | Requests/Month | Amadeus Cost | Sabre Cost | FlightStats Cost |
|-------------|----------------|--------------|------------|------------------|
| **Development** | 2,000 | Free | $500 | $99 |
| **Launch** | 10,000 | €99 | $750 | $99 |
| **Growth** | 50,000 | €299 | $1,500 | $299 |
| **Scale** | 200,000 | €999 | $4,000 | $999 |

### ROI Considerations

- **Revenue per Search**: €0.50-2.00 (booking commissions)
- **Break-even**: ~200-600 searches per month at €299 API cost
- **User Experience**: Real schedules increase booking conversion by 15-25%

## Final Recommendation

**Choose Amadeus for Developers** for the following reasons:

1. ✅ **Perfect for Spontra's European focus**
2. ✅ **Developer-friendly with excellent documentation**
3. ✅ **Free tier for development and testing**
4. ✅ **Reasonable pricing that scales with growth**
5. ✅ **Comprehensive data including pricing and schedules**
6. ✅ **2-3 week integration timeline fits development schedule**

**Next Steps:**
1. Sign up for Amadeus for Developers account
2. Get API credentials and test with sandbox environment
3. Build proof-of-concept integration for LHR-CDG route
4. Implement database schema and migration scripts
5. Deploy to staging environment for testing

This approach provides the best balance of functionality, cost, and development speed for Spontra's current stage and growth trajectory.
