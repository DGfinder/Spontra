#!/bin/bash

# Elasticsearch Optimization Setup for Spontra Platform
# Configures Elasticsearch for optimal search performance

set -e

echo "🔍 Optimizing Elasticsearch for Spontra Platform"
echo "================================================"

# Configuration
ES_HOST=${ES_HOST:-"localhost:9200"}
ES_USER=${ES_USER:-""}
ES_PASSWORD=${ES_PASSWORD:-""}

# Function to make curl requests to Elasticsearch
es_curl() {
    local method=$1
    local endpoint=$2
    local data=$3
    
    local auth_header=""
    if [[ -n "$ES_USER" && -n "$ES_PASSWORD" ]]; then
        auth_header="-u $ES_USER:$ES_PASSWORD"
    fi
    
    if [[ -n "$data" ]]; then
        curl -s -X "$method" "$ES_HOST$endpoint" \
            -H "Content-Type: application/json" \
            $auth_header \
            -d "$data"
    else
        curl -s -X "$method" "$ES_HOST$endpoint" \
            $auth_header
    fi
}

# Check Elasticsearch connection
echo "🔍 Checking Elasticsearch connection..."
if ! es_curl "GET" "/" > /dev/null 2>&1; then
    echo "❌ Cannot connect to Elasticsearch at $ES_HOST"
    echo "Please ensure Elasticsearch is running and accessible"
    exit 1
fi

echo "✅ Connected to Elasticsearch"

# Get cluster info
echo ""
echo "📊 Cluster Information:"
es_curl "GET" "/" | jq -r '"Version: " + .version.number + " | Cluster: " + .cluster_name'

# Apply cluster-level optimizations
echo ""
echo "⚙️  Applying cluster-level optimizations..."

# Update cluster settings for better performance
CLUSTER_SETTINGS='{
  "persistent": {
    "indices.recovery.max_bytes_per_sec": "100mb",
    "cluster.routing.allocation.disk.watermark.low": "85%",
    "cluster.routing.allocation.disk.watermark.high": "90%",
    "cluster.routing.allocation.disk.watermark.flood_stage": "95%",
    "indices.breaker.total.limit": "70%",
    "indices.breaker.fielddata.limit": "40%",
    "indices.breaker.request.limit": "20%",
    "thread_pool.search.queue_size": 2000,
    "thread_pool.write.queue_size": 1000
  }
}'

es_curl "PUT" "/_cluster/settings" "$CLUSTER_SETTINGS"
echo "✅ Applied cluster settings"

# Create optimized index templates
echo ""
echo "📝 Creating optimized index templates..."

# Flight index template
FLIGHT_TEMPLATE='{
  "index_patterns": ["spontra_flights*"],
  "settings": {
    "number_of_shards": 2,
    "number_of_replicas": 1,
    "refresh_interval": "5s",
    "index.mapping.total_fields.limit": 2000,
    "index.max_result_window": 50000,
    "index.query.default_field": ["origin_airport", "destination_airport", "airline"],
    "analysis": {
      "analyzer": {
        "standard_folding": {
          "type": "custom",
          "tokenizer": "standard",
          "filter": ["lowercase", "asciifolding"]
        },
        "autocomplete": {
          "type": "custom",
          "tokenizer": "keyword",
          "filter": ["lowercase", "edge_ngram_filter"]
        },
        "search_analyzer": {
          "type": "custom",
          "tokenizer": "keyword",
          "filter": ["lowercase"]
        }
      },
      "filter": {
        "edge_ngram_filter": {
          "type": "edge_ngram",
          "min_gram": 1,
          "max_gram": 20
        }
      }
    }
  },
  "mappings": {
    "dynamic": "strict",
    "properties": {
      "id": {"type": "keyword"},
      "provider": {"type": "keyword"},
      "origin_airport": {"type": "keyword"},
      "destination_airport": {"type": "keyword"},
      "departure_time": {"type": "date", "format": "strict_date_optional_time"},
      "arrival_time": {"type": "date", "format": "strict_date_optional_time"},
      "duration_minutes": {"type": "integer", "index": true},
      "price": {"type": "scaled_float", "scaling_factor": 100},
      "currency": {"type": "keyword"},
      "cabin_class": {"type": "keyword"},
      "airline": {"type": "keyword"},
      "flight_number": {"type": "keyword"},
      "aircraft": {"type": "text", "analyzer": "standard_folding"},
      "stops": {"type": "byte"},
      "is_refundable": {"type": "boolean"},
      "baggage_included": {"type": "boolean"},
      "valid_until": {"type": "date"},
      "seats_available": {"type": "short"},
      "relevance_score": {"type": "half_float"},
      "activity_match": {"type": "half_float"},
      "created_at": {"type": "date"},
      "updated_at": {"type": "date"}
    }
  }
}'

