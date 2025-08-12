#!/bin/bash

# Comprehensive Monitoring Setup for Spontra Platform
# Sets up Prometheus, Grafana, Jaeger, Loki, and AlertManager

set -e  # Exit on any error

echo "🔍 Setting Up Comprehensive Monitoring for Spontra Platform"
echo "=========================================================="

# Configuration
ENVIRONMENT=${ENVIRONMENT:-"development"}
GRAFANA_PASSWORD=${GRAFANA_PASSWORD:-"spontra2024"}
ALERT_EMAIL=${ALERT_EMAIL:-"alerts@spontra.com"}

echo "📊 Configuration:"
echo "  Environment: $ENVIRONMENT"
echo "  Grafana Admin Password: $GRAFANA_PASSWORD"
echo "  Alert Email: $ALERT_EMAIL"
echo ""

# Check prerequisites
echo "🔍 Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Create necessary directories
echo ""
echo "📁 Creating monitoring directories..."

mkdir -p monitoring/grafana/dashboards/{system,applications,business,infrastructure}
mkdir -p monitoring/prometheus/rules
mkdir -p monitoring/alertmanager/templates
mkdir -p monitoring/loki/data
mkdir -p monitoring/jaeger/data

echo "✅ Directories created"

# Create Grafana dashboard templates
echo ""
echo "📊 Creating Grafana dashboard templates..."

# System Overview Dashboard
cat > monitoring/grafana/dashboards/system/system-overview.json << 'EOF'
{
  "dashboard": {
    "id": null,
    "title": "System Overview",
    "tags": ["system", "overview"],
    "style": "dark",
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "CPU Usage",
        "type": "stat",
        "targets": [
          {
            "expr": "100 - (avg by (instance) (irate(node_cpu_seconds_total{mode=\"idle\"}[5m])) * 100)",
            "legendFormat": "{{instance}}"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "percent",
            "thresholds": {
              "steps": [
                {"color": "green", "value": 0},
                {"color": "yellow", "value": 70},
                {"color": "red", "value": 85}
              ]
            }
          }
        },
        "gridPos": {"h": 8, "w": 6, "x": 0, "y": 0}
      },
      {
        "id": 2,
        "title": "Memory Usage",
        "type": "stat",
        "targets": [
          {
            "expr": "(node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100",
            "legendFormat": "{{instance}}"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "percent",
            "thresholds": {
              "steps": [
                {"color": "green", "value": 0},
                {"color": "yellow", "value": 70},
                {"color": "red", "value": 90}
              ]
            }
          }
        },
        "gridPos": {"h": 8, "w": 6, "x": 6, "y": 0}
      }
    ],
    "time": {"from": "now-1h", "to": "now"},
    "refresh": "30s"
  }
}
EOF

# Application Performance Dashboard
cat > monitoring/grafana/dashboards/applications/app-performance.json << 'EOF'
{
  "dashboard": {
    "id": null,
    "title": "Application Performance",
    "tags": ["applications", "performance"],
    "style": "dark",
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "sum(rate(http_requests_total[5m])) by (service)",
            "legendFormat": "{{service}}"
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 0}
      },
      {
        "id": 2,
        "title": "Response Time (95th percentile)",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, service))",
            "legendFormat": "{{service}}"
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 12, "y": 0}
      }
    ],
    "time": {"from": "now-1h", "to": "now"},
    "refresh": "30s"
  }
}
EOF

