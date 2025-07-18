# Development Environment Configuration

terraform {
  required_version = ">= 1.0"
  
  # Uncomment and configure for remote state
  # backend "gcs" {
  #   bucket = "spontra-terraform-state-dev"
  #   prefix = "terraform/state"
  # }
}

# Variables
variable "project_id" {
  description = "GCP Project ID for development"
  type        = string
}

# Module configuration
module "spontra_dev" {
  source = "../../"
  
  project_id   = var.project_id
  region       = "us-central1"
  environment  = "dev"
  cluster_name = "spontra-dev-cluster"
}

# Outputs
output "cluster_name" {
  value = module.spontra_dev.cluster_name
}

output "cluster_endpoint" {
  value = module.spontra_dev.cluster_endpoint
}

output "database_connection_name" {
  value = module.spontra_dev.database_connection_name
}

output "redis_host" {
  value = module.spontra_dev.redis_host
}

output "bigquery_dataset_id" {
  value = module.spontra_dev.bigquery_dataset_id
}