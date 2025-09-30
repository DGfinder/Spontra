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

Spontra uses a modern, serverless architecture designed for high availability, scalability, and performance:

- **Frontend**: Next.js 15+ with React 19 for server-side rendering and optimal performance
- **Backend**: Next.js API Routes and Server Actions
- **Database**: PostgreSQL (Neon serverless) with Prisma ORM
- **Caching**: Redis (Vercel KV) + in-app offer caching
- **Search**: Elasticsearch for destination discovery
- **Streaming**: Apache Kafka for event processing
- **Infrastructure**: Vercel for frontend deployment, Terraform IaC for cloud resources

## Project Structure

```
spontra/
├── frontend/              # Next.js 15+ application
│   ├── src/app/          # App Router pages and API routes
│   ├── src/actions/      # Server Actions for data mutations
│   ├── src/lib/          # Shared utilities and services
│   ├── prisma/           # Prisma schema and migrations
│   └── tests/            # Test suites
├── infrastructure/        # Terraform infrastructure as code
├── docker/               # Docker configurations for infrastructure services
├── scripts/              # Data management and deployment scripts
└── docs/                 # Technical documentation
```

## Quick Start

### Prerequisites

- Docker & Docker Compose (for infrastructure services)
- Node.js 18+
- Terraform (for cloud infrastructure deployment)

### Development Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd spontra
```

2. Set up environment variables:
```bash
cp frontend/.env.example frontend/.env
# Edit .env with your credentials
```

3. Start infrastructure services (optional, for local development):
```bash
cd docker
docker-compose -f docker-compose.dev.yml up -d
```

4. Run the frontend:
```bash
cd frontend
npm install
npx prisma generate
npm run dev
```

## Key Technologies

### Application Layer

- **Next.js 15+**: App Router, React Server Components, Server Actions
- **TypeScript**: Strict mode for type safety
- **Prisma 6+**: Type-safe database ORM with 48 models
- **Neon PostgreSQL**: Serverless PostgreSQL database
- **Vercel KV**: Redis for caching and sessions

### Infrastructure Services

- **Elasticsearch**: Destination search and discovery
- **Kafka**: Event streaming for analytics
- **Redis**: Distributed caching
- **Cassandra**: Historical flight data (legacy)

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

## Admin Panel Resources
- Quickstart: [docs/ADMIN_PANEL_QUICKSTART.md](docs/ADMIN_PANEL_QUICKSTART.md)
- Cheat Sheet: [docs/ADMIN_PANEL_CHEATSHEET.md](docs/ADMIN_PANEL_CHEATSHEET.md)
- Production Checklist: [docs/ADMIN_PRODUCTION_CHECKLIST.md](docs/ADMIN_PRODUCTION_CHECKLIST.md)

## Deployment

The frontend is deployed to Vercel with automatic deployments from the main branch. Infrastructure services run on cloud providers managed via Terraform.

## Contributing

Contributions are welcome! Please ensure:
- TypeScript strict mode compliance
- Prisma migrations for database changes
- Test coverage for new features
- Documentation updates
