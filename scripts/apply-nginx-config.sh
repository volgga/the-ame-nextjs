#!/bin/bash
# Применение конфига Nginx на сервере
# Запуск на СЕРВЕРЕ: bash scripts/apply-nginx-config.sh

set -e

cd /var/www/theame

echo "=== 1. Обновление кода из репозитория ==="
git pull

echo ""
echo "=== 2. Применение конфига Nginx ==="
if [ -f "scripts/nginx-theame-fixed.conf" ]; then
    sudo cp scripts/nginx-theame-fixed.conf /etc/nginx/sites-available/theame
    echo "✅ Конфиг скопирован"
else
    echo "❌ Файл scripts/nginx-theame-fixed.conf не найден"
    exit 1
fi

echo ""
echo "=== 3. Удаление конфликтующих конфигов ==="
if [ -L "/etc/nginx/sites-enabled/theame.ru" ]; then
    sudo rm /etc/nginx/sites-enabled/theame.ru
    echo "✅ Удалён конфликтующий конфиг theame.ru"
fi

echo ""
echo "=== 4. Проверка конфига Nginx ==="
sudo nginx -t

echo ""
echo "=== 5. Перезапуск Nginx ==="
sudo systemctl restart nginx
echo "✅ Nginx перезапущен"

echo ""
echo "=== 6. Проверка: активные конфиги ==="
ls -la /etc/nginx/sites-enabled/ | grep theame

echo ""
echo "=== 7. Проверка: location блоки в конфиге ==="
echo "Проверка /_next/static/:"
grep -A2 "location /_next/static/" /etc/nginx/sites-available/theame | head -3 || echo "❌ Не найден"
echo ""
echo "Проверка /next/static/:"
grep -A2 "location /next/static/" /etc/nginx/sites-available/theame | head -3 || echo "❌ Не найден"

echo ""
echo "=== 8. Перезапуск PM2 (чтобы применить изменения) ==="
pm2 reload all --update-env
echo "✅ PM2 перезапущен"

echo ""
echo "============================================================================="
echo "✅ ГОТОВО!"
echo "============================================================================="
echo "Проверьте сайт:"
echo "  1. Откройте https://theame.ru в режиме инкогнито"
echo "  2. Или очистите кэш браузера (Ctrl+Shift+R)"
echo ""
echo "Если ошибки остаются, проверьте:"
echo "  curl -I https://theame.ru/_next/static/chunks/$(ls /var/www/theame/.next/static/chunks/*.js | head -1 | xargs basename)"
echo "============================================================================="
