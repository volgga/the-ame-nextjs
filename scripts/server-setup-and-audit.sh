#!/bin/bash
# Комплексный скрипт для проверки, настройки и аудита сервера
# Использование: sudo bash scripts/server-setup-and-audit.sh

set -euo pipefail

DEPLOY_PATH="${DEPLOY_PATH:-/var/www/theame}"
PM2_APP_NAME="${PM2_APP_NAME:-theame-next}"

echo "🔍 ПОЛНЫЙ АУДИТ И НАСТРОЙКА СЕРВЕРА"
echo "===================================="
echo ""

# ============================================
# 1. ПРОВЕРКА ОСНОВНЫХ КОМПОНЕНТОВ
# ============================================
echo "1️⃣  ПРОВЕРКА ОСНОВНЫХ КОМПОНЕНТОВ"
echo "--------------------------------"

# Проверка Node.js
if command -v node >/dev/null 2>&1; then
  NODE_VERSION=$(node --version)
  echo "✅ Node.js установлен: $NODE_VERSION"
  if [[ "$NODE_VERSION" != "v20"* ]]; then
    echo "⚠️  ВНИМАНИЕ: Рекомендуется Node.js 20.x, текущая версия: $NODE_VERSION"
  fi
else
  echo "❌ Node.js не установлен!"
  echo "   Установите: curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs"
  exit 1
fi

# Проверка npm
if command -v npm >/dev/null 2>&1; then
  NPM_VERSION=$(npm --version)
  echo "✅ npm установлен: v$NPM_VERSION"
else
  echo "❌ npm не установлен!"
  exit 1
fi

# Проверка PM2
if command -v pm2 >/dev/null 2>&1; then
  PM2_VERSION=$(pm2 --version)
  echo "✅ PM2 установлен: v$PM2_VERSION"
else
  echo "❌ PM2 не установлен!"
  echo "   Установите: npm install -g pm2"
  exit 1
fi

# Проверка Nginx
if command -v nginx >/dev/null 2>&1; then
  NGINX_VERSION=$(nginx -v 2>&1 | grep -oP 'nginx/\K[0-9.]+')
  echo "✅ Nginx установлен: $NGINX_VERSION"
  if systemctl is-active --quiet nginx 2>/dev/null; then
    echo "✅ Nginx запущен"
  else
    echo "⚠️  Nginx не запущен, запускаем..."
    systemctl start nginx
    systemctl enable nginx
  fi
else
  echo "⚠️  Nginx не установлен, устанавливаем..."
  apt-get update
  apt-get install -y nginx
  systemctl start nginx
  systemctl enable nginx
fi

echo ""

# ============================================
# 2. ПРОВЕРКА ДИРЕКТОРИИ ПРОЕКТА
# ============================================
echo "2️⃣  ПРОВЕРКА ДИРЕКТОРИИ ПРОЕКТА"
echo "-------------------------------"
echo "Ожидаемый путь: $DEPLOY_PATH"

if [ ! -d "$DEPLOY_PATH" ]; then
  echo "❌ Директория проекта не найдена!"
  echo "   Создаем директорию..."
  mkdir -p "$DEPLOY_PATH"
  echo "✅ Директория создана"
else
  echo "✅ Директория существует"
fi

cd "$DEPLOY_PATH" || {
  echo "❌ Не удалось перейти в $DEPLOY_PATH"
  exit 1
}

echo "Текущая директория: $(pwd)"
echo ""

# Проверка git репозитория
if [ -d ".git" ]; then
  echo "✅ Git репозиторий найден"
  GIT_REMOTE=$(git config --get remote.origin.url || echo "не настроен")
  echo "   Remote: $GIT_REMOTE"
else
  echo "⚠️  Git репозиторий не найден"
  echo "   Инициализируйте: git clone <repo-url> $DEPLOY_PATH"
fi

echo ""

# ============================================
# 3. ПРОВЕРКА И УСТАНОВКА ЗАВИСИМОСТЕЙ
# ============================================
echo "3️⃣  ПРОВЕРКА ЗАВИСИМОСТЕЙ"
echo "-------------------------"

if [ ! -f "package.json" ]; then
  echo "❌ package.json не найден!"
  echo "   Обновите код: git pull origin main"
  exit 1
fi

echo "✅ package.json найден"

