#!/usr/bin/env bash
# Скрипт для исправления 404 на _next/static на сервере
# Запуск: на сервере после SSH: bash scripts/server-fix-404.sh

set -euo pipefail

DEPLOY_PATH="${DEPLOY_PATH:-/var/www/theame}"
NGINX_CONF_SOURCE="$DEPLOY_PATH/scripts/nginx-theame-fixed.conf"
NGINX_CONF_DEST="/etc/nginx/sites-available/theame"

echo "=== Исправление 404 на _next/static ==="
echo "Путь проекта: $DEPLOY_PATH"
echo ""

cd "$DEPLOY_PATH" || { echo "Ошибка: $DEPLOY_PATH не найден"; exit 1; }

echo "1. Очистка старой сборки..."
rm -rf .next
echo "   OK"
echo ""

echo "2. Установка зависимостей..."
npm ci
echo ""

echo "3. Сборка проекта..."
npm run build
echo "   OK"
echo ""

echo "4. Копирование static и public в standalone (Next.js может не копировать автоматически)..."
if [ -d ".next/standalone" ]; then
  mkdir -p .next/standalone/.next
  cp -r .next/static .next/standalone/.next/ 2>/dev/null || true
  cp -r public .next/standalone/ 2>/dev/null || true
  echo "   OK: static и public скопированы в .next/standalone/"
else
  echo "   ВНИМАНИЕ: папка .next/standalone не найдена"
fi
echo ""

echo "5. Проверка наличия статики..."
if [ -d ".next/standalone/.next/static/chunks" ]; then
  echo "   OK: .next/standalone/.next/static/ содержит чанки"
  ls .next/standalone/.next/static/chunks/ | head -3
else
  echo "   ВНИМАНИЕ: статика не найдена в standalone. Проверьте output в next.config"
fi
echo ""

echo "6. Применение Nginx-конфига..."
echo "   Источник: $NGINX_CONF_SOURCE"
echo "   Назначение: $NGINX_CONF_DEST"
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

echo "7. Перезапуск PM2..."
pm2 restart theame-next --update-env
pm2 save
echo "   OK"
echo ""

echo "8. Проверка..."
sleep 3
HTTP=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ || echo "000")
echo "   localhost:3000 -> HTTP $HTTP"
echo ""
echo "=== Готово. Откройте сайт в браузере с Ctrl+Shift+R (очистка кэша) ==="
