#!/bin/bash
# Скрипт для настройки и запуска Nginx
# Использование: sudo bash scripts/setup-nginx.sh

set -euo pipefail

echo "🌍 НАСТРОЙКА NGINX"
echo "=================="
echo ""

# Проверяем, установлен ли Nginx
if ! command -v nginx >/dev/null 2>&1; then
  echo "📦 Устанавливаем Nginx..."
  apt-get update
  apt-get install -y nginx
fi

# Проверяем статус
if systemctl is-active --quiet nginx 2>/dev/null; then
  echo "✅ Nginx уже запущен"
else
  echo "🚀 Запускаем Nginx..."
  systemctl start nginx
  systemctl enable nginx
  echo "✅ Nginx запущен и добавлен в автозагрузку"
fi

# Конфигурация Nginx (theame — единый конфиг)
NGINX_CONFIG="/etc/nginx/sites-available/theame"
echo ""
echo "📝 Создаем конфигурацию Nginx..."

cat > "$NGINX_CONFIG" << 'EOF'
server {
    listen 80;
    server_name theame.ru www.theame.ru;

    # Логи
    access_log /var/log/nginx/theame-access.log;
    error_log /var/log/nginx/theame-error.log;

    # Проксируем на Next.js приложение
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Таймауты
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Статические файлы Next.js
    location /_next/static {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, immutable";
    }

    # Favicon и другие статические файлы
    location ~* \.(ico|jpg|jpeg|png|gif|svg|webp|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

echo "✅ Конфигурация создана: $NGINX_CONFIG"

# Активируем конфигурацию
rm -f /etc/nginx/sites-enabled/default
if [ ! -L "/etc/nginx/sites-enabled/theame" ]; then
  ln -sf "$NGINX_CONFIG" /etc/nginx/sites-enabled/theame
  echo "✅ Конфигурация активирована"
fi

# Проверяем конфигурацию
echo ""
echo "🔍 Проверяем конфигурацию Nginx..."
if nginx -t; then
  echo "✅ Конфигурация валидна"
  
  # Перезагружаем Nginx
  echo ""
  echo "🔄 Перезагружаем Nginx..."
  systemctl reload nginx
  echo "✅ Nginx перезагружен"
else
  echo "❌ Ошибка в конфигурации Nginx!"
  exit 1
fi

# Проверяем статус
echo ""
echo "📊 Статус Nginx:"
systemctl status nginx --no-pager | head -10

echo ""
echo "✅ Nginx настроен и запущен!"
echo ""
echo "💡 Проверьте доступность сайта:"
echo "   curl -I http://theame.ru"
echo "   или откройте в браузере: http://theame.ru"
