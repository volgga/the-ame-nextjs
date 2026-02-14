#!/bin/bash
# Деплой на сервере: ./scripts/deploy.sh [DEPLOY_PATH] [PM2_APP_NAME]
set -euo pipefail

# Параметры по умолчанию
DEPLOY_PATH="${1:-${DEPLOY_PATH:-/var/www/theame}}"
PM2_APP_NAME="${2:-${PM2_APP_NAME:-nextjs-project}}"

echo "Deploy path: $DEPLOY_PATH | PM2: $PM2_APP_NAME"
cd "$DEPLOY_PATH" || { echo "Error: $DEPLOY_PATH not found"; exit 1; }

git fetch origin main || { echo "Error: fetch failed"; exit 1; }
git reset --hard origin/main || { echo "Error: reset failed"; exit 1; }
[ -s "$HOME/.nvm/nvm.sh" ] && source "$HOME/.nvm/nvm.sh" && (nvm use 20 || nvm use default || true)
npm ci || { echo "Error: npm ci failed"; exit 1; }
npm run build || { echo "Error: build failed"; exit 1; }
if command -v pm2 >/dev/null 2>&1; then
  pm2 restart "$PM2_APP_NAME" || { echo "Error: pm2 restart failed. Run: pm2 list"; exit 1; }
  pm2 save || true
  echo "Done."
else
  echo "Error: PM2 not found. Install: npm install -g pm2"; exit 1
fi