# Проверка node_modules
if [ ! -d "node_modules" ] || [ ! -f "node_modules/.package-lock.json" ]; then
  echo "⚠️  node_modules отсутствует или поврежден, устанавливаем..."
  rm -rf node_modules package-lock.json 2>/dev/null || true
  npm ci
  echo "✅ Зависимости установлены"
else
  echo "✅ node_modules существует"
fi

echo ""

# ============================================
# 4. ПРОВЕРКА И НАСТРОЙКА NGINX
# ============================================
echo "4️⃣  НАСТРОЙКА NGINX"
echo "------------------"

NGINX_CONFIG="/etc/nginx/sites-available/theame.ru"

if [ ! -f "$NGINX_CONFIG" ]; then
  echo "⚠️  Конфигурация Nginx не найдена, создаем..."
  
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
  
  echo "✅ Конфигурация создана"
else
  echo "✅ Конфигурация Nginx существует"
fi

# Активируем конфигурацию
if [ ! -L "/etc/nginx/sites-enabled/theame.ru" ]; then
  ln -sf "$NGINX_CONFIG" /etc/nginx/sites-enabled/
  echo "✅ Конфигурация активирована"
fi

# Проверяем и перезагружаем Nginx
if nginx -t 2>/dev/null; then
  systemctl reload nginx 2>/dev/null || true
  echo "✅ Nginx настроен и перезагружен"
else
  echo "❌ Ошибка в конфигурации Nginx!"
  nginx -t
  exit 1
fi

echo ""

# ============================================
# 5. ПРОВЕРКА И СБОРКА ПРОЕКТА
# ============================================
echo "5️⃣  ПРОВЕРКА СБОРКИ"
echo "------------------"

# Проверяем наличие BUILD_ID - это признак валидной сборки
if [ ! -d ".next" ] || [ ! -f ".next/BUILD_ID" ]; then
  echo "⚠️  Проект не собран или сборка повреждена, собираем..."
  rm -rf .next
  npm run build
  echo "✅ Проект собран"
else
  echo "✅ Директория .next существует"
  # Проверяем валидность сборки - пытаемся прочитать BUILD_ID
  if [ -f ".next/BUILD_ID" ]; then
    BUILD_ID=$(cat .next/BUILD_ID 2>/dev/null || echo "")
    if [ -z "$BUILD_ID" ]; then
      echo "⚠️  BUILD_ID пустой, пересобираем..."
      rm -rf .next
      npm run build
      echo "✅ Проект пересобран"
    else
      echo "✅ Сборка валидна (BUILD_ID: $BUILD_ID)"
      # Проверяем свежесть сборки (не старше 1 дня)
      BUILD_AGE=$(find .next -name "BUILD_ID" -mtime +1 2>/dev/null | wc -l)
      if [ "$BUILD_AGE" -gt 0 ]; then
        echo "⚠️  Сборка устарела (старше 1 дня), пересобираем..."
        rm -rf .next
        npm run build
        echo "✅ Проект пересобран"
      fi
    fi
  else
    echo "⚠️  BUILD_ID не найден, пересобираем..."
    rm -rf .next
    npm run build
    echo "✅ Проект пересобран"
  fi
fi

echo ""

# ============================================
# 6. ПРОВЕРКА И ЗАПУСК PM2
# ============================================
echo "6️⃣  ПРОВЕРКА PM2"
echo "---------------"

if pm2 describe "$PM2_APP_NAME" >/dev/null 2>&1; then
  STATUS=$(pm2 jlist 2>/dev/null | grep -o "\"name\":\"$PM2_APP_NAME\".*\"pm_id\":[0-9]*" | grep -o "\"status\":\"[^\"]*\"" | cut -d'"' -f4 || echo "unknown")
  echo "✅ Процесс '$PM2_APP_NAME' найден (статус: $STATUS)"
  
  if [ "$STATUS" != "online" ]; then
    echo "⚠️  Процесс не в статусе 'online', перезапускаем..."
    pm2 restart "$PM2_APP_NAME"
  fi
else
  echo "⚠️  Процесс '$PM2_APP_NAME' не найден, запускаем..."
  
  if [ ! -f "ecosystem.config.cjs" ]; then
    echo "❌ ecosystem.config.cjs не найден!"
    exit 1
  fi
  
  pm2 start ecosystem.config.cjs
  pm2 save
  echo "✅ PM2 процесс запущен"
fi

