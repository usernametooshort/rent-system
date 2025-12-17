#!/bin/bash

if [ -z "$1" ]; then
    echo "Usage: ./restore.sh <timestamp>"
    echo "Available timestamps:"
    ls ./backups | grep rent_db_ | sed 's/rent_db_\(.*\).sqlite/\1/'
    exit 1
fi

TIMESTAMP="$1"
BACKUP_DIR="./backups"
DB_FILE="./data/dev.db"

# Confirm
read -p "Are you sure you want to restore from $TIMESTAMP? This will OVERWRITE current data. (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

echo "Stopping containers..."
docker-compose down

echo "Restoring database..."
cp "$BACKUP_DIR/rent_db_$TIMESTAMP.sqlite" "$DB_FILE"

if [ -f "$BACKUP_DIR/rent_uploads_$TIMESTAMP.tar.gz" ]; then
    echo "Restoring uploads..."
    # Ensure uploads dir is empty/clean before usage if desired, or just overwrite
    mkdir -p ./uploads
    tar -xzf "$BACKUP_DIR/rent_uploads_$TIMESTAMP.tar.gz" -C ./uploads
else
    echo "No uploads backup found for this timestamp."
fi

echo "Restarting containers..."
docker-compose up -d

echo "Restore completed."
