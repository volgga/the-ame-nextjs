#!/bin/bash
# Полная перенастройка сервера для theame.ru
# Запуск на СЕРВЕРЕ: bash scripts/full-server-reconfigure.sh

set -euo pipefail

DEPLOY_PATH="${DEPLOY_PATH:-/var/www/theame}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "============================================================================="
echo "  ПОЛНАЯ ПЕРЕНАСТРОЙКА СЕРВЕРА THEAME.RU"
echo "============================================================================="
echo "  Deploy path: $DEPLOY_PATH"
echo "  Project root: $PROJECT_ROOT"
echo "============================================================================="

cd "$PROJECT_ROOT"

# --- 1. ОЧИСТКА И СБОРКА ---
echo ""
echo "=== 1. ОЧИСТКА И СБОРКА ==="

echo "Удаление старых артефактов..."
rm -rf .next node_modules package-lock.json

echo "Установка зависимостей..."
npm install

echo "Сборка проекта (NODE_OPTIONS=1536MB)..."
export NODE_OPTIONS="--max-old-space-size=1536"
npm run build

# Копируем статику для standalone
echo "Копирование статики в standalone..."
mkdir -p .next/standalone/.next/server
cp -r public .next/standalone/public 2>/dev/null || true
cp -r .next/static .next/standalone/.next/static
cp -r .next/server .next/standalone/.next/

# --- 2. NGINX ---
echo ""
echo "=== 2. ПЕРЕНАСТРОЙКА NGINX ==="

NGINX_CONF_SOURCE="scripts/nginx-theame-reconfigure.conf"
NGINX_CONF_DEST="/etc/nginx/sites-available/theame"

if [ -f "$NGINX_CONF_SOURCE" ]; then
    sudo cp "$NGINX_CONF_SOURCE" "$NGINX_CONF_DEST"
    echo "Конфиг Nginx скопирован: $NGINX_CONF_DEST"
    [ ! -L /etc/nginx/sites-enabled/theame ] && sudo ln -sf /etc/nginx/sites-available/theame /etc/nginx/sites-enabled/theame
else
    echo "ВНИМАНИЕ: $NGINX_CONF_SOURCE не найден. Примените конфиг вручную."
fi

# --- 3. ПРАВА И ПЕРЕЗАПУСК ---
echo ""
echo "=== 3. ПРАВА И ПЕРЕЗАПУСК ==="

echo "Установка прав www-data..."
sudo chown -R www-data:www-data "$(pwd)"

echo "Проверка конфига Nginx..."
sudo nginx -t

echo "Перезапуск Nginx..."
sudo systemctl restart nginx

echo "Перезапуск PM2..."
pm2 delete all 2>/dev/null || true
pm2 start ecosystem.config.cjs
pm2 save

# --- 4. ФИНАЛЬНЫЙ ТЕСТ ---
echo ""
echo "=== 4. ФИНАЛЬНЫЙ ТЕСТ ==="

echo "Проверка приложения на 127.0.0.1:3000..."
if curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 http://127.0.0.1:3000/ | grep -qE '^[23][0-9][0-9]'; then
    echo "  OK: Приложение отвечает"
else
    echo "  ВНИМАНИЕ: Приложение не отвечает. pm2 logs theame-next"
fi

CHUNK_FILE=$(find .next/static/chunks -type f -name '*.js' 2>/dev/null | head -1)
if [ -n "$CHUNK_FILE" ]; then
    STATIC_REL="${CHUNK_FILE#.next/static/}"
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 "http://localhost/_next/static/$STATIC_REL" || echo "000")
    echo "Проверка статики: /_next/static/$STATIC_REL -> HTTP $HTTP_CODE"
fi

echo ""
echo "============================================================================="
echo "  ПЕРЕНАСТРОЙКА ЗАВЕРШЕНА"
echo "============================================================================="