# Проверяем статус
sleep 3
pm2 list | grep "$PM2_APP_NAME" || echo "⚠️  Процесс не найден в списке"

echo ""

# ============================================
# 7. ПРОВЕРКА ДОСТУПНОСТИ
# ============================================
echo "7️⃣  ПРОВЕРКА ДОСТУПНОСТИ"
echo "----------------------"

# Проверка localhost:3000 (с несколькими попытками)
LOCALHOST_OK=false
for i in 1 2 3; do
  sleep 2
  if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 > /dev/null 2>&1; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "304" ]; then
      echo "✅ Приложение отвечает на localhost:3000 (HTTP $HTTP_CODE)"
      LOCALHOST_OK=true
      break
    fi
  fi
done

if [ "$LOCALHOST_OK" = false ]; then
  echo "❌ Приложение НЕ отвечает на localhost:3000"
  echo "📋 Логи PM2 (последние 30 строк):"
  pm2 logs "$PM2_APP_NAME" --lines 30 --nostream || true
  echo ""
  echo "💡 Попробуйте пересобрать проект:"
  echo "   pm2 stop $PM2_APP_NAME"
  echo "   rm -rf .next"
  echo "   npm run build"
  echo "   pm2 start ecosystem.config.cjs"
fi

# Проверка через Nginx
if curl -s -o /dev/null -w "%{http_code}" http://localhost > /dev/null 2>&1; then
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost)
  echo "✅ Nginx проксирует запросы (HTTP $HTTP_CODE)"
else
  echo "⚠️  Nginx не отвечает на localhost"
fi

echo ""

# ============================================
# 8. ОЧИСТКА ДИСКА И ПАМЯТИ
# ============================================
echo "8️⃣  ОЧИСТКА ДИСКА И ПАМЯТИ"
echo "------------------------"

# Очистка apt кеша
echo "Очистка apt кеша..."
apt-get clean >/dev/null 2>&1 || true
apt-get autoclean >/dev/null 2>&1 || true

# Очистка npm кеша
echo "Очистка npm кеша..."
npm cache clean --force >/dev/null 2>&1 || true

# Очистка старых логов
echo "Очистка старых логов..."
find /var/log -name "*.log" -type f -mtime +7 -delete 2>/dev/null || true
find /var/log -name "*.gz" -type f -mtime +30 -delete 2>/dev/null || true
journalctl --vacuum-time=7d >/dev/null 2>&1 || true

# Очистка временных файлов
echo "Очистка временных файлов..."
rm -rf /tmp/* 2>/dev/null || true
find /tmp -type f -atime +7 -delete 2>/dev/null || true

# Очистка логов PM2 (оставляем последние 500 строк)
if [ -f "logs/out.log" ]; then
  tail -500 logs/out.log > /tmp/pm2-out.log 2>/dev/null && \
  mv /tmp/pm2-out.log logs/out.log 2>/dev/null || true
fi
if [ -f "logs/err.log" ]; then
  tail -500 logs/err.log > /tmp/pm2-err.log 2>/dev/null && \
  mv /tmp/pm2-err.log logs/err.log 2>/dev/null || true
fi

echo "✅ Очистка завершена"
echo ""

# ============================================
# 9. ФИНАЛЬНЫЙ СТАТУС
# ============================================
echo "9️⃣  ФИНАЛЬНЫЙ СТАТУС"
echo "-------------------"

echo "📊 Использование диска:"
df -h / | tail -1

echo ""
echo "📊 Использование памяти:"
free -h | grep -E "Mem|Swap"

echo ""
echo "📊 PM2 процессы:"
pm2 list

echo ""
echo "📊 Статус сервисов:"
systemctl is-active nginx >/dev/null 2>&1 && echo "✅ Nginx: активен" || echo "❌ Nginx: неактивен"
pm2 describe "$PM2_APP_NAME" >/dev/null 2>&1 && echo "✅ PM2 процесс '$PM2_APP_NAME': запущен" || echo "❌ PM2 процесс '$PM2_APP_NAME': не запущен"

echo ""
echo "✅ АУДИТ ЗАВЕРШЕН!"
echo ""
echo "💡 Рекомендации:"
echo "   - Проверьте сайт: curl -I http://theame.ru"
echo "   - Мониторинг PM2: pm2 monit"
echo "   - Логи PM2: pm2 logs $PM2_APP_NAME"
