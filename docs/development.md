# Development Guide

This guide will help you set up your development environment and start contributing to Spontra.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Docker & Docker Compose** (latest version)
- **Go 1.21+** for backend development
- **Node.js 18+** for frontend development
- **kubectl** for Kubernetes operations
- **Terraform 1.0+** for infrastructure management
- **gcloud CLI** for Google Cloud operations

## Initial Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd spontra
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start the development infrastructure:**
   ```bash
   make dev-up
   ```

4. **Install frontend dependencies:**
   ```bash
   cd frontend && npm install
   ```

5. **Initialize Go modules:**
   ```bash
   make init-services
   ```

## Development Workflow

### Starting Development Environment

1. **Start all services:**
   ```bash
   make dev-up
   ```

2. **Start the frontend development server:**
   ```bash
   cd frontend && npm run dev
   ```

3. **Start individual Go services:**
   ```bash
   # User service
   cd services/user-service && go run main.go

   # Search service
   cd services/search-service && go run main.go

   # Pricing service
   cd services/pricing-service && go run main.go

   # Data ingestion service
   cd services/data-ingestion-service && go run main.go
   ```

### Running Tests

- **All tests:** `make test`
- **Go services only:** `go test ./... -v` (in each service directory)
- **Frontend only:** `cd frontend && npm test`

### Code Quality

- **Linting:** `make lint`
- **Formatting:** `make format`
- **Type checking:** `cd frontend && npm run type-check`

## Service Architecture

### Core Services

1. **User Service** (Port 8080)
   - Authentication and authorization
   - User profile management
   - User preferences

2. **Search Service** (Port 8081)
   - Flight search orchestration
   - Elasticsearch integration
   - Search result caching

3. **Pricing Service** (Port 8082)
   - Price comparison
   - Price tracking and alerts
   - Historical price data

4. **Data Ingestion Service** (Port 8083)
   - External API integration
   - Real-time data processing
   - Kafka message production

5. **Frontend** (Port 3000)
   - Next.js React application
   - Server-side rendering
   - User interface

### Supporting Infrastructure

- **PostgreSQL** (Port 5432) - Primary database
- **Redis** (Port 6379) - Caching layer
- **Elasticsearch** (Port 9200) - Search engine
- **Kafka** (Port 9092) - Message streaming
- **Cassandra** (Port 9042) - Time-series data
- **Prometheus** (Port 9090) - Metrics collection
- **Grafana** (Port 3001) - Monitoring dashboard

## API Documentation

### Service Endpoints

#### User Service (`http://localhost:8080`)
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/users/:id` - Get user profile
- `PUT /api/v1/users/:id` - Update user profile

#### Search Service (`http://localhost:8081`)
- `POST /api/v1/search/flights` - Search for flights
- `GET /api/v1/search/flights/:searchId` - Get search results
- `GET /api/v1/search/suggestions/airports` - Airport suggestions

#### Pricing Service (`http://localhost:8082`)
- `POST /api/v1/pricing/compare` - Compare flight prices
- `GET /api/v1/pricing/history/:flightId` - Get price history
- `POST /api/v1/alerts` - Create price alert

## Database Schema

### PostgreSQL Databases

1. **user_service_db**
   - `users` - User accounts
   - `user_preferences` - User settings
   - `price_alerts` - Price alert configurations
   - `search_history` - User search history

2. **search_service_db**
   - `airports` - Airport reference data
   - `airlines` - Airline reference data
   - `aircraft_types` - Aircraft information
   - `flight_routes` - Route cache

### Cassandra Schema

- **flight_inventory** - Real-time flight availability
- **price_history** - Historical pricing data
- **search_results** - Cached search results

## Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=spontra
DB_PASSWORD=development
DB_NAME=spontra

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Elasticsearch
ELASTICSEARCH_URL=http://localhost:9200

# Kafka
KAFKA_BROKERS=localhost:9092

# External APIs
AMADEUS_API_KEY=your_api_key
SABRE_API_KEY=your_api_key

# JWT
JWT_SECRET=your_jwt_secret_key

# GCP (for deployment)
GCP_PROJECT_ID=your-project-id
GCP_REGION=us-central1
```

## Troubleshooting

### Common Issues

1. **Port conflicts:**
   - Check if ports are already in use: `lsof -i :PORT`
   - Stop conflicting services or change ports in configuration

2. **Database connection issues:**
   - Ensure PostgreSQL is running: `docker ps`
   - Check connection parameters in `.env`

3. **Go module issues:**
   - Clean module cache: `go clean -modcache`
   - Re-download dependencies: `go mod download`

4. **Frontend build issues:**
   - Clear npm cache: `npm cache clean --force`
   - Delete node_modules and reinstall: `rm -rf node_modules && npm install`

### Debug Commands

```bash
# Check service health
curl http://localhost:8080/health  # User service
curl http://localhost:8081/health  # Search service
curl http://localhost:8082/health  # Pricing service
curl http://localhost:8083/health  # Data ingestion service

# View service logs
docker-compose -f docker/docker-compose.dev.yml logs [service-name]

# Connect to database
docker exec -it spontra_postgres_1 psql -U spontra -d user_service_db

# Connect to Redis
docker exec -it spontra_redis_1 redis-cli
```

## Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes and test thoroughly
3. Run linting and tests: `make lint && make test`
4. Commit your changes: `git commit -m "Add your feature"`
5. Push to your branch: `git push origin feature/your-feature`
6. Create a Pull Request

## Getting Help

- Check the [troubleshooting section](#troubleshooting)
- Review existing [GitHub issues](https://github.com/your-org/spontra/issues)
- Create a new issue if you encounter bugs or have questions