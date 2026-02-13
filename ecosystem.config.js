/** PM2 config for production Next.js. Use: pm2 start ecosystem.config.js (from /var/www/theame on server) */
module.exports = {
  apps: [
    {
      name: "nextjs-project",
      script: "node_modules/.bin/next",
      args: "start -p 3000",
      cwd: "/var/www/theame",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: "3000",
        SITE_URL: "https://theame.ru",
        NEXT_PUBLIC_SITE_URL: "https://theame.ru",
        
        // Supabase (значения берутся из системных ENV переменных)
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
        
        // Tinkoff (T-Bank)
        TINKOFF_TERMINAL_KEY: process.env.TINKOFF_TERMINAL_KEY || "",
        TINKOFF_PASSWORD: process.env.TINKOFF_PASSWORD || "",
        TINKOFF_NOTIFICATION_URL: process.env.TINKOFF_NOTIFICATION_URL || "https://theame.ru/api/tinkoff-callback",
        
        // Telegram Bot API
        TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || "",
        TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID || "",
        TELEGRAM_THREAD_ID: process.env.TELEGRAM_THREAD_ID || "",
        TELEGRAM_ORDERS_CHAT_ID: process.env.TELEGRAM_ORDERS_CHAT_ID || "",
        TELEGRAM_ORDERS_THREAD_ID: process.env.TELEGRAM_ORDERS_THREAD_ID || "",
        
        // Admin
        ADMIN_USERNAME: process.env.ADMIN_USERNAME || "admin",
        ADMIN_PASSWORD_HASH: process.env.ADMIN_PASSWORD_HASH || "",
        ADMIN_SESSION_SECRET: process.env.ADMIN_SESSION_SECRET || "",
      },
    },
  ],
};
