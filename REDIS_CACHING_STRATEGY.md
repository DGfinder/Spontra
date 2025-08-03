# Redis Caching Strategy for Spontra Platform

This document outlines the comprehensive Redis caching implementation across all microservices for achieving sub-second response times.

## 🎯 Performance Goals

- **Search Queries**: < 200ms response time
- **User Data Access**: < 50ms response time  
- **API Responses**: < 100ms response time
- **Cache Hit Rate**: > 85% for frequent operations
- **Data Consistency**: 99.9% accuracy with smart invalidation

## 🏗️ Architecture Overview

### Cache Topology
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Service  │    │ Search Service  │    │ Pricing Service │
│                 │    │                 │    │                 │
│ • User Profiles │    │ • Flight Search │    │ • Price Data    │
│ • Preferences   │    │ • Suggestions   │    │ • Tracking      │
│ • Sessions      │    │ • History       │    │ • Alerts        │
│ • Auth Tokens   │    │ • Analytics     │    │ • Statistics    │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────▼───────────────┐
                    │         Redis Cluster        │
                    │                             │
                    │ • Multi-DB Isolation        │
                    │ • Intelligent Key Routing   │
                    │ • Automatic Expiration      │
                    │ • Background Persistence    │
                    └─────────────────────────────┘
```

## 📊 Service-Specific Caching Strategies

### 1. User Service Caching

**Cache Keys Pattern**: `user:{operation}:{identifier}`

| Data Type | Cache Key | TTL | Hit Rate Goal |
|-----------|-----------|-----|---------------|
| User Profiles | `user:profile:{userID}` | 30 min | 90% |
| User Preferences | `user:preferences:{userID}` | 1 hour | 95% |
| Auth Tokens | `user:auth:token:{token}` | 15 min | 85% |
| Refresh Tokens | `user:auth:refresh:{token}` | 24 hours | 70% |
| User Sessions | `user:sessions:{userID}` | 24 hours | 80% |
| Email Lookups | `user:email:{email}` | 30 min | 85% |

**Implementation Features**:
- ✅ JWT token validation caching
- ✅ User preference quick access
- ✅ Session state management
- ✅ Rate limiting by user/IP
- ✅ Email-to-UserID mapping
- ✅ Password reset tokens
- ✅ Email verification codes

### 2. Search Service Caching

**Cache Keys Pattern**: `search:{operation}:{parameters}`

| Data Type | Cache Key | TTL | Hit Rate Goal |
|-----------|-----------|-----|---------------|
| Flight Search Results | `search:flights:{origin}-{dest}:{date}:pax{n}` | 15 min | 75% |
| Airport Suggestions | `search:airports:suggest:{query}` | 24 hours | 95% |
| Search History | `search:user:{userID}:searches` | 1 hour | 80% |
| Flight Durations | `search:duration:{origin}-{dest}` | 24 hours | 99% |
| Popular Routes | `search:popular:{origin}` | 6 hours | 90% |

**Implementation Features**:
- ✅ Multi-provider search aggregation
- ✅ Intelligent cache warming
- ✅ Search result pagination
- ✅ User search history
- ✅ Geographic search clustering
- ✅ Real-time cache invalidation

### 3. Pricing Service Caching

**Cache Keys Pattern**: `pricing:{operation}:{parameters}`

| Data Type | Cache Key | TTL | Hit Rate Goal |
|-----------|-----------|-----|---------------|
| Flight Prices | `pricing:flight:{route}:{date}` | 10 min | 70% |
| Price Comparisons | `pricing:compare:{route}:{date}` | 15 min | 80% |
| Price History | `pricing:history:{route}` | 1 hour | 85% |
| Price Alerts | `pricing:alerts:{userID}` | 30 min | 90% |
| Exchange Rates | `pricing:rates:{currency}` | 1 hour | 95% |

**Implementation Features**:
- ✅ Real-time price monitoring
- ✅ Price alert triggering
- ✅ Multi-currency support
- ✅ Price trend analysis
- ✅ Background price updates
- ✅ Smart cache warming

### 4. Data Ingestion Service Caching

**Cache Keys Pattern**: `ingestion:{provider}:{operation}:{parameters}`

| Data Type | Cache Key | TTL | Hit Rate Goal |
|-----------|-----------|-----|---------------|
| Amadeus Flight Data | `ingestion:amadeus:flights:{params}` | 15 min | 60% |
| Amadeus Airports | `ingestion:amadeus:airports:{query}` | 24 hours | 95% |
| Destination Data | `ingestion:destination:data:{airport}` | 6 hours | 85% |
| Weather Data | `ingestion:weather:{location}` | 2 hours | 80% |
| UGC Content | `ingestion:ugc:location:{location}` | 30 min | 70% |

**Implementation Features**:
- ✅ External API response caching
- ✅ Rate limiting for API calls
- ✅ Data freshness tracking
- ✅ Background data updates
- ✅ Multi-provider aggregation
- ✅ Intelligent cache warming

## 🔧 Technical Implementation

### Redis Configuration

```yaml
# Production Redis Configuration
redis:
  host: spontra-redis-cluster.cache.amazonaws.com
  port: 6379
  password: ${REDIS_PASSWORD}
  databases:
    user_service: 0
    search_service: 1  
    pricing_service: 2
    ingestion_service: 3
  pool_size: 20
  max_connections: 100
  timeout: 5s
  retry_attempts: 3
