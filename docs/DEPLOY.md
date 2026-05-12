# Deployment Guide - University Server

This guide explains how to deploy the Farmer Data Collection System to the university server at `http://194.171.191.226:3061`.

## Prerequisites
- SSH access to the server.
- Docker and Docker Compose installed on the server.
- A way to transfer files (Git, SCP, or SFTP).

## Deployment Steps

### 1. Transfer the Code
Clone the repository or SCP the project folder to the server:
```bash
git clone <your-repo-url>
cd Next-Level-Logistics
```

### 2. Configure Environment
Create a `.env` file in the root directory to override default passwords:
```env
DATABASE_URL=postgresql://user:strongpassword@db:5432/farmer_data
POSTGRES_PASSWORD=strongpassword
```

### 3. Launch the Application
Use the production docker-compose file:
```bash
docker-compose -f docker/docker-compose.prod.yml up -d --build
```

### 4. Initialize the Database
Run the seed script once to create the initial test farm and farmer:
```bash
docker exec -it farmer_api_prod python /app/seed.py
```

## Server Configuration (Port 3061)
The university server likely uses a reverse proxy (like Nginx or Apache) to map `http://194.171.191.226:3061` to the internal application. 

**If you have access to the server's Nginx config**, ensure it is proxying traffic to the API container:
```nginx
location / {
    proxy_pass http://localhost:8000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

## Troubleshooting
- **Check Logs**: `docker-compose -f docker/docker-compose.prod.yml logs -f api`
- **Verify DB**: `docker exec -it farmer_db_prod psql -U user -d farmer_data`
- **Restart Services**: `docker-compose -f docker/docker-compose.prod.yml restart`
