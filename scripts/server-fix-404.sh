#!/usr/bin/env bash
# Чистая пересборка на сервере — устраняет 404 на _next/static и _next/image
# Запуск на сервере: bash scripts/server-fix-404.sh

set -euo pipefail

DEPLOY_PATH="${DEPLOY_PATH:-/var/www/theame}"
NGINX_CONF_SOURCE="$DEPLOY_PATH/scripts/nginx-theame-fixed.conf"
NGINX_CONF_DEST="/etc/nginx/sites-available/theame"

echo "=== Чистая установка (server-fix-404) ==="
echo "Путь проекта: $DEPLOY_PATH"
echo ""

cd "$DEPLOY_PATH" || { echo "Ошибка: $DEPLOY_PATH не найден"; exit 1; }

echo "1. Остановка PM2..."
pm2 stop theame-next 2>/dev/null || true
echo "   OK"
echo ""

echo "2. Жёсткая очистка (.next и node_modules)..."
rm -rf .next node_modules
echo "   OK"
echo ""

echo "3. Установка зависимостей..."
npm install
echo "   OK"
echo ""

echo "4. Сборка проекта..."
npm run build
echo "   OK"
echo ""

echo "5. Копирование static и public в standalone..."
if [ -d ".next/standalone" ]; then
  mkdir -p .next/standalone/.next
  cp -r .next/static .next/standalone/.next/
  cp -r public .next/standalone/
  echo "   OK: static и public скопированы"
else
  echo "   ОШИБКА: .next/standalone не найден"
  exit 1
fi
echo ""

echo "6. Исправление прав доступа (www-data для Nginx)..."
chown -R www-data:www-data "$DEPLOY_PATH/.next"
echo "   OK"
echo ""

echo "7. Перезапуск PM2 (server.js из .next/standalone/)..."
pm2 start ecosystem.config.cjs 2>/dev/null || pm2 restart theame-next --update-env
pm2 save
echo "   OK"
echo ""

echo "8. Применение Nginx-конфига (чистый reverse proxy)..."
if [ -f "$NGINX_CONF_SOURCE" ]; then
  if sudo cp "$NGINX_CONF_SOURCE" "$NGINX_CONF_DEST" 2>/dev/null; then
    if sudo nginx -t 2>/dev/null; then
      sudo systemctl reload nginx
      echo "   OK: Nginx перезагружен"
    else
      echo "   Ошибка nginx -t. Проверьте конфиг вручную."
    fi
  else
    echo "   Выполните вручную:"
    echo "   sudo cp $NGINX_CONF_SOURCE $NGINX_CONF_DEST"
    echo "   sudo nginx -t && sudo systemctl reload nginx"
  fi
else
  echo "   Файл $NGINX_CONF_SOURCE не найден"
fi
echo ""

echo "9. Проверка..."
sleep 3
HTTP=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/ 2>/dev/null || echo "000")
echo "   localhost:3000 -> HTTP $HTTP"
echo ""
echo "=== Готово. Откройте сайт в браузере с Ctrl+Shift+R (очистка кэша) ==="
