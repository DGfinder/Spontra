# BigQuery Module for Spontra

variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "environment" {
  description = "Environment"
  type        = string
}

# BigQuery dataset for analytics
resource "google_bigquery_dataset" "analytics" {
  dataset_id                  = "spontra_${var.environment}_analytics"
  friendly_name               = "Spontra ${var.environment} Analytics"
  description                 = "Analytics data for Spontra flight comparison platform"
  location                    = "US"
  default_table_expiration_ms = 3600000

  labels = {
    environment = var.environment
    service     = "spontra"
  }

  access {
    role          = "OWNER"
    user_by_email = data.google_client_config.current.access_token
  }

  access {
    role   = "READER"
    domain = "google.com"
  }
}

# Flight searches table
resource "google_bigquery_table" "flight_searches" {
  dataset_id = google_bigquery_dataset.analytics.dataset_id
  table_id   = "flight_searches"

  time_partitioning {
    type  = "DAY"
    field = "search_timestamp"
  }

  clustering = ["origin_airport", "destination_airport"]

  labels = {
    environment = var.environment
  }

  schema = jsonencode([
    {
      name = "search_id"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "user_id"
      type = "STRING"
      mode = "NULLABLE"
    },
    {
      name = "origin_airport"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "destination_airport"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "departure_date"
      type = "DATE"
      mode = "REQUIRED"
    },
    {
      name = "return_date"
      type = "DATE"
      mode = "NULLABLE"
    },
    {
      name = "passengers"
      type = "INTEGER"
      mode = "REQUIRED"
    },
    {
      name = "trip_type"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "search_timestamp"
      type = "TIMESTAMP"
      mode = "REQUIRED"
    },
    {
      name = "results_count"
      type = "INTEGER"
      mode = "NULLABLE"
    },
    {
      name = "min_price"
      type = "FLOAT"
      mode = "NULLABLE"
    },
    {
      name = "max_price"
      type = "FLOAT"
      mode = "NULLABLE"
    },
    {
      name = "currency"
      type = "STRING"
      mode = "NULLABLE"
    }
  ])
}

# Price tracking table
resource "google_bigquery_table" "price_tracking" {
  dataset_id = google_bigquery_dataset.analytics.dataset_id
  table_id   = "price_tracking"

  time_partitioning {
    type  = "DAY"
    field = "tracked_at"
  }

  clustering = ["route", "provider"]

  labels = {
    environment = var.environment
  }

  schema = jsonencode([
    {
      name = "price_id"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "route"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "provider"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "price"
      type = "FLOAT"
      mode = "REQUIRED"
    },
    {
      name = "currency"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "flight_date"
      type = "DATE"
      mode = "REQUIRED"
    },
    {
      name = "tracked_at"
      type = "TIMESTAMP"
      mode = "REQUIRED"
    },
    {
      name = "airline"
      type = "STRING"
      mode = "NULLABLE"
    },
    {
      name = "flight_number"
      type = "STRING"
      mode = "NULLABLE"
    }
  ])
}

# User behavior table
resource "google_bigquery_table" "user_behavior" {
  dataset_id = google_bigquery_dataset.analytics.dataset_id
  table_id   = "user_behavior"

  time_partitioning {
    type  = "DAY"
    field = "event_timestamp"
  }

  clustering = ["user_id", "event_type"]

  labels = {
    environment = var.environment
  }

  schema = jsonencode([
    {
      name = "event_id"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "user_id"
      type = "STRING"
      mode = "NULLABLE"
    },
    {
      name = "session_id"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "event_type"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "event_timestamp"
      type = "TIMESTAMP"
      mode = "REQUIRED"
    },
    {
      name = "page_url"
      type = "STRING"
      mode = "NULLABLE"
    },
    {
      name = "user_agent"
      type = "STRING"
      mode = "NULLABLE"
    },
    {
      name = "ip_address"
      type = "STRING"
      mode = "NULLABLE"
    },
    {
      name = "properties"
      type = "JSON"
      mode = "NULLABLE"
    }
  ])
}

# Data source
data "google_client_config" "current" {}

# Outputs
output "dataset_id" {
  value = google_bigquery_dataset.analytics.dataset_id
}

output "dataset_location" {
  value = google_bigquery_dataset.analytics.location
}

output "flight_searches_table_id" {
  value = google_bigquery_table.flight_searches.table_id
}

output "price_tracking_table_id" {
  value = google_bigquery_table.price_tracking.table_id
}

output "user_behavior_table_id" {
  value = google_bigquery_table.user_behavior.table_id
}