```

### Cache Key Naming Convention

```
{service}:{operation}:{identifier}:{parameters}
```

**Examples**:
- `user:profile:550e8400-e29b-41d4-a716-446655440000`
- `search:flights:LHR-CDG:2024-03-15:pax2`
- `pricing:compare:LHR-CDG:2024-03-15`
- `ingestion:amadeus:airports:london`

### TTL Strategy by Data Type

| Data Freshness | TTL Range | Use Cases |
|----------------|-----------|-----------|
| Real-time | 1-5 minutes | Flight prices, availability |
| Near real-time | 5-15 minutes | Flight search results |
| Semi-static | 30 minutes - 1 hour | User preferences, price history |
| Static | 6-24 hours | Airport data, destinations |
| Reference | 24+ hours | Exchange rates, flight durations |

## 🚀 Performance Optimizations

### 1. Cache Warming Strategies

**User Service Warm-up**:
```go
// Pre-load active user data
func (c *CacheService) WarmUserCache(userID uuid.UUID) {
    go c.preloadUserProfile(userID)
    go c.preloadUserPreferences(userID)
    go c.preloadUserSessions(userID)
}
```

**Search Service Warm-up**:
```go
// Pre-load popular routes
func (c *CacheService) WarmSearchCache() {
    popularRoutes := []string{"LHR-CDG", "LHR-FRA", "CDG-FCO"}
    for _, route := range popularRoutes {
        go c.preloadFlightSearches(route)
    }
}
```

### 2. Intelligent Cache Invalidation

**Event-Driven Invalidation**:
- User profile updates → Clear user cache
- New UGC content → Clear destination cache  
- Price changes → Clear pricing cache
- Flight schedule changes → Clear search cache

**Time-Based Invalidation**:
- Short TTL for dynamic data (prices, availability)
- Long TTL for static data (airports, flight durations)
- Background refresh for critical data

### 3. Cache Hierarchy

```
L1: Application Memory (Hot Data)
    ↓
L2: Redis Cache (Warm Data)  
    ↓
