#!/bin/bash
# Скрипт для проверки статуса сервера и приложения
# Использование: bash scripts/check-server-status.sh

set -euo pipefail

echo "🔍 Проверка статуса сервера и приложения..."
echo ""

# Проверяем PM2 процессы
echo "📊 PM2 процессы:"
if command -v pm2 >/dev/null 2>&1; then
  pm2 list
  echo ""
  
  # Проверяем конкретный процесс
  PM2_APP_NAME="${PM2_APP_NAME:-theame-next}"
  if pm2 describe "$PM2_APP_NAME" >/dev/null 2>&1; then
    echo "✅ PM2 процесс '$PM2_APP_NAME' найден"
    echo ""
    echo "📋 Детальная информация о процессе:"
    pm2 describe "$PM2_APP_NAME" | head -20
    echo ""
    
    # Проверяем статус
    STATUS=$(pm2 jlist | grep -o "\"name\":\"$PM2_APP_NAME\".*\"pm_id\":[0-9]*" | grep -o "\"status\":\"[^\"]*\"" | cut -d'"' -f4 || echo "unknown")
    echo "📊 Статус процесса: $STATUS"
    
    if [ "$STATUS" != "online" ]; then
      echo "⚠️  ВНИМАНИЕ: Процесс не в статусе 'online'!"
      echo ""
      echo "📋 Последние логи ошибок:"
      pm2 logs "$PM2_APP_NAME" --err --lines 20 --nostream || true
    fi
  else
    echo "❌ PM2 процесс '$PM2_APP_NAME' НЕ НАЙДЕН!"
    echo ""
    echo "💡 Попробуйте запустить:"
    echo "   cd /var/www/theame && pm2 start ecosystem.config.cjs"
  fi
else
  echo "❌ PM2 не установлен!"
fi

echo ""
echo "🌐 Проверка доступности приложения:"

# Проверяем порт 3000
if command -v netstat >/dev/null 2>&1; then
  echo "📊 Порты, слушающие на localhost:"
  netstat -tlnp 2>/dev/null | grep ":3000" || echo "⚠️  Порт 3000 не слушается"
elif command -v ss >/dev/null 2>&1; then
  echo "📊 Порты, слушающие на localhost:"
  ss -tlnp 2>/dev/null | grep ":3000" || echo "⚠️  Порт 3000 не слушается"
else
  echo "⚠️  netstat/ss не найдены, проверка портов пропущена"
fi

echo ""
echo "🔌 Проверка локального подключения к приложению:"
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 > /dev/null 2>&1; then
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
  echo "✅ Приложение отвечает на localhost:3000 (HTTP $HTTP_CODE)"
else
  echo "❌ Приложение НЕ отвечает на localhost:3000"
  echo ""
  echo "💡 Проверьте логи PM2:"
  echo "   pm2 logs theame-next --lines 50"
fi

echo ""
echo "🌍 Проверка Nginx (если установлен):"
if command -v nginx >/dev/null 2>&1; then
  if systemctl is-active --quiet nginx 2>/dev/null || service nginx status >/dev/null 2>&1; then
    echo "✅ Nginx запущен"
    echo ""
    echo "📋 Конфигурация Nginx для theame.ru:"
    if [ -f /etc/nginx/sites-enabled/theame.ru ] || [ -f /etc/nginx/sites-enabled/theame ]; then
      echo "✅ Конфиг найден"
      grep -E "server_name|proxy_pass" /etc/nginx/sites-enabled/theame* 2>/dev/null || true
    else
      echo "⚠️  Конфиг не найден в /etc/nginx/sites-enabled/"
    fi
  else
    echo "⚠️  Nginx не запущен"
    echo "💡 Запустите: sudo systemctl start nginx"
  fi
else
  echo "ℹ️  Nginx не установлен (возможно используется другой веб-сервер)"
fi

echo ""
echo "📋 Последние логи PM2 (ошибки):"
pm2 logs "$PM2_APP_NAME" --err --lines 10 --nostream 2>/dev/null || echo "Не удалось получить логи"

echo ""
echo "📋 Последние логи PM2 (все):"
pm2 logs "$PM2_APP_NAME" --lines 10 --nostream 2>/dev/null || echo "Не удалось получить логи"
