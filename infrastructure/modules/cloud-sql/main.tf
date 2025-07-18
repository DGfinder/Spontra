# Cloud SQL Module for Spontra

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

variable "private_vpc_connection" {
  description = "Private VPC connection"
  type        = string
}

# Random password for database
resource "random_password" "db_password" {
  length  = 32
  special = true
}

# PostgreSQL instance
resource "google_sql_database_instance" "postgres" {
  name             = "spontra-${var.environment}-postgres"
  database_version = "POSTGRES_15"
  region           = var.region

  depends_on = [var.private_vpc_connection]

  settings {
    tier              = var.environment == "dev" ? "db-f1-micro" : "db-custom-2-8192"
    availability_type = var.environment == "production" ? "REGIONAL" : "ZONAL"
    disk_type         = "PD_SSD"
    disk_size         = var.environment == "dev" ? 20 : 100
    disk_autoresize   = true

    backup_configuration {
      enabled                        = true
      start_time                     = "23:00"
      point_in_time_recovery_enabled = true
      backup_retention_settings {
        retained_backups = 7
      }
    }

    ip_configuration {
      ipv4_enabled    = false
      private_network = var.network_id
    }

    database_flags {
      name  = "max_connections"
      value = "200"
    }

    database_flags {
      name  = "shared_preload_libraries"
      value = "pg_stat_statements"
    }

    maintenance_window {
      day          = 7    # Sunday
      hour         = 2    # 2 AM
      update_track = "stable"
    }

    insights_config {
      query_insights_enabled  = true
      query_string_length     = 1024
      record_application_tags = true
      record_client_address   = true
    }
  }

  deletion_protection = var.environment == "production" ? true : false
}

# Database user
resource "google_sql_user" "users" {
  name     = "spontra"
  instance = google_sql_database_instance.postgres.name
  password = random_password.db_password.result
}

# Databases
resource "google_sql_database" "user_service_db" {
  name     = "user_service_db"
  instance = google_sql_database_instance.postgres.name
}

resource "google_sql_database" "search_service_db" {
  name     = "search_service_db"
  instance = google_sql_database_instance.postgres.name
}

# Secret for database password
resource "google_secret_manager_secret" "db_password" {
  secret_id = "spontra-${var.environment}-db-password"

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "db_password" {
  secret      = google_secret_manager_secret.db_password.id
  secret_data = random_password.db_password.result
}

# Outputs
output "connection_name" {
  value = google_sql_database_instance.postgres.connection_name
}

output "private_ip_address" {
  value = google_sql_database_instance.postgres.private_ip_address
}

output "database_user" {
  value = google_sql_user.users.name
}

output "password_secret_name" {
  value = google_secret_manager_secret.db_password.secret_id
}