/** PM2 config for production Next.js. Use: pm2 start ecosystem.config.js (from /var/www/theame on server) */

// Загружаем переменные из .env.production если файл существует
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env.production');
let envVars = {};

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        // Убираем кавычки если есть
        envVars[key.trim()] = value.replace(/^["']|["']$/g, '');
      }
    }
  });
}

// Объединяем переменные: сначала из .env.production, потом из process.env (системные)
const getEnv = (key, defaultValue = '') => {
  return envVars[key] || process.env[key] || defaultValue;
};

module.exports = {
  apps: [
    {
      name: "nextjs-project",
      script: "node_modules/.bin/next",
      args: "start -p 3000",
      cwd: "/var/www/theame",
      instances: 1,
      exec_mode: "fork",
      // PM2 автоматически загрузит переменные из .env.production
      env_file: ".env.production",
      env: {
        NODE_ENV: "production",
        PORT: "3000",
        SITE_URL: getEnv("SITE_URL", "https://theame.ru"),
        NEXT_PUBLIC_SITE_URL: getEnv("NEXT_PUBLIC_SITE_URL", "https://theame.ru"),
        
        // Supabase
        NEXT_PUBLIC_SUPABASE_URL: getEnv("NEXT_PUBLIC_SUPABASE_URL"),
        NEXT_PUBLIC_SUPABASE_ANON_KEY: getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
        SUPABASE_SERVICE_ROLE_KEY: getEnv("SUPABASE_SERVICE_ROLE_KEY"),
        
        // Tinkoff (T-Bank)
        TINKOFF_TERMINAL_KEY: getEnv("TINKOFF_TERMINAL_KEY"),
        TINKOFF_PASSWORD: getEnv("TINKOFF_PASSWORD"),
        TINKOFF_NOTIFICATION_URL: getEnv("TINKOFF_NOTIFICATION_URL", "https://theame.ru/api/tinkoff-callback"),
        
        // Telegram Bot API
        TELEGRAM_BOT_TOKEN: getEnv("TELEGRAM_BOT_TOKEN"),
        TELEGRAM_CHAT_ID: getEnv("TELEGRAM_CHAT_ID"),
        TELEGRAM_THREAD_ID: getEnv("TELEGRAM_THREAD_ID"),
        TELEGRAM_ORDERS_CHAT_ID: getEnv("TELEGRAM_ORDERS_CHAT_ID"),
        TELEGRAM_ORDERS_THREAD_ID: getEnv("TELEGRAM_ORDERS_THREAD_ID"),
        
        // Admin
        ADMIN_USERNAME: getEnv("ADMIN_USERNAME", "admin"),
        ADMIN_PASSWORD_HASH: getEnv("ADMIN_PASSWORD_HASH"),
        ADMIN_SESSION_SECRET: getEnv("ADMIN_SESSION_SECRET"),
      },
    },
  ],
};
