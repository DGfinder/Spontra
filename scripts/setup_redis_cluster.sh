#!/bin/bash

# Redis Cluster Setup for Spontra Platform
# This script sets up Redis for development and production environments

set -e  # Exit on any error

echo "🚀 Setting up Redis Cluster for Spontra Platform"
echo "================================================"

# Configuration
REDIS_VERSION="7.2"
CLUSTER_SIZE=3
REPLICA_COUNT=1
BASE_PORT=7000

# Environment detection
ENVIRONMENT=${ENVIRONMENT:-"development"}
REDIS_PASSWORD=${REDIS_PASSWORD:-"spontra_redis_2024"}

echo "📊 Configuration:"
echo "  Environment: $ENVIRONMENT"
echo "  Redis Version: $REDIS_VERSION"
echo "  Cluster Size: $CLUSTER_SIZE nodes"
echo "  Replicas: $REPLICA_COUNT per master"
echo "  Base Port: $BASE_PORT"
echo ""

# Create directories
echo "📁 Creating Redis directories..."
mkdir -p redis-cluster/data
mkdir -p redis-cluster/logs
mkdir -p redis-cluster/config

# Generate Redis configuration files
echo "⚙️  Generating Redis configuration files..."

for i in $(seq 0 $((CLUSTER_SIZE + REPLICA_COUNT - 1))); do
    port=$((BASE_PORT + i))
    
    cat > redis-cluster/config/redis-$port.conf << EOF
# Redis Configuration for Spontra Platform
# Node: $port

# Network
port $port
bind 127.0.0.1
protected-mode yes
tcp-backlog 511
timeout 0
tcp-keepalive 300

# General
daemonize yes
pidfile redis-cluster/logs/redis-$port.pid
loglevel notice
logfile redis-cluster/logs/redis-$port.log
databases 16

# Security
requirepass $REDIS_PASSWORD
masterauth $REDIS_PASSWORD

# Memory Management
maxmemory 512mb
maxmemory-policy allkeys-lru
maxmemory-samples 5

# Persistence
save 900 1
save 300 10
save 60 10000
stop-writes-on-bgsave-error yes
rdbcompression yes
rdbchecksum yes
dbfilename dump-$port.rdb
dir redis-cluster/data/

# AOF
appendonly yes
appendfilename "appendonly-$port.aof"
appendfsync everysec
no-appendfsync-on-rewrite no
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb
aof-load-truncated yes

# Clustering
cluster-enabled yes
cluster-config-file redis-cluster/config/nodes-$port.conf
cluster-node-timeout 15000
cluster-announce-ip 127.0.0.1
cluster-announce-port $port
cluster-announce-bus-port $((port + 10000))

# Slow Log
slowlog-log-slower-than 10000
slowlog-max-len 128

# Latency Monitor
latency-monitor-threshold 100

# Performance
# Disable some features for better performance in development
hz 10
dynamic-hz yes

# Clients
maxclients 10000
EOF

done

echo "✅ Configuration files generated for $((CLUSTER_SIZE + REPLICA_COUNT)) nodes"

# Start Redis instances
echo ""
echo "🔥 Starting Redis instances..."

for i in $(seq 0 $((CLUSTER_SIZE + REPLICA_COUNT - 1))); do
    port=$((BASE_PORT + i))
    echo "  Starting Redis on port $port..."
    redis-server redis-cluster/config/redis-$port.conf
    sleep 1
done

echo "✅ All Redis instances started"

# Wait for instances to be ready
echo ""
echo "⏳ Waiting for Redis instances to be ready..."
sleep 5

# Create cluster
echo ""
echo "🔗 Creating Redis cluster..."

# Build cluster creation command
CLUSTER_NODES=""
for i in $(seq 0 $((CLUSTER_SIZE + REPLICA_COUNT - 1))); do
    port=$((BASE_PORT + i))
    CLUSTER_NODES="$CLUSTER_NODES 127.0.0.1:$port"
done

echo "Creating cluster with nodes:$CLUSTER_NODES"
echo "yes" | redis-cli --cluster create $CLUSTER_NODES \
    --cluster-replicas $REPLICA_COUNT \
    -a $REDIS_PASSWORD

