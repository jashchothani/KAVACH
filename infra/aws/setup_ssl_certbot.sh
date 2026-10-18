#!/usr/bin/env bash
# ==============================================================================
# KAVACH Sovereign SOAR-XDR — Automated Free Let's Encrypt SSL/TLS Setup
# Default Domain: kavachcybertech.in (including www and api subdomains)
# Default Email:  kavachcybertech@gmail.com
# ==============================================================================

set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then
    echo "❌ Please run with sudo: sudo bash $0 [domain-name] [admin-email]"
    exit 1
fi

DOMAIN="${1:-kavachcybertech.in}"
EMAIL="${2:-kavachcybertech@gmail.com}"

echo "======================================================================"
echo "  🔒 Setting up Let's Encrypt SSL for: ${DOMAIN}"
echo "  📧 Administrative Email:             ${EMAIL}"
echo "======================================================================"

# 1. Install Certbot
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y certbot

# 2. Stop frontend container temporarily to bind port 80 for ACME standalone challenge
echo "Temporarily pausing web container on port 80..."
docker compose -f docker-compose.prod.yml stop frontend || true

# 3. Obtain Certificate with subdomains if configured
echo "Requesting SSL certificate from Let's Encrypt..."
CERT_DOMAINS=("-d" "$DOMAIN")

# Check if www and api resolve to this host before adding them
if [ "$DOMAIN" = "kavachcybertech.in" ]; then
    CERT_DOMAINS+=("-d" "www.${DOMAIN}" "-d" "api.${DOMAIN}")
fi

certbot certonly --standalone \
    --preferred-challenges http \
    "${CERT_DOMAINS[@]}" \
    --email "$EMAIL" \
    --agree-tos \
    --non-interactive || \
certbot certonly --standalone \
    --preferred-challenges http \
    -d "$DOMAIN" \
    --email "$EMAIL" \
    --agree-tos \
    --non-interactive

# 4. Copy certificates into KAVACH SSL directory mounted by Nginx
mkdir -p kavach-frontend/ssl
cp -L "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" kavach-frontend/ssl/kavach.crt
cp -L "/etc/letsencrypt/live/${DOMAIN}/privkey.pem" kavach-frontend/ssl/kavach.key
chmod 644 kavach-frontend/ssl/kavach.crt
chmod 600 kavach-frontend/ssl/kavach.key

# 5. Restart frontend container with new SSL certificates
docker compose -f docker-compose.prod.yml up -d frontend

# 6. Setup Automated Weekly Renewal Cron
cat << 'CRON_EOF' > /etc/cron.d/certbot-kavach-renew
0 3 * * 1 root certbot renew --quiet --pre-hook "docker compose -f /opt/kavach/docker-compose.prod.yml stop frontend" --post-hook "cp -L /etc/letsencrypt/live/*/fullchain.pem /opt/kavach/kavach-frontend/ssl/kavach.crt && cp -L /etc/letsencrypt/live/*/privkey.pem /opt/kavach/kavach-frontend/ssl/kavach.key && docker compose -f /opt/kavach/docker-compose.prod.yml up -d frontend"
CRON_EOF

echo ""
echo "======================================================================"
echo "  ✅ SSL/TLS Certificate configured successfully!"
echo "  🌐 Secure Web Console:    https://${DOMAIN}/"
echo "  🌐 Secure SOC Dashboard:  https://${DOMAIN}/soc"
echo "  🌐 Secure Raksha AI:      https://${DOMAIN}/raksha-ai"
echo "  🌐 Secure API Endpoint:   https://${DOMAIN}/api/v1/health"
echo "======================================================================"
