# Spontra - Spontaneous Travel Discovery Platform

A revolutionary travel discovery platform that transforms how people find destinations by prioritizing spontaneous exploration over traditional flight search. Unlike conventional platforms that start with destinations, Spontra starts with time and activities to inspire spontaneous travel decisions.

## 🚀 Unique User Experience

### Spontaneous Discovery Flow
1. **Time-First Approach**: Users specify flight duration ranges (e.g., 2-4 hours) instead of destinations
2. **Activity Preferences**: Select interests like adventure, nightlife, culture, food, or shopping
3. **Country Constellation**: Discover destinations through an interactive circular constellation interface
4. **Activity Exploration**: Dive deeper into specific activities at chosen destinations with video previews
5. **Smart Flight Selection**: Curated flight options with activity-contextual information and optimal timing

### Key Innovations
- **Constellation UI Pattern**: Visual, spatial exploration replacing traditional lists and tables
- **Activity-Driven Recommendations**: Destinations matched to user interests rather than price-first searching
- **YouTube Integration**: Real activity videos to inspire and validate destination choices
- **User-Generated Content**: Community-driven travel experiences with GPS verification
- **Atmospheric Design**: Full-screen backgrounds that change based on selected activities for immersive planning

## Architecture Overview

Spontra uses a cloud-native, microservices-based architecture designed for high availability, scalability, and performance:

- **Frontend**: Next.js with React for server-side rendering and optimal performance
- **Backend**: Go microservices with API Gateway (Envoy Proxy)
- **Databases**: PostgreSQL + Cassandra + Redis for different data patterns
- **Search**: Elasticsearch for real-time flight search
- **Streaming**: Apache Kafka for real-time data processing
- **Analytics**: Apache Spark + BigQuery for data analytics and ML
- **Infrastructure**: Kubernetes on GCP with Terraform IaC

## Project Structure

```
spontra/
├── services/              # Go microservices
│   ├── user-service/      # Authentication and user management
│   ├── search-service/    # Flight search orchestration
│   ├── pricing-service/   # Price comparison and tracking
│   └── data-ingestion-service/  # External API integration
├── frontend/              # Next.js React application
├── infrastructure/        # Terraform infrastructure as code
├── docker/               # Docker configurations
├── k8s/                  # Kubernetes manifests
├── scripts/              # Development and deployment scripts
└── docs/                 # Technical documentation
```

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Go 1.21+
- Node.js 18+
- kubectl (for Kubernetes deployment)
- Terraform (for infrastructure)

### Development Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd spontra
```

2. Start the development environment:
```bash
make dev-up
```

3. Run the frontend:
```bash
cd frontend && npm run dev
```

## Services

### Core Microservices

- **User Service**: Handles authentication, user profiles, and preferences
- **Search Service**: Orchestrates flight searches and manages caching
- **Pricing Service**: Compares prices across providers and tracks changes
- **Data Ingestion Service**: Integrates with external flight data APIs

### Supporting Infrastructure

- **API Gateway**: Routes requests and handles cross-cutting concerns
- **Message Queue**: Kafka for asynchronous processing
- **Databases**: Multi-store approach for optimal data patterns
- **Monitoring**: Prometheus, Grafana, and distributed tracing

## Data Management

### Airport Data Management

Spontra maintains up-to-date airport data using the OpenFlights dataset:

```bash
# Update airport data from OpenFlights
python scripts/update_airports_from_openflights.py

# This script will:
# 1. Clone/update the OpenFlights repository
# 2. Process airports.dat with country name resolution
# 3. Generate temp/airports_openflights.csv
# 4. Load data into PostgreSQL airports table
```

**Dependencies**: Requires `pycountry` Python package for country name resolution.

### Flight Duration Data

For development and testing, flight durations are calculated using geographic distance and typical flight patterns:

```bash
# Populate flight durations (European routes)
cd services/search-service/scripts
python populate_flight_durations.py

# Generates 3,080+ flight duration records for 56 major European airports
# Based on great circle distance calculations with realistic flight time estimates
```

**Note**: This provides estimated flight times for development. For production, integrate with airline schedule APIs (Amadeus, Sabre, etc.) for real scheduled flight data.

### Database Schema

- **airports**: 5,970+ airports with IATA codes, coordinates, and country data
- **flight_durations**: Calculated flight times between European airport pairs
- **search_sessions**: User search history and preferences
- **search_history**: Detailed search analytics

## Development

See [Development Guide](docs/development.md) for detailed setup instructions.

## Deployment

See [Deployment Guide](docs/deployment.md) for production deployment instructions.

## Contributing

See [Contributing Guide](docs/contributing.md) for development guidelines and best practices.