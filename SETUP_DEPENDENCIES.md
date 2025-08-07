# 🛠️ Dependencies Setup for Live Results

## **Step 1: Install Go 1.21+**

### **Windows (your current system):**
```bash
# Download from official site
# https://golang.org/dl/
# Choose: go1.21.x.windows-amd64.msi

# Or using chocolatey:
choco install golang

# Or using scoop:
scoop install go
```

### **Verify Installation:**
```bash
go version  # Should show go1.21.x
```

## **Step 2: Download Go Dependencies**

### **Navigate to each service and download deps:**
```bash
# Data Ingestion Service (main API)
cd services/data-ingestion-service
go mod download

# Search Service  
cd ../search-service
go mod download

# User Service
cd ../user-service  
go mod download

# Pricing Service
cd ../pricing-service
go mod download
```

## **Step 3: Start Infrastructure**

### **Start all infrastructure services:**
```bash
cd docker
docker-compose -f docker-compose.dev.yml up -d
```

### **Verify infrastructure is running:**
```bash
# Check all services are up
docker-compose -f docker-compose.dev.yml ps

# Test connectivity
curl http://localhost:9200  # Elasticsearch
curl http://localhost:6379  # Redis  
```

## **Step 4: Start Backend Services**

### **Terminal 1 - Data Ingestion Service (Port 8083):**
```bash
cd services/data-ingestion-service
go run main.go
```

### **Terminal 2 - Search Service (Port 8081):**
```bash
cd services/search-service  
go run main.go
```

### **Verify services are running:**
```bash
curl http://localhost:8083/health
curl http://localhost:8081/health
```

## **Step 5: Test Live Range Search**

### **Frontend is already running on http://localhost:3000**

### **Test the complete flow:**
1. Open browser to http://localhost:3000
2. Select "Adventure" theme
3. Enter "LHR" as departure airport
4. Set range slider to **2h - 6h** 
5. Click "Search" 
6. **🎉 Get live results with real Amadeus data!**

## **Expected Dependencies List:**

### **Go Packages (auto-downloaded):**
- `gin-gonic/gin` - Web framework
- `gocql/gocql` - Cassandra driver  
- `olivere/elastic` - Elasticsearch client
- `go-redis/redis` - Redis client
- `segmentio/kafka-go` - Kafka client
- `google/uuid` - UUID generation
- `lib/pq` - PostgreSQL driver
- `go-playground/validator` - Validation

### **Infrastructure (Docker):**
- PostgreSQL 15
- Redis 7  
- Elasticsearch 8.11
- Kafka + Zookeeper
- Cassandra 4.1
- Prometheus + Grafana

## **🚀 After Setup Complete:**

You'll have:
- ✅ **Live Amadeus API** integration
- ✅ **Range-based search** (2h-6h flights)
- ✅ **Real-time pricing** and availability
- ✅ **Instant destination** filtering
- ✅ **Activity matching** by theme
- ✅ **Full microservices** architecture

**Total setup time: ~15-30 minutes** depending on download speeds!