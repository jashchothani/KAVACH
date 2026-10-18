#!/bin/sh
set -e

# Ensure SSL directory exists
mkdir -p /etc/nginx/ssl

# If no certificate exists, create an initial self-signed certificate for kavachcybertech.in
# This prevents Nginx from failing on startup before Let's Encrypt certificates are acquired.
if [ ! -f /etc/nginx/ssl/kavach.crt ] || [ ! -f /etc/nginx/ssl/kavach.key ]; then
    echo "[KAVACH] Generating initial SSL certificate for kavachcybertech.in..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /etc/nginx/ssl/kavach.key \
        -out /etc/nginx/ssl/kavach.crt \
        -subj "/C=IN/ST=Gujarat/L=Ahmedabad/O=KAVACH Cybertech/CN=kavachcybertech.in" \
        -addext "subjectAltName=DNS:kavachcybertech.in,DNS:www.kavachcybertech.in,DNS:api.kavachcybertech.in" \
        2>/dev/null || openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /etc/nginx/ssl/kavach.key \
        -out /etc/nginx/ssl/kavach.crt \
        -subj "/C=IN/ST=Gujarat/L=Ahmedabad/O=KAVACH Cybertech/CN=kavachcybertech.in"
    echo "[KAVACH] SSL certificate initialized successfully."
fi

exec nginx -g "daemon off;"
