#!/usr/bin/env bash
# Бронебойный скрипт — полная очистка и переустановка (фикс TAR_ENTRY_ERROR, ENOENT)
# Запуск на сервере: sudo bash scripts/ultimate-fix.sh

set -euo pipefail

DEPLOY_PATH="${DEPLOY_PATH:-/var/www/theame}"
NGINX_CONF_SOURCE="$DEPLOY_PATH/scripts/nginx-final.conf"
NGINX_CONF_DEST="/etc/nginx/sites-available/theame"

echo "=============================================="
echo "  ULTIMATE FIX — полная переустановка"
echo "=============================================="
echo "Путь: $DEPLOY_PATH"
echo ""

cd "$DEPLOY_PATH" || { echo "Ошибка: $DEPLOY_PATH не найден"; exit 1; }

# --- 1. Убить PM2 полностью (снять блокировки файлов) ---
echo "[1/8] pm2 kill..."
pm2 kill 2>/dev/null || true
echo "      OK"
echo ""

# --- 2. Жёсткое удаление всего ---
echo "[2/8] rm -rf node_modules .next package-lock.json ~/.npm /root/.npm..."
rm -rf node_modules .next package-lock.json
rm -rf ~/.npm /root/.npm 2>/dev/null || true
echo "      OK"
echo ""

# --- 3. Очистка кэша npm ---
echo "[3/8] npm cache clean --force..."
npm cache clean --force
echo "      OK"
echo ""

# --- 4. Установка ---
echo "[4/8] npm install..."
npm install
echo "      OK"
echo ""

# --- 5. Сборка ---
echo "[5/8] npm run build..."
npm run build
echo "      OK"
echo ""

# --- 6. Nginx ---
echo "[6/8] Применение nginx-final.conf..."
cp -f "$NGINX_CONF_SOURCE" "$NGINX_CONF_DEST" 2>/dev/null || sudo cp -f "$NGINX_CONF_SOURCE" "$NGINX_CONF_DEST"
rm -f /etc/nginx/sites-enabled/default 2>/dev/null || sudo rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/theame /etc/nginx/sites-enabled/theame 2>/dev/null || sudo ln -sf /etc/nginx/sites-available/theame /etc/nginx/sites-enabled/theame
echo "      OK"
echo ""

# --- 7. PM2 ---
echo "[7/8] pm2 start ecosystem.config.cjs..."
pm2 start ecosystem.config.cjs
pm2 save
echo "      OK"
echo ""

# --- 8. Nginx reload ---
echo "[8/8] nginx -t && systemctl reload nginx..."
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
echo "✅ Готово. Откройте https://theame.ru с Ctrl+Shift+R"
