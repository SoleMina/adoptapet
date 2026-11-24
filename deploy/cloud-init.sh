#!/bin/bash
# Paste into Oracle Cloud > Create instance > Advanced options > Management > "Paste cloud-init script".
# On first boot it opens ports 80/443, installs Docker, clones the repo, generates the secrets and starts the stack.
# Progress: ssh in and run `sudo tail -f /var/log/cloud-init-output.log` (the first build takes 10-20 minutes).
set -eux

# Oracle's Ubuntu images reject everything except SSH in iptables
iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
netfilter-persistent save

# On first boot unattended-upgrades holds the apt lock; the Docker installer fails if it runs meanwhile
while fuser /var/lib/dpkg/lock-frontend /var/lib/apt/lists/lock >/dev/null 2>&1; do sleep 5; done

curl -fsSL https://get.docker.com | sh
usermod -aG docker ubuntu

cd /home/ubuntu
git clone https://github.com/SoleMina/adoptapet.git
cd adoptapet

# DOMAIN = public IP with dashes + .sslip.io (free name that points to that IP, valid for HTTPS)
IP=$(curl -fsS https://api.ipify.org || curl -fsS https://ifconfig.me)
cat > .env <<EOF
DOMAIN=${IP//./-}.sslip.io
MYSQL_ROOT_PASSWORD=$(openssl rand -hex 16)
RABBITMQ_PASSWORD=$(openssl rand -hex 16)
EOF
cp adoptapet-backend/.env.example adoptapet-backend/.env
sed -i "s|^JWT_SECRET=.*|JWT_SECRET=$(openssl rand -hex 64)|; s|^ADMIN_PASSWORD=.*|ADMIN_PASSWORD=$(openssl rand -hex 12)|" \
  adoptapet-backend/.env
chown -R ubuntu:ubuntu /home/ubuntu/adoptapet

docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
