#!/bin/bash
# Выполни эту команду в своем терминале:
# ssh root@94.103.84.28 'bash -s' < deploy-commands.sh

set -e

echo "📦 Шаг 1: Обновление системы и установка nginx, git, ufw..."
apt update && apt upgrade -y
apt install -y nginx git ufw curl
ufw allow 22
ufw allow 80
ufw allow 443
ufw --force enable || true

echo "📦 Шаг 2: Установка Node.js 20 и PM2..."
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm install 20
nvm use 20
nvm alias default 20
npm install -g pm2

echo "📦 Шаг 3: Клонирование репозитория..."
mkdir -p /var/www
rm -rf /var/www/app
git clone https://github.com/volgga/the-ame-nextjs /var/www/app || true

echo "📦 Шаг 4: Создание .env.local..."
cat > /var/www/app/.env.local << 'ENVEOF'
NEXT_PUBLIC_SUPABASE_URL=https://eweaqbtqzzoxpwfmjinp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=G7DOVb26JLGYGmgOmmtzNA__QM03j3k
SUPABASE_SERVICE_ROLE_KEY=RS2RS0FKuqBZBglHTv51_w_c8sqio58
TELEGRAM_BOT_TOKEN=8210290619:AAEXbzbTbkcR5pH-gsondkTRa165ie9ZBYs
TELEGRAM_CHAT_ID=-1002343550030
TELEGRAM_THREAD_ID=624995887
ENVEOF

echo "📦 Шаг 4.5: Настройка swap для работы с ограниченной памятью..."
# Проверяем, есть ли swap
if ! swapon --show | grep -q .; then
    echo "Создаю swap файл 2GB..."
    fallocate -l 2G /swapfile || dd if=/dev/zero of=/swapfile bs=1024 count=2097152
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    echo "✅ Swap создан"
else
    echo "✅ Swap уже настроен"
fi

echo "📦 Шаг 5: Установка зависимостей и сборка..."
cd /var/www/app
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
# Устанавливаем зависимости с оптимизацией памяти
NODE_OPTIONS="--max-old-space-size=512" npm ci --prefer-offline --no-audit
NODE_OPTIONS="--max-old-space-size=512" npm run build

echo "📦 Шаг 6: Запуск приложения через PM2..."
cd /var/www/app
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
pm2 delete nextapp 2>/dev/null || true
pm2 start npm --name nextapp -- start
pm2 save
pm2 startup systemd -u root --hp /root | grep -v "PM2" | bash || true

echo "📦 Шаг 7: Настройка Nginx..."
cat > /etc/nginx/sites-available/nextapp << 'NGINXEOF'
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINXEOF

ln -sf /etc/nginx/sites-available/nextapp /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

echo "📦 Шаг 8: Проверка..."
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
pm2 status
curl -I http://94.103.84.28 || true

echo "✅ Деплой завершен!"
