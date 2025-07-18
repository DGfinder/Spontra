# Spontra Development Makefile

.PHONY: help dev-up dev-down build test clean lint format

# Default target
help:
	@echo "Available commands:"
	@echo "  make dev-up        - Start development environment"
	@echo "  make dev-down      - Stop development environment"
	@echo "  make build         - Build all services"
	@echo "  make test          - Run all tests"
	@echo "  make lint          - Run linters"
	@echo "  make format        - Format code"
	@echo "  make clean         - Clean build artifacts"

# Development Environment
dev-up:
	@echo "Starting development environment..."
	docker-compose -f docker/docker-compose.dev.yml up -d
	@echo "Development environment started"

dev-down:
	@echo "Stopping development environment..."
	docker-compose -f docker/docker-compose.dev.yml down
	@echo "Development environment stopped"

# Build Services
build:
	@echo "Building all services..."
	@cd services/user-service && go build ./...
	@cd services/search-service && go build ./...
	@cd services/pricing-service && go build ./...
	@cd services/data-ingestion-service && go build ./...
	@cd frontend && npm run build
	@echo "Build completed"

# Testing
test:
	@echo "Running all tests..."
	@cd services/user-service && go test ./...
	@cd services/search-service && go test ./...
	@cd services/pricing-service && go test ./...
	@cd services/data-ingestion-service && go test ./...
	@cd frontend && npm test
	@echo "Tests completed"

# Linting
lint:
	@echo "Running linters..."
	@cd services/user-service && golangci-lint run
	@cd services/search-service && golangci-lint run
	@cd services/pricing-service && golangci-lint run
	@cd services/data-ingestion-service && golangci-lint run
	@cd frontend && npm run lint
	@echo "Linting completed"

# Formatting
format:
	@echo "Formatting code..."
	@cd services/user-service && go fmt ./...
	@cd services/search-service && go fmt ./...
	@cd services/pricing-service && go fmt ./...
	@cd services/data-ingestion-service && go fmt ./...
	@cd frontend && npm run format
	@echo "Formatting completed"

# Cleanup
clean:
	@echo "Cleaning build artifacts..."
	@cd services/user-service && go clean
	@cd services/search-service && go clean
	@cd services/pricing-service && go clean
	@cd services/data-ingestion-service && go clean
	@cd frontend && rm -rf .next node_modules/.cache
	@echo "Cleanup completed"

# Initialize services
init-services:
	@echo "Initializing Go services..."
	@cd services/user-service && go mod init spontra/user-service
	@cd services/search-service && go mod init spontra/search-service
	@cd services/pricing-service && go mod init spontra/pricing-service
	@cd services/data-ingestion-service && go mod init spontra/data-ingestion-service
	@echo "Services initialized"

# Initialize frontend
init-frontend:
	@echo "Initializing Next.js frontend..."
	@cd frontend && npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
	@echo "Frontend initialized"