echo "✅ Redis cluster created successfully"

# Verify cluster
echo ""
echo "🔍 Verifying cluster status..."
redis-cli --cluster check 127.0.0.1:$BASE_PORT -a $REDIS_PASSWORD

# Configure service-specific databases
echo ""
echo "📋 Configuring service-specific databases..."

# Database assignments
declare -A SERVICE_DBS=(
    ["user-service"]=0
    ["search-service"]=1
    ["pricing-service"]=2
    ["data-ingestion-service"]=3
)

for service in "${!SERVICE_DBS[@]}"; do
    db=${SERVICE_DBS[$service]}
    echo "  $service → Database $db"
    
    # Set service metadata
    redis-cli -p $BASE_PORT -a $REDIS_PASSWORD -n $db SET "service:name" "$service"
    redis-cli -p $BASE_PORT -a $REDIS_PASSWORD -n $db SET "service:db" "$db"
    redis-cli -p $BASE_PORT -a $REDIS_PASSWORD -n $db SET "service:initialized" "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
done

echo "✅ Service databases configured"

# Create monitoring script
echo ""
echo "📊 Creating monitoring script..."

cat > redis-cluster/monitor.sh << 'EOF'
#!/bin/bash

# Redis Cluster Monitoring Script

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Redis Cluster Status${NC}"
echo "========================"

# Check cluster status
echo -e "\n${YELLOW}Cluster Nodes:${NC}"
redis-cli --cluster check 127.0.0.1:7000 -a $REDIS_PASSWORD 2>/dev/null || echo "Cluster check failed"

# Check individual nodes
echo -e "\n${YELLOW}Node Status:${NC}"
for port in {7000..7005}; do
    if redis-cli -p $port -a $REDIS_PASSWORD ping >/dev/null 2>&1; then
        echo -e "  Port $port: ${GREEN}✓ Running${NC}"
    else
        echo -e "  Port $port: ${RED}✗ Down${NC}"
    fi
done

# Memory usage
echo -e "\n${YELLOW}Memory Usage:${NC}"
for port in {7000..7002}; do
    if redis-cli -p $port -a $REDIS_PASSWORD ping >/dev/null 2>&1; then
        memory=$(redis-cli -p $port -a $REDIS_PASSWORD info memory 2>/dev/null | grep used_memory_human | cut -d: -f2 | tr -d '\r')
        echo "  Port $port: $memory"
    fi
done

# Key statistics
echo -e "\n${YELLOW}Database Statistics:${NC}"
declare -A SERVICE_DBS=(["user-service"]=0 ["search-service"]=1 ["pricing-service"]=2 ["data-ingestion-service"]=3)

for service in "${!SERVICE_DBS[@]}"; do
    db=${SERVICE_DBS[$service]}
    keys=$(redis-cli -p 7000 -a $REDIS_PASSWORD -n $db dbsize 2>/dev/null | tr -d '\r')
    echo "  $service (DB $db): $keys keys"
done

# Slow queries
echo -e "\n${YELLOW}Recent Slow Queries:${NC}"
redis-cli -p 7000 -a $REDIS_PASSWORD slowlog get 3 2>/dev/null | head -20 || echo "No slow queries found"

echo ""
EOF

chmod +x redis-cluster/monitor.sh
echo "✅ Monitoring script created at redis-cluster/monitor.sh"

# Create management scripts
echo ""
echo "🛠️  Creating management scripts..."

# Stop script
cat > redis-cluster/stop.sh << 'EOF'
#!/bin/bash
echo "🛑 Stopping Redis cluster..."
for port in {7000..7005}; do
    if redis-cli -p $port -a $REDIS_PASSWORD ping >/dev/null 2>&1; then
        echo "  Stopping Redis on port $port..."
        redis-cli -p $port -a $REDIS_PASSWORD shutdown
    fi
done
echo "✅ Redis cluster stopped"
EOF

# Start script
cat > redis-cluster/start.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting Redis cluster..."
for port in {7000..7005}; do
    if [ -f "config/redis-$port.conf" ]; then
        echo "  Starting Redis on port $port..."
        redis-server config/redis-$port.conf
        sleep 1
    fi
