#!/bin/bash

# Configuration
BACKUP_DIR="./backups"
DB_FILE="./data/dev.db" # In container mapped to host
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

# 1. Backup Database (SQLite)
# Ideally, we should use sqlite3 .backup command to ensure consistency, 
# but copying works reasonably well for low-write scenarios.
# For better safety, we can pause the container briefly.

echo "Backing up database..."
sqlite3 "$DB_FILE" ".backup '$BACKUP_DIR/rent_db_$TIMESTAMP.sqlite'"

# 2. Backup Uploads
echo "Backing up uploaded files..."
tar -czf "$BACKUP_DIR/rent_uploads_$TIMESTAMP.tar.gz" -C ./uploads .

# 3. Clean up old backups (keep last 7 days)
echo "Cleaning up old backups..."
find "$BACKUP_DIR" -type f -mtime +7 -name "rent_*" -delete

echo "Backup completed: $TIMESTAMP"
