#!/bin/bash
# Финальный скрипт для исправления всех проблем - выполнить на сервере

set -e

cd /var/www/theame || exit 1

echo "🔧 Исправление всех проблем..."

# Остановите PM2
pm2 stop nextjs-project 2>/dev/null || true
pm2 delete nextjs-project 2>/dev/null || true

# Загрузите переменные
export $(cat .env.production | grep -v '^#' | xargs)

# Удалите старую сборку
rm -rf .next

# Пересоберите проект
npm run build

# Запустите PM2
pm2 start ecosystem.config.js
pm2 save

# Проверка
sleep 3
curl -s https://theame.ru/api/payments/tinkoff/notify/check | grep -q "envAllSet.*true" && echo "✅ Все работает!" || echo "⚠️ Проверьте вручную"
