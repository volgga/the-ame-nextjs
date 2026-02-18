#!/bin/bash
# Полная диагностика сервера и приложения
# Использование: bash scripts/full-diagnosis.sh

set -euo pipefail

echo "🔍 ПОЛНАЯ ДИАГНОСТИКА СЕРВЕРА И ПРИЛОЖЕНИЯ"
echo "=========================================="
echo ""

# 1. Проверка места запуска
echo "📁 1. ПРОВЕРКА МЕСТА ЗАПУСКА"
echo "----------------------------"
DEPLOY_PATH="${DEPLOY_PATH:-/var/www/theame}"
echo "Ожидаемый путь: $DEPLOY_PATH"
if [ -d "$DEPLOY_PATH" ]; then
  echo "✅ Директория существует"
  echo "   Содержимое:"
  ls -la "$DEPLOY_PATH" | head -10
  echo ""
  echo "   Текущая рабочая директория процессов:"
  cd "$DEPLOY_PATH" && pwd
else
  echo "❌ Директория НЕ существует!"
  echo "   Ищем альтернативные пути..."
  find /var/www -name "ecosystem.config.cjs" 2>/dev/null || echo "   Не найдено"
fi
echo ""

# 2. Проверка диска
echo "💾 2. ПРОВЕРКА ДИСКА"
echo "-------------------"
df -h / | tail -1
USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$USAGE" -gt 90 ]; then
  echo "⚠️  КРИТИЧНО: Диск заполнен более чем на 90%!"
elif [ "$USAGE" -gt 80 ]; then
  echo "⚠️  ВНИМАНИЕ: Диск заполнен более чем на 80%"
else
  echo "✅ Места на диске достаточно"
fi
echo ""

# 3. Проверка памяти
echo "🧠 3. ПРОВЕРКА ПАМЯТИ"
echo "-------------------"
free -h
AVAILABLE_MEM=$(free -m | awk '/^Mem:/{print $7}')
echo "Доступно памяти: ${AVAILABLE_MEM}MB"
if [ "$AVAILABLE_MEM" -lt 512 ]; then
  echo "⚠️  КРИТИЧНО: Очень мало памяти!"
elif [ "$AVAILABLE_MEM" -lt 1024 ]; then
  echo "⚠️  ВНИМАНИЕ: Мало памяти"
else
  echo "✅ Памяти достаточно"
fi
echo ""

# 4. Проверка PM2 процессов
echo "🔄 4. ПРОВЕРКА PM2 ПРОЦЕССОВ"
echo "---------------------------"
if command -v pm2 >/dev/null 2>&1; then
  echo "PM2 установлен: $(which pm2)"
  echo ""
  echo "Все процессы PM2:"
  pm2 list
  echo ""
  
  PM2_APP_NAME="${PM2_APP_NAME:-theame-next}"
  if pm2 describe "$PM2_APP_NAME" >/dev/null 2>&1; then
    echo "✅ Процесс '$PM2_APP_NAME' найден"
    echo ""
    echo "Детальная информация:"
    pm2 describe "$PM2_APP_NAME" | grep -E "status|name|script path|exec cwd|uptime|restarts" || true
    echo ""
    
    STATUS=$(pm2 jlist 2>/dev/null | grep -o "\"name\":\"$PM2_APP_NAME\".*\"pm_id\":[0-9]*" | grep -o "\"status\":\"[^\"]*\"" | cut -d'"' -f4 || echo "unknown")
    echo "Статус: $STATUS"
    
    if [ "$STATUS" != "online" ]; then
      echo "❌ ПРОЦЕСС НЕ В СТАТУСЕ 'online'!"
    fi
    
    # Проверяем рабочую директорию процесса
    PM2_CWD=$(pm2 jlist 2>/dev/null | grep -A 50 "\"name\":\"$PM2_APP_NAME\"" | grep -o "\"pm_cwd\":\"[^\"]*\"" | cut -d'"' -f4 || echo "unknown")
    echo "Рабочая директория PM2: $PM2_CWD"
    
    # Проверяем скрипт
    PM2_SCRIPT=$(pm2 jlist 2>/dev/null | grep -A 50 "\"name\":\"$PM2_APP_NAME\"" | grep -o "\"pm_exec_path\":\"[^\"]*\"" | cut -d'"' -f4 || echo "unknown")
    echo "Запускаемый скрипт: $PM2_SCRIPT"
    
  else
    echo "❌ Процесс '$PM2_APP_NAME' НЕ НАЙДЕН!"
  fi
else
  echo "❌ PM2 не установлен!"
fi
echo ""

# 5. Проверка порта 3000
echo "🌐 5. ПРОВЕРКА ПОРТА 3000"
echo "-----------------------"
if command -v netstat >/dev/null 2>&1; then
  PORT_INFO=$(netstat -tlnp 2>/dev/null | grep ":3000" || echo "")
