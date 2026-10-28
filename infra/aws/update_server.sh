#!/usr/bin/env bash
set -euo pipefail
echo "================================================="
echo "🛡️ Updating KAVACH Platform on AWS EC2..."
echo "================================================="

# Find repo directory
if [ -d "/opt/kavach" ]; then
    APP_DIR="/opt/kavach"
elif [ -d "$HOME/kavach" ]; then
    APP_DIR="$HOME/kavach"
elif [ -d "$HOME/KAVACH" ]; then
    APP_DIR="$HOME/KAVACH"
else
    APP_DIR="$(pwd)"
fi

cd "$APP_DIR"
echo "📁 Application Directory: $APP_DIR"

# Pull latest code from GitHub
echo "⬇️ Pulling latest changes from GitHub (main)..."
git fetch origin main
git reset --hard origin/main

# Ensure port 465 is configured in .env.prod
if [ -f "$APP_DIR/.env.prod" ]; then
    sed -i 's/SMTP_PORT=.*/SMTP_PORT=465/g' "$APP_DIR/.env.prod" 2>/dev/null || true
    sed -i 's/NOTIFICATION_PORT=.*/NOTIFICATION_PORT=465/g' "$APP_DIR/.env.prod" 2>/dev/null || true
    if ! grep -q "SMTP_PORT" "$APP_DIR/.env.prod"; then
        echo "SMTP_PORT=465" >> "$APP_DIR/.env.prod"
        echo "NOTIFICATION_PORT=465" >> "$APP_DIR/.env.prod"
    fi
fi

# Rebuild and restart docker stack
echo "🐳 Rebuilding and restarting KAVACH Docker containers..."
docker compose -f docker-compose.prod.yml down --remove-orphans || true
docker compose -f docker-compose.prod.yml up -d --build

echo "🩺 Verifying container status..."
sleep 5
docker compose -f docker-compose.prod.yml ps

echo "================================================="
echo "✅ KAVACH Server Successfully Updated & Running!"
echo "================================================="