es_curl "PUT" "/_index_template/spontra_flights" "$FLIGHT_TEMPLATE"
echo "✅ Created flight index template"

# Airport index template
AIRPORT_TEMPLATE='{
  "index_patterns": ["spontra_airports*"],
  "settings": {
    "number_of_shards": 1,
    "number_of_replicas": 1,
    "refresh_interval": "30s",
    "analysis": {
      "analyzer": {
        "standard_folding": {
          "type": "custom",
          "tokenizer": "standard",
          "filter": ["lowercase", "asciifolding"]
        },
        "autocomplete": {
          "type": "custom",
          "tokenizer": "keyword",
          "filter": ["lowercase", "edge_ngram_filter"]
        },
        "search_analyzer": {
          "type": "custom",
          "tokenizer": "keyword",
          "filter": ["lowercase"]
        }
      },
      "filter": {
        "edge_ngram_filter": {
          "type": "edge_ngram",
          "min_gram": 1,
          "max_gram": 20
        }
      }
    }
  },
  "mappings": {
    "dynamic": "strict",
    "properties": {
      "code": {
        "type": "text",
        "analyzer": "autocomplete",
        "search_analyzer": "search_analyzer",
        "fields": {
          "exact": {"type": "keyword"},
          "suggest": {"type": "completion"}
        }
      },
      "name": {
        "type": "text",
        "analyzer": "autocomplete",
        "search_analyzer": "search_analyzer",
        "fields": {
          "standard": {"type": "text", "analyzer": "standard_folding"},
          "suggest": {"type": "completion", "contexts": [{"name": "country", "type": "category"}]}
        }
      },
      "city": {
        "type": "text",
        "analyzer": "autocomplete",
        "search_analyzer": "search_analyzer",
        "fields": {
          "standard": {"type": "text", "analyzer": "standard_folding"}
        }
      },
      "country": {
        "type": "text",
        "analyzer": "standard_folding",
        "fields": {
          "keyword": {"type": "keyword"}
        }
      },
      "country_code": {"type": "keyword"},
      "type": {"type": "keyword"},
      "popularity": {"type": "half_float"},
      "coordinates": {"type": "geo_point"},
      "timezone": {"type": "keyword"},
      "created_at": {"type": "date"},
      "updated_at": {"type": "date"}
    }
  }
}'

es_curl "PUT" "/_index_template/spontra_airports" "$AIRPORT_TEMPLATE"
echo "✅ Created airport index template"

# Create ILM policies for data lifecycle management
echo ""
echo "🔄 Setting up Index Lifecycle Management..."

# Flight data ILM policy (hot -> warm -> cold -> delete)
FLIGHT_ILM_POLICY='{
  "policy": {
    "phases": {
      "hot": {
        "actions": {
          "rollover": {
            "max_size": "10gb",
            "max_age": "7d"
          },
          "set_priority": {
            "priority": 100
          }
        }
      },
      "warm": {
        "min_age": "7d",
        "actions": {
          "set_priority": {
            "priority": 50
          },
          "allocate": {
            "number_of_replicas": 0
          },
          "forcemerge": {
            "max_num_segments": 1
          }
        }
      },
      "cold": {
        "min_age": "30d",
        "actions": {
          "set_priority": {
            "priority": 0
          },
          "allocate": {
            "number_of_replicas": 0
          }
        }
      },
      "delete": {
        "min_age": "90d"
      }
    }
  }
}'

es_curl "PUT" "/_ilm/policy/spontra-flights-policy" "$FLIGHT_ILM_POLICY"
echo "✅ Created flight data ILM policy"

# Airport data ILM policy (static data, longer retention)
AIRPORT_ILM_POLICY='{
  "policy": {
    "phases": {
      "hot": {
        "actions": {
          "set_priority": {
            "priority": 100
          }
        }
      },
      "warm": {
        "min_age": "30d",
        "actions": {
          "set_priority": {
            "priority": 50
          },
          "forcemerge": {
            "max_num_segments": 1
          }
        }
      }
    }
  }
}'

