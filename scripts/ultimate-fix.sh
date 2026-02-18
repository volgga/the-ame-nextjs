#!/usr/bin/env bash
# Ultimate fix для 404 на _next/static, _next/image, шрифтах и картинках
# Запуск на сервере под root: bash scripts/ultimate-fix.sh
# Или: sudo bash scripts/ultimate-fix.sh

set -euo pipefail

DEPLOY_PATH="${DEPLOY_PATH:-/var/www/theame}"
PM2_APP_NAME="${PM2_APP_NAME:-theame-next}"
NGINX_CONF_SOURCE="$DEPLOY_PATH/scripts/nginx.conf.fixed"
NGINX_CONF_DEST="/etc/nginx/sites-available/theame"

echo "=============================================="
echo "  ULTIMATE FIX — Next.js Standalone + Nginx"
echo "=============================================="
echo "Путь: $DEPLOY_PATH"
echo ""

cd "$DEPLOY_PATH" || { echo "Ошибка: $DEPLOY_PATH не найден"; exit 1; }

# --- 1. Остановка PM2 ---
echo "[1/8] Остановка PM2..."
pm2 delete all 2>/dev/null || true
echo "      OK"
echo ""

# --- 2. Полная чистка ---
echo "[2/8] Полная чистка (.next, node_modules, package-lock.json)..."
rm -rf .next node_modules package-lock.json
echo "      OK"
echo ""

# --- 3. Чистая установка ---
echo "[3/8] npm cache clean + npm install..."
npm cache clean --force
npm install
echo "      OK"
echo ""

# --- 4. Сборка ---
echo "[4/8] Сборка (npm run build)..."
export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=2048}"
npm run build
echo "      OK"
echo ""

# --- 5. Символические ссылки (критично для standalone) ---
echo "[5/8] Создание символических ссылок для static и public..."

STANDALONE_NEXT="$DEPLOY_PATH/.next/standalone/.next"
STANDALONE_ROOT="$DEPLOY_PATH/.next/standalone"

if [ ! -d "$STANDALONE_ROOT" ]; then
  echo "      ОШИБКА: .next/standalone не найден после сборки"
  exit 1
fi

# Удаляем старые копии/пустые папки (если были от cp)
rm -rf "$STANDALONE_NEXT/static" "$STANDALONE_ROOT/public" 2>/dev/null || true

# Ссылка 1: .next/static -> .next/standalone/.next/static
ln -sf "$DEPLOY_PATH/.next/static" "$STANDALONE_NEXT/static"
echo "      ln -sf .next/static -> standalone/.next/static"

# Ссылка 2: public -> .next/standalone/public
ln -sf "$DEPLOY_PATH/public" "$STANDALONE_ROOT/public"
echo "      ln -sf public -> standalone/public"

echo "      OK"
echo ""

# --- 6. Права доступа ---
echo "[6/8] Права доступа (755 на .next)..."
chmod -R 755 "$DEPLOY_PATH/.next"
chown -R www-data:www-data "$DEPLOY_PATH/.next" 2>/dev/null || true
echo "      OK"
echo ""

# --- 7. Запуск PM2 ---
echo "[7/8] Запуск PM2 из ecosystem.config.cjs..."
pm2 start ecosystem.config.cjs
pm2 save
echo "      OK"
echo ""

# --- 8. Применение Nginx ---
echo "[8/8] Применение Nginx-конфига..."
if [ -f "$NGINX_CONF_SOURCE" ]; then
  cp "$NGINX_CONF_SOURCE" "$NGINX_CONF_DEST" 2>/dev/null || \
  sudo cp "$NGINX_CONF_SOURCE" "$NGINX_CONF_DEST"
  if nginx -t 2>/dev/null || sudo nginx -t 2>/dev/null; then
    systemctl reload nginx 2>/dev/null || sudo systemctl reload nginx
    echo "      OK: Nginx перезагружен"
  else
    echo "      ВНИМАНИЕ: nginx -t не прошёл. Примените конфиг вручную:"
    echo "      sudo cp $NGINX_CONF_SOURCE $NGINX_CONF_DEST"
    echo "      sudo nginx -t && sudo systemctl reload nginx"
  fi
  # Активируем сайт, если ещё не активирован
  [ -L /etc/nginx/sites-enabled/theame ] 2>/dev/null || \
    (sudo ln -sf /etc/nginx/sites-available/theame /etc/nginx/sites-enabled/ 2>/dev/null || true)
else
  echo "      Файл $NGINX_CONF_SOURCE не найден — примените nginx вручную"
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
