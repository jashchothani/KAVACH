#!/usr/bin/env bash
# ==============================================================================
# KAVACH Sovereign SOAR-XDR — Automated Free Let's Encrypt SSL/TLS Setup
# ==============================================================================

set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then
    echo "❌ Please run with sudo: sudo bash $0 <your-domain.com> <your-email@domain.com>"
    exit 1
fi

DOMAIN="${1:-}"
EMAIL="${2:-}"

if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
    echo "Usage: sudo bash $0 <domain-name> <admin-email>"
    echo "Example: sudo bash $0 kavach.mysecurityfirm.com admin@mysecurityfirm.com"
    exit 1
fi

echo "======================================================================"
echo "  🔒 Setting up Let's Encrypt SSL for: ${DOMAIN}"
echo "======================================================================"

# 1. Install Certbot
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y certbot

# 2. Stop frontend container temporarily to bind port 80 for ACME challenge
echo "Temporarily pausing container on port 80..."
docker compose -f docker-compose.prod.yml stop frontend || true

# 3. Obtain Certificate
certbot certonly --standalone \
    --preferred-challenges http \
    -d "$DOMAIN" \
    --email "$EMAIL" \
    --agree-tos \
    --non-interactive

# 4. Create SSL Directory for Nginx
mkdir -p kavach-frontend/ssl
cp -L "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" kavach-frontend/ssl/kavach.crt
cp -L "/etc/letsencrypt/live/${DOMAIN}/privkey.pem" kavach-frontend/ssl/kavach.key
chmod 600 kavach-frontend/ssl/kavach.key

# 5. Restart Containers with Port 443
docker compose -f docker-compose.prod.yml up -d --build

# 6. Setup Auto-Renewal Cron
cat << 'CRON_EOF' > /etc/cron.d/certbot-kavach-renew
0 3 * * 1 root certbot renew --quiet --pre-hook "docker compose -f /opt/kavach/docker-compose.prod.yml stop frontend" --post-hook "cp -L /etc/letsencrypt/live/*/fullchain.pem /opt/kavach/kavach-frontend/ssl/kavach.crt && cp -L /etc/letsencrypt/live/*/privkey.pem /opt/kavach/kavach-frontend/ssl/kavach.key && docker compose -f /opt/kavach/docker-compose.prod.yml up -d"
CRON_EOF

echo ""
echo "======================================================================"
echo "  ✅ SSL/TLS Certificate configured successfully!"
echo "  🌐 Secure URL: https://${DOMAIN}/"
echo "======================================================================"
