#!/bin/bash
# Полная очистка и перезапуск сервера
# Использование: sudo bash scripts/full-server-restart.sh

set -euo pipefail

echo "🚀 ПОЛНАЯ ОЧИСТКА И ПЕРЕЗАПУСК СЕРВЕРА"
echo "======================================"
echo ""

# Автоопределение пути к проекту
if [ -z "${DEPLOY_PATH:-}" ]; then
  CURRENT_DIR="$(pwd)"
  if [ -f "$CURRENT_DIR/package.json" ] && [ -d "$CURRENT_DIR/.git" ]; then
    DEPLOY_PATH="$CURRENT_DIR"
  else
    POSSIBLE_PATHS=(
      "/var/www/theame-nextjs"
      "/var/www/theame"
      "/var/www/theame-next"
    )
    DEPLOY_PATH=""
    for path in "${POSSIBLE_PATHS[@]}"; do
      if [ -d "$path" ] && [ -f "$path/package.json" ] && [ -d "$path/.git" ]; then
        DEPLOY_PATH="$path"
        break
      fi
    done
    if [ -z "$DEPLOY_PATH" ]; then
      DEPLOY_PATH="/var/www/theame"
    fi
  fi
fi

echo "📁 Путь к проекту: $DEPLOY_PATH"
cd "$DEPLOY_PATH" || {
  echo "❌ Не удалось перейти в $DEPLOY_PATH"
  exit 1
}

echo ""
echo "1️⃣  ОСТАНОВКА ВСЕХ ПРОЦЕССОВ"
echo "----------------------------"

# Останавливаем PM2 процессы
if command -v pm2 >/dev/null 2>&1; then
  echo "🛑 Останавливаем PM2 процессы..."
  pm2 stop all 2>/dev/null || true
  pm2 delete all 2>/dev/null || true
  echo "✅ PM2 процессы остановлены"
else
  echo "⚠️  PM2 не установлен"
fi

echo ""
echo "2️⃣  ОЧИСТКА КЕШЕЙ И ВРЕМЕННЫХ ФАЙЛОВ"
echo "------------------------------------"

# Очистка npm кеша
echo "🧹 Очистка npm кеша..."
npm cache clean --force 2>/dev/null || true

# Очистка Next.js кеша
echo "🧹 Очистка Next.js кеша..."
rm -rf .next 2>/dev/null || true
rm -rf .next/cache 2>/dev/null || true

# Очистка node_modules
echo "🧹 Удаление node_modules..."
rm -rf node_modules 2>/dev/null || true

