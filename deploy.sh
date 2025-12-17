#!/bin/bash
set -e


# Make scripts executable
chmod +x scripts/backup.sh
chmod +x scripts/restore.sh

# Create necessary directories
mkdir -p data
mkdir -p uploads
mkdir -p backups

# Check if .env.production exists, if not warn
if [ ! -f .env.production ]; then
    echo "Warning: .env.production not found. Please create it based on .env.production.example (or just .env.production provided)."
    exit 1
fi

# Load environment variables from .env.production usually handled by docker-compose --env-file
# Here we just start plain docker-compose

echo "Building and deploying containers..."
docker-compose --env-file .env.production up -d --build

echo "Deployment finished."
echo "Frontend: http://localhost:8280"
