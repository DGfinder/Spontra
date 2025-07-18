# Redis Module for Spontra

variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "region" {
  description = "GCP Region"
  type        = string
}

variable "environment" {
  description = "Environment"
  type        = string
}

variable "network_id" {
  description = "VPC Network ID"
  type        = string
}

# Memory Store Redis instance
resource "google_redis_instance" "cache" {
  name           = "spontra-${var.environment}-redis"
  tier           = var.environment == "dev" ? "BASIC" : "STANDARD_HA"
  memory_size_gb = var.environment == "dev" ? 1 : 5
  region         = var.region

  location_id             = "${var.region}-a"
  alternative_location_id = var.environment == "production" ? "${var.region}-b" : null

  authorized_network = var.network_id

  redis_version     = "REDIS_6_X"
  display_name      = "Spontra ${var.environment} Redis Cache"
  reserved_ip_range = "192.168.0.0/29"

  redis_configs = {
    maxmemory-policy = "allkeys-lru"
    notify-keyspace-events = "Ex"
  }

  maintenance_policy {
    weekly_maintenance_window {
      day = "SUNDAY"
      start_time {
        hours   = 2
        minutes = 0
        seconds = 0
        nanos   = 0
      }
    }
  }

  labels = {
    environment = var.environment
    service     = "spontra"
  }
}

# Outputs
output "host" {
  value = google_redis_instance.cache.host
}

output "port" {
  value = google_redis_instance.cache.port
}

output "auth_string" {
  value     = google_redis_instance.cache.auth_string
  sensitive = true
}

output "memory_size_gb" {
  value = google_redis_instance.cache.memory_size_gb
}