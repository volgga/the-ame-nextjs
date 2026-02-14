#!/bin/bash
# На сервере: bash scripts/deploy-vps-remote.sh  |  С локальной: ssh root@IP 'bash -s' < scripts/deploy-vps-remote.sh
set -e
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

git pull origin main || true
npm install -g pm2 2>/dev/null || true
mkdir -p logs
pkill -f "next start" 2>/dev/null || true
sleep 2
npm run build
pm2 delete all 2>/dev/null || true
pm2 start "$(pwd)/ecosystem.config.cjs"
pm2 save
pm2 startup
pm2 status
curl -s -o /dev/null -w "localhost:3000 HTTP %{http_code}\n" http://localhost:3000 || true
