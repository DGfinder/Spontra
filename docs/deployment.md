# Deployment Guide

This guide covers deploying Spontra to Google Cloud Platform using Terraform and Kubernetes.

## Prerequisites

- GCP account with billing enabled
- `gcloud` CLI installed and configured
- `terraform` 1.0+ installed
- `kubectl` installed
- Docker installed for building images

## Initial Setup

### 1. GCP Project Setup

1. **Create a new GCP project:**
   ```bash
   gcloud projects create YOUR_PROJECT_ID
   gcloud config set project YOUR_PROJECT_ID
   ```

2. **Enable required APIs:**
   ```bash
   gcloud services enable container.googleapis.com
   gcloud services enable sqladmin.googleapis.com
   gcloud services enable redis.googleapis.com
   gcloud services enable bigquery.googleapis.com
   gcloud services enable secretmanager.googleapis.com
   gcloud services enable servicenetworking.googleapis.com
   ```

3. **Create a service account for Terraform:**
   ```bash
   gcloud iam service-accounts create terraform-sa \
     --display-name="Terraform Service Account"
   
   gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
     --member="serviceAccount:terraform-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
     --role="roles/editor"
   
   gcloud iam service-accounts keys create terraform-key.json \
     --iam-account=terraform-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com
   ```

### 2. Terraform Backend Setup (Optional but Recommended)

1. **Create a Cloud Storage bucket for Terraform state:**
   ```bash
   gsutil mb gs://YOUR_PROJECT_ID-terraform-state
   gsutil versioning set on gs://YOUR_PROJECT_ID-terraform-state
   ```

2. **Update backend configuration in `infrastructure/environments/*/main.tf`:**
   ```hcl
   terraform {
     backend "gcs" {
       bucket = "YOUR_PROJECT_ID-terraform-state"
       prefix = "terraform/state"
     }
   }
   ```

## Deployment Environments

We support three environments: `dev`, `staging`, and `production`.

### Development Environment

1. **Navigate to the dev environment:**
   ```bash
   cd infrastructure/environments/dev
   ```

2. **Create terraform.tfvars:**
   ```bash
   cp terraform.tfvars.example terraform.tfvars
   # Edit with your project ID
   ```

3. **Initialize and apply Terraform:**
   ```bash
   terraform init
   terraform plan
   terraform apply
   ```

4. **Get GKE credentials:**
   ```bash
   gcloud container clusters get-credentials spontra-dev-cluster \
     --region=us-central1 --project=YOUR_PROJECT_ID
   ```

### Production Environment

1. **Create production environment files:**
   ```bash
   cd infrastructure/environments/production
   cp ../dev/main.tf main.tf
   # Update environment = "production" in the file
   ```

2. **Apply with production settings:**
   ```bash
   terraform init
   terraform plan -var="project_id=YOUR_PROJECT_ID"
   terraform apply
   ```

## Application Deployment

### 1. Build and Push Docker Images

```bash
# Set environment variables
export PROJECT_ID=YOUR_PROJECT_ID
export IMAGE_TAG=$(git rev-parse --short HEAD)

# Configure Docker for GCR
gcloud auth configure-docker

# Build and push all services
docker build -f docker/Dockerfile.go-service -t gcr.io/$PROJECT_ID/user-service:$IMAGE_TAG ./services/user-service
docker push gcr.io/$PROJECT_ID/user-service:$IMAGE_TAG

docker build -f docker/Dockerfile.go-service -t gcr.io/$PROJECT_ID/search-service:$IMAGE_TAG ./services/search-service
docker push gcr.io/$PROJECT_ID/search-service:$IMAGE_TAG

docker build -f docker/Dockerfile.go-service -t gcr.io/$PROJECT_ID/pricing-service:$IMAGE_TAG ./services/pricing-service
docker push gcr.io/$PROJECT_ID/pricing-service:$IMAGE_TAG

docker build -f docker/Dockerfile.go-service -t gcr.io/$PROJECT_ID/data-ingestion-service:$IMAGE_TAG ./services/data-ingestion-service
docker push gcr.io/$PROJECT_ID/data-ingestion-service:$IMAGE_TAG

docker build -f docker/Dockerfile.frontend -t gcr.io/$PROJECT_ID/frontend:$IMAGE_TAG ./frontend
docker push gcr.io/$PROJECT_ID/frontend:$IMAGE_TAG
```

### 2. Deploy to Kubernetes

```bash
# Update image tags in manifests
find k8s -name "*.yaml" -exec sed -i "s/PROJECT_ID/$PROJECT_ID/g" {} \;
find k8s -name "*.yaml" -exec sed -i "s/IMAGE_TAG/$IMAGE_TAG/g" {} \;

# Apply Kubernetes manifests
kubectl apply -f k8s/

# Verify deployment
kubectl get pods
kubectl get services
```