elif command -v ss >/dev/null 2>&1; then
  PORT_INFO=$(ss -tlnp 2>/dev/null | grep ":3000" || echo "")
else
  PORT_INFO=""
fi

if [ -n "$PORT_INFO" ]; then
  echo "✅ Порт 3000 слушается:"
  echo "$PORT_INFO"
else
  echo "❌ Порт 3000 НЕ слушается!"
fi
echo ""

# 6. Проверка доступности приложения
echo "🔌 6. ПРОВЕРКА ДОСТУПНОСТИ ПРИЛОЖЕНИЯ"
echo "-----------------------------------"
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 > /dev/null 2>&1; then
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
  echo "✅ Приложение отвечает на localhost:3000"
  echo "   HTTP код: $HTTP_CODE"
  if [ "$HTTP_CODE" != "200" ]; then
    echo "⚠️  ВНИМАНИЕ: HTTP код не 200!"
  fi
else
  echo "❌ Приложение НЕ отвечает на localhost:3000"
fi
echo ""

# 7. Проверка Nginx
echo "🌍 7. ПРОВЕРКА NGINX"
echo "-------------------"
if command -v nginx >/dev/null 2>&1; then
  if systemctl is-active --quiet nginx 2>/dev/null || service nginx status >/dev/null 2>&1; then
    echo "✅ Nginx запущен"
    echo ""
    echo "Конфигурация для theame.ru:"
    NGINX_CONFIG=$(find /etc/nginx -name "*theame*" 2>/dev/null | head -1)
    if [ -n "$NGINX_CONFIG" ]; then
      echo "Найден конфиг: $NGINX_CONFIG"
      echo ""
      echo "Содержимое:"
      cat "$NGINX_CONFIG" | grep -E "server_name|proxy_pass|listen" || true
    else
      echo "⚠️  Конфиг для theame.ru не найден!"
      echo "   Доступные конфиги:"
      ls -la /etc/nginx/sites-enabled/ 2>/dev/null || true
    fi
  else
    echo "❌ Nginx НЕ запущен!"
  fi
else
  echo "ℹ️  Nginx не установлен"
fi
echo ""

# 8. Проверка сборки
echo "🔨 8. ПРОВЕРКА СБОРКИ"
echo "-------------------"
cd "$DEPLOY_PATH" 2>/dev/null || cd /var/www/theame || { echo "❌ Не удалось перейти в директорию проекта"; exit 1; }

if [ -d ".next" ]; then
  echo "✅ Директория .next существует"
  echo "   Размер: $(du -sh .next 2>/dev/null | cut -f1)"
  echo "   Содержимое:"
  ls -la .next | head -10
else
  echo "❌ Директория .next НЕ существует - проект не собран!"
fi

if [ -f "package.json" ]; then
  echo "✅ package.json найден"
else
  echo "❌ package.json НЕ найден!"
fi

if [ -f "ecosystem.config.cjs" ]; then
  echo "✅ ecosystem.config.cjs найден"
else
  echo "❌ ecosystem.config.cjs НЕ найден!"
fi
echo ""

# 9. Последние логи
echo "📋 9. ПОСЛЕДНИЕ ЛОГИ PM2 (ошибки)"
echo "--------------------------------"
PM2_APP_NAME="${PM2_APP_NAME:-theame-next}"
if pm2 describe "$PM2_APP_NAME" >/dev/null 2>&1; then
  echo "Последние 30 строк ошибок:"
  pm2 logs "$PM2_APP_NAME" --err --lines 30 --nostream 2>/dev/null || echo "Не удалось получить логи"
else
  echo "Процесс не найден, логи недоступны"
fi
echo ""

# 10. Рекомендации
echo "💡 10. РЕКОМЕНДАЦИИ"
echo "-------------------"
if ! pm2 describe "${PM2_APP_NAME:-theame-next}" >/dev/null 2>&1; then
  echo "1. Запустите PM2 процесс:"
  echo "   cd $DEPLOY_PATH && pm2 start ecosystem.config.cjs"
fi

if [ ! -d "$DEPLOY_PATH/.next" ]; then
  echo "2. Пересоберите проект:"
  echo "   cd $DEPLOY_PATH && npm run build"
fi

if ! curl -s http://localhost:3000 >/dev/null 2>&1; then
  echo "3. Проверьте логи PM2 для выявления ошибок:"
  echo "   pm2 logs ${PM2_APP_NAME:-theame-next} --lines 50"
fi

if [ "$USAGE" -gt 90 ]; then
  echo "4. Очистите место на диске!"
fi

if [ "$AVAILABLE_MEM" -lt 512 ]; then
  echo "5. Увеличьте память или добавьте swap!"
fi

echo ""
echo "✅ Диагностика завершена"
