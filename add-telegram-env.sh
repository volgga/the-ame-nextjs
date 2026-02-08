#!/bin/bash
# Скрипт для добавления Telegram переменных в .env.local на сервере
# Использование: ssh root@94.103.84.28 'bash -s' < add-telegram-env.sh

set -e

echo "📝 Добавление Telegram переменных в .env.local..."

cd /var/www/app

# Проверяем, существует ли файл
if [ ! -f .env.local ]; then
    echo "⚠️  Файл .env.local не найден. Создаю новый..."
    touch .env.local
fi

# Добавляем или обновляем Telegram переменные
if grep -q "TELEGRAM_BOT_TOKEN" .env.local; then
    echo "🔄 Обновляю существующие Telegram переменные..."
    sed -i '/^TELEGRAM_BOT_TOKEN=/d' .env.local
    sed -i '/^TELEGRAM_CHAT_ID=/d' .env.local
    sed -i '/^TELEGRAM_THREAD_ID=/d' .env.local
fi

# Добавляем переменные в конец файла
cat >> .env.local << 'ENVEOF'

# Telegram Bot API для отправки уведомлений о формах
TELEGRAM_BOT_TOKEN=8210290619:AAEXbzbTbkcR5pH-gsondkTRa165ie9ZBYs
TELEGRAM_CHAT_ID=-1002343550030
TELEGRAM_THREAD_ID=624995887
ENVEOF

echo "✅ Telegram переменные добавлены в .env.local"

# Перезапускаем приложение через PM2
echo "🔄 Перезапуск приложения..."
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
pm2 restart nextapp || pm2 start npm --name nextapp -- start

echo "✅ Готово! Приложение перезапущено с новыми переменными."
