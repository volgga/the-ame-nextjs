#!/bin/bash
# Запуск на СЕРВЕРЕ: bash scripts/nginx-check-and-fix.sh
# Диагностика и напоминание, как применить конфиг Nginx для статики.

set -e
echo "=== 1. Какие конфиги включены ==="
ls -la /etc/nginx/sites-enabled/

echo ""
echo "=== 2. Есть ли в theame location /next/static/ ? ==="
grep -n "location /next/static/" /etc/nginx/sites-available/theame || echo "НЕТ — нужно применить конфиг из scripts/nginx-theame-fixed.conf"

echo ""
echo "=== 3. Есть ли server { listen 443 в theame? ==="
grep -n "listen 443" /etc/nginx/sites-available/theame || echo "НЕТ — блок HTTPS отсутствует в theame"

echo ""
echo "=== 4. Папка статики на месте? ==="
ls -la /var/www/theame/.next/static/ 2>/dev/null | head -5 || echo "Папка .next/static отсутствует — нужен npm run build"

echo ""
echo "=== 5. Тест: отдаёт ли Nginx /next/static/ по HTTPS? (с сервера) ==="
# Берём любой существующий файл из статики
FIRST_CHUNK=$(ls /var/www/theame/.next/static/chunks/*.js 2>/dev/null | head -1)
if [ -n "$FIRST_CHUNK" ]; then
  BASENAME=$(basename "$FIRST_CHUNK")
  echo "Запрос: https://theame.ru/next/static/chunks/$BASENAME"
  curl -sI "https://theame.ru/next/static/chunks/$BASENAME" | head -3
else
  echo "Чанков нет — сначала выполните npm run build в /var/www/theame"
fi

echo ""
echo "=== Если в п.2 или п.3 «НЕТ» — примените конфиг: ==="
echo "  cd /var/www/theame && git pull"
echo "  sudo tee /etc/nginx/sites-available/theame < scripts/nginx-theame-fixed.conf"
echo "  sudo nginx -t && sudo systemctl restart nginx"
