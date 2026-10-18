# KAVACH Enterprise Production Deployment Guide

## 1. Architectural Overview

KAVACH is architected for enterprise cyber defense across cloud and on-premise environments. The cloud reference deployment utilizes **AWS Elastic Container Service (ECS) with AWS Fargate** for serverless container orchestration, **AWS RDS PostgreSQL** for resilient relational storage, **ElastiCache for Redis** for high-throughput message streaming, and **AWS Secrets Manager** for zero-trust credential governance.

```mermaid
graph TD
    Client["Windows Endpoints / Browser Analysts"] -->|HTTPS / WSS (Port 443)| CF["AWS CloudFront / Route 53"]
    CF --> ALB["AWS Application Load Balancer (ALB)"]
    ALB -->|HTTP /80| FE["ECS Fargate: kavach-frontend (Nginx)"]
    ALB -->|HTTP /8000| BE["ECS Fargate: kavach-backend (FastAPI / Celery)"]
    FE -->|Internal Reverse Proxy| BE
    BE -->|SQL Queries (SSL)| RDS[("Amazon RDS PostgreSQL Multi-AZ")]
    BE -->|Events / Spool Ingest| Redis[("Amazon ElastiCache Redis")]
    BE -->|Forensic Dumps| S3[("Amazon S3 (Encrypted Storage)")]
    BE -->|Audit & Anomaly Logs| CW["Amazon CloudWatch Logs"]
    SM["AWS Secrets Manager"] -.->|Injects JWT_SECRET & DB Creds| BE
```

---

## 2. Prerequisites & Requirements

- **AWS Account** with administrative permissions to ECS, ECR, RDS, ElastiCache, Secrets Manager, and Route 53.
- **AWS CLI v2** configured (`aws configure`).
- **Docker Engine** (or Docker Desktop) installed locally.
- **Domain Name** managed in Route 53 or external registrar with AWS Certificate Manager (ACM) public certificate.

---

## 3. Step-by-Step AWS ECS Fargate Deployment

### Step 3.1 Create ECR Repositories

```bash
aws ecr create-repository \
    --repository-name kavach-backend \
    --region ap-south-1 \
    --image-scanning-configuration scanOnPush=true

aws ecr create-repository \
    --repository-name kavach-frontend \
    --region ap-south-1 \
    --image-scanning-configuration scanOnPush=true
```

### Step 3.2 Build and Push Production Container Images

```bash
# Log in to ECR
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION="ap-south-1"

aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com

# Build and Push Backend
docker build -t $AWS_ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/kavach-backend:latest -f backend/Dockerfile.prod ./backend
docker push $AWS_ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/kavach-backend:latest

# Build and Push Frontend
docker build -t $AWS_ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/kavach-frontend:latest -f kavach-frontend/Dockerfile ./kavach-frontend
docker push $AWS_ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/kavach-frontend:latest
```

---

## 4. Database & Secrets Provisioning

### Step 4.1 Provision AWS RDS PostgreSQL Multi-AZ

1. Create a PostgreSQL 16.x DB instance:
   - **DB Instance Class**: `db.m6g.large` (Production) or `db.t4g.medium` (Staging).
   - **Storage**: 100 GB GP3 with auto-scaling up to 500 GB.
   - **Multi-AZ**: Enabled for high availability.
   - **Encryption**: Enabled via AWS KMS.
   - **Parameter Group**: Set `rds.force_ssl = 1`.

### Step 4.2 Populate AWS Secrets Manager

Store application secrets securely in AWS Secrets Manager:

```bash
# Store Database Credentials
aws secretsmanager create-secret \
    --name "kavach/prod/rds-credentials" \
    --description "KAVACH RDS PostgreSQL Credentials" \
    --secret-string '{"username":"kavach_admin","password":"<GENERATE_STRONG_RANDOM_PASSWORD>"}' \
    --region ap-south-1

# Store Application Security Keys
aws secretsmanager create-secret \
    --name "kavach/prod/app-secrets" \
    --description "KAVACH JWT & Session Secrets" \
    --secret-string '{"SECRET_KEY":"<GENERATE_64_CHAR_HEX>","JWT_SECRET":"<GENERATE_64_CHAR_HEX>"}' \
    --region ap-south-1
```

---

## 5. Register ECS Task Definition & Launch Service

### Step 5.1 Register Task Definition

The task definition template is located at `infra/aws/ecs-task-def.json`:

```bash
aws ecs register-task-definition \
    --cli-input-json file://infra/aws/ecs-task-def.json \
    --region ap-south-1
```

### Step 5.2 Create ECS Service with ALB Integration

```bash
aws ecs create-service \
    --cluster kavach-production-cluster \
    --service-name kavach-service \
    --task-definition kavach-production \
    --desired-count 2 \
    --launch-type FARGATE \
    --platform-version LATEST \
    --network-configuration "awsvpcConfiguration={subnets=[subnet-xxxx1,subnet-xxxx2],securityGroups=[sg-kavach-ecs],assignPublicIp=ENABLED}" \
    --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:ap-south-1:...:targetgroup/kavach-tg/...,containerName=kavach-frontend,containerPort=80" \
    --region ap-south-1
```

---

## 6. Alternative: Production Docker Compose Deployment

For on-premise servers, air-gapped workstations, or sovereign data centers:

```bash
# 1. Clone repository
git clone https://github.com/your-org/KAVACH.git /opt/kavach
cd /opt/kavach

# 2. Configure environment
cp .env.example .env
nano .env  # Configure strong SECRET_KEY, JWT_SECRET, and database credentials

# 3. Launch hardened production stack
docker-compose -f docker-compose.prod.yml up -d --build

# 4. Verify service health
docker-compose -f docker-compose.prod.yml ps
curl -f http://localhost/health
curl -f http://localhost/api/v1/health
```

---

## 7. CloudWatch Monitoring & Alerts

The production backend automatically publishes structured JSON logs to AWS CloudWatch.
Key metric filters to configure in CloudWatch:
1. **Critical Threat Detection Rate**:
   - Filter pattern: `{ $.level = "critical" || $.severity = "CRITICAL" }`
   - Alarm: Trigger SNS notification to SOC if > 5 events/minute.
2. **Ingestion Gateway Error Rate**:
   - Filter pattern: `{ $.event = "cloud_ingest_rejected" || $.status >= 400 }`
   - Alarm: Alert if error rate exceeds 2% of total traffic.
3. **Container Resource Utilization**:
   - Alarm on ECS Task CPU > 80% or Memory > 85% for 3 consecutive periods of 60 seconds.