# Business Metrics Dashboard
cat > monitoring/grafana/dashboards/business/business-metrics.json << 'EOF'
{
  "dashboard": {
    "id": null,
    "title": "Spontra Business Metrics",
    "tags": ["business", "metrics"],
    "style": "dark",
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "User Registrations",
        "type": "stat",
        "targets": [
          {
            "expr": "increase(spontra_user_registrations_total[24h])",
            "legendFormat": "Daily Registrations"
          }
        ],
        "gridPos": {"h": 8, "w": 6, "x": 0, "y": 0}
      },
      {
        "id": 2,
        "title": "Flight Searches",
        "type": "stat",
        "targets": [
          {
            "expr": "increase(spontra_search_requests_total[24h])",
            "legendFormat": "Daily Searches"
          }
        ],
        "gridPos": {"h": 8, "w": 6, "x": 6, "y": 0}
      },
      {
        "id": 3,
        "title": "Search Success Rate",
        "type": "stat",
        "targets": [
          {
            "expr": "rate(spontra_search_requests_total[5m]) - rate(spontra_search_requests_failed_total[5m]) / rate(spontra_search_requests_total[5m]) * 100",
            "legendFormat": "Success Rate"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "percent",
            "thresholds": {
              "steps": [
                {"color": "red", "value": 0},
                {"color": "yellow", "value": 90},
                {"color": "green", "value": 95}
              ]
            }
          }
        },
        "gridPos": {"h": 8, "w": 6, "x": 12, "y": 0}
      }
    ],
    "time": {"from": "now-24h", "to": "now"},
    "refresh": "1m"
  }
}
EOF

echo "✅ Dashboard templates created"

# Create AlertManager templates
echo ""
echo "📧 Creating AlertManager templates..."

cat > monitoring/alertmanager/templates/email.tmpl << 'EOF'
{{ define "email.spontra.subject" }}
[{{ .Status | toUpper }}] {{ .GroupLabels.SortedPairs.Values | join " " }} ({{ len .Alerts }})
{{ end }}

