# IAM Module for Spontra

variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "environment" {
  description = "Environment"
  type        = string
}

# Service account for microservices
resource "google_service_account" "microservices" {
  account_id   = "spontra-${var.environment}-services"
  display_name = "Spontra ${var.environment} Microservices"
  description  = "Service account for Spontra microservices in ${var.environment}"
}

# Service account for data ingestion
resource "google_service_account" "data_ingestion" {
  account_id   = "spontra-${var.environment}-data"
  display_name = "Spontra ${var.environment} Data Ingestion"
  description  = "Service account for data ingestion service in ${var.environment}"
}

# Service account for analytics
resource "google_service_account" "analytics" {
  account_id   = "spontra-${var.environment}-analytics"
  display_name = "Spontra ${var.environment} Analytics"
  description  = "Service account for analytics and BigQuery operations in ${var.environment}"
}

# IAM bindings for microservices service account
resource "google_project_iam_member" "microservices_cloudsql_client" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.microservices.email}"
}

resource "google_project_iam_member" "microservices_redis_editor" {
  project = var.project_id
  role    = "roles/redis.editor"
  member  = "serviceAccount:${google_service_account.microservices.email}"
}

resource "google_project_iam_member" "microservices_secretmanager_accessor" {
  project = var.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.microservices.email}"
}

resource "google_project_iam_member" "microservices_monitoring_writer" {
  project = var.project_id
  role    = "roles/monitoring.metricWriter"
  member  = "serviceAccount:${google_service_account.microservices.email}"
}

resource "google_project_iam_member" "microservices_logging_writer" {
  project = var.project_id
  role    = "roles/logging.logWriter"
  member  = "serviceAccount:${google_service_account.microservices.email}"
}

# IAM bindings for data ingestion service account
resource "google_project_iam_member" "data_ingestion_pubsub_editor" {
  project = var.project_id
  role    = "roles/pubsub.editor"
  member  = "serviceAccount:${google_service_account.data_ingestion.email}"
}

resource "google_project_iam_member" "data_ingestion_storage_admin" {
  project = var.project_id
  role    = "roles/storage.admin"
  member  = "serviceAccount:${google_service_account.data_ingestion.email}"
}

resource "google_project_iam_member" "data_ingestion_bigquery_data_editor" {
  project = var.project_id
  role    = "roles/bigquery.dataEditor"
  member  = "serviceAccount:${google_service_account.data_ingestion.email}"
}

resource "google_project_iam_member" "data_ingestion_bigquery_job_user" {
  project = var.project_id
  role    = "roles/bigquery.jobUser"
  member  = "serviceAccount:${google_service_account.data_ingestion.email}"
}

# IAM bindings for analytics service account
resource "google_project_iam_member" "analytics_bigquery_data_viewer" {
  project = var.project_id
  role    = "roles/bigquery.dataViewer"
  member  = "serviceAccount:${google_service_account.analytics.email}"
}

resource "google_project_iam_member" "analytics_bigquery_job_user" {
  project = var.project_id
  role    = "roles/bigquery.jobUser"
  member  = "serviceAccount:${google_service_account.analytics.email}"
}

# Workload Identity bindings for Kubernetes service accounts
resource "google_service_account_iam_binding" "microservices_workload_identity" {
  service_account_id = google_service_account.microservices.name
  role               = "roles/iam.workloadIdentityUser"

  members = [
    "serviceAccount:${var.project_id}.svc.id.goog[default/user-service]",
    "serviceAccount:${var.project_id}.svc.id.goog[default/search-service]",
    "serviceAccount:${var.project_id}.svc.id.goog[default/pricing-service]",
  ]
}

resource "google_service_account_iam_binding" "data_ingestion_workload_identity" {
  service_account_id = google_service_account.data_ingestion.name
  role               = "roles/iam.workloadIdentityUser"

  members = [
    "serviceAccount:${var.project_id}.svc.id.goog[default/data-ingestion-service]",
  ]
}

resource "google_service_account_iam_binding" "analytics_workload_identity" {
  service_account_id = google_service_account.analytics.name
  role               = "roles/iam.workloadIdentityUser"

  members = [
    "serviceAccount:${var.project_id}.svc.id.goog[default/analytics-service]",
  ]
}

# Outputs
output "microservices_service_account_email" {
  value = google_service_account.microservices.email
}

output "data_ingestion_service_account_email" {
  value = google_service_account.data_ingestion.email
}

output "analytics_service_account_email" {
  value = google_service_account.analytics.email
}