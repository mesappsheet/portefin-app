#!/bin/bash
# ============================================================
# Script de configuration VPS — PorteFin
# Apps : afriquelivreetrichefinance.com (PC) + app.afriquelivreetrichefinance.com (Mobile)
# Usage : bash setup-vps.sh
# ============================================================

set -e

REPO_URL="https://github.com/mesappsheet/portefin-app.git"
APP_DIR="/var/www/portefin"
DOMAIN_PC="afriquelivreetrichefinance.com"
DOMAIN_APP="app.afriquelivreetrichefinance.com"

echo "========================================"
echo "  Configuration VPS PorteFin"
echo "========================================"

# 1. Mise à jour système
echo "[1/7] Mise à jour du système..."
apt-get update -y && apt-get upgrade -y

# 2. Installation Nginx, Git, Certbot
echo "[2/7] Installation Nginx + Git + Certbot..."
apt-get install -y nginx git certbot python3-certbot-nginx ufw

# 3. Firewall
echo "[3/7] Configuration Firewall..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

# 4. Clone du dépôt GitHub
echo "[4/7] Clonage du dépôt..."
if [ -d "$APP_DIR" ]; then
  echo "  Dossier existant — mise à jour..."
  cd "$APP_DIR" && git pull origin main
else
  git clone "$REPO_URL" "$APP_DIR"
fi

# 5. Permissions
chown -R www-data:www-data "$APP_DIR"
chmod -R 755 "$APP_DIR"

# 6. Configuration Nginx — App PC
echo "[5/7] Configuration Nginx App PC..."
cat > /etc/nginx/sites-available/portefin-pc << EOF
server {
    listen 80;
    server_name $DOMAIN_PC www.$DOMAIN_PC;
    root $APP_DIR;
    index MAQUETTE_COMPLETE.html;

    location / {
        try_files \$uri \$uri/ /MAQUETTE_COMPLETE.html;
    }

    # Cache statique
    location ~* \.(css|js|png|jpg|ico|woff2)$ {
        expires 7d;
        add_header Cache-Control "public, immutable";
    }

    gzip on;
    gzip_types text/html text/css application/javascript;
}
EOF

# 7. Configuration Nginx — App Mobile PWA
echo "[6/7] Configuration Nginx App Mobile..."
cat > /etc/nginx/sites-available/portefin-app << EOF
server {
    listen 80;
    server_name $DOMAIN_APP;
    root $APP_DIR/maquette-app;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Service Worker — ne pas cacher
    location /sw.js {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        expires 0;
    }

    # Manifest PWA
    location /manifest.json {
        add_header Cache-Control "no-cache";
    }

    location ~* \.(css|js|png|jpg|ico|woff2)$ {
        expires 7d;
        add_header Cache-Control "public, immutable";
    }

    gzip on;
    gzip_types text/html text/css application/javascript application/json;
}
EOF

# Activer les sites
ln -sf /etc/nginx/sites-available/portefin-pc /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/portefin-app /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Vérification config Nginx
nginx -t

# Redémarrage Nginx
systemctl restart nginx
systemctl enable nginx

# 8. SSL Let's Encrypt
echo "[7/7] Installation certificats SSL (HTTPS)..."
certbot --nginx \
  -d "$DOMAIN_PC" \
  -d "www.$DOMAIN_PC" \
  -d "$DOMAIN_APP" \
  --non-interactive \
  --agree-tos \
  --email admin@afriquelivreetrichefinance.com \
  --redirect

# 9. Script de déploiement automatique
cat > /usr/local/bin/deploy-portefin.sh << 'DEPLOY'
#!/bin/bash
cd /var/www/portefin
git pull origin main
chown -R www-data:www-data /var/www/portefin
echo "[$(date)] Déploiement OK" >> /var/log/portefin-deploy.log
DEPLOY

chmod +x /usr/local/bin/deploy-portefin.sh

# 10. Cron — auto-deploy toutes les 5 minutes
(crontab -l 2>/dev/null; echo "*/5 * * * * /usr/local/bin/deploy-portefin.sh") | crontab -

echo ""
echo "========================================"
echo "  CONFIGURATION TERMINÉE !"
echo "========================================"
echo ""
echo "  App PC     : https://$DOMAIN_PC"
echo "  App Mobile : https://$DOMAIN_APP"
echo ""
echo "  Auto-deploy : toutes les 5 min depuis GitHub"
echo ""
