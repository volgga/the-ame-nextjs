#!/bin/bash
# Скрипт для проверки настроек Telegram на сервере
# Использование: bash scripts/check-telegram-env.sh

set -euo pipefail

ENV_FILE=".env.production"

echo "🔍 Проверка настроек Telegram..."
echo ""

# Проверяем наличие файла
if [ ! -f "$ENV_FILE" ]; then
  echo "❌ Файл $ENV_FILE не найден!"
  exit 1
fi

echo "📄 Проверка переменных в $ENV_FILE:"
echo ""

# Проверяем токен
if grep -q "^TELEGRAM_BOT_TOKEN=" "$ENV_FILE"; then
  TOKEN=$(grep "^TELEGRAM_BOT_TOKEN=" "$ENV_FILE" | cut -d'=' -f2- | tr -d '"' | tr -d "'")
  if [ -n "$TOKEN" ]; then
    TOKEN_PREVIEW="${TOKEN:0:20}..."
    echo "✅ TELEGRAM_BOT_TOKEN найден: $TOKEN_PREVIEW"
  else
    echo "❌ TELEGRAM_BOT_TOKEN пустой"
  fi
else
  echo "❌ TELEGRAM_BOT_TOKEN не найден"
fi

# Проверяем chat ID
if grep -q "^TELEGRAM_ORDERS_CHAT_ID=" "$ENV_FILE"; then
  CHAT_ID=$(grep "^TELEGRAM_ORDERS_CHAT_ID=" "$ENV_FILE" | cut -d'=' -f2- | tr -d '"' | tr -d "'")
  if [ -n "$CHAT_ID" ]; then
    echo "✅ TELEGRAM_ORDERS_CHAT_ID найден: $CHAT_ID"
  else
    echo "⚠️  TELEGRAM_ORDERS_CHAT_ID пустой"
  fi
else
  echo "⚠️  TELEGRAM_ORDERS_CHAT_ID не найден (будет использован TELEGRAM_CHAT_ID)"
fi

# Проверяем fallback chat ID
if grep -q "^TELEGRAM_CHAT_ID=" "$ENV_FILE"; then
  CHAT_ID=$(grep "^TELEGRAM_CHAT_ID=" "$ENV_FILE" | cut -d'=' -f2- | tr -d '"' | tr -d "'")
  if [ -n "$CHAT_ID" ]; then
    echo "✅ TELEGRAM_CHAT_ID найден: $CHAT_ID"
  else
    echo "⚠️  TELEGRAM_CHAT_ID пустой"
  fi
else
  echo "⚠️  TELEGRAM_CHAT_ID не найден"
fi

# Проверяем thread ID
if grep -q "^TELEGRAM_ORDERS_THREAD_ID=" "$ENV_FILE"; then
  THREAD_ID=$(grep "^TELEGRAM_ORDERS_THREAD_ID=" "$ENV_FILE" | cut -d'=' -f2- | tr -d '"' | tr -d "'")
  if [ -n "$THREAD_ID" ]; then
    echo "✅ TELEGRAM_ORDERS_THREAD_ID найден: $THREAD_ID"
  else
    echo "ℹ️  TELEGRAM_ORDERS_THREAD_ID не задан (сообщения будут в основной чат)"
  fi
else
  echo "ℹ️  TELEGRAM_ORDERS_THREAD_ID не найден (сообщения будут в основной чат)"
fi

echo ""
echo "🔄 Проверка PM2 процесса..."

if command -v pm2 >/dev/null 2>&1; then
  PM2_APP_NAME="${PM2_APP_NAME:-theame-next}"
  if pm2 describe "$PM2_APP_NAME" >/dev/null 2>&1; then
    echo "✅ PM2 процесс '$PM2_APP_NAME' запущен"
    
    # Показываем переменные окружения процесса
    echo ""
    echo "📋 Переменные окружения в PM2 процессе:"
    pm2 env "$PM2_APP_NAME" | grep -E "TELEGRAM|TINKOFF" || echo "⚠️  Не удалось получить переменные окружения"
  else
    echo "❌ PM2 процесс '$PM2_APP_NAME' не найден"
    echo "📋 Доступные процессы:"
    pm2 list || true
  fi
else
  echo "⚠️  PM2 не установлен"
fi

echo ""
echo "💡 Для проверки работы уведомлений:"
echo "   - Откройте: https://theame.ru/api/payments/tinkoff/notify/check"
echo "   - Или проверьте логи: pm2 logs theame-next --lines 50"