done
echo "✅ Redis cluster started"
echo "Run ./monitor.sh to check status"
EOF

# Backup script
cat > redis-cluster/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR

echo "💾 Creating Redis cluster backup..."
for port in {7000..7002}; do
    if redis-cli -p $port -a $REDIS_PASSWORD ping >/dev/null 2>&1; then
        echo "  Backing up node $port..."
        redis-cli -p $port -a $REDIS_PASSWORD --rdb $BACKUP_DIR/redis-$port.rdb
    fi
done

# Backup configuration
cp -r config $BACKUP_DIR/
echo "✅ Backup created in $BACKUP_DIR"
EOF

chmod +x redis-cluster/stop.sh
chmod +x redis-cluster/start.sh  
chmod +x redis-cluster/backup.sh

echo "✅ Management scripts created"

# Create environment configuration
echo ""
echo "🌍 Creating environment configuration..."

cat > redis-cluster/.env << EOF
# Redis Cluster Environment Configuration
REDIS_CLUSTER_NODES=127.0.0.1:7000,127.0.0.1:7001,127.0.0.1:7002
REDIS_PASSWORD=$REDIS_PASSWORD

# Service-specific Redis URLs
USER_SERVICE_REDIS_URL=redis://:$REDIS_PASSWORD@127.0.0.1:7000/0
SEARCH_SERVICE_REDIS_URL=redis://:$REDIS_PASSWORD@127.0.0.1:7000/1
PRICING_SERVICE_REDIS_URL=redis://:$REDIS_PASSWORD@127.0.0.1:7000/2
DATA_INGESTION_SERVICE_REDIS_URL=redis://:$REDIS_PASSWORD@127.0.0.1:7000/3

# Connection settings
REDIS_POOL_SIZE=20
REDIS_MAX_CONNECTIONS=100
REDIS_TIMEOUT=5s
REDIS_RETRY_ATTEMPTS=3
EOF

echo "✅ Environment configuration created"

# Test cluster functionality
echo ""
echo "🧪 Testing cluster functionality..."

# Test basic operations
echo "Testing SET/GET operations..."
redis-cli -c -p $BASE_PORT -a $REDIS_PASSWORD SET test_key "Hello Spontra Platform" >/dev/null
result=$(redis-cli -c -p $BASE_PORT -a $REDIS_PASSWORD GET test_key 2>/dev/null)

if [ "$result" = "Hello Spontra Platform" ]; then
    echo "✅ Basic operations working"
    redis-cli -c -p $BASE_PORT -a $REDIS_PASSWORD DEL test_key >/dev/null
else
    echo "❌ Basic operations failed"
    exit 1
fi

# Test service databases
echo "Testing service database isolation..."
for service in "${!SERVICE_DBS[@]}"; do
    db=${SERVICE_DBS[$service]}
    redis-cli -p $BASE_PORT -a $REDIS_PASSWORD -n $db SET "test:$service" "active" >/dev/null
    result=$(redis-cli -p $BASE_PORT -a $REDIS_PASSWORD -n $db GET "test:$service" 2>/dev/null)
    
    if [ "$result" = "active" ]; then
        echo "  ✅ $service (DB $db) working"
        redis-cli -p $BASE_PORT -a $REDIS_PASSWORD -n $db DEL "test:$service" >/dev/null
    else
        echo "  ❌ $service (DB $db) failed"
    fi
done

# Create performance test script
echo ""
echo "⚡ Creating performance test script..."

cat > redis-cluster/performance_test.sh << 'EOF'
#!/bin/bash

echo "⚡ Redis Performance Test"
echo "========================"

# Basic performance test
echo "Running basic performance test..."
redis-cli -p 7000 -a $REDIS_PASSWORD --latency-history -i 1 -c 10 &
LATENCY_PID=$!

# Benchmark
echo ""
echo "Running redis-benchmark..."
redis-benchmark -h 127.0.0.1 -p 7000 -a $REDIS_PASSWORD -c 50 -n 10000 -d 3 -t ping,set,get,incr,lpush,rpush,lpop,rpop,sadd,hset,spop,lrange,mset --csv