# Очистка логов
echo "🧹 Очистка логов..."
rm -rf logs/*.log 2>/dev/null || true
pm2 flush 2>/dev/null || true

# Очистка системных кешей
echo "🧹 Очистка системных кешей..."
apt-get clean >/dev/null 2>&1 || true
apt-get autoclean >/dev/null 2>&1 || true

# Очистка временных файлов
echo "🧹 Очистка временных файлов..."
rm -rf /tmp/* 2>/dev/null || true
find /tmp -type f -atime +7 -delete 2>/dev/null || true

echo "✅ Очистка завершена"

echo ""
echo "3️⃣  ОБНОВЛЕНИЕ КОДА ИЗ РЕПОЗИТОРИЯ"
echo "----------------------------------"

# Обновляем код
echo "📥 Обновление кода из git..."
git fetch origin main 2>/dev/null || true
git reset --hard origin/main 2>/dev/null || true
git pull origin main || {
  echo "⚠️  git pull не удался, продолжаем..."
}

echo "✅ Код обновлен"

echo ""
echo "4️⃣  УСТАНОВКА ЗАВИСИМОСТЕЙ"
echo "---------------------------"

# Проверяем package-lock.json
if [ ! -f "package-lock.json" ]; then
  echo "⚠️  package-lock.json не найден, генерируем..."
  npm install --package-lock-only 2>/dev/null || npm install --production=false
fi

# Устанавливаем зависимости
echo "📦 Установка зависимостей..."
npm ci || {
  echo "⚠️  npm ci не удался, используем npm install..."
  npm cache clean --force 2>/dev/null || true
  npm install --production=false
}

echo "✅ Зависимости установлены"

echo ""
echo "5️⃣  СБОРКА ПРОЕКТА"
echo "------------------"

# Определяем лимит памяти на основе общей памяти сервера
TOTAL_MEM=$(free -m | awk '/^Mem:/{print $2}' || echo "1024")
AVAILABLE_MEM=$(free -m | awk '/^Mem:/{print $7}' || echo "1024")

# Для сборки используем общую память сервера, так как есть swap
if [ "$TOTAL_MEM" -lt 1024 ]; then
  # Сервер с 1GB RAM - используем 1GB для сборки (с поддержкой swap)
  NODE_MEM_LIMIT=1024
elif [ "$TOTAL_MEM" -lt 2048 ]; then
  # Сервер с 1-2GB RAM - используем до 1.5GB для сборки
  NODE_MEM_LIMIT=1536
elif [ "$TOTAL_MEM" -lt 4096 ]; then
  # Сервер с 2-4GB RAM - используем до 2GB для сборки
  NODE_MEM_LIMIT=2048
else
  # Сервер с 4GB+ RAM - используем до 3GB для сборки
  NODE_MEM_LIMIT=3072
fi

export NODE_OPTIONS="--max-old-space-size=${NODE_MEM_LIMIT}"
echo "💾 Общая память: ${TOTAL_MEM}MB, Доступная: ${AVAILABLE_MEM}MB"
echo "📊 Лимит Node.js для сборки: ${NODE_MEM_LIMIT}MB (с поддержкой swap)"

# Собираем проект
echo "🔨 Сборка проекта..."
npm run build || {
  echo "❌ Сборка не удалась!"
  exit 1
}

echo "✅ Проект собран"

echo ""
echo "6️⃣  НАСТРОЙКА NGINX"
echo "-------------------"

NGINX_CONFIG="/etc/nginx/sites-available/theame"
if [ ! -f "$NGINX_CONFIG" ]; then
  echo "📝 Создание конфигурации Nginx..."
  cat > "$NGINX_CONFIG" << 'EOF'
server {
    listen 80;
    server_name theame.ru www.theame.ru;

    access_log /var/log/nginx/theame-access.log;
    error_log /var/log/nginx/theame-error.log;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF
fi

# Активируем конфигурацию
rm -f /etc/nginx/sites-enabled/default
if [ ! -L "/etc/nginx/sites-enabled/theame" ]; then
  ln -sf "$NGINX_CONFIG" /etc/nginx/sites-enabled/theame
fi

# Проверяем и перезагружаем Nginx
if nginx -t 2>/dev/null; then
  systemctl reload nginx 2>/dev/null || systemctl restart nginx 2>/dev/null || true
  echo "✅ Nginx настроен и перезагружен"
else
  echo "❌ Ошибка в конфигурации Nginx!"
  nginx -t
fi

echo ""
echo "7️⃣  ЗАПУСК PM2"
echo "-------------"

# Запускаем PM2
if [ -f "ecosystem.config.cjs" ]; then
  echo "🚀 Запуск PM2 процесса..."
  pm2 start ecosystem.config.cjs
  pm2 save
  pm2 startup systemd -u root --hp /root 2>/dev/null || true
  echo "✅ PM2 процесс запущен"
else
  echo "❌ ecosystem.config.cjs не найден!"
  exit 1
fi

echo ""
echo "8️⃣  ПРОВЕРКА СТАТУСА"
echo "-------------------"

sleep 5

# Проверяем статус PM2
echo "📊 Статус PM2:"
pm2 list

# Проверяем доступность приложения
echo ""
echo "🌐 Проверка доступности приложения..."
for i in 1 2 3; do
  sleep 2
  if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 > /dev/null 2>&1; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "304" ]; then
      echo "✅ Приложение доступно на localhost:3000 (HTTP $HTTP_CODE)"
      break
    fi
  fi
done

echo ""
echo "📊 Использование ресурсов:"
echo "💾 Память:"
free -h | grep -E "Mem|Swap"
echo ""
echo "💿 Диск:"
df -h / | tail -1

echo ""
echo "✅ ПЕРЕЗАПУСК ЗАВЕРШЕН!"
echo ""
echo "💡 Полезные команды:"
echo "   - Логи PM2: pm2 logs theame-next"
echo "   - Мониторинг: pm2 monit"
echo "   - Статус: pm2 list"
echo "   - Проверка сайта: curl -I http://theame.ru"