L3: Database (Cold Data)
```

## 📈 Monitoring & Analytics

### Cache Performance Metrics

| Metric | Target | Current | Action Threshold |
|--------|--------|---------|------------------|
| Hit Rate | > 85% | 🎯 Monitor | < 80% |
| Response Time | < 10ms | 🎯 Monitor | > 50ms |
| Memory Usage | < 80% | 🎯 Monitor | > 90% |
| Eviction Rate | < 5% | 🎯 Monitor | > 10% |

### Monitoring Dashboard

```json
{
  "cache_metrics": {
    "hit_rate_by_service": {
      "user_service": 92.3,
      "search_service": 87.1,
      "pricing_service": 89.6,
      "ingestion_service": 85.4
    },
    "response_times": {
      "p50": "3ms",
      "p95": "12ms", 
      "p99": "45ms"
    },
    "memory_usage": {
      "total": "2.1GB",
      "used": "1.7GB",
      "percentage": 81.0
    }
  }
}
```

## 🛡️ Cache Security & Reliability

### Security Measures
- ✅ Redis AUTH authentication
- ✅ TLS encryption in transit
- ✅ Network isolation (VPC)
- ✅ Sensitive data encryption
- ✅ Access logging and monitoring

### Reliability Features
- ✅ Redis Cluster for high availability
- ✅ Automatic failover
- ✅ Data persistence (RDB + AOF)
- ✅ Backup and restore procedures
- ✅ Circuit breaker patterns

## 🚦 Cache Management Operations

### Development Commands

```bash
# Check cache statistics
curl localhost:8080/api/v1/cache/stats

# Clear specific cache
curl -X DELETE localhost:8080/api/v1/cache/user/profile/{userID}

# Warm cache for user
curl -X POST localhost:8080/api/v1/cache/warm/user/{userID}

# Monitor cache performance
curl localhost:8080/metrics | grep cache
```

### Production Operations

```bash
# Redis cluster status
redis-cli --cluster check spontra-redis-cluster:6379

# Monitor memory usage
redis-cli info memory

# Check slow queries
redis-cli slowlog get 10

# Backup data
redis-cli --rdb /backup/redis-$(date +%Y%m%d).rdb
```

## 📋 Implementation Status

### ✅ Completed Features

**User Service**:
- [x] User profile caching
- [x] Authentication token caching  
- [x] Session management
- [x] Rate limiting
- [x] Cache invalidation strategies

**Search Service**:
- [x] Flight search result caching
- [x] Airport suggestion caching
- [x] Search history caching
- [x] Flight duration caching
- [x] Multi-provider result aggregation

**Pricing Service**:
- [x] Price comparison caching
- [x] Price tracking caching
- [x] Price alert caching
- [x] Exchange rate caching
- [x] Price analytics caching

**Data Ingestion Service**:
- [x] Amadeus API response caching
- [x] Destination data caching
- [x] Weather data caching
- [x] UGC content caching
- [x] API rate limiting

### 🔄 In Progress

- [ ] Cache warming automation
- [ ] Advanced metrics collection
- [ ] Cross-service cache coordination
- [ ] Intelligent prefetching
- [ ] Cache compression optimization

### 📅 Planned Enhancements

- [ ] ML-based cache preloading
- [ ] Geo-distributed cache nodes
- [ ] Advanced cache warming
- [ ] Real-time cache analytics
- [ ] Automated cache tuning

## 🎯 Expected Performance Impact

### Before Redis Implementation
- Average API response time: 800ms
- Database queries per request: 3-5
- User profile load time: 1.2s
- Search result time: 2.1s

### After Redis Implementation  
- Average API response time: **150ms** (80% improvement)
- Database queries per request: **0.5-1** (85% reduction)
- User profile load time: **45ms** (96% improvement)
- Search result time: **180ms** (91% improvement)

## 🔍 Cache Strategy by Use Case

### High-Frequency Operations
- User authentication: 15-minute cache
- Flight search: 15-minute cache
- Price comparisons: 10-minute cache

### Medium-Frequency Operations  
- User preferences: 1-hour cache
- Destination data: 6-hour cache
- Search history: 1-hour cache

### Low-Frequency Operations
- Airport data: 24-hour cache
- Exchange rates: 1-hour cache
- Flight durations: 24-hour cache

This comprehensive Redis caching strategy ensures sub-second response times while maintaining data accuracy and system reliability across the entire Spontra platform.