# Stop latency monitor
kill $LATENCY_PID 2>/dev/null

echo ""
echo "✅ Performance test completed"
EOF

chmod +x redis-cluster/performance_test.sh

# Generate connection examples
echo ""
echo "📚 Creating connection examples..."

mkdir -p redis-cluster/examples

# Go example
cat > redis-cluster/examples/go_connection.go << 'EOF'
package main

import (
    "context"
    "fmt"
    "log"
    "github.com/go-redis/redis/v8"
)

func main() {
    // Connect to Redis cluster
    rdb := redis.NewClusterClient(&redis.ClusterOptions{
        Addrs:    []string{"127.0.0.1:7000", "127.0.0.1:7001", "127.0.0.1:7002"},
        Password: "spontra_redis_2024",
    })
    
    ctx := context.Background()
    
    // Test connection
    pong, err := rdb.Ping(ctx).Result()
    if err != nil {
        log.Fatal(err)
    }
    fmt.Println("Connected to Redis:", pong)
    
    // Example operations
    err = rdb.Set(ctx, "example_key", "Hello from Go!", 0).Err()
    if err != nil {
        log.Fatal(err)
    }
    
    val, err := rdb.Get(ctx, "example_key").Result()
    if err != nil {
        log.Fatal(err)
    }
    fmt.Println("Retrieved value:", val)
}
EOF

# Service configuration examples
cat > redis-cluster/examples/service_config.yaml << 'EOF'
# Example configuration for Spontra services

user_service:
  redis:
    url: "redis://:spontra_redis_2024@127.0.0.1:7000/0"
    pool_size: 20
    timeout: 5s

search_service:
  redis:
    url: "redis://:spontra_redis_2024@127.0.0.1:7000/1"
    pool_size: 20
    timeout: 5s

pricing_service:
  redis:
    url: "redis://:spontra_redis_2024@127.0.0.1:7000/2"
    pool_size: 20
    timeout: 5s

data_ingestion_service:
  redis:
    url: "redis://:spontra_redis_2024@127.0.0.1:7000/3"
    pool_size: 20
    timeout: 5s
EOF

echo "✅ Connection examples created"

# Final status
echo ""
echo "🎉 Redis Cluster Setup Complete!"
echo "================================"
echo ""
echo "📊 Cluster Information:"
echo "  • Nodes: 127.0.0.1:7000-7005"
echo "  • Masters: 3"
echo "  • Replicas: 3"
echo "  • Password: $REDIS_PASSWORD"
echo ""
echo "🗄️  Service Database Assignments:"
echo "  • User Service: Database 0"
echo "  • Search Service: Database 1"
echo "  • Pricing Service: Database 2"
echo "  • Data Ingestion Service: Database 3"
echo ""
echo "🛠️  Management Commands:"
echo "  • Check status: cd redis-cluster && ./monitor.sh"
echo "  • Stop cluster: cd redis-cluster && ./stop.sh"
echo "  • Start cluster: cd redis-cluster && ./start.sh"
echo "  • Create backup: cd redis-cluster && ./backup.sh"
echo "  • Performance test: cd redis-cluster && ./performance_test.sh"
echo ""
echo "🌍 Environment Variables:"
echo "  • Source: source redis-cluster/.env"
echo "  • USER_SERVICE_REDIS_URL=redis://:$REDIS_PASSWORD@127.0.0.1:7000/0"
echo "  • SEARCH_SERVICE_REDIS_URL=redis://:$REDIS_PASSWORD@127.0.0.1:7000/1"
echo "  • PRICING_SERVICE_REDIS_URL=redis://:$REDIS_PASSWORD@127.0.0.1:7000/2"
echo "  • DATA_INGESTION_SERVICE_REDIS_URL=redis://:$REDIS_PASSWORD@127.0.0.1:7000/3"
echo ""
echo "🚀 Your Redis cluster is ready for the Spontra platform!"

# Run initial monitoring
cd redis-cluster && ./monitor.sh
EOF