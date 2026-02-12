#!/bin/bash
# Скрипт деплоя для выполнения на сервере
# Использование: ./scripts/deploy.sh [DEPLOY_PATH] [PM2_APP_NAME]

set -euo pipefail

# Параметры по умолчанию
DEPLOY_PATH="${1:-${DEPLOY_PATH:-/var/www/theame}}"
PM2_APP_NAME="${2:-${PM2_APP_NAME:-nextjs-project}}"

echo "🚀 Starting deployment..."
echo "📁 Deploy path: $DEPLOY_PATH"
echo "🔄 PM2 app name: $PM2_APP_NAME"

# Переходим в директорию проекта
cd "$DEPLOY_PATH" || {
  echo "❌ Error: Directory $DEPLOY_PATH does not exist"
  exit 1
}

# Обновляем код из репозитория
echo "📥 Fetching latest code..."
git fetch origin main || {
  echo "❌ Error: Failed to fetch from origin/main"
  exit 1
}

echo "🔄 Resetting to origin/main..."
git reset --hard origin/main || {
  echo "❌ Error: Failed to reset to origin/main"
  exit 1
}

# Проверяем наличие nvm и активируем если есть
if [ -s "$HOME/.nvm/nvm.sh" ]; then
  echo "📦 Loading nvm..."
  source "$HOME/.nvm/nvm.sh"
  nvm use 20 || nvm use default || true
fi

# Устанавливаем зависимости
echo "📦 Installing dependencies..."
npm ci || {
  echo "❌ Error: npm ci failed"
  exit 1
}

# Собираем проект
echo "🔨 Building Next.js application..."
npm run build || {
  echo "❌ Error: Build failed"
  exit 1
}

# Перезапускаем PM2 процесс
echo "🔄 Restarting PM2 process..."
if command -v pm2 >/dev/null 2>&1; then
  pm2 restart "$PM2_APP_NAME" || {
    echo "❌ Error: Failed to restart PM2 process '$PM2_APP_NAME'"
    echo "💡 Hint: Make sure PM2 process '$PM2_APP_NAME' exists. Check with: pm2 list"
    exit 1
  }
  pm2 save || true
  echo "✅ PM2 process '$PM2_APP_NAME' restarted successfully"
else
  echo "❌ Error: PM2 is not installed or not in PATH"
  echo "💡 Hint: Install PM2 with: npm install -g pm2"
  echo "💡 Hint: Then start the app with: pm2 start ecosystem.config.js"
  exit 1
fi

echo "✅ Deployment completed successfully!"