### 3. Configure External Access

1. **Create an Ingress for external access:**
   ```yaml
   apiVersion: networking.k8s.io/v1
   kind: Ingress
   metadata:
     name: spontra-ingress
     annotations:
       kubernetes.io/ingress.global-static-ip-name: "spontra-ip"
       networking.gke.io/managed-certificates: "spontra-ssl-cert"
   spec:
     rules:
     - host: yourdomain.com
       http:
         paths:
         - path: /
           pathType: Prefix
           backend:
             service:
               name: nginx-gateway
               port:
                 number: 80
   ```

2. **Create managed SSL certificate:**
   ```yaml
   apiVersion: networking.gke.io/v1
   kind: ManagedCertificate
   metadata:
     name: spontra-ssl-cert
   spec:
     domains:
       - yourdomain.com
       - www.yourdomain.com
   ```

## Monitoring and Observability

### 1. Set up monitoring stack

```bash
# Deploy Prometheus and Grafana
kubectl apply -f k8s/monitoring/
```

### 2. Configure alerting

1. **Set up Slack webhook for alerts**
2. **Configure PagerDuty integration**
3. **Set up email notifications**

## Database Migrations

### PostgreSQL Migrations

```bash
# Connect to Cloud SQL instance
gcloud sql connect spontra-dev-postgres --user=spontra

# Run migration scripts
psql -d user_service_db -f migrations/001_initial_schema.sql
```

### Cassandra Schema Setup

```bash
# Connect to Cassandra (if using separate cluster)
kubectl exec -it cassandra-0 -- cqlsh

# Create keyspace and tables
CREATE KEYSPACE spontra WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 3};
```

## Scaling

### Horizontal Pod Autoscaling

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: user-service-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: user-service
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

### Cluster Autoscaling

The GKE cluster is configured with cluster autoscaling:
- Minimum nodes: 3 (production) / 1 (dev)
- Maximum nodes: 20 (production) / 5 (dev)

## Security

### 1. Network Security

- Private GKE cluster with authorized networks
- VPC-native networking with IP aliasing
- Network policies for pod-to-pod communication

### 2. Secret Management

```bash
# Create secrets
kubectl create secret generic db-credentials \
  --from-literal=username=spontra \
  --from-literal=password=YOUR_DB_PASSWORD

# Use Google Secret Manager
gcloud secrets create spontra-db-password --data-file=password.txt
```

### 3. Workload Identity

Services use Workload Identity to access GCP services securely without storing service account keys.

## Backup and Disaster Recovery

### 1. Database Backups

- Automated daily backups for Cloud SQL
- Point-in-time recovery enabled
- Cross-region backup replication for production

### 2. Application Data

```bash
# Backup Kubernetes secrets and configs
kubectl get secrets -o yaml > backup-secrets.yaml
kubectl get configmaps -o yaml > backup-configmaps.yaml
```

## Troubleshooting

### Common Issues

1. **Pod not starting:**
   ```bash
   kubectl describe pod POD_NAME
   kubectl logs POD_NAME
   ```

2. **Service not accessible:**
   ```bash
   kubectl get endpoints
   kubectl get ingress
   ```

3. **Database connection issues:**
   ```bash
   kubectl exec -it POD_NAME -- env | grep DB
   ```

### Useful Commands

```bash
# View cluster information
kubectl cluster-info

# Check node status
kubectl get nodes

# View resource usage
kubectl top nodes
kubectl top pods

# Scale deployment
kubectl scale deployment user-service --replicas=5

# Rolling update
kubectl set image deployment/user-service user-service=gcr.io/$PROJECT_ID/user-service:new-tag

# View deployment history
kubectl rollout history deployment/user-service

# Rollback deployment
kubectl rollout undo deployment/user-service
```

## CI/CD Integration

The deployment is automated through GitHub Actions. See `.github/workflows/deploy.yml` for the complete pipeline.

### Required Secrets

Set these secrets in your GitHub repository:

- `GCP_SA_KEY`: Base64-encoded service account key JSON
- `GCP_PROJECT_ID`: Your GCP project ID

### Manual Deployment

To deploy manually:

```bash
# Build and deploy
make build
make deploy ENVIRONMENT=dev

# Or for production
make deploy ENVIRONMENT=production
```

## Cost Optimization

1. **Use preemptible instances for dev environment**
2. **Enable cluster autoscaling**
3. **Configure resource requests and limits**
4. **Use committed use discounts for production**
5. **Set up billing alerts**

## Support

For deployment issues:
1. Check the troubleshooting section above
2. Review GCP Console logs
3. Check Kubernetes events: `kubectl get events`
4. Contact the infrastructure team