{{ define "email.spontra.html" }}
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; }
    .alert { margin: 10px 0; padding: 10px; border-left: 5px solid #ddd; }
    .critical { border-left-color: #d32f2f; background-color: #ffebee; }
    .warning { border-left-color: #f57c00; background-color: #fff3e0; }
    .info { border-left-color: #1976d2; background-color: #e3f2fd; }
  </style>
</head>
<body>
  <h2>Spontra Platform Alert</h2>
  {{ range .Alerts }}
  <div class="alert {{ .Labels.severity }}">
    <h3>{{ .Annotations.summary }}</h3>
    <p><strong>Description:</strong> {{ .Annotations.description }}</p>
    <p><strong>Service:</strong> {{ .Labels.service }}</p>
    <p><strong>Instance:</strong> {{ .Labels.instance }}</p>
    <p><strong>Severity:</strong> {{ .Labels.severity }}</p>
    <p><strong>Started:</strong> {{ .StartsAt.Format "2006-01-02 15:04:05" }}</p>
    {{ if .EndsAt }}
    <p><strong>Ended:</strong> {{ .EndsAt.Format "2006-01-02 15:04:05" }}</p>
    {{ end }}
  </div>
  {{ end }}
</body>
</html>
{{ end }}
EOF

echo "✅ AlertManager templates created"

# Update environment variables in configs
echo ""
echo "🔧 Updating configuration with environment variables..."

# Update Grafana password in docker-compose
if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s/GF_SECURITY_ADMIN_PASSWORD=spontra2024/GF_SECURITY_ADMIN_PASSWORD=$GRAFANA_PASSWORD/" monitoring/docker-compose.yml
else
    sed -i "s/GF_SECURITY_ADMIN_PASSWORD=spontra2024/GF_SECURITY_ADMIN_PASSWORD=$GRAFANA_PASSWORD/" monitoring/docker-compose.yml
fi

# Update alert email in AlertManager config
if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s/alerts@spontra.com/$ALERT_EMAIL/g" monitoring/alertmanager/alertmanager.yml
else
    sed -i "s/alerts@spontra.com/$ALERT_EMAIL/g" monitoring/alertmanager/alertmanager.yml
fi

echo "✅ Configuration updated"

# Start monitoring stack
echo ""
echo "🚀 Starting monitoring stack..."

cd monitoring

# Pull latest images
echo "📥 Pulling Docker images..."
docker-compose pull

# Start services
echo "🔥 Starting monitoring services..."
docker-compose up -d

echo "⏳ Waiting for services to start..."
sleep 30

# Verify services
echo ""
echo "🔍 Verifying service health..."

services=(
    "prometheus:9090"
    "grafana:3001"
    "jaeger:16686"
    "alertmanager:9093"
    "loki:3100"
)

for service in "${services[@]}"; do
    IFS=':' read -r name port <<< "$service"
    if curl -s "http://localhost:$port" > /dev/null 2>&1; then
        echo "  ✅ $name is running on port $port"
    else
        echo "  ❌ $name failed to start on port $port"
    fi
done

cd ..

# Create monitoring management scripts
echo ""
echo "🛠️  Creating monitoring management scripts..."

# Status script
cat > monitoring/status.sh << 'EOF'
#!/bin/bash

echo "🔍 Spontra Monitoring Stack Status"
echo "=================================="

# Check Docker containers
echo ""
echo "📦 Container Status:"
docker-compose ps

# Check service endpoints
echo ""
echo "🌐 Service Health:"
services=(
    "Prometheus:9090"
    "Grafana:3001"
    "Jaeger:16686"
    "AlertManager:9093"
    "Loki:3100"
)

for service in "${services[@]}"; do
    IFS=':' read -r name port <<< "$service"
    if curl -s "http://localhost:$port" > /dev/null 2>&1; then
        echo "  ✅ $name - http://localhost:$port"
    else
        echo "  ❌ $name - http://localhost:$port (not responding)"
    fi
done

# Show resource usage
echo ""
echo "📊 Resource Usage:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
EOF

# Restart script
cat > monitoring/restart.sh << 'EOF'
#!/bin/bash

echo "🔄 Restarting Spontra Monitoring Stack..."

docker-compose down
sleep 5
docker-compose up -d

echo "⏳ Waiting for services to start..."
sleep 30

echo "✅ Monitoring stack restarted"
echo "Run ./status.sh to check service health"
EOF

# Logs script
cat > monitoring/logs.sh << 'EOF'
#!/bin/bash

SERVICE=${1:-""}

if [ -z "$SERVICE" ]; then
    echo "📋 Available services:"
    docker-compose ps --services
    echo ""
    echo "Usage: ./logs.sh <service-name>"
    echo "Example: ./logs.sh prometheus"
    exit 1
fi

echo "📋 Logs for $SERVICE:"
docker-compose logs -f "$SERVICE"
EOF

# Backup script
cat > monitoring/backup.sh << 'EOF'
#!/bin/bash

BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "💾 Creating monitoring backup..."

# Backup Grafana data
echo "  📊 Backing up Grafana data..."
docker-compose exec -T grafana tar czf - /var/lib/grafana > "$BACKUP_DIR/grafana-data.tar.gz"

# Backup Prometheus data
echo "  📈 Backing up Prometheus data..."
docker-compose exec -T prometheus tar czf - /prometheus > "$BACKUP_DIR/prometheus-data.tar.gz"

# Backup configuration files
echo "  ⚙️  Backing up configuration..."
tar czf "$BACKUP_DIR/config.tar.gz" \
    prometheus/ \
    grafana/ \
    alertmanager/ \
    loki/ \
    otel/ \
    docker-compose.yml

echo "✅ Backup created in $BACKUP_DIR"

# Clean old backups (keep last 7)
find backups/ -type d -name "20*" | sort | head -n -7 | xargs rm -rf 2>/dev/null || true
EOF

chmod +x monitoring/status.sh
chmod +x monitoring/restart.sh
chmod +x monitoring/logs.sh
chmod +x monitoring/backup.sh

echo "✅ Management scripts created"

# Create monitoring documentation
echo ""
echo "📚 Creating monitoring documentation..."

cat > monitoring/README.md << 'EOF'
# Spontra Platform Monitoring

Comprehensive monitoring setup with Prometheus, Grafana, Jaeger, Loki, and AlertManager.

## Services Overview

| Service | Port | Purpose | URL |
|---------|------|---------|-----|
| Prometheus | 9090 | Metrics collection | http://localhost:9090 |
| Grafana | 3001 | Visualization | http://localhost:3001 |
| Jaeger | 16686 | Distributed tracing | http://localhost:16686 |
| AlertManager | 9093 | Alert handling | http://localhost:9093 |
| Loki | 3100 | Log aggregation | http://localhost:3100 |

## Quick Start

```bash
# Start monitoring stack
docker-compose up -d

# Check status
./status.sh

# View logs
./logs.sh <service-name>

# Restart all services
./restart.sh

# Create backup
./backup.sh
```

## Default Credentials

- **Grafana**: admin / spontra2024
- **Prometheus**: No authentication
- **Jaeger**: No authentication

## Key Features

### Metrics Collection
- ✅ System metrics (CPU, memory, disk, network)
- ✅ Application metrics (HTTP requests, response times, errors)
- ✅ Database metrics (PostgreSQL, Redis)
- ✅ Business metrics (user registrations, searches, conversions)

### Distributed Tracing
- ✅ Request tracing across microservices
- ✅ Performance bottleneck identification
- ✅ Service dependency mapping
- ✅ Error propagation tracking

### Log Aggregation
- ✅ Centralized log collection
- ✅ Log correlation with traces
- ✅ Real-time log streaming
- ✅ Log-based alerting

### Alerting
- ✅ Multi-channel notifications (email, Slack)
- ✅ Smart alert routing by team
- ✅ Alert suppression and grouping
- ✅ Escalation policies

## Monitoring Best Practices

### Metrics
- Monitor the 4 golden signals: latency, traffic, errors, saturation
- Use SLIs (Service Level Indicators) and SLOs (Service Level Objectives)
- Track business metrics alongside technical metrics

### Alerting
- Alert on symptoms, not causes
- Use meaningful alert names and descriptions
- Include runbook links in alert annotations
- Regular alert review and tuning

### Dashboards
- Design for your audience (dev, ops, business)
- Use consistent naming and color schemes
- Focus on actionable insights
- Include context and drill-down capabilities

## Troubleshooting

### Common Issues

**Service not starting:**
```bash
# Check logs
./logs.sh <service-name>

# Check Docker resources
docker system df
docker system prune
```

**High resource usage:**
```bash
# Monitor resource usage
docker stats

# Adjust retention policies in prometheus.yml
# Reduce scrape intervals for non-critical metrics
```

**Missing metrics:**
```bash
# Verify service endpoints
curl http://localhost:<port>/metrics

# Check Prometheus targets
# Go to http://localhost:9090/targets
```

## Configuration Files

- `prometheus/prometheus.yml` - Prometheus configuration
- `grafana/provisioning/` - Grafana datasources and dashboards
- `alertmanager/alertmanager.yml` - Alert routing and notification
- `loki/loki.yml` - Log aggregation configuration
- `otel/otel-collector.yml` - OpenTelemetry collector setup

## Extending Monitoring

### Adding New Services
1. Add scrape config to `prometheus/prometheus.yml`
2. Create Grafana dashboard
3. Add relevant alerts to `prometheus/rules/`
4. Test and validate

### Custom Metrics
1. Implement metrics in your service
2. Expose `/metrics` endpoint
3. Add to Prometheus scrape config
4. Create dashboard panels

### Log Sources
1. Add log paths to `promtail/promtail.yml`
2. Define parsing rules
3. Create Loki queries
4. Add log-based alerts
EOF

echo "✅ Documentation created"

# Final status report
echo ""
echo "🎉 Monitoring Setup Complete!"
echo "============================="
echo ""
echo "🌐 Access URLs:"
echo "  • Prometheus: http://localhost:9090"
echo "  • Grafana: http://localhost:3001 (admin/$GRAFANA_PASSWORD)"
echo "  • Jaeger: http://localhost:16686"
echo "  • AlertManager: http://localhost:9093"
echo "  • Loki: http://localhost:3100"
echo ""
echo "🛠️  Management Commands:"
echo "  • Check status: cd monitoring && ./status.sh"
echo "  • View logs: cd monitoring && ./logs.sh <service>"
echo "  • Restart: cd monitoring && ./restart.sh"
echo "  • Backup: cd monitoring && ./backup.sh"
echo ""
echo "📊 Key Features Enabled:"
echo "  • System and application metrics collection"
echo "  • Distributed tracing with Jaeger"
echo "  • Log aggregation with Loki"
echo "  • Smart alerting with AlertManager"
echo "  • Business metrics tracking"
echo "  • Multi-team alert routing"
echo ""
echo "📚 Documentation: monitoring/README.md"
echo ""
echo "🚀 Your comprehensive monitoring stack is ready!"

# Run status check
cd monitoring && ./status.sh