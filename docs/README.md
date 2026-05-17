# Farmer Data Collection System - Deployment Guide

## Overview

The Farmer Data Collection System is a comprehensive solution for collecting agricultural data through mobile apps and web dashboards. This system enables farmers to submit harvest data via photos and forms, with AI processing for automated data extraction.

## Architecture

- **Mobile App**: React Native (Expo) app for farmers
- **API Backend**: FastAPI (Python) with PostgreSQL database
- **Web Dashboard**: React dashboard for supply chain managers
- **AI Pipeline**: Computer vision and OCR for photo processing
- **Infrastructure**: Docker containers with Redis for queuing

## Prerequisites

- Docker and Docker Compose
- Node.js 18+ and npm
- Python 3.11+
- Git

## Quick Start Deployment

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Next-Level-Logistics
```

### 2. Environment Setup

Copy the environment file and configure your settings:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# Database
POSTGRES_USER=farmer_user
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=farmer_data

# Redis
REDIS_URL=redis://redis:6379

# API
API_HOST=0.0.0.0
API_PORT=8000

# Optional: External services
S3_BUCKET=your-s3-bucket
WEBHOOK_URL=https://your-webhook-endpoint.com
```

### 3. Start the System

```bash
# Start all services (API, Database, Dashboard, Redis)
docker-compose -f docker/docker-compose.prod.yml up -d

# Or for development
docker-compose -f docker/docker-compose.yml up -d
```

### 4. Initialize Database

```bash
# Run database migrations
docker-compose -f docker/docker-compose.prod.yml exec api alembic upgrade head

# Seed with test data
docker-compose -f docker/docker-compose.prod.yml exec api python seed.py
```

### 5. Access the System

- **API Documentation**: http://localhost:8000/docs
- **Web Dashboard**: http://localhost
- **Mobile App**: See mobile app setup below

## Detailed Deployment

### Production Deployment

#### Using Docker Compose (Recommended)

1. **Build and deploy**:
```bash
# Build production images
docker-compose -f docker/docker-compose.prod.yml build

# Start services
docker-compose -f docker/docker-compose.prod.yml up -d

# Check logs
docker-compose -f docker/docker-compose.prod.yml logs -f
```

2. **Database setup**:
```bash
# Create database and run migrations
docker-compose -f docker/docker-compose.prod.yml exec api alembic upgrade head

# Seed initial data
docker-compose -f docker/docker-compose.prod.yml exec api python seed.py
```

3. **SSL/TLS Setup** (Optional):
```bash
# Using nginx reverse proxy
docker run -d \
  --name nginx-proxy \
  -p 80:80 -p 443:443 \
  -v /path/to/ssl/certs:/etc/nginx/certs \
  -v /var/run/docker.sock:/tmp/docker.sock \
  jwilder/nginx-proxy
```

#### Manual Deployment

1. **Database**:
```bash
# Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql
CREATE DATABASE farmer_data;
CREATE USER farmer_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE farmer_data TO farmer_user;
```

2. **Redis**:
```bash
# Install Redis
sudo apt-get install redis-server

# Start Redis
sudo systemctl start redis-server
```

3. **API Backend**:
```bash
cd api
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

4. **Web Dashboard**:
```bash
cd dashboard
npm install
npm run build
# Serve with nginx or your preferred web server
```

### Mobile App Deployment

#### Development Setup

1. **Install Expo CLI**:
```bash
npm install -g @expo/cli
```

2. **Install dependencies**:
```bash
cd app
npm install
```

3. **Start development server**:
```bash
npx expo start
```

4. **Test on device**:
- Install "Expo Go" app on your phone
- Scan the QR code displayed in terminal

#### Production Build

1. **Build for iOS/Android**:
```bash
# For iOS
npx expo build:ios

# For Android
npx expo build:android
```

2. **Submit to app stores**:
- iOS: Upload to App Store Connect
- Android: Upload to Google Play Console

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `POSTGRES_USER` | Database username | farmer_user |
| `POSTGRES_PASSWORD` | Database password | Required |
| `POSTGRES_DB` | Database name | farmer_data |
| `REDIS_URL` | Redis connection URL | redis://redis:6379 |
| `API_HOST` | API bind address | 0.0.0.0 |
| `API_PORT` | API port | 8000 |
| `S3_BUCKET` | S3 bucket for photos | Optional |
| `WEBHOOK_URL` | External webhook endpoint | Optional |

### Database Configuration

The system uses PostgreSQL with the following key tables:
- `farmers`: Farmer profiles
- `farms`: Farm information
- `locations`: Predefined locations
- `records`: Submission records
- `record_products`: Product details
- `record_condition`: Quality assessments

### API Endpoints

- `POST /v1/records`: Submit new record
- `GET /v1/records/{id}`: Get processed record
- `GET /v1/locations`: Get farm locations
- `POST /v1/photos/upload`: Upload photo

## Monitoring and Maintenance

### Health Checks

```bash
# Check container health
docker-compose -f docker/docker-compose.prod.yml ps

# View logs
docker-compose -f docker/docker-compose.prod.yml logs api
docker-compose -f docker/docker-compose.prod.yml logs dashboard
```

### Database Backup

```bash
# Backup database
docker-compose -f docker/docker-compose.prod.yml exec db pg_dump -U farmer_user farmer_data > backup.sql

# Restore database
docker-compose -f docker/docker-compose.prod.yml exec -T db psql -U farmer_user farmer_data < backup.sql
```

### Updates

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose -f docker/docker-compose.prod.yml down
docker-compose -f docker/docker-compose.prod.yml build --no-cache
docker-compose -f docker/docker-compose.prod.yml up -d

# Run migrations if needed
docker-compose -f docker/docker-compose.prod.yml exec api alembic upgrade head
```

## Troubleshooting

### Common Issues

1. **Database connection failed**:
   - Check PostgreSQL is running
   - Verify connection string in `.env`
   - Ensure database exists

2. **API not responding**:
   - Check container logs: `docker-compose logs api`
   - Verify port 8000 is not blocked
   - Check environment variables

3. **Mobile app won't connect**:
   - Ensure API is accessible from mobile network
   - Check firewall settings
   - Verify API URL in mobile app config

4. **Photo upload fails**:
   - Check S3 credentials if using cloud storage
   - Verify file permissions
   - Check network connectivity

### Logs

```bash
# View all logs
docker-compose -f docker/docker-compose.prod.yml logs

# Follow specific service logs
docker-compose -f docker/docker-compose.prod.yml logs -f api

# View last 100 lines
docker-compose -f docker/docker-compose.prod.yml logs --tail=100 api
```

## Security Considerations

- Change default database passwords
- Use HTTPS in production
- Implement API rate limiting
- Regular security updates
- Monitor for vulnerabilities

## Support

For issues and questions:
1. Check the logs for error messages
2. Review the API documentation at `/docs`
3. Consult the main project README for detailed specifications

## License

[Add your license information here]