#!/bin/bash
# Скрипт для настройки ENV переменных на сервере
# Использование: ./scripts/setup-server-env.sh

set -e

echo "🔧 Настройка ENV переменных на сервере..."
echo ""

# Проверяем что мы на сервере
if [ ! -d "/var/www/theame" ]; then
    echo "❌ Ошибка: Директория /var/www/theame не найдена"
    echo "   Убедитесь что вы запускаете скрипт на сервере"
    exit 1
fi

cd /var/www/theame

# Значения из .env.local (замените на ваши реальные)
# ВАЖНО: Замените значения ниже на реальные из вашего .env.local

# ENV переменные (значения берутся из .env.local или задаются вручную)
# ВАЖНО: Замените значения ниже на реальные из вашего .env.local
    "TINKOFF_TERMINAL_KEY=1754488339859"
    "TINKOFF_PASSWORD=Njtk41vKKN3yi58i"
    "TINKOFF_NOTIFICATION_URL=https://theame.ru/api/tinkoff-callback"
    "TELEGRAM_BOT_TOKEN=8210290619:AAEXbzbTbkcR5pH-gsondkTRa165ie9ZBYs"
    "TELEGRAM_CHAT_ID=-1002343550030"
    "TELEGRAM_THREAD_ID=3766"
    "TELEGRAM_ORDERS_CHAT_ID=-1002343550030"
    "TELEGRAM_ORDERS_THREAD_ID=1947"
    "ADMIN_USERNAME=admin"
    "ADMIN_PASSWORD_HASH=\$2b\$10\$s/tjvnZr1vq0KCcvBN5G1eVVd/eGFYGnRNWVLnE2GT1hc4sTx1a0e"
    "ADMIN_SESSION_SECRET=7sdf98sdf7sdf9"
)

echo "📝 Создание файла .env.production..."

# Создаем .env.production
# ВАЖНО: Замените значения ниже на реальные из вашего .env.local
cat > .env.production << 'EOF'
# Base URL
SITE_URL=https://theame.ru
NEXT_PUBLIC_SITE_URL=https://theame.ru

# Supabase (замените на ваши реальные значения)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Tinkoff (T-Bank) (замените на ваши реальные значения)
TINKOFF_TERMINAL_KEY=your_tinkoff_terminal_key_here
TINKOFF_PASSWORD=your_tinkoff_password_here
TINKOFF_NOTIFICATION_URL=https://theame.ru/api/tinkoff-callback

# Telegram Bot API (замените на ваши реальные значения)
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_CHAT_ID=your_telegram_chat_id_here
TELEGRAM_THREAD_ID=your_telegram_thread_id_here
TELEGRAM_ORDERS_CHAT_ID=your_telegram_orders_chat_id_here
TELEGRAM_ORDERS_THREAD_ID=your_telegram_orders_thread_id_here

# Admin (замените на ваши реальные значения)
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=your_admin_password_hash_here
ADMIN_SESSION_SECRET=your_admin_session_secret_here
EOF

echo "✅ Файл .env.production создан"

# Загружаем переменные в текущую сессию
echo "📥 Загрузка переменных окружения..."
export $(cat .env.production | grep -v '^#' | xargs)

# Проверяем что PM2 установлен
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 не установлен. Установите: npm install -g pm2"
    exit 1
fi

# Обновляем код из репозитория
echo "🔄 Обновление кода из репозитория..."
git pull origin main || echo "⚠️  Не удалось обновить код, продолжаем..."

# Перезапускаем PM2
echo "🔄 Перезапуск PM2 процесса..."
pm2 restart nextjs-project || {
    echo "❌ Ошибка при перезапуске PM2"
    echo "💡 Попробуйте запустить вручную: pm2 restart ecosystem.config.js"
    exit 1
}

pm2 save

echo ""
echo "✅ Готово! ENV переменные настроены и PM2 перезапущен"
echo ""
echo "🔍 Проверка переменных:"
pm2 env nextjs-project | grep -E "(TELEGRAM|TINKOFF|SUPABASE)" | head -10

echo ""
echo "🧪 Проверьте диагностический endpoint:"
echo "   curl https://theame.ru/api/payments/tinkoff/notify/check"
echo ""
