#!/usr/bin/env bash
# Ultimate fix — пуленепробиваемый деплой Next.js standalone
# Статику раздаёт Nginx напрямую (.next/static, public), Node.js — только динамику
# Запуск на сервере: bash scripts/ultimate-fix.sh

set -euo pipefail

DEPLOY_PATH="${DEPLOY_PATH:-/var/www/theame}"
PM2_APP_NAME="${PM2_APP_NAME:-theame-next}"
NGINX_CONF_SOURCE="$DEPLOY_PATH/scripts/nginx-final.conf"
NGINX_CONF_DEST="/etc/nginx/sites-available/theame"

echo "=============================================="
echo "  ULTIMATE FIX — Nginx статика + Node.js динамика"
echo "=============================================="
echo "Путь: $DEPLOY_PATH"
echo ""

cd "$DEPLOY_PATH" || { echo "Ошибка: $DEPLOY_PATH не найден"; exit 1; }

# --- 1. Остановка PM2 ---
echo "[1/7] Остановка PM2..."
pm2 delete all 2>/dev/null || true
echo "      OK"
echo ""

# --- 2. Полная чистка (включая повреждённый npm cache) ---
echo "[2/7] Чистка (node_modules, .next, package-lock.json, /root/.npm)..."
rm -rf node_modules .next package-lock.json
rm -rf /root/.npm 2>/dev/null || true
echo "      OK"
echo ""

# --- 3. Установка и сборка ---
echo "[3/7] npm install..."
npm install
echo "      OK"
echo ""

echo "[4/7] npm run build..."
export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=2048}"
npm run build
echo "      OK"
echo ""

# --- 5. Права доступа ---
echo "[5/7] Права доступа (755, www-data)..."
chmod -R 755 "$DEPLOY_PATH/.next" "$DEPLOY_PATH/public"
chown -R www-data:www-data "$DEPLOY_PATH/.next" "$DEPLOY_PATH/public" 2>/dev/null || true
echo "      OK"
echo ""

# --- 6. PM2 (через ecosystem.config.cjs) ---
echo "[6/7] Запуск PM2 (ecosystem.config.cjs)..."
pm2 start ecosystem.config.cjs
pm2 save
echo "      OK"
echo ""

# --- 7. Nginx ---
echo "[7/7] Применение nginx-final.conf..."
if [ -f "$NGINX_CONF_SOURCE" ]; then
  cp -f "$NGINX_CONF_SOURCE" "$NGINX_CONF_DEST" 2>/dev/null || \
    { sudo cp -f "$NGINX_CONF_SOURCE" "$NGINX_CONF_DEST" || exit 1; }
  if nginx -t 2>/dev/null || sudo nginx -t 2>/dev/null; then
    systemctl reload nginx 2>/dev/null || sudo systemctl reload nginx
    echo "      OK: Nginx конфиг заменён и перезагружен"
  else
    echo "      ОШИБКА: nginx -t не прошёл. Проверьте конфиг вручную."
    exit 1
  fi
  ln -sf /etc/nginx/sites-available/theame /etc/nginx/sites-enabled/theame 2>/dev/null || \
    sudo ln -sf /etc/nginx/sites-available/theame /etc/nginx/sites-enabled/theame 2>/dev/null || true
else
  echo "      ОШИБКА: $NGINX_CONF_SOURCE не найден"
  exit 1
fi
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
