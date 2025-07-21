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

## Development

See [Development Guide](docs/development.md) for detailed setup instructions.

## Deployment

See [Deployment Guide](docs/deployment.md) for production deployment instructions.

## Contributing

See [Contributing Guide](docs/contributing.md) for development guidelines and best practices.