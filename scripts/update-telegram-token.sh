#!/bin/bash
# Скрипт для обновления Telegram bot token на сервере
# Использование: bash scripts/update-telegram-token.sh

set -euo pipefail

NEW_TOKEN="8210290619:AAHj_Mn4Eis4R1c4auOjoAORjpT4t6oXjeg"
ENV_FILE=".env.production"

if [ ! -f "$ENV_FILE" ]; then
  echo "❌ Файл $ENV_FILE не найден!"
  echo "💡 Создайте файл $ENV_FILE в корне проекта на сервере"
  exit 1
fi

echo "🔄 Обновление TELEGRAM_BOT_TOKEN в $ENV_FILE..."

# Проверяем, есть ли уже TELEGRAM_BOT_TOKEN в файле
if grep -q "^TELEGRAM_BOT_TOKEN=" "$ENV_FILE"; then
  # Обновляем существующую строку
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s|^TELEGRAM_BOT_TOKEN=.*|TELEGRAM_BOT_TOKEN=$NEW_TOKEN|" "$ENV_FILE"
  else
    # Linux
    sed -i "s|^TELEGRAM_BOT_TOKEN=.*|TELEGRAM_BOT_TOKEN=$NEW_TOKEN|" "$ENV_FILE"
  fi
  echo "✅ Токен обновлен в $ENV_FILE"
else
  # Добавляем новую строку в секцию Telegram (если есть) или в конец файла
  if grep -q "^# Telegram" "$ENV_FILE" || grep -q "^# =========================.*Telegram" "$ENV_FILE"; then
    # Добавляем после секции Telegram
    if [[ "$OSTYPE" == "darwin"* ]]; then
      sed -i '' "/^# Telegram\|^# =========================.*Telegram/a\\
TELEGRAM_BOT_TOKEN=$NEW_TOKEN
" "$ENV_FILE"
    else
      sed -i "/^# Telegram\|^# =========================.*Telegram/a TELEGRAM_BOT_TOKEN=$NEW_TOKEN" "$ENV_FILE"
    fi
  else
    # Добавляем в конец файла
    echo "" >> "$ENV_FILE"
    echo "# Telegram Bot Token" >> "$ENV_FILE"
    echo "TELEGRAM_BOT_TOKEN=$NEW_TOKEN" >> "$ENV_FILE"
  fi
  echo "✅ Токен добавлен в $ENV_FILE"
fi

# Проверяем, что токен действительно обновлен
if grep -q "^TELEGRAM_BOT_TOKEN=$NEW_TOKEN" "$ENV_FILE"; then
  echo "✅ Проверка: токен корректно записан в файл"
else
  echo "⚠️  Предупреждение: токен может быть не обновлен корректно"
fi

echo ""
echo "🔄 Перезапуск PM2 процесса..."
if command -v pm2 >/dev/null 2>&1; then
  PM2_APP_NAME="${PM2_APP_NAME:-theame-next}"
  if pm2 describe "$PM2_APP_NAME" >/dev/null 2>&1; then
    echo "🔄 Перезапускаю PM2 процесс '$PM2_APP_NAME'..."
    pm2 restart "$PM2_APP_NAME"
    echo "✅ PM2 процесс '$PM2_APP_NAME' перезапущен"
    
    # Ждем немного и проверяем статус
    sleep 2
    pm2 status "$PM2_APP_NAME" || true
  else
    echo "⚠️  PM2 процесс '$PM2_APP_NAME' не найден"
    echo "📋 Доступные процессы PM2:"
    pm2 list || true
    echo ""
    echo "💡 Запустите вручную: pm2 restart theame-next"
  fi
else
  echo "⚠️  PM2 не найден, перезапустите приложение вручную"
fi

echo ""
echo "✅ Готово! Новый токен установлен: ${NEW_TOKEN:0:20}..."
echo ""
echo "💡 Для проверки работы уведомлений:"
echo "   1. Откройте https://theame.ru/api/payments/tinkoff/notify/check"
echo "   2. Или проверьте логи: pm2 logs theame-next"
