# Spontra Infrastructure - Main Configuration

terraform {
  required_version = ">= 1.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.24"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.12"
    }
  }
}

# Variables
variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "region" {
  description = "GCP Region"
  type        = string
  default     = "us-central1"
}

variable "environment" {
  description = "Environment (dev, staging, production)"
  type        = string
}

variable "cluster_name" {
  description = "GKE Cluster name"
  type        = string
  default     = "spontra-cluster"
}

# Provider Configuration
provider "google" {
  project = var.project_id
  region  = var.region
}

# Data sources
data "google_client_config" "default" {}

# Networking Module
module "networking" {
  source = "./modules/networking"
  
  project_id  = var.project_id
  region      = var.region
  environment = var.environment
}

# GKE Cluster Module
module "gke" {
  source = "./modules/gke"
  
  project_id    = var.project_id
  region        = var.region
  environment   = var.environment
  cluster_name  = var.cluster_name
  network_name  = module.networking.network_name
  subnet_name   = module.networking.subnet_name
}

# Cloud SQL Module
module "cloud_sql" {
  source = "./modules/cloud-sql"
  
  project_id       = var.project_id
  region           = var.region
  environment      = var.environment
  network_id       = module.networking.network_id
  private_vpc_connection = module.networking.private_vpc_connection
}

# Redis Module
module "redis" {
  source = "./modules/redis"
  
  project_id  = var.project_id
  region      = var.region
  environment = var.environment
  network_id  = module.networking.network_id
}

# BigQuery Module
module "bigquery" {
  source = "./modules/bigquery"
  
  project_id  = var.project_id
  environment = var.environment
}

# IAM Module
module "iam" {
  source = "./modules/iam"
  
  project_id  = var.project_id
  environment = var.environment
}

# Outputs
output "cluster_name" {
  value = module.gke.cluster_name
}

output "cluster_endpoint" {
  value = module.gke.cluster_endpoint
}

output "database_connection_name" {
  value = module.cloud_sql.connection_name
}

output "redis_host" {
  value = module.redis.host
}

output "bigquery_dataset_id" {
  value = module.bigquery.dataset_id
}