es_curl "PUT" "/_ilm/policy/spontra-airports-policy" "$AIRPORT_ILM_POLICY"
echo "✅ Created airport data ILM policy"

# Set up search templates for optimized queries
echo ""
echo "🔍 Creating search templates..."

# Flight search template
FLIGHT_SEARCH_TEMPLATE='{
  "script": {
    "lang": "mustache",
    "source": {
      "query": {
        "bool": {
          "filter": [
            {"term": {"origin_airport": "{{origin}}"}},
            {"term": {"destination_airport": "{{destination}}"}},
            {"range": {"departure_time": {"gte": "{{date_from}}", "lte": "{{date_to}}"}}}
          ],
          "should": [
            {{#cabin_class}}{"term": {"cabin_class": "{{cabin_class}}"}}{{/cabin_class}},
            {{#direct_only}}{"term": {"stops": 0}}{{/direct_only}},
            {{#preferred_airlines}}{"terms": {"airline": [{{#.}}"{{.}}"{{#unless @last}},{{/unless}}{{/.}}]}}{{/preferred_airlines}}
          ],
          "must_not": [
            {{#excluded_airlines}}{"terms": {"airline": [{{#.}}"{{.}}"{{#unless @last}},{{/unless}}{{/.}}]}}{{/excluded_airlines}}
          ]
        }
      },
      "sort": [
        {{#sort_price}}{"price": {"order": "{{sort_order}}"}}{{/sort_price}},
        {{#sort_duration}}{"duration_minutes": {"order": "{{sort_order}}"}}{{/sort_duration}},
        {{#sort_departure}}{"departure_time": {"order": "{{sort_order}}"}}{{/sort_departure}},
        {"_score": {"order": "desc"}}
      ],
      "_source": {
        "includes": ["id", "provider", "origin_airport", "destination_airport", "departure_time", "arrival_time", "duration_minutes", "price", "currency", "airline", "flight_number", "stops", "cabin_class"]
      },
      "size": "{{max_results}}",
      "from": "{{from}}"
    }
  }
}'

es_curl "PUT" "/_scripts/flight_search" "$FLIGHT_SEARCH_TEMPLATE"
echo "✅ Created flight search template"

# Airport autocomplete template
AIRPORT_AUTOCOMPLETE_TEMPLATE='{
  "script": {
    "lang": "mustache",
    "source": {
      "query": {
        "bool": {
          "should": [
            {"term": {"code.exact": {"value": "{{query}}", "boost": 10}}},
            {"prefix": {"code": {"value": "{{query}}", "boost": 5}}},
            {"prefix": {"name": {"value": "{{query}}", "boost": 3}}},
            {"prefix": {"city": {"value": "{{query}}", "boost": 3}}},
            {"multi_match": {
              "query": "{{query}}",
              "fields": ["code^3", "name.standard^2", "city.standard^2", "country"],
              "type": "best_fields",
              "fuzziness": "AUTO"
            }}
          ],
          "minimum_should_match": 1
        }
      },
      "sort": [
        {"_score": {"order": "desc"}},
        {"popularity": {"order": "desc", "missing": "_last"}}
      ],
      "_source": {
        "includes": ["code", "name", "city", "country", "country_code", "type", "coordinates"]
      },
      "size": "{{limit}}"
    }
  }
}'

es_curl "PUT" "/_scripts/airport_autocomplete" "$AIRPORT_AUTOCOMPLETE_TEMPLATE"
echo "✅ Created airport autocomplete template"

# Performance monitoring setup
echo ""
echo "📊 Setting up performance monitoring..."

# Enable slow query logging
SLOW_LOG_SETTINGS='{
  "index.search.slowlog.threshold.query.warn": "2s",
  "index.search.slowlog.threshold.query.info": "1s",
  "index.search.slowlog.threshold.query.debug": "500ms",
  "index.search.slowlog.threshold.fetch.warn": "1s",
  "index.search.slowlog.threshold.fetch.info": "500ms",
  "index.search.slowlog.threshold.fetch.debug": "200ms"
}'

# Apply to existing indices if they exist
for index in "spontra_flights" "spontra_airports"; do
    if es_curl "HEAD" "/$index" > /dev/null 2>&1; then
        es_curl "PUT" "/$index/_settings" "$SLOW_LOG_SETTINGS"
        echo "✅ Applied slow log settings to $index"
    fi
done

# Create monitoring indices if they don't exist
echo ""
echo "🔧 Creating monitoring indices..."

# Search analytics index
SEARCH_ANALYTICS_MAPPING='{
  "settings": {
    "number_of_shards": 1,
    "number_of_replicas": 1,
    "refresh_interval": "10s"
  },
  "mappings": {
    "properties": {
      "timestamp": {"type": "date"},
      "query": {"type": "keyword"},
      "origin": {"type": "keyword"},
      "destination": {"type": "keyword"},
      "results_count": {"type": "integer"},
      "response_time_ms": {"type": "integer"},
      "user_id": {"type": "keyword"},
      "session_id": {"type": "keyword"},
      "user_agent": {"type": "text"},
      "ip_address": {"type": "ip"}
    }
  }
}'

if ! es_curl "HEAD" "/spontra_search_analytics" > /dev/null 2>&1; then
    es_curl "PUT" "/spontra_search_analytics" "$SEARCH_ANALYTICS_MAPPING"
    echo "✅ Created search analytics index"
fi

# Warmup common queries
echo ""
echo "🔥 Warming up caches with common queries..."

# Common airport queries
COMMON_AIRPORTS=("LON" "PAR" "NYC" "SFO" "LAX" "JFK" "LHR" "CDG" "AMS" "BER")

for airport in "${COMMON_AIRPORTS[@]}"; do
    WARMUP_QUERY='{
      "template": {
        "id": "airport_autocomplete",
        "params": {
          "query": "'$airport'",
          "limit": 5
        }
      }
    }'
    
    es_curl "POST" "/spontra_airports/_search/template" "$WARMUP_QUERY" > /dev/null 2>&1
done

echo "✅ Cache warmup completed"

# Final optimization check
echo ""
echo "🔍 Running final optimization check..."

# Force refresh all indices
es_curl "POST" "/_refresh" > /dev/null 2>&1

# Get cluster health
CLUSTER_HEALTH=$(es_curl "GET" "/_cluster/health")
STATUS=$(echo "$CLUSTER_HEALTH" | jq -r '.status')
NODES=$(echo "$CLUSTER_HEALTH" | jq -r '.number_of_nodes')
INDICES=$(echo "$CLUSTER_HEALTH" | jq -r '.active_primary_shards')

echo ""
echo "🎉 Elasticsearch Optimization Complete!"
echo "======================================"
echo ""
echo "📊 Cluster Status:"
echo "  Status: $STATUS"
echo "  Nodes: $NODES"
echo "  Active Shards: $INDICES"
echo ""
echo "✅ Optimizations Applied:"
echo "  • Index templates with performance mappings"
echo "  • Autocomplete analyzers for instant search"
echo "  • ILM policies for data lifecycle management"
echo "  • Search templates for query optimization"
echo "  • Slow query logging enabled"
echo "  • Cache warmup completed"
echo ""
echo "🚀 Expected Performance Improvements:"
echo "  • Sub-100ms airport autocomplete"
echo "  • Sub-500ms flight search responses"
echo "  • Efficient memory and storage usage"
echo "  • Automatic data lifecycle management"
echo ""
echo "📝 Next Steps:"
echo "  1. Update your application to use search templates"
echo "  2. Monitor slow query logs for optimization opportunities"
echo "  3. Set up alerts for cluster health and performance"
echo "  4. Consider adding more nodes as data grows"

# Save configuration summary
CONFIG_SUMMARY='{
  "optimization_completed": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
  "elasticsearch_version": "'$(es_curl "GET" "/" | jq -r '.version.number')'",
  "cluster_name": "'$(es_curl "GET" "/" | jq -r '.cluster_name')'",
  "templates_created": ["spontra_flights", "spontra_airports"],
  "ilm_policies": ["spontra-flights-policy", "spontra-airports-policy"],
  "search_templates": ["flight_search", "airport_autocomplete"],
  "performance_features": {
    "autocomplete": true,
    "search_templates": true,
    "ilm_management": true,
    "slow_logging": true,
    "cache_warmup": true
  }
}'

echo "$CONFIG_SUMMARY" > elasticsearch_optimization_summary.json
echo ""
echo "📋 Configuration summary saved to: elasticsearch_optimization_summary.json"