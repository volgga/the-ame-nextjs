#!/usr/bin/env bash
# Ultimate fix — стандартный билд Next.js (без standalone)
# Next.js раздаёт всё сам, Nginx — только reverse proxy
# Запуск на сервере: bash scripts/ultimate-fix.sh

set -euo pipefail

DEPLOY_PATH="${DEPLOY_PATH:-/var/www/theame}"
NGINX_CONF_SOURCE="$DEPLOY_PATH/scripts/nginx-final.conf"
NGINX_CONF_DEST="/etc/nginx/sites-available/theame"

echo "=============================================="
echo "  ULTIMATE FIX — стандартный Next.js билд"
echo "=============================================="
echo "Путь: $DEPLOY_PATH"
echo ""

cd "$DEPLOY_PATH" || { echo "Ошибка: $DEPLOY_PATH не найден"; exit 1; }

# --- 1. Остановка PM2 ---
echo "[1/7] pm2 delete all..."
pm2 delete all 2>/dev/null || true
echo "      OK"
echo ""

# --- 2. Чистка ---
echo "[2/7] rm -rf .next node_modules..."
rm -rf .next node_modules
rm -rf /root/.npm 2>/dev/null || true
echo "      OK"
echo ""

# --- 3. Установка ---
echo "[3/7] npm install --unsafe-perm..."
npm install --unsafe-perm
echo "      OK"
echo ""

# --- 4. Сборка ---
echo "[4/7] npm run build..."
export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=2048}"
npm run build
echo "      OK"
echo ""

# --- 5. Nginx ---
echo "[5/7] Копирование nginx-final.conf и активация..."
cp -f "$NGINX_CONF_SOURCE" "$NGINX_CONF_DEST" 2>/dev/null || \
  { sudo cp -f "$NGINX_CONF_SOURCE" "$NGINX_CONF_DEST" || exit 1; }

# Удалить default, добавить theame
rm -f /etc/nginx/sites-enabled/default 2>/dev/null || sudo rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/theame /etc/nginx/sites-enabled/theame 2>/dev/null || \
  sudo ln -sf /etc/nginx/sites-available/theame /etc/nginx/sites-enabled/theame
echo "      OK"
echo ""

# --- 6. PM2 ---
echo "[6/7] pm2 start ecosystem.config.cjs..."
pm2 start ecosystem.config.cjs
pm2 save
echo "      OK"
echo ""

# --- 7. Перезагрузка Nginx ---
echo "[7/7] nginx -t && systemctl reload nginx..."
sudo nginx -t && sudo systemctl reload nginx
echo "      OK"
echo ""

# --- Проверка ---
echo "=============================================="
echo "  Проверка"
echo "=============================================="
sleep 3
HTTP=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/ 2>/dev/null || echo "000")
echo "localhost:3000 -> HTTP $HTTP"
echo ""
echo "✅ Готово. Откройте https://theame.ru с Ctrl+Shift+R (очистка кэша браузера)"
