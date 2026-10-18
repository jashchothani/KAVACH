#!/usr/bin/env bash
# ==============================================================================
# KAVACH Sovereign SOAR-XDR — Automated Production Deployment Script for Linux
# Compatible with: Ubuntu 22.04/24.04 LTS, Debian 12, Amazon Linux 2023
# ==============================================================================

set -euo pipefail

echo "======================================================================"
echo "  🛡️  KAVACH SOAR-XDR PLATFORM — AWS LINUX PRODUCTION DEPLOYMENT"
echo "======================================================================"

# 1. Require Root / Sudo
if [ "$(id -u)" -ne 0 ]; then
    echo "❌ Please run this script with sudo: sudo bash $0"
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
cd "${APP_DIR}"

echo "📁 Application root directory: ${APP_DIR}"

# 2. Detect Package Manager and Install Dependencies
echo "📦 Step 1: Checking and installing runtime prerequisites (Docker, Compose, Git)..."

if command -v apt-get &> /dev/null; then
    export DEBIAN_FRONTEND=noninteractive
    apt-get update -y
    apt-get install -y --no-install-recommends \
        ca-certificates \
        curl \
        gnupg \
        lsb-release \
        git \
        ufw \
        jq

    # Install official Docker engine if not present
    if ! command -v docker &> /dev/null; then
        echo "🐳 Installing official Docker CE..."
        install -m 0755 -d /etc/apt/keyrings
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg --yes
        chmod a+r /etc/apt/keyrings/docker.gpg
        echo \
          "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
          $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
        apt-get update -y
        apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    fi

elif command -v dnf &> /dev/null; then
    # Amazon Linux 2023 / Fedora / RHEL
    dnf update -y
    dnf install -y git curl jq
    if ! command -v docker &> /dev/null; then
        echo "🐳 Installing Docker on Amazon Linux..."
        dnf install -y docker
    fi
    # Install docker compose plugin
    mkdir -p /usr/local/lib/docker/cli-plugins
    curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-$(uname -m) -o /usr/local/lib/docker/cli-plugins/docker-compose
    chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
fi

# 3. Enable and Start Docker Daemon
systemctl enable docker
systemctl start docker

# 4. Linux Kernel Tuning for High-Concurrency Telemetry
echo "⚙️  Step 2: Tuning Linux kernel sysctl settings..."
cat << 'SYSCTL_EOF' > /etc/sysctl.d/99-kavach-production.conf
net.core.somaxconn = 65535
net.ipv4.tcp_max_syn_backlog = 8192
net.ipv4.ip_local_port_range = 1024 65535
fs.file-max = 2097152
vm.max_map_count = 262144
SYSCTL_EOF
sysctl --system > /dev/null || true

# 5. Configure Firewall (UFW)
if command -v ufw &> /dev/null; then
    echo "🔒 Step 3: Configuring host firewall rules (Ports 22, 80, 443)..."
    ufw allow 22/tcp || true
    ufw allow 80/tcp || true
    ufw allow 443/tcp || true
    ufw --force enable || true
fi

# 6. Initialize Environment File
echo "📝 Step 4: Configuring production environment variables..."
if [ ! -f "${APP_DIR}/.env.prod" ]; then
    if [ -f "${APP_DIR}/.env.prod.example" ]; then
        cp "${APP_DIR}/.env.prod.example" "${APP_DIR}/.env.prod"
        echo "Created .env.prod from .env.prod.example"
    else
        touch "${APP_DIR}/.env.prod"
    fi
fi

# 7. Build and Start Container Stack
echo "🚀 Step 5: Building and starting KAVACH Production Docker Containers..."
docker compose -f docker-compose.prod.yml down --remove-orphans || true
docker compose -f docker-compose.prod.yml up -d --build

# 8. Create systemd Service for Auto-Restart on Host Reboots
echo "🔄 Step 6: Creating systemd service for automatic reboot recovery..."
cat << SERVICE_EOF > /etc/systemd/system/kavach.service
[Unit]
Description=KAVACH Sovereign SOAR-XDR Platform
Requires=docker.service
After=docker.service network-online.target
Wants=network-online.target

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=${APP_DIR}
ExecStart=/usr/bin/docker compose -f docker-compose.prod.yml up -d
ExecStop=/usr/bin/docker compose -f docker-compose.prod.yml down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
SERVICE_EOF

systemctl daemon-reload
systemctl enable kavach.service

# 9. Verify Container Health
echo "🩺 Step 7: Verifying container health status..."
sleep 8

MAX_RETRIES=20
COUNT=0
HEALTHY=false

while [ $COUNT -lt $MAX_RETRIES ]; do
    if curl -s -f http://127.0.0.1/health > /dev/null 2>&1; then
        HEALTHY=true
        break
    fi
    echo "Waiting for services to become healthy ($((COUNT + 1))/${MAX_RETRIES})..."
    sleep 3
    COUNT=$((COUNT + 1))
done

# 10. Fetch Public IP
PUBLIC_IP=$(curl -s -m 4 https://checkip.amazonaws.com || curl -s -m 4 ifconfig.me || echo "SERVER_PUBLIC_IP")

echo ""
echo "======================================================================"
if [ "$HEALTHY" = true ]; then
    echo "  ✅ KAVACH PRODUCTION PLATFORM IS LIVE & HEALTHY!"
else
    echo "  ⚠️  Containers are starting up. Please check logs below."
fi
echo "======================================================================"
echo "  🌐 Operations Console: http://${PUBLIC_IP}/"
echo "  📊 SOC Live Telemetry: http://${PUBLIC_IP}/soc"
echo "  🛡️  Raksha AI Assistant: http://${PUBLIC_IP}/raksha-ai"
echo "  🩺 Backend API Health: http://${PUBLIC_IP}/api/v1/health"
echo "======================================================================"
echo ""
echo "Useful Commands:"
echo "  - View live logs:    docker compose -f docker-compose.prod.yml logs -f"
echo "  - Restart platform:  systemctl restart kavach"
echo "  - Stop platform:     docker compose -f docker-compose.prod.yml down"
echo "======================================================================"
