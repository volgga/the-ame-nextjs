#!/bin/bash
# Сборка проекта локально и загрузка на сервер
# Выполни локально: ./build-locally-and-deploy.sh

set -e

echo "🏗️  Собираю проект локально..."
echo ""

cd "/Users/aleksandrvolgin/Desktop/The Ame/nextjs-project"

# Проверяем что мы локально
if [ ! -f "package.json" ]; then
    echo "❌ package.json не найден! Убедись что ты в правильной директории."
    exit 1
fi

# Устанавливаем зависимости локально если нужно
if [ ! -d "node_modules" ]; then
    echo "📦 Устанавливаю зависимости локально..."
    npm install
fi

# Собираем проект локально
echo ""
echo "🏗️  Собираю проект локально..."
npm run build

if [ ! -d ".next" ]; then
    echo "❌ Сборка не удалась локально!"
    exit 1
fi

echo "✅ Проект собран локально"

# Создаем архив с собранным проектом
echo ""
echo "📦 Создаю архив..."
tar -czf /tmp/nextjs-build.tar.gz .next package.json package-lock.json .env.local 2>/dev/null || \
tar -czf /tmp/nextjs-build.tar.gz .next package.json package-lock.json

echo "✅ Архив создан: /tmp/nextjs-build.tar.gz"

# Загружаем на сервер
echo ""
echo "📤 Загружаю на сервер..."
scp /tmp/nextjs-build.tar.gz root@94.103.84.28:/tmp/

echo ""
echo "🚀 Выполняю команды на сервере..."
ssh root@94.103.84.28 << 'REMOTE_SCRIPT'
set -e

cd /var/www/app
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

echo "📦 Распаковываю архив..."
tar -xzf /tmp/nextjs-build.tar.gz

echo "📦 Устанавливаю только production зависимости..."
npm ci --production --no-audit --no-fund

echo "✅ Зависимости установлены"

# Создаем .env.local если нет
if [ ! -f ".env.local" ]; then
    echo "📝 Создаю .env.local..."
    cat > .env.local << 'ENVEOF'
NEXT_PUBLIC_SUPABASE_URL=https://eweaqbtqzzoxpwfmjinp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=G7DOVb26JLGYGmgOmmtzNA__QM03j3k
SUPABASE_SERVICE_ROLE_KEY=RS2RS0FKuqBZBglHTv51_w_c8sqio58
ENVEOF
fi

# Запускаем через PM2
echo "🚀 Запускаю через PM2..."
pm2 delete nextapp 2>/dev/null || true

cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'nextapp',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/app',
    interpreter: '/root/.nvm/versions/node/v20.20.0/bin/node',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
EOF

pm2 start ecosystem.config.js
pm2 save

echo "⏳ Жду 5 секунд..."
sleep 5

echo "✅ Проверка:"
pm2 status
echo ""
curl -I http://127.0.0.1:3000 2>&1 | head -5

echo ""
echo "✅ Готово! Сайт должен быть доступен на http://94.103.84.28"
REMOTE_SCRIPT

echo ""
echo "✅ Деплой завершен!"
