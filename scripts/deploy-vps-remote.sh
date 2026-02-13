#!/bin/bash
# Выполнить на сервере в корне проекта: bash scripts/deploy-vps-remote.sh
# Или с локальной машины: ssh root@ТВОЙ_IP 'bash -s' < scripts/deploy-vps-remote.sh
set -e
echo "=== Поиск проекта ==="
CD=""
for d in /var/www/nextjs-project /var/www/the-ame-nextjs /root/nextjs-project /root/the-ame-nextjs; do
  if [ -f "$d/package.json" ] && [ -f "$d/next.config.ts" ]; then
    CD="$d"
    break
  fi
done
if [ -z "$CD" ]; then
  CD=$(find /var/www /root -maxdepth 4 -name "next.config.ts" 2>/dev/null | head -1 | xargs dirname)
fi
if [ -z "$CD" ]; then
  echo "Ошибка: проект (next.config.ts) не найден в /var/www или /root"
  exit 1
fi
echo "Проект: $CD"
cd "$CD"

echo "=== git pull ==="
git pull origin main || true

echo "=== PM2 глобально ==="
npm install -g pm2 2>/dev/null || true

echo "=== Папка logs ==="
mkdir -p logs

echo "=== Остановка старого процесса ==="
pkill -f "next start" 2>/dev/null || true
sleep 2

echo "=== Сборка ==="
npm run build

echo "=== PM2: перезапуск ==="
pm2 delete all 2>/dev/null || true
# Запуск по полному пути, чтобы PM2 точно нашёл конфиг (из любой текущей папки)
pm2 start "$(pwd)/ecosystem.config.cjs"

echo "=== PM2 save ==="
pm2 save

echo "=== PM2 startup ==="
pm2 startup

echo ""
echo "=== Готово. Статус ==="
pm2 status
curl -s -o /dev/null -w "Проверка localhost:3000: HTTP %{http_code}\n" http://localhost:3000 || true
echo ""
echo "Важно: если pm2 startup выше вывел команду с 'sudo env PATH=...' — выполни её на сервере от root (чтобы при перезагрузке VPS сайт поднимался сам)."
